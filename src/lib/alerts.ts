import { formatTemperature, inUnit, type LogEntry } from "~/lib/logs";
import type { Plan } from "~/lib/plan";

/**
 * The red-flag check: a plain threshold comparison of a value the patient logged
 * against a limit the patient (or their care team) entered in their own plan.
 *
 * It never diagnoses, never says what a symptom might mean and never mentions
 * medication. Its only output is a sentence naming the value and the saved limit,
 * so the page can say plainly: contact your care team.
 *
 * No saved limit for a value means that value is never checked.
 */

export interface RedFlag {
  kind: "pain" | "temperature";
  /** Which value crossed the patient's own limit. */
  reading: string;
  /** The limit they saved for it. */
  limit: string;
}

export const evaluateRedFlags = (plan: Plan | null, entry: LogEntry | null): RedFlag[] => {
  if (!plan || !entry) return [];
  const flags: RedFlag[] = [];

  const painLimit = plan.careTeam.painThreshold;
  if (painLimit !== null && entry.pain >= painLimit) {
    flags.push({
      kind: "pain",
      reading: `Pain score ${String(entry.pain)} out of 10`,
      limit: `${String(painLimit)} out of 10`,
    });
  }

  const tempLimit = plan.careTeam.tempThreshold;
  if (tempLimit !== null && entry.temperature !== null) {
    // Compare like with like: the reading is shown in the unit the limit is in.
    const reading = inUnit(entry.temperature, entry.temperatureUnit, plan.careTeam.tempUnit);
    if (reading >= tempLimit) {
      flags.push({
        kind: "temperature",
        reading: `Temperature ${formatTemperature(reading, plan.careTeam.tempUnit)}`,
        limit: formatTemperature(tempLimit, plan.careTeam.tempUnit),
      });
    }
  }

  return flags;
};
