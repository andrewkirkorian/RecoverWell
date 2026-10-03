import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell, Card, DatabaseNotice, FormMessage } from "~/components/AppShell";
import { RedFlagBanner } from "~/components/RedFlag";
import { evaluateRedFlags } from "~/lib/alerts";
import { formatDateLong, formatDateShort } from "~/lib/dates";
import { LOCAL_DATE_SCRIPT } from "~/lib/local-date";
import { messageFor, TODAY_ERRORS } from "~/lib/messages";
import { buildDayItems, formatTime, type DayItem } from "~/lib/plan";
import { loadTodayPage } from "~/server/api";

export const Route = createFileRoute("/today")({
  head: () => ({ meta: [{ title: "Today — RecoverWell" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    e: typeof search.e === "string" ? search.e : undefined,
  }),
  beforeLoad: async () => {
    const state = await loadTodayPage();
    if (state.db === "missing" || state.db === "error") return state;
    if (!state.signedIn) throw redirect({ to: "/login" });
    return state;
  },
  component: TodayPage,
});

function TickRow({ item, date, done }: { item: DayItem; date: string; done: boolean }) {
  return (
    <li>
      <form method="post" action="/api/tick">
        <input type="hidden" name="item" value={item.id} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="done" value={done ? "0" : "1"} />
        <button
          type="submit"
          aria-pressed={done}
          className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-4 text-left ${
            done
              ? "border-teal-200 bg-teal-50"
              : "border-slate-200 bg-white hover:border-teal-300"
          }`}
        >
          <span
            aria-hidden
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-white ${
              done ? "border-teal-600 bg-teal-600" : "border-slate-300 bg-white"
            }`}
          >
            {done ? "✓" : ""}
          </span>
          <span className="flex-1">
            <span
              className={`block text-base font-medium ${
                done ? "text-slate-500 line-through" : "text-slate-900"
              }`}
            >
              {item.label}
            </span>
            <span className="block text-sm text-slate-500">{item.detail}</span>
          </span>
          <span className="text-xs font-medium text-slate-400">
            {done ? "Undo" : "Tick off"}
          </span>
        </button>
      </form>
    </li>
  );
}

function TodayPage() {
  const state = Route.useRouteContext();
  const { e } = Route.useSearch();
  const message = messageFor(TODAY_ERRORS, e);

  if (state.db !== "ok") {
    return (
      <AppShell active="today">
        <DatabaseNotice state={state.db} />
      </AppShell>
    );
  }

  const plan = state.plan;
  const items = buildDayItems(plan);
  const doneSet = new Set(state.done);
  const doneCount = items.filter((item) => doneSet.has(item.id)).length;
  const total = items.length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const nextItem = items.find((item) => !doneSet.has(item.id)) ?? null;
  // A flag stays in front of the patient from their last log until the next one.
  const flags = evaluateRedFlags(plan, state.latest);

  return (
    <AppShell active="today">
      {flags.length > 0 ? (
        <div className="mb-5">
          <RedFlagBanner
            flags={flags}
            phone={plan?.careTeam.phone ?? ""}
            date={state.latest?.date ?? state.date}
          />
        </div>
      ) : null}

      <p className="text-sm font-medium text-teal-800">{formatDateLong(state.date)}</p>
      <h1 className="mt-1 text-2xl font-semibold">Today&rsquo;s recovery routine</h1>
      {plan ? (
        <p className="mt-1 text-sm text-slate-500">
          {plan.procedureLabel} &middot; surgery {formatDateShort(plan.surgeryDate)}
        </p>
      ) : null}

      {message ? (
        <div className="mt-4">
          <FormMessage>{message}</FormMessage>
        </div>
      ) : null}

      <a
        href="/log"
        className="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-teal-300 bg-white px-4 py-3 hover:bg-teal-50"
      >
        <span className="text-base font-medium text-teal-900">How are you feeling today?</span>
        <span className="text-sm text-teal-700">Log it &rarr;</span>
      </a>

      {!plan ? (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold">Your plan is empty</h2>
          <p className="mt-2 text-slate-600">
            Add your medications, wound-care steps and goals once, and they will appear here
            every day as a checklist. Everything comes from your own instructions.
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
          {total > 0 ? (
            <div className="mt-4">
              <p className="text-base font-medium text-slate-700">
                {doneCount} of {total} done
              </p>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={doneCount}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label="Items ticked off today"
              >
                <div className="h-full rounded-full bg-teal-600" style={{ width: `${String(percent)}%` }} />
              </div>
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl bg-teal-700 p-4 text-white">
            <p className="text-xs font-semibold tracking-wide uppercase opacity-90">Next up</p>
            {nextItem ? (
              <>
                <p className="mt-1 text-xl font-semibold">
                  {nextItem.time ? `${formatTime(nextItem.time)} · ` : ""}
                  {nextItem.label}
                </p>
                <p className="text-sm opacity-90">{nextItem.detail}</p>
              </>
            ) : (
              <p className="mt-1 text-xl font-semibold">
                Everything on today&rsquo;s list is ticked off
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-6">
            {state.sections.map((section) => (
              <section key={section.key}>
                <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
                  {section.title}
                </h2>
                <ul className="mt-2 flex flex-col gap-3">
                  {section.items.map((item) => (
                    <TickRow
                      key={item.id}
                      item={item}
                      date={state.date}
                      done={doneSet.has(item.id)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-sm text-slate-500">
        This list is what you entered. If you are worried about how your recovery is going,
        contact your care team.{" "}
        <a className="underline" href="/plan">
          Change my plan
        </a>
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <a
          href="/timeline"
          className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
        >
          <span className="text-base text-slate-700">See your recovery timeline</span>
          <span className="text-sm text-teal-700">Open &rarr;</span>
        </a>
        <a
          href="/summary"
          className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 hover:bg-slate-50"
        >
          <span className="text-base text-slate-700">Print a summary for your next appointment</span>
          <span className="text-sm text-teal-700">Open &rarr;</span>
        </a>
      </div>

      <script dangerouslySetInnerHTML={{ __html: LOCAL_DATE_SCRIPT }} />
    </AppShell>
  );
}
