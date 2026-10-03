import type { RedFlag } from "~/lib/alerts";
import { formatDateShort } from "~/lib/dates";

/**
 * The red-flag banner.
 *
 * It appears only when a value the patient logged met or passed a limit the
 * patient's own care team gave them. It names the value and the limit, says
 * "contact your care team", and shows their saved number when there is one. It
 * never says what a symptom might mean, never mentions medication, and never
 * gives advice of its own.
 */
export function RedFlagBanner({
  flags,
  phone,
  date,
}: {
  flags: RedFlag[];
  phone: string;
  date: string;
}) {
  if (flags.length === 0) return null;

  // A phone number is dialled, not spoken: strip anything a dialler can't use.
  const dialable = phone.replace(/[^0-9+]/g, "");

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="rounded-2xl border-2 border-red-600 bg-red-50 p-4"
    >
      <h2 className="text-xl font-bold text-red-800">Contact your care team</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {flags.map((flag) => (
          <li key={flag.kind} className="text-base font-medium text-red-900">
            {flag.reading} — you saved {flag.limit} as your limit.
          </li>
        ))}
      </ul>
      <p className="mt-3 text-lg font-semibold text-red-900">
        {phone ? (
          <>
            Please contact your care team now:{" "}
            <a className="underline" href={`tel:${dialable}`}>
              {phone}
            </a>
          </>
        ) : (
          "Please contact your care team now."
        )}
      </p>
      <p className="mt-3 text-sm text-red-900">
        This is a reminder about the numbers you saved. It is not medical advice.
      </p>
      <p className="mt-1 text-sm text-red-800">From your log for {formatDateShort(date)}.</p>
    </section>
  );
}
