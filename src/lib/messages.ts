/** Plain-language messages for the error codes the form posts come back with. */

export const SIGNUP_ERRORS: Record<string, string> = {
  email: "Please enter a valid email address.",
  password: "Please choose a password with at least 8 characters.",
  email_taken: "That email is already registered. Try logging in instead.",
  nodb: "The app isn't connected to its database yet, so accounts can't be created right now.",
  problem: "Something went wrong saving your account. Please try again.",
};

export const LOGIN_ERRORS: Record<string, string> = {
  bad: "Email or password is incorrect.",
  nodb: "The app isn't connected to its database yet, so you can't log in right now.",
  problem: "Something went wrong signing you in. Please try again.",
};

export const PLAN_ERRORS: Record<string, string> = {
  surgery_date: "Please add the date of your surgery.",
  procedure_label: "Please add a short name for your surgery.",
  med_name: "Each medication needs a name — please fill it in or remove that row.",
  med_time: "Each medication needs at least one time of day.",
  wound_label: "Each wound-care step needs a short label — please fill it in or remove that row.",
  wound_time: "Please add at least one time of day, or choose once daily or twice daily.",
  empty: "Add at least one medication, wound-care step or goal, then save.",
  pain_threshold:
    "The pain score to call about has to be a whole number from 0 to 10 — or leave it blank.",
  temp_threshold:
    "The temperature to call about has to be a number — or leave it blank.",
  nodb: "The app isn't connected to its database yet, so your plan can't be saved right now.",
  problem: "Something went wrong saving your plan. Please try again.",
};

export const LOG_ERRORS: Record<string, string> = {
  pain: "Please choose a pain score from 0 to 10.",
  temperature: "Please enter your temperature as a number, or leave it blank.",
  date: "We couldn't tell which day this log was for. Please reload the page and try again.",
  nodb: "The app isn't connected to its database yet, so your log can't be saved right now.",
  problem: "Something went wrong saving your log. Please try again.",
};

export const TODAY_ERRORS: Record<string, string> = {
  problem: "That tick couldn't be saved. Please try again.",
  nodb: "The app isn't connected to its database yet, so ticks can't be saved right now.",
};

export const messageFor = (
  messages: Record<string, string>,
  code: string | undefined,
): string | null => (code ? messages[code] ?? null : null);
