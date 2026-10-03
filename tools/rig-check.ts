// Verification helper: prove the throwaway rig is fresh before a run starts.
//
// A harness re-run against a half-used throwaway database is the failure mode this
// exists to prevent: leftover accounts from an earlier run make sign-ups fail with
// "that email is already registered", and a run that started against stale state
// can look like a verdict on the app when it is really a verdict on the rig.
//
// Throwaway scaffolding, like the rest of tools/. Reads only, prints counts.
//
//   MONGODB_URI=mongodb://127.0.0.1:27018/recoverwell_verify bun tools/rig-check.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("rig-check: MONGODB_URI is not set — point it at the throwaway mongod");
  process.exit(1);
}

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4_000 });

try {
  await client.connect();
} catch {
  console.error(
    `rig-check: nothing is answering on ${uri} — start the throwaway mongod with 'bash tools/reset-verify.sh'`,
  );
  process.exit(1);
}

try {
  const db = client.db();
  const counts: Record<string, number> = {};
  for (const name of ["users", "plans", "logs", "completions", "sessions"]) {
    counts[name] = await db.collection(name).countDocuments();
  }
  const used = Object.entries(counts).filter(([, count]) => count > 0);
  if (used.length > 0) {
    console.error(
      `rig-check: the throwaway database is not empty (${used
        .map(([name, count]) => `${name}: ${String(count)}`)
        .join(", ")}) — an earlier run already used it. Run 'bash tools/reset-verify.sh' to wipe it.`,
    );
    process.exit(1);
  }
  console.log("rig OK       : throwaway database is empty and reachable");
} finally {
  await client.close();
}
