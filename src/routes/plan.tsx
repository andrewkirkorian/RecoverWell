import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";

import { AppShell, Card, DatabaseNotice, FormMessage } from "~/components/AppShell";
import { messageFor, PLAN_ERRORS } from "~/lib/messages";
import { loadPlanPage } from "~/server/api";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Your recovery plan — RecoverWell" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    e: typeof search.e === "string" ? search.e : undefined,
  }),
  beforeLoad: async () => {
    const state = await loadPlanPage();
    if (state.db === "missing" || state.db === "error") return state;
    if (!state.signedIn) throw redirect({ to: "/login" });
    return state;
  },
  component: PlanPage,
});

interface MedDraft {
  key: string;
  id: string;
  name: string;
  dose: string;
  times: string[];
}

interface WoundDraft {
  key: string;
  id: string;
  label: string;
  /** "times" | "perday:1" | "perday:2" */
  schedule: string;
  times: string[];
}

interface GoalDraft {
  key: string;
  id: string;
  label: string;
}

const newKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const emptyMed = (): MedDraft => ({ key: newKey(), id: "", name: "", dose: "", times: [""] });
const emptyWound = (): WoundDraft => ({
  key: newKey(),
  id: "",
  label: "",
  schedule: "times",
  times: [""],
});
const emptyGoal = (): GoalDraft => ({ key: newKey(), id: "", label: "" });

const inputClass =
  "min-h-12 w-full rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-teal-600 focus:outline-none";
const smallButtonClass =
  "rounded-lg px-2 py-2 text-sm font-medium text-slate-600 underline hover:bg-slate-100";
const addButtonClass =
  "min-h-12 rounded-xl border border-dashed border-slate-400 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100";

