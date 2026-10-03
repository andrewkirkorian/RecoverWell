import {
  isTimeValue,
  type CareTeam,
  type GoalRow,
  type MedRow,
  type Plan,
  type WoundRow,
} from "~/lib/plan";
import type { TempUnit } from "~/lib/logs";
import { clean } from "~/lib/validate";

/** Reads the patient's own entries out of the plan form. No field is ever
 * defaulted to clinical content — an empty field stays empty. */

const MAX_ROWS = 30;
const MAX_TIMES = 6;
const MAX_WARNINGS = 20;
const ID_PATTERN = /^[A-Za-z0-9_-]{6,64}$/;

export type PlanParseResult =
  | { ok: true; plan: Plan }
  | { ok: false; error: string };

const rowId = (value: FormDataEntryValue | null): string => {
  const text = typeof value === "string" ? value : "";
  if (ID_PATTERN.test(text)) return text;
  return crypto.randomUUID();
};

const count = (form: FormData, name: string): number => {
  const raw = Number(form.get(name));
  if (!Number.isFinite(raw)) return 0;
  return Math.min(Math.max(Math.trunc(raw), 0), MAX_ROWS);
};

const field = (form: FormData, name: string, maxLength = 120): string =>
  clean(typeof form.get(name) === "string" ? String(form.get(name)) : "", maxLength);

const timesFor = (form: FormData, name: string, howMany: number): string[] => {
  const values: string[] = [];
  for (let index = 0; index < howMany; index += 1) {
    const value = form.get(`${name}_${String(index)}`);
    if (typeof value === "string" && isTimeValue(value)) values.push(value);
  }
  return [...new Set(values)].slice(0, MAX_TIMES);
};

/** A blank field is `null` (the patient didn't give a number); text that isn't a
 * number is `NaN`, which the caller turns into a plain error message. */
const optionalNumber = (form: FormData, name: string): number | null => {
  const raw = form.get(name);
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (text.length === 0) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : NaN;
};

/**
 * The "when to call your care team" section. Every field is optional and nothing
 * is ever filled in for the patient: a blank stays blank, and a blank limit means
 * the app never raises an alert for that value.
 */
const parseCareTeam = (form: FormData): CareTeam | "pain_threshold" | "temp_threshold" => {
  const pain = optionalNumber(form, "pain_threshold");
  if (pain !== null && (!Number.isInteger(pain) || pain < 0 || pain > 10)) {
    return "pain_threshold";
  }

  const temp = optionalNumber(form, "temp_threshold");
  if (temp !== null && (temp <= 0 || temp > 200)) return "temp_threshold";

  const unit: TempUnit = form.get("temp_unit") === "F" ? "F" : "C";

  const warningSigns: string[] = [];
  for (let index = 0; index < count(form, "warning_count"); index += 1) {
    const text = field(form, `warning_${String(index)}_text`, 160);
    if (text.length === 0 || warningSigns.includes(text)) continue;
    warningSigns.push(text);
    if (warningSigns.length >= MAX_WARNINGS) break;
  }

  return {
    painThreshold: pain,
    // Keep the patient's number at the precision a thermometer shows.
    tempThreshold: temp === null ? null : Math.round(temp * 10) / 10,
    tempUnit: unit,
    warningSigns,
    phone: field(form, "care_team_phone", 40),
  };
};

export function parsePlanForm(form: FormData): PlanParseResult {
  const surgeryDate = field(form, "surgery_date", 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(surgeryDate)) return { ok: false, error: "surgery_date" };
  const procedureLabel = field(form, "procedure_label");
  if (procedureLabel.length === 0) return { ok: false, error: "procedure_label" };

  const medications: MedRow[] = [];
  for (let index = 0; index < count(form, "med_count"); index += 1) {
    const name = field(form, `med_${String(index)}_name`);
    const dose = field(form, `med_${String(index)}_dose`, 80);
    const timeCount = Math.min(
      Math.max(Math.trunc(Number(form.get(`med_${String(index)}_times`)) || 0), 0),
      MAX_TIMES,
    );
    const times = timesFor(form, `med_${String(index)}_time`, timeCount);
    const isEmpty = name.length === 0 && dose.length === 0 && times.length === 0;
    if (isEmpty) continue;
    if (name.length === 0) return { ok: false, error: "med_name" };
    if (times.length === 0) return { ok: false, error: "med_time" };
    medications.push({ id: rowId(form.get(`med_${String(index)}_id`)), name, dose, times });
  }

  const woundCare: WoundRow[] = [];
  for (let index = 0; index < count(form, "wound_count"); index += 1) {
    const label = field(form, `wound_${String(index)}_label`);
    // "times" (the patient picks times), "perday:1" (once daily) or "perday:2" (twice daily).
    const schedule = field(form, `wound_${String(index)}_schedule`, 12);
    const scheduled = !schedule.startsWith("perday");
    const perDay = schedule === "perday:2" ? 2 : 1;
    const timeCount = Math.min(
      Math.max(Math.trunc(Number(form.get(`wound_${String(index)}_times`)) || 0), 0),
      MAX_TIMES,
    );
    const times = scheduled ? timesFor(form, `wound_${String(index)}_time`, timeCount) : [];
    if (label.length === 0 && times.length === 0 && scheduled) continue;
    if (label.length === 0) return { ok: false, error: "wound_label" };
    if (scheduled && times.length === 0) return { ok: false, error: "wound_time" };
    woundCare.push({
      id: rowId(form.get(`wound_${String(index)}_id`)),
      label,
      times,
      perDay: scheduled ? 1 : perDay,
    });
  }

  const goals: GoalRow[] = [];
  for (let index = 0; index < count(form, "goal_count"); index += 1) {
    const label = field(form, `goal_${String(index)}_label`);
    if (label.length === 0) continue;
    goals.push({ id: rowId(form.get(`goal_${String(index)}_id`)), label });
  }

  if (medications.length === 0 && woundCare.length === 0 && goals.length === 0) {
    return { ok: false, error: "empty" };
  }

  const careTeam = parseCareTeam(form);
  if (typeof careTeam === "string") return { ok: false, error: careTeam };

  return {
    ok: true,
    plan: { surgeryDate, procedureLabel, medications, woundCare, goals, careTeam },
  };
}
