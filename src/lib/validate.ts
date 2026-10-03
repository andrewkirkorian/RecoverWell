/** Plain input checks shared by the signup/login/plan forms. */

export const PASSWORD_MIN_LENGTH = 8;

export const normalizeEmail = (value: string): string => value.trim().toLowerCase();

/** Deliberately loose: we only need to catch obvious typos, not police addresses. */
export const isEmailShaped = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export const clean = (value: string, maxLength = 200): string =>
  value.replace(/\s+/g, " ").trim().slice(0, maxLength);
