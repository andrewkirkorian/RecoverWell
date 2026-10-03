import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell, Card, DatabaseNotice } from "~/components/AppShell";
import { formatDateLong, formatDateShort } from "~/lib/dates";
import { readingAsEntered, type HistoryTotals, type TimelineDay } from "~/lib/history";
import { formatTemperature, unitName } from "~/lib/logs";
import { formatTime, type Plan } from "~/lib/plan";
import { loadHistoryPage } from "~/server/api";

/**
 * The follow-up appointment summary: one page the patient can print or show on
 * their phone and hand to their clinician.
 *
 * Every line is the patient's own entry shown back — the surgery details,
 * medications, wound-care steps, goals and care-team limits they typed in, and
 * the days they logged. It says plainly that it is a record of what they entered
 * and not a clinical assessment; it never interprets a symptom, predicts
 * anything, or advises about medicines.
 */
export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "Summary for your appointment — RecoverWell" }] }),
  beforeLoad: async () => {
    const state = await loadHistoryPage();
    if (state.db === "missing" || state.db === "error") return state;
    if (!state.signedIn) throw redirect({ to: "/login" });
    return state;
  },
  component: SummaryPage,
});

/** A tiny inline handler so the print button works without a script bundle. */
const PRINT_SCRIPT =
  `(function(){try{var b=document.getElementById("rw-print");` +
  `if(b)b.addEventListener("click",function(){window.print()});}catch(e){}})();`;

const MAX_TABLE_ROWS = 30;

const notSaved = "none saved";

/** "1 tablet · 8:00 AM, 8:00 PM" — the dose and times exactly as entered. */
const medTimes = (times: string[]): string =>
  times.length > 0 ? times.map((time) => formatTime(time)).join(", ") : "no times saved";

const woundSchedule = (times: string[], perDay: number): string => {
  if (times.length > 0) return times.map((time) => formatTime(time)).join(", ");
  return perDay >= 2 ? "twice daily" : "once daily";
};

const checklistText = (day: TimelineDay): string =>
  day.total > 0 ? `${String(day.done)} of ${String(day.total)} done` : "no checklist items";

const painSummary = (totals: HistoryTotals): string => {
  if (totals.painCount === 0 || totals.painMin === null || totals.painMax === null) {
    return "Pain scores: none logged.";
  }
  const count = `Pain scores: ${String(totals.painCount)} logged,`;
  if (totals.painMin === totals.painMax) {
    return `${count} each ${String(totals.painMin)} out of 10.`;
  }
  return `${count} from ${String(totals.painMin)} to ${String(totals.painMax)} out of 10.`;
};

const temperatureSummary = (totals: HistoryTotals): string => {
  if (totals.tempCount === 0 || totals.tempLow === null || totals.tempHigh === null) {
    return "Temperature readings: none logged.";
  }
  const unit = `°${totals.tempUnit}`;
  const low = formatTemperature(totals.tempLow, totals.tempUnit);
  const high = formatTemperature(totals.tempHigh, totals.tempUnit);
  const range =
    totals.tempLow === totals.tempHigh
      ? `each ${low}`
      : `lowest ${low}, highest ${high}`;
  return `Temperature readings: ${String(totals.tempCount)} logged, ${range} (shown in ${unit}, the unit you saved in your plan).`;
};

const coversText = (
  totals: HistoryTotals,
  from: string,
  to: string,
  surgeryDate: string,
): string => {
  if (totals.shown < totals.covered) {
    return `This record covers your most recent ${String(totals.shown)} days, from ${formatDateShort(from)} to ${formatDateShort(to)}.`;
  }
  return `This record covers the ${String(totals.covered)} days from your surgery on ${formatDateShort(surgeryDate)} to ${formatDateShort(to)}.`;
};

