/**
 * Recovery-plan types and the pure "what's due today" builder.
 *
 * Nothing here is medical knowledge: every label, dose, time and limit in a Plan
 * came from the patient (or their caregiver) typing it in. This module has no
 * server-only imports, so the same code can be used while rendering.
 */

import type { TempUnit } from "~/lib/logs";

export interface MedRow {
  id: string;
  name: string;
  dose: string;
  times: string[];
}

export interface WoundRow {
  id: string;
  label: string;
  /** Times of day, e.g. ["08:00", "20:00"]. Empty when `perDay` is used instead. */
  times: string[];
  /** Used only when `times` is empty: how many times a day (1 or 2). */
  perDay: number;
}

export interface GoalRow {
  id: string;
  label: string;
}

/**
 * The limits the patient's own care team gave them, exactly as the patient typed
 * them in. Every field is optional.
 *
 * The app compares logged values against these numbers and nothing else: an empty
 * field means that value is never checked and no alert is ever raised for it.
 * `warningSigns` is free text the patient wrote — the app shows it back and never
 * reads it.
 */
export interface CareTeam {
  /** 0–10 pain score at or above which the patient wants a reminder to call, or null. */
  painThreshold: number | null;
  /** Temperature at or above which the patient wants a reminder to call, or null. */
  tempThreshold: number | null;
  /** The unit `tempThreshold` is written in, chosen by the patient. */
  tempUnit: TempUnit;
  /** The patient's own "call us if…" list, in their own words. */
  warningSigns: string[];
  /** The patient's care-team phone number, shown with an alert. Empty when they didn't save one. */
  phone: string;
}

export const emptyCareTeam = (): CareTeam => ({
  painThreshold: null,
  tempThreshold: null,
  tempUnit: "C",
  warningSigns: [],
  phone: "",
});

export interface Plan {
  surgeryDate: string;
  procedureLabel: string;
  medications: MedRow[];
  woundCare: WoundRow[];
  goals: GoalRow[];
  careTeam: CareTeam;
}

export interface DayItem {
  /** Stable id across days, so a tick for one item never marks another. */
  id: string;
  kind: "med" | "wound" | "goal";
  label: string;
  /** Secondary line, e.g. the patient's own dose text. */
  detail: string;
  /** "HH:MM" 24-hour, or null for "any time today". */
  time: string | null;
}

export interface DaySection {
  key: string;
  title: string;
  items: DayItem[];
}

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const isTimeValue = (value: string): boolean => TIME_PATTERN.test(value);

/** "14:30" -> "2:30 PM". Plain 12-hour language, no jargon. */
export const formatTime = (value: string): string => {
  const [hoursRaw, minutes] = value.split(":");
  const hours = Number(hoursRaw);
  if (!Number.isFinite(hours)) return value;
  const suffix = hours < 12 ? "AM" : "PM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(display)}:${minutes} ${suffix}`;
};

const uniqueTimes = (times: string[]): string[] =>
  [...new Set(times.filter(isTimeValue))].sort();

/** Everything from the saved plan that is due on any given day, in order. */
export function buildDayItems(plan: Plan | null): DayItem[] {
  if (!plan) return [];
  const timed: DayItem[] = [];
  const anytime: DayItem[] = [];

  for (const med of plan.medications) {
    for (const time of uniqueTimes(med.times)) {
      timed.push({
        id: `med:${med.id}:${time}`,
        kind: "med",
        label: med.name,
        detail: med.dose.trim().length > 0 ? med.dose.trim() : "Medication",
        time,
      });
    }
  }

  for (const wound of plan.woundCare) {
    const times = uniqueTimes(wound.times);
    if (times.length > 0) {
      for (const time of times) {
        timed.push({
          id: `wound:${wound.id}:${time}`,
          kind: "wound",
          label: wound.label,
          detail: "Wound care",
          time,
        });
      }
    } else {
      const count = Math.min(Math.max(wound.perDay, 1), 3);
      for (let n = 1; n <= count; n += 1) {
        anytime.push({
          id: `wound:${wound.id}:any:${String(n)}`,
          kind: "wound",
          label: wound.label,
          detail: count > 1 ? `Wound care (${String(n)} of ${String(count)})` : "Wound care",
          time: null,
        });
      }
    }
  }

  const ordered = [
    ...timed.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? "")),
    ...anytime,
  ];
  const goals: DayItem[] = plan.goals.map((goal) => ({
    id: `goal:${goal.id}`,
    kind: "goal",
    label: goal.label,
    detail: "Goal",
    time: null,
  }));

  return [...ordered, ...goals];
}

/** The day split into the sections the Today view renders. */
export function buildDaySections(plan: Plan | null): DaySection[] {
  const items = buildDayItems(plan);
  const sections: DaySection[] = [];
  const byTime = new Map<string, DayItem[]>();
  const untimed: DayItem[] = [];
  const goals: DayItem[] = [];

  for (const item of items) {
    if (item.kind === "goal") {
      goals.push(item);
      continue;
    }
    if (item.time === null) {
      untimed.push(item);
      continue;
    }
    const bucket = byTime.get(item.time);
    if (bucket) bucket.push(item);
    else byTime.set(item.time, [item]);
  }

  for (const time of [...byTime.keys()].sort()) {
    sections.push({ key: `time:${time}`, title: formatTime(time), items: byTime.get(time) ?? [] });
  }
  if (untimed.length > 0) {
    sections.push({ key: "anytime", title: "Any time today", items: untimed });
  }
  if (goals.length > 0) {
    sections.push({ key: "goals", title: "Goals for today", items: goals });
  }
  return sections;
}
