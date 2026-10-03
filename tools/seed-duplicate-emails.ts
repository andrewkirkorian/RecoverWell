// Verification helper: put two `users` documents carrying the same email into the
// throwaway database *before* the app's first request, so the unique index on
// users.email cannot be built. That is how the harness proves index setup is not
// fatal and is not retried on every request.
//
// This is also a precondition, and it fails fast rather than pretending: it needs a
// genuinely empty throwaway database. If accounts from an earlier run are already
// there, or the unique index already exists, the seeding step cannot do its job —
// so it exits non-zero and says exactly which state it found, and verify.sh stops.
//
// Throwaway scaffolding, like the rest of tools/: it writes only to the local
// throwaway mongod, contains no real data, and prints no documents.
//
//   MONGODB_URI=mongodb://127.0.0.1:27018/recoverwell_verify bun tools/seed-duplicate-emails.ts
import { MongoClient, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("seed: MONGODB_URI is not set — point it at the throwaway mongod");
  process.exit(1);
}

/**
 * A collection that does not exist yet has no indexes — and on a genuinely empty
 * throwaway database asking for them raises NamespaceNotFound (code 26) rather
 * than returning an empty list. "No collection" means "no unique index", which is
 * exactly the state this script needs.
 */
const listIndexes = async (collection: Collection<Document>) => {
  try {
    return await collection.indexes();
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
    if (code === 26) return [];
    throw error;
  }
};

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4_000 });
try {
  await client.connect();
} catch {
  console.error(`seed: cannot reach ${uri} — start the throwaway mongod with 'bash tools/reset-verify.sh'`);
  process.exit(1);
}

try {
  const db = client.db();
  const users = db.collection("users");

  const existing = await users.countDocuments();
  if (existing > 0) {
    console.error(
      `seed: the throwaway database already holds ${String(existing)} users document(s) — ` +
        "it is not pristine, so the index precondition cannot be set up. " +
        "Run 'bash tools/reset-verify.sh' to wipe it.",
    );
    process.exit(1);
  }

  const alreadyIndexed = (await listIndexes(users)).some(
    (index) => index.unique === true && index.key.email === 1,
  );
  if (alreadyIndexed) {
    console.error(
      "seed: the unique index on users.email already exists, so index setup cannot " +
        "be made to fail. Run 'bash tools/reset-verify.sh' to wipe the throwaway database.",
    );
    process.exit(1);
  }

  const email = "duplicate-index@example.com";
  // A hash-shaped placeholder, never used: no sign-in is attempted for this email.
  const passwordHash = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;
  await users.insertMany([
    { email, passwordHash, createdAt: new Date(0), note: "seeded duplicate 1" },
    { email, passwordHash, createdAt: new Date(0), note: "seeded duplicate 2" },
  ]);
  const seeded = await users.countDocuments();
  if (seeded !== 2) {
    console.error(`seed: expected 2 users documents after seeding, found ${String(seeded)}`);
    process.exit(1);
  }
  console.log("seeded 2 users documents sharing one email (duplicate keys on purpose)");
} catch (error) {
  // A duplicate-key refusal here means the unique index is already in place, which
  // is the same missing precondition as above. Anything else is reported by name
  // and code — enough to debug, and it cannot carry a connection string.
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  const name = error instanceof Error ? error.name : "unknown";
  console.error(
    code === 11000
      ? "seed: refused a duplicate key, so the unique index on users.email already exists — run 'bash tools/reset-verify.sh'"
      : `seed: could not seed the throwaway database (${name}${code === null ? "" : ` code ${String(code)}`}) — run 'bash tools/reset-verify.sh' and try again`,
  );
  process.exit(1);
} finally {
  await client.close();
}