function PlanPage() {
  const state = Route.useRouteContext();
  const { e } = Route.useSearch();
  const message = messageFor(PLAN_ERRORS, e);
  const plan = state.plan;

  const [surgeryDate, setSurgeryDate] = useState(plan?.surgeryDate ?? "");
  const [procedureLabel, setProcedureLabel] = useState(plan?.procedureLabel ?? "");
  const [meds, setMeds] = useState<MedDraft[]>(() =>
    plan && plan.medications.length > 0
      ? plan.medications.map((med) => ({
          key: newKey(),
          id: med.id,
          name: med.name,
          dose: med.dose,
          times: med.times.length > 0 ? med.times : [""],
        }))
      : [emptyMed()],
  );
  const [wounds, setWounds] = useState<WoundDraft[]>(() =>
    plan && plan.woundCare.length > 0
      ? plan.woundCare.map((wound) => ({
          key: newKey(),
          id: wound.id,
          label: wound.label,
          schedule:
            wound.times.length === 0 ? (wound.perDay >= 2 ? "perday:2" : "perday:1") : "times",
          times: wound.times.length > 0 ? wound.times : [""],
        }))
      : [emptyWound()],
  );
  const [goals, setGoals] = useState<GoalDraft[]>(() =>
    plan && plan.goals.length > 0
      ? plan.goals.map((goal) => ({ key: newKey(), id: goal.id, label: goal.label }))
      : [emptyGoal()],
  );

  const [painThreshold, setPainThreshold] = useState(
    plan?.careTeam.painThreshold === null || plan?.careTeam.painThreshold === undefined
      ? ""
      : String(plan.careTeam.painThreshold),
  );
  const [tempThreshold, setTempThreshold] = useState(
    plan?.careTeam.tempThreshold === null || plan?.careTeam.tempThreshold === undefined
      ? ""
      : String(plan.careTeam.tempThreshold),
  );
  const [tempUnit, setTempUnit] = useState<"C" | "F">(plan?.careTeam.tempUnit ?? "C");
  const [careTeamPhone, setCareTeamPhone] = useState(plan?.careTeam.phone ?? "");
  const [warnings, setWarnings] = useState<string[]>(() =>
    plan && plan.careTeam.warningSigns.length > 0 ? plan.careTeam.warningSigns : [""],
  );

  const patchWarning = (index: number, value: string) =>
    setWarnings((prev) => prev.map((text, at) => (at === index ? value : text)));

  const patchMed = (key: string, patch: Partial<MedDraft>) =>
    setMeds((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const patchWound = (key: string, patch: Partial<WoundDraft>) =>
    setWounds((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const patchGoal = (key: string, patch: Partial<GoalDraft>) =>
    setGoals((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  if (state.db !== "ok") {
    return (
      <AppShell active="plan">
        <DatabaseNotice state={state.db} />
      </AppShell>
    );
  }

  const hasSavedPlan = plan !== null;

  return (
    <AppShell active="plan">
      <h1 className="text-2xl font-semibold">Your recovery plan</h1>
      <p className="mt-2 text-slate-600">
        Fill this in from the instructions your care team gave you. RecoverWell doesn&rsquo;t
        suggest medications, doses, times or steps — everything here comes from you. You can
        change it at any time.
      </p>

      <form method="post" action="/api/plan" className="mt-6 flex flex-col gap-6">
        {message ? <FormMessage>{message}</FormMessage> : null}

        <Card>
          <h2 className="text-lg font-semibold">Your surgery</h2>
          <div className="mt-3 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Date of surgery
              <input
                className={inputClass}
                type="date"
                name="surgery_date"
                value={surgeryDate}
                onChange={(event) => setSurgeryDate(event.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              What the surgery was, in your own words
              <input
                className={inputClass}
                type="text"
                name="procedure_label"
                value={procedureLabel}
                placeholder="For example: knee replacement"
                maxLength={120}
                onChange={(event) => setProcedureLabel(event.target.value)}
                required
              />
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Medications</h2>
          <p className="mt-1 text-sm text-slate-600">
            Name, dose and the times of day from your own instructions.
          </p>
          <input type="hidden" name="med_count" value={meds.length} />
          <div className="mt-4 flex flex-col gap-5">
            {meds.map((med, index) => (
              <div key={med.key} className="rounded-xl border border-slate-200 p-3">
                <input type="hidden" name={`med_${String(index)}_id`} value={med.id} />
                <input type="hidden" name={`med_${String(index)}_times`} value={med.times.length} />
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Name
                    <input
                      className={inputClass}
                      type="text"
                      name={`med_${String(index)}_name`}
                      value={med.name}
                      maxLength={120}
                      placeholder="As written on your instructions"
                      onChange={(event) =>
                        patchMed(med.key, { name: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Dose
                    <input
                      className={inputClass}
                      type="text"
                      name={`med_${String(index)}_dose`}
                      value={med.dose}
                      maxLength={80}
                      placeholder="For example: 1 tablet"
                      onChange={(event) =>
                        patchMed(med.key, { dose: event.target.value })
                      }
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-slate-700">Times of day</span>
                    {med.times.map((time, timeIndex) => (
                      <div key={timeIndex} className="flex items-center gap-2">
                        <input
                          className={inputClass}
                          type="time"
                          name={`med_${String(index)}_time_${String(timeIndex)}`}
                          value={time}
                          step={300}
                          onChange={(event) =>
                            patchMed(med.key, {
                              times: med.times.map((value, at) =>
                                at === timeIndex ? event.target.value : value,
                              ),
                            })
                          }
                        />
                        {med.times.length > 1 ? (
                          <button
                            type="button"
                            className={smallButtonClass}
                            onClick={() =>
                              patchMed(med.key, {
                                times: med.times.filter((_, at) => at !== timeIndex),
                              })
                            }
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <button
                      type="button"
                      className={smallButtonClass}
                      onClick={() => patchMed(med.key, { times: [...med.times, ""] })}
                    >
                      Add another time
                    </button>
                  </div>
                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => setMeds((prev) => prev.filter((row) => row.key !== med.key))}
                  >
                    Remove this medication
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`mt-4 w-full ${addButtonClass}`}
            onClick={() => setMeds((prev) => [...prev, emptyMed()])}
          >
            Add a medication
          </button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Wound care</h2>
          <p className="mt-1 text-sm text-slate-600">
            The steps your care team asked you to follow, and when you do them.
          </p>
          <input type="hidden" name="wound_count" value={wounds.length} />
          <div className="mt-4 flex flex-col gap-5">
            {wounds.map((wound, index) => (
              <div key={wound.key} className="rounded-xl border border-slate-200 p-3">
                <input type="hidden" name={`wound_${String(index)}_id`} value={wound.id} />
                <input
                  type="hidden"
                  name={`wound_${String(index)}_times`}
                  value={wound.schedule === "times" ? wound.times.length : 0}
                />
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    Step
                    <input
                      className={inputClass}
                      type="text"
                      name={`wound_${String(index)}_label`}
                      value={wound.label}
                      maxLength={120}
                      placeholder="For example: change the dressing"
                      onChange={(event) =>
                        patchWound(wound.key, { label: event.target.value })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                    When
                    <select
                      className={inputClass}
                      name={`wound_${String(index)}_schedule`}
                      value={wound.schedule}
                      onChange={(event) =>
                        patchWound(wound.key, { schedule: event.target.value })
                      }
                    >
                      <option value="times">At set times I choose</option>
                      <option value="perday:1">Once daily</option>
                      <option value="perday:2">Twice daily</option>
                    </select>
                  </label>
                  {wound.schedule === "times" ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-medium text-slate-700">Times of day</span>
                      {wound.times.map((time, timeIndex) => (
                        <div key={timeIndex} className="flex items-center gap-2">
                          <input
                            className={inputClass}
                            type="time"
                            name={`wound_${String(index)}_time_${String(timeIndex)}`}
                            value={time}
                            step={300}
                            onChange={(event) =>
                              patchWound(wound.key, {
                                times: wound.times.map((value, at) =>
                                  at === timeIndex ? event.target.value : value,
                                ),
                              })
                            }
                          />
                          {wound.times.length > 1 ? (
                            <button
                              type="button"
                              className={smallButtonClass}
                              onClick={() =>
                                patchWound(wound.key, {
                                  times: wound.times.filter((_, at) => at !== timeIndex),
                                })
                              }
                            >
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        className={smallButtonClass}
                        onClick={() =>
                          patchWound(wound.key, { times: [...wound.times, ""] })
                        }
                      >
                        Add another time
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className={smallButtonClass}
                    onClick={() => setWounds((prev) => prev.filter((row) => row.key !== wound.key))}
                  >
                    Remove this step
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`mt-4 w-full ${addButtonClass}`}
            onClick={() => setWounds((prev) => [...prev, emptyWound()])}
          >
            Add a wound-care step
          </button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Mobility and milestone goals</h2>
          <p className="mt-1 text-sm text-slate-600">
            Short goals in your own words, for example &ldquo;walk to the kitchen&rdquo;.
          </p>
          <input type="hidden" name="goal_count" value={goals.length} />
          <div className="mt-4 flex flex-col gap-3">
            {goals.map((goal, index) => (
              <div key={goal.key} className="flex items-end gap-2">
                <input type="hidden" name={`goal_${String(index)}_id`} value={goal.id} />
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
                  Goal
                  <input
                    className={inputClass}
                    type="text"
                    name={`goal_${String(index)}_label`}
                    value={goal.label}
                    maxLength={120}
                    placeholder="For example: walk to the kitchen"
                    onChange={(event) =>
                      patchGoal(goal.key, { label: event.target.value })
                    }
                  />
                </label>
                <button
                  type="button"
                  className={smallButtonClass}
                  onClick={() => setGoals((prev) => prev.filter((row) => row.key !== goal.key))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`mt-4 w-full ${addButtonClass}`}
            onClick={() => setGoals((prev) => [...prev, emptyGoal()])}
          >
            Add a goal
          </button>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">When to call your care team</h2>
          <p className="mt-1 text-sm text-slate-600">
            Open your own instructions. If your care team gave you a number to watch for, put it
            here exactly as they gave it to you. Leave anything blank that you don&rsquo;t have
            &mdash; RecoverWell only ever mentions what you save here, and it never decides
            anything for you.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Pain score to call about (0 to 10)
              <input
                className={inputClass}
                type="number"
                name="pain_threshold"
                min="0"
                max="10"
                step="1"
                inputMode="numeric"
                value={painThreshold}
                onChange={(event) => setPainThreshold(event.target.value)}
                placeholder="Leave blank if your instructions don't give one"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700">
                Temperature to call about
                <input
                  className={inputClass}
                  type="number"
                  name="temp_threshold"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={tempThreshold}
                  onChange={(event) => setTempThreshold(event.target.value)}
                  placeholder="Leave blank if you don't have one"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                In which unit
                <select
                  className={inputClass}
                  name="temp_unit"
                  value={tempUnit}
                  onChange={(event) =>
                    setTempUnit(event.target.value === "F" ? "F" : "C")
                  }
                >
                  <option value="C">&deg;C (Celsius)</option>
                  <option value="F">&deg;F (Fahrenheit)</option>
                </select>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-700">
                Warning signs to watch for, in your own words
              </span>
              <p className="text-xs text-slate-500">
                Your own &ldquo;call us if&hellip;&rdquo; list. RecoverWell can&rsquo;t check these
                for you &mdash; it just keeps them where you log how you feel.
              </p>
              <input type="hidden" name="warning_count" value={warnings.length} />
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className={inputClass}
                    type="text"
                    name={`warning_${String(index)}_text`}
                    value={warning}
                    maxLength={160}
                    placeholder="For example: anything your instructions said to call about"
                    onChange={(event) => patchWarning(index, event.target.value)}
                  />
                  {warnings.length > 1 ? (
                    <button
                      type="button"
                      className={smallButtonClass}
                      onClick={() =>
                        setWarnings((prev) => prev.filter((_, at) => at !== index))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                className={smallButtonClass}
                onClick={() => setWarnings((prev) => [...prev, ""])}
              >
                Add another warning sign
              </button>
            </div>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Care team phone number (optional)
              <input
                className={inputClass}
                type="tel"
                name="care_team_phone"
                value={careTeamPhone}
                maxLength={40}
                inputMode="tel"
                onChange={(event) => setCareTeamPhone(event.target.value)}
                placeholder="The number to call if a limit is reached"
              />
            </label>
            <p className="text-xs text-slate-500">
              This is the number RecoverWell shows if one of your limits is reached. Leave it
              blank and it will simply say to contact your care team.
            </p>
          </div>
        </Card>

        <button
          type="submit"
          className="min-h-14 rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
        >
          {hasSavedPlan ? "Save changes" : "Save my plan"}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Signed in as {state.email ?? "your account"}. Nothing here is medical advice — it is
        your own plan, kept in one place.
      </p>
    </AppShell>
  );
}
