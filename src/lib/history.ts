/**
 * The recovery timeline and the follow-up appointment summary are built from the
 * same two things: the plan the patient typed in themselves (labels, times and
 * care-team limits) and the days they logged.
 *
 * Everything here is arithmetic on what the patient entered — a date range, a
 * count of ticked items, a lowest and highest reading, and whether a logged value
 * met a limit the patient saved (through the same `evaluateRedFlags` comparison
 * the banner uses). Nothing here interprets a symptom, predicts anything, or
 * offers medical advice. No server-only imports: the same code runs while
 * rendering.
 */

import { evaluateRedFlags, type RedFlag } from "~/lib/alerts";
import { isDateValue } from "~/lib/dates";
import { formatTemperature, inUnit, type LogEntry, type TempUnit } from "~/lib/logs";
import { buildDayItems, type Plan } from "~/lib/plan";

/**
 * The longest stretch of days either page will lay out. A surgery date far in the
 * past would otherwise mean thousands of rows; the most recent days are the ones a
 * patient and their care team look at. When this bites, both pages say plainly
 * which days the record covers.
 */
export const MAX_TIMELINE_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/** "2026-10-03" shifted by whole days, as a plain "YYYY-MM-DD". */
export const addDays = (date: string, delta: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export const daysBetween = (from: string, to: string): number =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);

/** One tick the patient made, as stored. */
export interface TickedItem {
  date: string;
  itemId: string;
}

export interface TimelineDay {
  /** "YYYY-MM-DD". */
  date: string;
  /** Which day of recovery this is: the surgery date itself is day 1. */
  dayNumber: number;
  /** The patient's own entry for that day, or null when they logged nothing. */
  entry: LogEntry | null;
  /** Limits crossed that day, from the same comparison the banner uses. */
  flags: RedFlag[];
  /** How many of that day's checklist items are ticked, and how many there are. */
  done: number;
  total: number;
}

export interface History {
  surgeryDate: string | null;
  procedureLabel: string;
  /** Every day covered, newest first. Days with nothing logged are still here. */
  days: TimelineDay[];
  /** Days from the surgery date to `today`, inclusive. */
  totalDays: number;
  /** The oldest and newest days actually laid out. */
  shownFrom: string | null;
  shownTo: string | null;
  /** True when older days were left out because of `MAX_TIMELINE_DAYS`. */
  capped: boolean;
}

const emptyHistory = (plan: Plan | null): History => ({
  surgeryDate: plan && isDateValue(plan.surgeryDate) ? plan.surgeryDate : null,
  procedureLabel: plan ? plan.procedureLabel : "",
  days: [],
  totalDays: 0,
  shownFrom: null,
  shownTo: null,
  capped: false,
});

/**
 * One row per day from the patient's surgery date to today, newest first.
 *
 * The checklist denominator is the plan as it stands today: it is the only list
 * the app can honestly count against, and it is the same set the Today view
 * counts, so a ticker id that is no longer in the plan is not counted anywhere.
 */
export function buildHistory({
  plan,
  logs,
  ticks,
  today,
}: {
  plan: Plan | null;
  logs: LogEntry[];
  ticks: TickedItem[];
  today: string;
}): History {
  const history = emptyHistory(plan);
  if (!plan || !history.surgeryDate || !isDateValue(today)) return history;
  const span = daysBetween(history.surgeryDate, today);
  // A surgery date the patient typed in the future has no days behind it yet.
  if (span < 0) return history;

  const totalDays = span + 1;
  const items = buildDayItems(plan);
  const total = items.length;
  const inPlan = new Set(items.map((item) => item.id));

  const entryByDate = new Map<string, LogEntry>();
  for (const entry of logs) {
    if (isDateValue(entry.date) && !entryByDate.has(entry.date)) entryByDate.set(entry.date, entry);
  }

  const tickedByDate = new Map<string, Set<string>>();
  for (const tick of ticks) {
    if (!isDateValue(tick.date) || !inPlan.has(tick.itemId)) continue;
    const set = tickedByDate.get(tick.date) ?? new Set<string>();
    set.add(tick.itemId);
    tickedByDate.set(tick.date, set);
  }

  const shown = Math.min(totalDays, MAX_TIMELINE_DAYS);
  const days: TimelineDay[] = [];
  for (let back = 0; back < shown; back += 1) {
    const date = addDays(today, -back);
    const entry = entryByDate.get(date) ?? null;
    days.push({
      date,
      dayNumber: totalDays - back,
      entry,
      flags: evaluateRedFlags(plan, entry),
      done: tickedByDate.get(date)?.size ?? 0,
      total,
    });
  }

  return {
    ...history,
    days,
    totalDays,
    shownFrom: days.length > 0 ? days[days.length - 1]!.date : null,
    shownTo: days.length > 0 ? days[0]!.date : null,
    capped: shown < totalDays,
  };
}

export interface HistoryTotals {
  /** Days from the surgery date to today. */
  covered: number;
  /** Days laid out on the page (never more than `MAX_TIMELINE_DAYS`). */
  shown: number;
  /** Days the patient logged something. */
  logged: number;
  /** Days where every item on that day's checklist was ticked. */
  fullyTicked: number;
  painMin: number | null;
  painMax: number | null;
  painCount: number;
  /** Lowest and highest temperature logged, in the unit the plan uses today. */
  tempLow: number | null;
  tempHigh: number | null;
  tempCount: number;
  tempUnit: TempUnit;
  /** Days a saved limit was met or passed. */
  crossed: TimelineDay[];
}

/** The counts the appointment summary puts above the day-by-day list. */
export function buildTotals(history: History, plan: Plan | null): HistoryTotals {
  const tempUnit: TempUnit = plan?.careTeam.tempUnit ?? "C";
  let logged = 0;
  let fullyTicked = 0;
  let painCount = 0;
  let painMin: number | null = null;
  let painMax: number | null = null;
  let tempCount = 0;
  let tempLow: number | null = null;
  let tempHigh: number | null = null;

  for (const day of history.days) {
    if (day.entry) {
      logged += 1;
      painCount += 1;
      const pain = day.entry.pain;
      painMin = painMin === null ? pain : Math.min(painMin, pain);
      painMax = painMax === null ? pain : Math.max(painMax, pain);
      if (day.entry.temperature !== null) {
        const reading = inUnit(day.entry.temperature, day.entry.temperatureUnit, tempUnit);
        tempCount += 1;
        tempLow = tempLow === null ? reading : Math.min(tempLow, reading);
        tempHigh = tempHigh === null ? reading : Math.max(tempHigh, reading);
      }
    }
    if (day.total > 0 && day.done === day.total) fullyTicked += 1;
  }

  return {
    covered: history.totalDays,
    shown: history.days.length,
    logged,
    fullyTicked,
    painMin,
    painMax,
    painCount,
    tempLow,
    tempHigh,
    tempCount,
    tempUnit,
    crossed: history.days.filter((day) => day.flags.length > 0),
  };
}

/**
 * A reading as the patient entered it, with the value in the plan's current unit
 * beside it when the two differ — the same conversion the banner uses to compare
 * them, and never a change to what they typed.
 */
export const readingAsEntered = (entry: LogEntry, unit: TempUnit): string => {
  if (entry.temperature === null) return "";
  const asEntered = formatTemperature(entry.temperature, entry.temperatureUnit);
  if (entry.temperatureUnit === unit) return asEntered;
  return `${asEntered} (${formatTemperature(inUnit(entry.temperature, entry.temperatureUnit, unit), unit)})`;
};
