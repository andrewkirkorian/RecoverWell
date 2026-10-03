import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

import { isDateValue, utcToday } from "~/lib/dates";
import type { LogEntry } from "~/lib/logs";
import { buildDaySections, buildDayItems, type DaySection, type Plan } from "~/lib/plan";
import { DbNotConfiguredError, isDbConfigured } from "~/mongo.server";
import { serverRequest } from "~/server/request.server";
import { readCookie, sessionUser, type SessionUser } from "~/server/session.server";
import {
  getCompletions,
  getLatestLog,
  getLog,
  getPlan,
  getRecentLogs,
} from "~/server/store.server";

/**
 * Server functions the pages call while rendering. Health of the database is
 * reported as a value (never an exception) so a page can say plainly that the
 * database isn't connected yet instead of crashing or leaking a stack trace.
 * Patient data lives only in these responses — it is never logged or put in a URL.
 *
 * This module is reachable from client code (routes import the server functions),
 * so every helper that touches the database is wrapped in `createServerOnlyFn`:
 * that keeps the imports above out of the browser bundle while leaving the
 * handlers free to call them on the server.
 */

export type DbState = "ok" | "missing" | "error";

export interface SessionState {
  db: DbState;
  signedIn: boolean;
  email: string | null;
}

export interface PlanPageState extends SessionState {
  plan: Plan | null;
}

export interface TodayPageState extends SessionState {
  plan: Plan | null;
  date: string;
  sections: DaySection[];
  done: string[];
  /** The patient's most recent day's log, whatever its date. The Today view keeps
   * a red flag from this entry visible until the next log is saved. */
  latest: LogEntry | null;
}

export interface LogPageState extends SessionState {
  date: string;
  plan: Plan | null;
  /** The entry already saved for today, if there is one. */
  today: LogEntry | null;
  /** Recent days, newest first. */
  recent: LogEntry[];
  /** The most recent entry of any date — what the red-flag banner is judged on, so
   * a flag raised yesterday is still in front of the patient while they log today. */
  latest: LogEntry | null;
}

const dbStateFrom = createServerOnlyFn((error: unknown): DbState =>
  error instanceof DbNotConfiguredError ? "missing" : "error",
);

/** Runs a database read and converts failures into a plain state value. */
const readOrDegrade = createServerOnlyFn(
  async <T>(read: () => Promise<T>, fallback: T): Promise<{ db: DbState; value: T }> => {
    if (!isDbConfigured()) return { db: "missing", value: fallback };
    try {
      return { db: "ok", value: await read() };
    } catch (error) {
      return { db: dbStateFrom(error), value: fallback };
    }
  },
);

const currentUser = createServerOnlyFn(async (): Promise<SessionUser | null> => {
  if (!isDbConfigured()) return null;
  try {
    return await sessionUser(await serverRequest());
  } catch {
    return null;
  }
});

/** "Today" in the patient's own time zone when the browser has told us (cookie),
 * else the server's UTC date. The cookie holds a date, never health data. */
const todayForRequest = createServerOnlyFn((request: Request): string => {
  const fromCookie = readCookie(request, "rw_local_date");
  const server = utcToday();
  if (!fromCookie || !isDateValue(fromCookie)) return server;
  const drift = Math.abs(
    new Date(`${fromCookie}T00:00:00Z`).getTime() - new Date(`${server}T00:00:00Z`).getTime(),
  );
  // Same day or neighbouring day only: ignore a stale or nonsense cookie.
  return drift <= 24 * 60 * 60 * 1000 ? fromCookie : server;
});

const signedOutState = createServerOnlyFn(
  (): SessionState => ({
    db: isDbConfigured() ? "ok" : "missing",
    signedIn: false,
    email: null,
  }),
);

export const loadSessionState = createServerFn().handler(async (): Promise<SessionState> => {
  if (!isDbConfigured()) return { db: "missing", signedIn: false, email: null };
  try {
    const user = await sessionUser(await serverRequest());
    return { db: "ok", signedIn: Boolean(user), email: user?.email ?? null };
  } catch (error) {
    return { db: dbStateFrom(error), signedIn: false, email: null };
  }
});

export const loadPlanPage = createServerFn().handler(async (): Promise<PlanPageState> => {
  const user = await currentUser();
  if (!user) return { ...signedOutState(), plan: null };
  const { db, value } = await readOrDegrade<Plan | null>(() => getPlan(user.id), null);
  return { db, signedIn: true, email: user.email, plan: value };
});

export const loadTodayPage = createServerFn().handler(async (): Promise<TodayPageState> => {
  const date = todayForRequest(await serverRequest());
  const user = await currentUser();
  if (!user) {
    return { ...signedOutState(), plan: null, date, sections: [], done: [], latest: null };
  }
  const planRead = await readOrDegrade<Plan | null>(() => getPlan(user.id), null);
  const doneRead = await readOrDegrade<string[]>(() => getCompletions(user.id, date), []);
  const latestRead = await readOrDegrade<LogEntry | null>(() => getLatestLog(user.id), null);
  const plan = planRead.value;
  const all = buildDayItems(plan);
  const done = doneRead.value.filter((id) => all.some((item) => item.id === id));
  const reads = [planRead, doneRead, latestRead];
  return {
    db: reads.some((read) => read.db === "error")
      ? "error"
      : reads.every((read) => read.db === "ok")
        ? "ok"
        : "missing",
    signedIn: true,
    email: user.email,
    plan,
    date,
    sections: buildDaySections(plan),
    done,
    latest: latestRead.value,
  };
});

export const loadLogPage = createServerFn().handler(async (): Promise<LogPageState> => {
  const date = todayForRequest(await serverRequest());
  const user = await currentUser();
  if (!user) {
    return { ...signedOutState(), date, plan: null, today: null, recent: [], latest: null };
  }
  const planRead = await readOrDegrade<Plan | null>(() => getPlan(user.id), null);
  const todayRead = await readOrDegrade<LogEntry | null>(() => getLog(user.id, date), null);
  const recentRead = await readOrDegrade<LogEntry[]>(() => getRecentLogs(user.id, 7), []);
  const latestRead = await readOrDegrade<LogEntry | null>(() => getLatestLog(user.id), null);
  const reads = [planRead, todayRead, recentRead, latestRead];
  return {
    db: reads.some((read) => read.db === "error")
      ? "error"
      : reads.every((read) => read.db === "ok")
        ? "ok"
        : "missing",
    signedIn: true,
    email: user.email,
    date,
    plan: planRead.value,
    today: todayRead.value,
    recent: recentRead.value,
    latest: latestRead.value,
  };
});
