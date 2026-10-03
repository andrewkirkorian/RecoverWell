import { isDateValue, utcToday, withinOneDayOf } from "~/lib/dates";
import { readCookie } from "~/server/session.server";

/**
 * Which calendar day a request is about. The browser tells us the patient's own
 * local date in a cookie (it holds a date, never health data); we only believe it
 * when it is the same day as the server's or the neighbouring one, so a stale or
 * tampered cookie can never point a request at an arbitrary day. Server-only.
 */

export const LOCAL_DATE_COOKIE = "rw_local_date";

export const localDateFor = (request: Request): string => {
  const fromCookie = readCookie(request, LOCAL_DATE_COOKIE);
  const server = utcToday();
  if (!fromCookie || !isDateValue(fromCookie)) return server;
  return withinOneDayOf(fromCookie, server) ? fromCookie : server;
};

/**
 * True when a date posted to us is the patient's local day or a neighbouring one.
 * Anything further away is refused: the app only ever acts on a day the patient
 * could actually be living (and the drift between their clock and ours).
 */
export const isAcceptableDayFor = (date: string, request: Request): boolean =>
  isDateValue(date) && withinOneDayOf(date, localDateFor(request));
