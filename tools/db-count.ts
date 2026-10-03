// Verification helper: count documents per collection in the throwaway database,
// and list which days each user has a log for. Reads only; prints no logged
// values (no pain scores, temperatures or notes) — just counts, dates and a
// truncated user id, which is what the isolation checks need.
//
//   MONGODB_URI=mongodb://127.0.0.1:27018/recoverwell_verify bun tools/db-count.ts
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set — point it at the throwaway mongod");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

for (const name of ["users", "plans", "completions", "sessions", "logs"]) {
  console.log(`  ${name}: ${String(await db.collection(name).countDocuments())} document(s)`);
}

const logs = await db
  .collection("logs")
  .find({}, { projection: { userId: 1, date: 1 } })
  .sort({ userId: 1, date: 1 })
  .toArray();

const byUser = new Map<string, string[]>();
for (const doc of logs) {
  const key = String(doc.userId);
  byUser.set(key, [...(byUser.get(key) ?? []), String(doc.date)]);
}

for (const [user, dates] of byUser) {
  const duplicates = dates.filter((date, index) => dates.indexOf(date) !== index);
  console.log(
    `  logs for user ${user.slice(0, 8)}…: ${dates.join(", ")}` +
      `  (days logged: ${String(new Set(dates).size)}, duplicate days: ${String(duplicates.length)})`,
  );
}

const indexes = await db.collection("logs").indexes();
console.log(
  `  logs indexes: ${indexes
    .map((index) => `${JSON.stringify(index.key)}${index.unique ? " unique" : ""}`)
    .join(", ")}`,
);

await client.close();
