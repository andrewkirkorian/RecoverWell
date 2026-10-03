import { ObjectId } from "mongodb";

import type { LogEntry, TempUnit } from "~/lib/logs";
import type { CareTeam, GoalRow, MedRow, Plan, WoundRow } from "~/lib/plan";
import { getDb } from "~/mongo.server";

/**
 * Every query here is scoped by the authenticated user's id — a caller can only
 * ever read or write rows carrying its own `userId`. Nothing in this module logs.
 * Server-only: import it from createServerFn handlers or api routes, never from
 * client code.
 */

/** Raised when a signup races another signup for the same email. */
export class EmailTakenError extends Error {
  constructor() {
    super("email already registered");
    this.name = "EmailTakenError";
  }
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

const asString = (value: unknown, maxLength = 200): string =>
  typeof value === "string" ? value.slice(0, maxLength) : "";

const asId = (value: unknown): string => asString(value, 64);

const asMedications = (value: unknown): MedRow[] =>
  Array.isArray(value)
    ? value.slice(0, 50).map((row: unknown) => {
        const med = (row ?? {}) as Record<string, unknown>;
        return {
          id: asId(med.id),
          name: asString(med.name),
          dose: asString(med.dose),
          times: Array.isArray(med.times) ? med.times.map((t) => asString(t, 5)) : [],
        };
      })
    : [];

const asWoundCare = (value: unknown): WoundRow[] =>
  Array.isArray(value)
    ? value.slice(0, 50).map((row: unknown) => {
        const wound = (row ?? {}) as Record<string, unknown>;
        const perDay = typeof wound.perDay === "number" ? wound.perDay : 1;
        return {
          id: asId(wound.id),
          label: asString(wound.label),
          times: Array.isArray(wound.times) ? wound.times.map((t) => asString(t, 5)) : [],
          perDay: Math.min(Math.max(Math.trunc(perDay), 1), 3),
        };
      })
    : [];

const asGoals = (value: unknown): GoalRow[] =>
  Array.isArray(value)
    ? value.slice(0, 50).map((row: unknown) => {
        const goal = (row ?? {}) as Record<string, unknown>;
        return { id: asId(goal.id), label: asString(goal.label) };
      })
    : [];

const asTempUnit = (value: unknown): TempUnit => (value === "F" ? "F" : "C");

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** A plan saved before this section existed has no care-team limits at all, which
 * is exactly "no alert": every field stays empty rather than being guessed. */
const asCareTeam = (value: unknown): CareTeam => {
  const raw = (value ?? {}) as Record<string, unknown>;
  const pain = asNumber(raw.painThreshold);
  return {
    painThreshold: pain === null ? null : Math.min(Math.max(Math.round(pain), 0), 10),
    tempThreshold: asNumber(raw.tempThreshold),
    tempUnit: asTempUnit(raw.tempUnit),
    warningSigns: Array.isArray(raw.warningSigns)
      ? raw.warningSigns
          .slice(0, 50)
          .map((sign) => asString(sign, 160))
          .filter((sign) => sign.length > 0)
      : [],
    phone: asString(raw.phone, 40),
  };
};

/** Shape a stored document into a Plan, tolerating anything unexpected in the field. */
const toPlan = (doc: Record<string, unknown>): Plan => ({
  surgeryDate: asString(doc.surgeryDate, 10),
  procedureLabel: asString(doc.procedureLabel),
  medications: asMedications(doc.medications),
  woundCare: asWoundCare(doc.woundCare),
  goals: asGoals(doc.goals),
  careTeam: asCareTeam(doc.careTeam),
});

/** The same toleration for a stored day's log. */
const toLogEntry = (doc: Record<string, unknown>): LogEntry => {
  const pain = asNumber(doc.pain);
  return {
    date: asString(doc.date, 10),
    pain: pain === null ? 0 : Math.min(Math.max(Math.round(pain), 0), 10),
    temperature: asNumber(doc.temperature),
    temperatureUnit: asTempUnit(doc.temperatureUnit),
    woundNote: asString(doc.woundNote, 600),
    note: asString(doc.note, 600),
  };
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne({ email });
  if (!doc) return null;
  return {
    id: doc._id.toHexString(),
    email: asString(doc.email),
    passwordHash: asString(doc.passwordHash, 500),
  };
}

export async function createUser(email: string, passwordHash: string): Promise<string> {
  const db = await getDb();
  try {
    const result = await db
      .collection("users")
      .insertOne({ email, passwordHash, createdAt: new Date() });
    return result.insertedId.toHexString();
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) {
      throw new EmailTakenError();
    }
    throw error;
  }
}

