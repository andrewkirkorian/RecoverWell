/**
 * The daily log: its shape, and the small amount of arithmetic the app does with
 * what the patient typed.
 *
 * Nothing here is clinical knowledge. A pain score and a temperature are values
 * the patient recorded; the unit is the one they chose in their own plan. This
 * module has no server-only imports, so the same code runs while rendering.
 */

export type TempUnit = "C" | "F";

export interface LogEntry {
  /** "YYYY-MM-DD" — one entry per day, per user. */
  date: string;
  /** 0–10, on the patient's own scale. */
  pain: number;
  /** The patient's temperature reading, or null when they didn't record one. */
  temperature: number | null;
  /** The unit `temperature` was recorded in, at the time it was recorded. */
  temperatureUnit: TempUnit;
  /** The patient's own note about their wound, if any. */
  woundNote: string;
  /** The patient's own general note, if any. */
  note: string;
}

export const PAIN_STEPS: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Fahrenheit -> Celsius. Plain arithmetic on a number the patient typed. */
export const toCelsius = (fahrenheit: number): number => ((fahrenheit - 32) * 5) / 9;

export const toFahrenheit = (celsius: number): number => (celsius * 9) / 5 + 32;

/**
 * The same reading expressed in `unit`, rounded to one decimal.
 *
 * Used only so a value recorded in one unit can be compared with — and shown
 * beside — a limit the patient saved in the other; it never changes what the
 * patient typed.
 */
export const inUnit = (value: number, from: TempUnit, unit: TempUnit): number => {
  let converted = value;
  if (from !== unit) converted = unit === "C" ? toCelsius(value) : toFahrenheit(value);
  return Math.round(converted * 10) / 10;
};

/** 38.5 -> "38.5", 38 -> "38". */
export const formatNumber = (value: number): string =>
  Number.isInteger(value) ? String(value) : value.toFixed(1);

/** 38.5 in C -> "38.5 °C". */
export const formatTemperature = (value: number, unit: TempUnit): string =>
  `${formatNumber(value)} °${unit}`;

/** The unit's name as a patient reads it: "°C" -> "Celsius". */
export const unitName = (unit: TempUnit): string => (unit === "C" ? "Celsius" : "Fahrenheit");
