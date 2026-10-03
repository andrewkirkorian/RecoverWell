/**
 * Attempt counters for the two endpoints an attacker would grind: signing in
 * (guessing a real patient's password) and signing up (mass account creation).
 *
 * **In memory, deliberately.** This site runs as one process on one machine, so a
 * single table covers everything an attacker can do from here, and there is
 * nothing extra to deploy, configure or migrate. A restart forgets the counters,
 * which only resets an attacker's backoff — what actually makes guessing
 * expensive is the cost of the password hash itself.
 *
 * Nothing here is logged and the counters never leave this module. The only
 * things held are the email being attempted (already the account key) and the
 * client address; the tables are capped so a flood of distinct keys cannot grow
 * them without bound.
 *
 * The decision is made before any database work, and a throttled sign-in gives
 * exactly the same answer as a wrong password — so being throttled tells an
 * attacker nothing about whether an account exists.
 */

/** Failures are forgotten after this long without another one, so a patient who
 * mistyped their password this morning is never still paying for it tonight. */
const WINDOW_MS = 15 * 60 * 1000;

/** Ceiling on the tables: past this many distinct keys the whole table is
 * dropped, which can only make an attacker's life easier for one window and can
 * never take memory away from serving patients. */
const MAX_KEYS = 10_000;

interface Limits {
  /** Failures allowed inside the window before any delay at all. */
  free: number;
  /** First delay once past `free`; each further failure doubles it. */
  baseMs: number;
  /** Longest delay, so a person is never locked out indefinitely. */
  maxMs: number;
}

/**
 * Sign-in, per email. This is the load-bearing counter: it cannot be spoofed, and
 * it means attempts against one patient's account never lock anyone else out.
 * Five free attempts covers a person mistyping; from there the wait doubles from
 * one second up to fifteen minutes, so a guesser gets about five tries and then
 * nothing useful, while a patient waits seconds at worst.
 */
const LOGIN_EMAIL: Limits = { free: 5, baseMs: 1_000, maxMs: 15 * 60 * 1000 };

/**
 * Sign-in, per client address. Deliberately much looser than the per-email
 * counter: a household, a ward or a waiting-room wifi can share one address, and
 * locking a shared address out would lock out patients who did nothing wrong.
 * This counter is best-effort — the platform's proxy sets the forwarded address,
 * and a direct-caller could lie about it — which is why the free allowance is
 * high enough that only a flood trips it.
 */
const LOGIN_IP: Limits = { free: 30, baseMs: 1_000, maxMs: 15 * 60 * 1000 };

/**
 * Sign-up, per email. Lighter than sign-in — creating accounts is a nuisance, not
 * a way into someone else's record — but repeated attempts on one address are
 * unusual enough to slow down.
 */
const SIGNUP_EMAIL: Limits = { free: 5, baseMs: 2_000, maxMs: 30 * 60 * 1000 };

/** Sign-up, per client address: the mass-creation guard. Thirty attempts in a
 * window is far more than any real household needs and far fewer than a script. */
const SIGNUP_IP: Limits = { free: 30, baseMs: 5_000, maxMs: 60 * 60 * 1000 };

interface Counters {
  failures: number;
  lastFailureAt: number;
}

type Table = Map<string, Counters>;

const loginTable: Table = new Map();
const signupTable: Table = new Map();

/** The delay owed after `failures` failures: none up to `free`, then doubling. */
const delayMs = (failures: number, limits: Limits): number =>
  failures <= limits.free
    ? 0
    : Math.min(limits.maxMs, limits.baseMs * 2 ** (failures - limits.free - 1));

const isBlocked = (table: Table, key: string, limits: Limits, now: number): boolean => {
  const entry = table.get(key);
  if (!entry) return false;
  if (now - entry.lastFailureAt > WINDOW_MS) {
    table.delete(key);
    return false;
  }
  return now - entry.lastFailureAt < delayMs(entry.failures, limits);
};

const recordFailure = (table: Table, key: string, now: number): void => {
  const entry = table.get(key);
  if (!entry || now - entry.lastFailureAt > WINDOW_MS) {
    table.set(key, { failures: 1, lastFailureAt: now });
  } else {
    entry.failures += 1;
    entry.lastFailureAt = now;
  }
  if (table.size > MAX_KEYS) table.clear();
};

/**
 * The client address for the counters. The platform's proxy puts the real address
 * in `x-forwarded-for`; with no proxy in front (local runs) every caller counts
 * as one key, which is the safe direction.
 */
export const clientKey = (request: Request): string => {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = request.headers.get("x-real-ip")?.trim();
  return (forwarded && forwarded.length > 0 ? forwarded : real && real.length > 0 ? real : "local")
    .slice(0, 60);
};

/* --------------------------------------------------------------- sign in --- */

export const signInBlocked = (email: string, client: string): boolean => {
  const now = Date.now();
  return (
    isBlocked(loginTable, `e:${email}`, LOGIN_EMAIL, now) ||
    isBlocked(loginTable, `i:${client}`, LOGIN_IP, now)
  );
};

export const signInFailed = (email: string, client: string): void => {
  const now = Date.now();
  recordFailure(loginTable, `e:${email}`, now);
  recordFailure(loginTable, `i:${client}`, now);
};

/** A real sign-in wipes both counters: the owner is here, so the guessing is over. */
export const signInSucceeded = (email: string, client: string): void => {
  loginTable.delete(`e:${email}`);
  loginTable.delete(`i:${client}`);
};

/* -------------------------------------------------------------- sign up --- */

export const signUpBlocked = (email: string, client: string): boolean => {
  const now = Date.now();
  return (
    isBlocked(signupTable, `e:${email}`, SIGNUP_EMAIL, now) ||
    isBlocked(signupTable, `i:${client}`, SIGNUP_IP, now)
  );
};

export const signUpFailed = (email: string, client: string): void => {
  const now = Date.now();
  recordFailure(signupTable, `e:${email}`, now);
  recordFailure(signupTable, `i:${client}`, now);
};

/** The address now has an account of its own, so its per-email counter is moot.
 * The per-address counter is deliberately *not* cleared. */
export const signUpSucceeded = (email: string): void => {
  signupTable.delete(`e:${email}`);
};
