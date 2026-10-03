import { MongoClient, type Db } from "mongodb";

/**
 * Server-only, lazy handle to the team's MongoDB Atlas database.
 *
 * The connection string comes from `MONGODB_URI`. It is read per call (never at
 * module load) so the site still builds and serves before the credential exists —
 * the problem only surfaces if a query actually runs without it, and callers
 * catch `DbNotConfiguredError` to render an honest in-app notice instead of a
 * stack trace.
 *
 * Import this only from `createServerFn` handlers or `src/routes/api/*` routes.
 * Never from client code.
 */

/** Thrown when `MONGODB_URI` is missing, so callers can distinguish "not set up yet". */
export class DbNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set — connect a MongoDB database before using accounts.");
    this.name = "DbNotConfiguredError";
  }
}

/** True when a connection string exists. Safe to call anywhere on the server. */
export const isDbConfigured = (): boolean => Boolean(process.env.MONGODB_URI);

let clientPromise: Promise<MongoClient> | null = null;
let indexSetup: Promise<void> | null = null;
let indexState: "pending" | "done" | "failed" = "pending";

/** Database name: the path of the connection string, else "recoverwell". */
const dbNameFrom = (uri: string): string => {
  try {
    const path = new URL(uri).pathname.replace(/^\//, "");
    return path.length > 0 ? path : "recoverwell";
  } catch {
    return "recoverwell";
  }
};

/** Open the shared client (one per server process). Resets on failure so a later call can retry. */
const getClient = async (uri: string): Promise<MongoClient> => {
  if (!clientPromise) {
    const client = new MongoClient(uri, {
      // Fail in seconds, not the 30s default, so a page never hangs on a
      // misconfigured/unreachable cluster.
      serverSelectionTimeoutMS: 8_000,
    });
    clientPromise = client.connect().then(
      (connected) => connected,
      (error: unknown) => {
        clientPromise = null;
        throw error instanceof Error ? error : new Error("database connection failed");
      },
    );
  }
  return clientPromise;
};

/**
 * Best-effort index creation: uniqueness for emails (so two accounts can never
 * share one) and keys that keep one day's log and one plan per user.
 *
 * Index setup runs at most once per process, and a failure is never retried:
 * building an index is housekeeping, so a patient-facing request must neither
 * wait on it repeatedly nor fail because of it. If setup cannot run (permissions,
 * a cluster that refuses it), the app keeps working and still checks for existing
 * emails before inserting. Each index is attempted on its own so one failure does
 * not skip the rest — the unique keys matter most. The failure is reported once,
 * naming only the collections, because the driver's error text can carry
 * connection details.
 */
const ensureIndexes = async (db: Db): Promise<void> => {
  if (indexState !== "pending") return;
  if (!indexSetup) {
    indexSetup = (async () => {
      const failed: string[] = [];
      const attempt = async (collection: string, build: () => Promise<unknown>) => {
        try {
          await build();
        } catch {
          failed.push(collection);
        }
      };
      await attempt("users", () => db.collection("users").createIndex({ email: 1 }, { unique: true }));
      await attempt("sessions", () =>
        db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
      );
      await attempt("sessions", () =>
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
      );
      await attempt("completions", () =>
        db.collection("completions").createIndex({ userId: 1, date: 1, itemId: 1 }, { unique: true }),
      );
      await attempt("plans", () => db.collection("plans").createIndex({ userId: 1 }, { unique: true }));
      // One day's log per user: this unique key is what makes re-saving the same
      // date an update rather than a second entry.
      await attempt("logs", () =>
        db.collection("logs").createIndex({ userId: 1, date: 1 }, { unique: true }),
      );
      if (failed.length > 0) {
        indexState = "failed";
        console.error(
          `recoverwell: could not build indexes for: ${failed.join(", ")} — continuing without them`,
        );
        return;
      }
      indexState = "done";
    })();
    // Whatever happens above, this promise must resolve: index setup never fails
    // a request.
    indexSetup = indexSetup.catch(() => {
      indexState = "failed";
    });
  }
  await indexSetup;
};

/** The database handle. Throws `DbNotConfiguredError` when `MONGODB_URI` is missing. */
export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DbNotConfiguredError();
  const client = await getClient(uri);
  const db = client.db(dbNameFrom(uri));
  await ensureIndexes(db);
  return db;
}
