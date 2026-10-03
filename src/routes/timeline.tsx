import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell, Card, DatabaseNotice } from "~/components/AppShell";
import { formatDateLong, formatDateShort } from "~/lib/dates";
import { MAX_TIMELINE_DAYS, type TimelineDay } from "~/lib/history";
import { formatTemperature } from "~/lib/logs";
import { loadHistoryPage } from "~/server/api";

/**
 * The recovery timeline: one row for every day since the patient's surgery date,
 * newest first. It shows only what the patient entered — the pain score and
 * temperature they logged, their own wound and general notes, how much of that
 * day's checklist they ticked — and, on any day a value they logged met a limit
 * they saved, the plain fact that the app told them to contact their care team.
 *
 * A day with no entry still gets a row, so a gap in the record is visible rather
 * than hidden. Nothing here interprets a symptom, predicts anything, or gives
 * advice about medicines.
 */
export const Route = createFileRoute("/timeline")({
  head: () => ({ meta: [{ title: "Your recovery timeline — RecoverWell" }] }),
  beforeLoad: async () => {
    const state = await loadHistoryPage();
    if (state.db === "missing" || state.db === "error") return state;
    if (!state.signedIn) throw redirect({ to: "/login" });
    return state;
  },
  component: TimelinePage,
});

/** The values the patient logged that day, in one plain line. */
const loggedLine = (day: TimelineDay): string => {
  const entry = day.entry;
  if (!entry) return "";
  const parts = [`Pain ${String(entry.pain)} out of 10`];
  if (entry.temperature !== null) {
    parts.push(formatTemperature(entry.temperature, entry.temperatureUnit));
  }
  return parts.join(" · ");
};

function DayRow({ day }: { day: TimelineDay }) {
  const percent = day.total > 0 ? Math.round((day.done / day.total) * 100) : 0;

  return (
    <li
      data-day={day.date}
      className="print-row break-inside-avoid rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-base font-semibold text-slate-900">{formatDateShort(day.date)}</p>
        <p className="text-xs font-medium text-slate-500">{`Day ${String(day.dayNumber)}`}</p>
      </div>

      {day.entry ? (
        <>
          <p className="mt-1 text-base text-slate-900">{loggedLine(day)}</p>
          {day.entry.woundNote.length > 0 ? (
            <p className="mt-1 text-sm break-words whitespace-pre-line text-slate-600">
              <span className="font-medium text-slate-700">Wound: </span>
              {day.entry.woundNote}
            </p>
          ) : null}
          {day.entry.note.length > 0 ? (
            <p className="mt-1 text-sm break-words whitespace-pre-line text-slate-600">
              <span className="font-medium text-slate-700">Note: </span>
              {day.entry.note}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-base text-slate-500">Nothing logged</p>
      )}

      {day.flags.length > 0 ? (
        <div className="mt-2 rounded-xl border-2 border-red-300 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">
            You logged a value at or above a limit you saved, so the app told you to contact
            your care team that day.
          </p>
          <ul className="mt-1 flex flex-col gap-1">
            {day.flags.map((flag) => (
              <li key={flag.kind} className="text-sm text-red-900">
                {`${flag.reading} — you saved ${flag.limit} as your limit.`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {day.total > 0 ? (
        <div className="mt-3">
          <p className="text-sm font-medium text-slate-700">
            {`Checklist: ${String(day.done)} of ${String(day.total)} done`}
          </p>
          {/* A plain inline bar, no chart library. */}
          <div
            className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200"
            role="img"
            aria-label={`${String(day.done)} of ${String(day.total)} items ticked off`}
          >
            <div
              className="h-full rounded-full bg-teal-600"
              style={{ width: `${String(percent)}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No checklist items in your plan</p>
      )}
    </li>
  );
}

function TimelinePage() {
  const state = Route.useRouteContext();

  if (state.db !== "ok") {
    return (
      <AppShell active="timeline">
        <DatabaseNotice state={state.db} />
      </AppShell>
    );
  }

  const { history } = state;
  const surgeryDate = history.surgeryDate;

  return (
    <AppShell active="timeline">
      <h1 className="text-2xl font-semibold">Your recovery timeline</h1>

      <a
        href="/summary"
        className="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-teal-300 bg-white px-4 py-3 hover:bg-teal-50"
      >
        <span className="text-base font-medium text-teal-900">
          For your next appointment: print what you have logged
        </span>
        <span className="text-sm text-teal-700">Open &rarr;</span>
      </a>

      {!surgeryDate ? (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold">Your surgery date is not saved yet</h2>
          <p className="mt-2 text-slate-600">
            The timeline is one row per day from your surgery date onwards. Add the date of
            your surgery in your plan and every day since will appear here.
          </p>
          <a
            className="mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
            href="/plan"
          >
            Set up my plan
          </a>
        </Card>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-500">
            {`Your surgery was on ${formatDateShort(surgeryDate)}; day 1 is the day of your surgery. Days with nothing logged are shown too, so you can see the gaps.`}
          </p>
          {history.capped ? (
            <p className="mt-1 text-sm text-slate-500">
              {`This page shows your most recent ${String(MAX_TIMELINE_DAYS)} days, from ${formatDateShort(history.shownFrom ?? surgeryDate)} to ${formatDateShort(history.shownTo ?? state.date)}.`}
            </p>
          ) : null}

          {history.days.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-3">
              {history.days.map((day) => (
                <DayRow key={day.date} day={day} />
              ))}
            </ul>
          ) : (
            <Card className="mt-6">
              <p className="text-slate-600">
                {`You saved ${formatDateShort(surgeryDate)} as your surgery date, so there are no days since then yet.`}
              </p>
            </Card>
          )}
        </>
      )}

      <p className="mt-8 text-sm text-slate-500">
        This is a record of what you logged and ticked off, and the limits you saved. It is not
        medical advice. Today is {formatDateLong(state.date)}.
      </p>
    </AppShell>
  );
}
