import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell, Card, DatabaseNotice, FormMessage } from "~/components/AppShell";
import { RedFlagBanner } from "~/components/RedFlag";
import { evaluateRedFlags } from "~/lib/alerts";
import { formatDateLong, formatDateShort } from "~/lib/dates";
import { LOCAL_DATE_SCRIPT } from "~/lib/local-date";
import {
  formatNumber,
  formatTemperature,
  inUnit,
  PAIN_STEPS,
  unitName,
  type LogEntry,
  type TempUnit,
} from "~/lib/logs";
import { LOG_ERRORS, messageFor } from "~/lib/messages";
import { loadLogPage } from "~/server/api";

export const Route = createFileRoute("/log")({
  head: () => ({ meta: [{ title: "How you feel today — RecoverWell" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    e: typeof search.e === "string" ? search.e : undefined,
  }),
  beforeLoad: async () => {
    const state = await loadLogPage();
    if (state.db === "missing" || state.db === "error") return state;
    if (!state.signedIn) throw redirect({ to: "/login" });
    return state;
  },
  component: LogPage,
});

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 px-3 py-2 text-base text-slate-900 focus:border-teal-600 focus:outline-none";

/** The temperature to show in the form: the saved reading, in the unit the plan
 * uses now, so the patient never sees a number in the wrong unit. */
const prefillTemperature = (entry: LogEntry | null, unit: TempUnit): string => {
  if (!entry || entry.temperature === null) return "";
  return formatNumber(inUnit(entry.temperature, entry.temperatureUnit, unit));
};

function PainScale({ selected }: { selected: number | null }) {
  return (
    // Five per row, so every score is at least 44 px wide on a 320 px phone.
    <div className="mt-2 grid grid-cols-5 gap-2">
      {PAIN_STEPS.map((step) => (
        <label key={step} className="cursor-pointer">
          <input
            type="radio"
            name="pain"
            value={step}
            defaultChecked={selected === step}
            required
            className="peer sr-only"
          />
          <span className="flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-lg font-medium text-slate-800 peer-checked:border-teal-700 peer-checked:bg-teal-700 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-teal-700">
            {step}
          </span>
        </label>
      ))}
    </div>
  );
}

function EntryRow({ entry }: { entry: LogEntry }) {
  return (
    <li className="border-t border-slate-200 py-3 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold text-slate-700">{formatDateShort(entry.date)}</p>
      <p className="text-base text-slate-900">
        Pain {entry.pain} out of 10
        {entry.temperature !== null
          ? ` · ${formatTemperature(entry.temperature, entry.temperatureUnit)}`
          : ""}
      </p>
      {entry.woundNote.length > 0 ? (
        <p className="mt-1 text-sm text-slate-600 whitespace-pre-line break-words">
          <span className="font-medium text-slate-700">Wound: </span>
          {entry.woundNote}
        </p>
      ) : null}
      {entry.note.length > 0 ? (
        <p className="mt-1 text-sm text-slate-600 whitespace-pre-line break-words">
          <span className="font-medium text-slate-700">Note: </span>
          {entry.note}
        </p>
      ) : null}
    </li>
  );
}

function LogPage() {
  const state = Route.useRouteContext();
  const { e } = Route.useSearch();
  const message = messageFor(LOG_ERRORS, e);

  if (state.db !== "ok") {
    return (
      <AppShell active="log">
        <DatabaseNotice state={state.db} />
      </AppShell>
    );
  }

  const plan = state.plan;
  const unit = plan?.careTeam.tempUnit ?? "C";
  const flags = evaluateRedFlags(plan, state.latest);
  const today = state.today;
  const warningSigns = plan?.careTeam.warningSigns ?? [];

  return (
    <AppShell active="log">
      <p className="text-sm font-medium text-teal-800">{formatDateLong(state.date)}</p>
      <h1 className="mt-1 text-2xl font-semibold">How you feel today</h1>
      <p className="mt-1 text-sm text-slate-500">
        Two numbers and a note &mdash; it takes under a minute.
      </p>

      {flags.length > 0 ? (
        <div className="mt-4">
          <RedFlagBanner flags={flags} phone={plan?.careTeam.phone ?? ""} date={state.latest?.date ?? state.date} />
        </div>
      ) : null}

      <form method="post" action="/api/log" className="mt-5 flex flex-col gap-5">
        {message ? <FormMessage>{message}</FormMessage> : null}
        <input type="hidden" name="date" value={state.date} />

        <Card>
          <fieldset>
            <legend className="text-lg font-semibold">Pain score, 0 to 10</legend>
            <p className="mt-1 text-sm text-slate-600">
              The number you would give your care team today.
            </p>
            <PainScale selected={today?.pain ?? null} />
          </fieldset>
        </Card>

        <Card>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Temperature in {unitName(unit)} (&deg;{unit}) &mdash; leave blank if you didn&rsquo;t
            take it
            <input
              className={inputClass}
              type="number"
              name="temperature"
              step="0.1"
              min="0"
              inputMode="decimal"
              defaultValue={prefillTemperature(today, unit)}
              placeholder="For example: 37.2"
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">
            You chose {unitName(unit)} in your plan.{" "}
            <a className="underline" href="/plan">
              Change it there
            </a>
            .
          </p>
        </Card>

        <Card>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Wound check
            <textarea
              className={`${inputClass} min-h-24`}
              name="wound_note"
              rows={3}
              maxLength={600}
              defaultValue={today?.woundNote ?? ""}
              placeholder="What you saw when you checked your wound, in your own words"
            />
          </label>
        </Card>

        <Card>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Anything else
            <textarea
              className={`${inputClass} min-h-24`}
              name="note"
              rows={3}
              maxLength={600}
              defaultValue={today?.note ?? ""}
              placeholder="Sleep, appetite, how you got on today"
            />
          </label>
        </Card>

        <button
          type="submit"
          className="min-h-14 rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
        >
          {today ? "Update today's log" : "Save today's log"}
        </button>
      </form>

      {today ? (
        <p className="mt-3 text-sm text-slate-500">
          You already have a log for today. Saving again updates that entry.
        </p>
      ) : null}

      {warningSigns.length > 0 ? (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold">Warning signs you saved</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your own list, in your words. RecoverWell can&rsquo;t check these for you &mdash; it
            keeps them here so you have them to hand.
          </p>
          <ul className="mt-3 flex list-disc flex-col gap-1 pl-5 text-slate-800">
            {warningSigns.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section className="mt-6">
        <h2 className="text-lg font-semibold">Your last few days</h2>
        {state.recent.length === 0 ? (
          <p className="mt-2 text-slate-600">
            Nothing logged yet. What you save here is kept for your next appointment.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {state.recent.map((entry) => (
              <EntryRow key={entry.date} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-slate-500">
        RecoverWell only records what you type and shows it back. It is not medical advice. If
        you are worried about how your recovery is going, contact your care team.
      </p>

      <script dangerouslySetInnerHTML={{ __html: LOCAL_DATE_SCRIPT }} />
    </AppShell>
  );
}
