/** Small date helpers. Dates are handled as plain "YYYY-MM-DD" strings, never as
 * Date objects crossing the server/client boundary. */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateValue = (value: string): boolean => {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

/** Today on the server clock (UTC). */
export const utcToday = (): string => new Date().toISOString().slice(0, 10);
/**
 * True when two `YYYY-MM-DD` values are the same day or neighbouring days.
 *
 * One day of slack either way covers the difference between the patient's own
 * time zone and the server's, without letting a request name an arbitrary day.
 */
export const withinOneDayOf = (date: string, reference: string): boolean => {
  if (!isDateValue(date) || !isDateValue(reference)) return false;
  const drift = Math.abs(
    new Date(`${date}T00:00:00Z`).getTime() - new Date(`${reference}T00:00:00Z`).getTime(),
  );
  return drift <= 24 * 60 * 60 * 1000;
};

/** "2026-10-03" -> "Saturday, October 3, 2026". */
export const formatDateLong = (value: string): string => {
  if (!isDateValue(value)) return value;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};

/** "2026-10-03" -> "Oct 3, 2026". */
export const formatDateShort = (value: string): string => {
  if (!isDateValue(value)) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
};
