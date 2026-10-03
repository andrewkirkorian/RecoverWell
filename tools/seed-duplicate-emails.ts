// Verification helper: put two `users` documents carrying the same email into the
// throwaway database *before* the app's first request, so the unique index on
// users.email cannot be built. That is how the harness proves index setup is not
// fatal and is not retried on every request.
//
// Throwaway scaffolding, like the rest of tools/: it writes only to the local
// throwaway mongod, contains no real data, and prints no documents.
//
//   MONGODB_URI=mongodb://127.0.0.1:27018/recoverwell_verify bun tools/seed-duplicate-emails.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set — point it at the throwaway mongod");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const email = "duplicate-index@example.com";
// A hash-shaped placeholder, never used: no sign-in is attempted for this email.
const passwordHash = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;
await db.collection("users").insertMany([
  { email, passwordHash, createdAt: new Date(0), note: "seeded duplicate 1" },
  { email, passwordHash, createdAt: new Date(0), note: "seeded duplicate 2" },
]);
console.log(`seeded 2 users documents sharing one email (duplicate keys on purpose)`);
await client.close();