function PlanSection({ plan }: { plan: Plan }) {
  const unit = plan.careTeam.tempUnit;
  const painLimit =
    plan.careTeam.painThreshold === null
      ? notSaved
      : `${String(plan.careTeam.painThreshold)} out of 10`;
  const tempLimit =
    plan.careTeam.tempThreshold === null
      ? notSaved
      : formatTemperature(plan.careTeam.tempThreshold, unit);

  return (
    <>
      <Card className="print-row mt-4 break-inside-avoid">
        <h2 className="text-lg font-semibold">Your surgery, as you entered it</h2>
        <dl className="mt-2 flex flex-col gap-1 text-base">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-700">Date of surgery:</dt>
            <dd>{formatDateShort(plan.surgeryDate)}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-700">What you called the surgery:</dt>
            <dd>{plan.procedureLabel.length > 0 ? plan.procedureLabel : notSaved}</dd>
          </div>
        </dl>
      </Card>

      <Card className="print-row mt-4 break-inside-avoid">
        <h2 className="text-lg font-semibold">Medications, as you entered them</h2>
        {plan.medications.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {plan.medications.map((med) => (
              <li key={med.id}>
                <p className="text-base font-medium text-slate-900">
                  {`${med.name.length > 0 ? med.name : "(no name)"} — ${med.dose.length > 0 ? med.dose : "(no dose)"}`}
                </p>
                <p className="text-sm text-slate-600">{`Times: ${medTimes(med.times)}`}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-600">No medications entered.</p>
        )}
      </Card>

      <Card className="print-row mt-4 break-inside-avoid">
        <h2 className="text-lg font-semibold">Wound care, as you entered it</h2>
        {plan.woundCare.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {plan.woundCare.map((wound) => (
              <li key={wound.id}>
                <p className="text-base font-medium text-slate-900">
                  {wound.label.length > 0 ? wound.label : "(no step entered)"}
                </p>
                <p className="text-sm text-slate-600">
                  {`When: ${woundSchedule(wound.times, wound.perDay)}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-600">No wound-care steps entered.</p>
        )}
        {plan.goals.length > 0 ? (
          <>
            <h3 className="mt-3 text-base font-semibold">Goals, as you entered them</h3>
            <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
              {plan.goals.map((goal) => (
                <li key={goal.id}>{goal.label}</li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>

      <Card className="print-row mt-4 break-inside-avoid">
        <h2 className="text-lg font-semibold">The limits you saved for calling your care team</h2>
        <dl className="mt-2 flex flex-col gap-1 text-base">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-700">Pain score to call about:</dt>
            <dd>{painLimit}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-700">Temperature to call about:</dt>
            <dd>{tempLimit}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-medium text-slate-700">Care team phone number:</dt>
            <dd>{plan.careTeam.phone.length > 0 ? plan.careTeam.phone : notSaved}</dd>
          </div>
        </dl>
        <h3 className="mt-3 text-base font-semibold">Warning signs you saved</h3>
        {plan.careTeam.warningSigns.length > 0 ? (
          <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
            {plan.careTeam.warningSigns.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-slate-600">No warning signs entered.</p>
        )}
      </Card>
    </>
  );
}

function RecordSection({
  totals,
  days,
  surgeryDate,
  date,
}: {
  totals: HistoryTotals;
  days: TimelineDay[];
  surgeryDate: string;
  date: string;
}) {
  const logged = days.filter((day) => day.entry !== null);
  const shownLogged = logged.slice(0, MAX_TABLE_ROWS);
  const notes = logged.filter(
    (day) => day.entry && (day.entry.woundNote.length > 0 || day.entry.note.length > 0),
  );
  const from = days.length > 0 ? days[days.length - 1]!.date : surgeryDate;

  return (
    <Card className="print-row mt-4 break-inside-avoid">
      <h2 className="text-lg font-semibold">What you logged</h2>
      <p className="mt-2 text-base text-slate-700">{coversText(totals, from, date, surgeryDate)}</p>
      <ul className="mt-2 flex flex-col gap-1 text-base text-slate-800">
        <li>{`Days you logged: ${String(totals.logged)}`}</li>
        <li>
          {`Days you ticked off every item on your checklist: ${String(totals.fullyTicked)}`}
        </li>
        <li>{painSummary(totals)}</li>
        <li>{temperatureSummary(totals)}</li>
        <li>
          {`Days a limit you saved was met or passed: ${String(totals.crossed.length)}`}
        </li>
      </ul>

      {totals.crossed.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {totals.crossed.map((day) => (
            <li key={day.date} className="rounded-xl border-2 border-red-300 bg-red-50 p-3">
              <p className="text-base font-semibold text-red-800">
                {`${formatDateShort(day.date)} — you were told to contact your care team.`}
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {day.flags.map((flag) => (
                  <li key={flag.kind} className="text-sm text-red-900">
                    {`${flag.reading} — you saved ${flag.limit} as your limit.`}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-slate-700">
          No day you logged met or passed a limit you saved.
        </p>
      )}

      {shownLogged.length > 0 ? (
        <>
          <h3 className="mt-4 text-base font-semibold">Your logged days</h3>
          <table className="mt-2 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-300">
                <th scope="col" className="py-1 pr-2 font-semibold">Day</th>
                <th scope="col" className="py-1 pr-2 font-semibold">Pain</th>
                <th scope="col" className="py-1 pr-2 font-semibold">Temperature</th>
                <th scope="col" className="py-1 pr-2 font-semibold">Checklist</th>
                <th scope="col" className="py-1 font-semibold">Limit met or passed</th>
              </tr>
            </thead>
            <tbody>
              {shownLogged.map((day) => (
                <tr key={day.date} className="print-row break-inside-avoid border-b border-slate-200">
                  <td className="py-1 pr-2 align-top">
                    {`${formatDateShort(day.date)} (day ${String(day.dayNumber)})`}
                  </td>
                  <td className="py-1 pr-2 align-top">{`${String(day.entry?.pain ?? 0)} out of 10`}</td>
                  <td className="py-1 pr-2 align-top">
                    {day.entry ? readingAsEntered(day.entry, totals.tempUnit) : notSaved}
                  </td>
                  <td className="py-1 pr-2 align-top">{checklistText(day)}</td>
                  <td className="py-1 align-top">
                    {day.flags.length > 0 ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logged.length > shownLogged.length ? (
            <p className="mt-2 text-sm text-slate-600">
              {`Showing your most recent ${String(MAX_TABLE_ROWS)} logged days of ${String(logged.length)}.`}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-slate-700">Nothing has been logged yet.</p>
      )}

      {notes.length > 0 ? (
        <>
          <h3 className="mt-4 text-base font-semibold">Wound and other notes you logged</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {notes.map((day) => (
              <li key={day.date} className="print-row break-inside-avoid">
                <p className="text-sm font-semibold text-slate-700">{formatDateShort(day.date)}</p>
                {day.entry && day.entry.woundNote.length > 0 ? (
                  <p className="text-sm break-words whitespace-pre-line text-slate-800">
                    <span className="font-medium text-slate-700">Wound: </span>
                    {day.entry.woundNote}
                  </p>
                ) : null}
                {day.entry && day.entry.note.length > 0 ? (
                  <p className="text-sm break-words whitespace-pre-line text-slate-800">
                    <span className="font-medium text-slate-700">Note: </span>
                    {day.entry.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="mt-3 text-sm text-slate-600">
        {`Temperature readings are compared and totalled in °${totals.tempUnit} (${unitName(totals.tempUnit)}), the unit you saved in your plan. Each reading is shown above as you entered it.`}
      </p>
    </Card>
  );
}

function SummaryPage() {
  const state = Route.useRouteContext();

  if (state.db !== "ok") {
    return (
      <AppShell active="timeline">
        <DatabaseNotice state={state.db} />
      </AppShell>
    );
  }

  const { plan, history, totals } = state;
  const surgeryDate = history.surgeryDate;

  return (
    <AppShell active="timeline">
      <h1 className="text-2xl font-semibold">Summary for your follow-up appointment</h1>
      <p className="mt-2 text-slate-600">
        Print this page, or show it on your phone, when you see your care team. It is a record
        of what you entered in RecoverWell and what you ticked off. It is not a clinical
        assessment, and it is not medical advice.
      </p>

      <button
        id="rw-print"
        type="button"
        className="no-print mt-4 min-h-14 w-full rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
      >
        Print this page
      </button>

      {plan && surgeryDate ? (
        <>
          <PlanSection plan={plan} />
          <RecordSection
            totals={totals}
            days={history.days}
            surgeryDate={surgeryDate}
            date={state.date}
          />
        </>
      ) : (
        <Card className="print-row mt-6 break-inside-avoid">
          <h2 className="text-lg font-semibold">Your plan is not saved yet</h2>
          <p className="mt-2 text-slate-600">
            Everything on this page comes from your own plan and your own log. Save your plan
            and log a day, and it will all appear here ready to print.
          </p>
          <a
            className="no-print mt-4 flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
            href="/plan"
          >
            Set up my plan
          </a>
        </Card>
      )}

      <p className="mt-8 text-sm text-slate-500">
        {`Signed in as ${state.email ?? "your account"}. Prepared on ${formatDateLong(state.date)}. RecoverWell only records what you type and shows it back.`}
      </p>

      <script dangerouslySetInnerHTML={{ __html: PRINT_SCRIPT }} />
    </AppShell>
  );
}
