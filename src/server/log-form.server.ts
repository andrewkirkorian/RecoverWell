import { isDateValue } from "~/lib/dates";
import type { LogEntry, TempUnit } from "~/lib/logs";

/**
 * Reads one day's log out of the form the patient submitted. Server-only.
 *
 * The temperature unit is not taken from the form: the caller reads it from the
 * patient's own saved plan, so a value can never end up filed under a unit the
 * patient didn't choose. Nothing here logs, and the parsed entry is written to
 * storage keyed by the authenticated user id only.
 */

export type LogParseResult = { ok: true; entry: LogEntry } | { ok: false; error: string };

const text = (form: FormData, name: string, maxLength: number): string => {
  const value = form.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
};

/** Notes keep the patient's line breaks (they may write a list) but lose runs of
 * spaces and any blank-line pile-up. */
const note = (form: FormData, name: string): string =>
  text(form, name, 1200)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 600);

export function parseLogForm(form: FormData, temperatureUnit: TempUnit): LogParseResult {
  const date = text(form, "date", 10);
  if (!isDateValue(date)) return { ok: false, error: "date" };

  const painRaw = text(form, "pain", 4).trim();
  if (painRaw.length === 0) return { ok: false, error: "pain" };
  const pain = Number(painRaw);
  if (!Number.isInteger(pain) || pain < 0 || pain > 10) return { ok: false, error: "pain" };

  const tempRaw = text(form, "temperature", 12).trim();
  let temperature: number | null = null;
  if (tempRaw.length > 0) {
    // A comma decimal separator is taken as a decimal point ("37,5" -> 37.5).
    const value = Number(tempRaw.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0 || value > 200) {
      return { ok: false, error: "temperature" };
    }
    temperature = Math.round(value * 10) / 10;
  }

  return {
    ok: true,
    entry: {
      date,
      pain,
      temperature,
      temperatureUnit,
      woundNote: note(form, "wound_note"),
      note: note(form, "note"),
    },
  };
}