export async function getPlan(userId: string): Promise<Plan | null> {
  const db = await getDb();
  const doc = await db.collection("plans").findOne({ userId: new ObjectId(userId) });
  return doc ? toPlan(doc) : null;
}

export async function savePlan(userId: string, plan: Plan): Promise<void> {
  const db = await getDb();
  await db.collection("plans").updateOne(
    { userId: new ObjectId(userId) },
    {
      $set: { ...plan, updatedAt: new Date() },
      $setOnInsert: { userId: new ObjectId(userId), createdAt: new Date() },
    },
    { upsert: true },
  );
}

/** Item ids ticked off on one date for this user. */
export async function getCompletions(userId: string, date: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .collection("completions")
    .find({ userId: new ObjectId(userId), date })
    .toArray();
  return rows.map((row) => asId(row.itemId)).filter((id) => id.length > 0);
}

/** Tick or untick one item. `done: false` removes the record. */
export async function setCompletion(
  userId: string,
  date: string,
  itemId: string,
  done: boolean,
): Promise<void> {
  const db = await getDb();
  const owner = new ObjectId(userId);
  if (done) {
    await db.collection("completions").updateOne(
      { userId: owner, date, itemId },
      { $set: { done: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true },
    );
    return;
  }
  await db.collection("completions").deleteOne({ userId: owner, date, itemId });
}

/* ------------------------------------------------------------------ logs --- */

/**
 * Write one day's log for this user. The `{ userId, date }` key is unique, so
 * saving the same day again updates that day's entry instead of adding a second
 * one — re-saving is how a patient corrects a mistake.
 */
export async function saveLog(userId: string, entry: LogEntry): Promise<void> {
  const db = await getDb();
  const owner = new ObjectId(userId);
  await db.collection("logs").updateOne(
    { userId: owner, date: entry.date },
    {
      $set: { ...entry, updatedAt: new Date() },
      $setOnInsert: { userId: owner, createdAt: new Date() },
    },
    { upsert: true },
  );
}

/** This user's entry for one date, or null when they haven't logged that day. */
export async function getLog(userId: string, date: string): Promise<LogEntry | null> {
  const db = await getDb();
  const doc = await db.collection("logs").findOne({ userId: new ObjectId(userId), date });
  return doc ? toLogEntry(doc) : null;
}

/**
 * The user's most recent day's entry, whatever its date. The Today view keeps a
 * red flag visible from this entry until the next one is saved, so it cannot be
 * missed by not opening the log page again.
 */
export async function getLatestLog(userId: string): Promise<LogEntry | null> {
  const db = await getDb();
  const doc = await db
    .collection("logs")
    .find({ userId: new ObjectId(userId) })
    .sort({ date: -1 })
    .limit(1)
    .next();
  return doc ? toLogEntry(doc) : null;
}

/** The user's most recent days, newest first. */
export async function getRecentLogs(userId: string, limit = 7): Promise<LogEntry[]> {
  const db = await getDb();
  const rows = await db
    .collection("logs")
    .find({ userId: new ObjectId(userId) })
    .sort({ date: -1 })
    .limit(Math.min(Math.max(Math.trunc(limit), 1), 30))
    .toArray();
  return rows.map(toLogEntry);
}
