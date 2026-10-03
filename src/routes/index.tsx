import { createFileRoute } from "@tanstack/react-router";

import { loadSessionState } from "~/server/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RecoverWell — your recovery routine, one day at a time" },
      {
        name: "description",
        content:
          "RecoverWell turns the discharge instructions you were given into a simple daily checklist for recovering at home. A tracking and reminder tool that sits alongside your care team's instructions.",
      },
    ],
  }),
  loader: async () => loadSessionState(),
  component: Home,
});

function Home() {
  const { signedIn } = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-xl px-5 pt-10 pb-16">
        <header className="flex items-center justify-between">
          <span className="text-lg font-semibold text-teal-800">RecoverWell</span>
          <a className="text-sm font-medium text-slate-600 underline" href="/login">
            Log in
          </a>
        </header>

        <h1 className="mt-10 text-3xl leading-tight font-semibold sm:text-4xl">
          Recovering at home, one day at a time.
        </h1>

        <p className="mt-4 text-lg text-slate-700">
          RecoverWell turns the discharge instructions you were given into a simple daily
          routine. You type in your own medications and times, your own wound-care steps and
          your own goals once — then each day the app shows you what&rsquo;s due, and you tick
          things off as you go. It&rsquo;s for anyone recovering from surgery at home, and for
          the family member or friend helping them.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold">What RecoverWell is</h2>
          <ul className="mt-3 space-y-3 text-slate-700">
            <li>
              <strong className="font-semibold text-slate-900">A tracking and reminder tool.</strong>{" "}
              It sits alongside the instructions from your own care team. It does not give
              medical advice, and it never tells you which medication to take, how much, or
              what a symptom means.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Only what you enter.</strong>{" "}
              Every medication, dose, time and step it reminds you about is something you or
              your caregiver typed in. It suggests nothing of its own.
            </li>
            <li>
              <strong className="font-semibold text-slate-900">Your own record.</strong> Your
              plan and your daily ticks are private to your account.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {signedIn ? (
            <a
              href="/today"
              className="flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
            >
              Go to today&rsquo;s list
            </a>
          ) : (
            <a
              href="/signup"
              className="flex min-h-14 items-center justify-center rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
            >
              Create an account
            </a>
          )}
          <a
            href="/login"
            className="flex min-h-14 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-lg font-medium text-slate-800 hover:bg-slate-100"
          >
            Log in
          </a>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          If you are worried about how your recovery is going, contact your care team. They
          are the people who know your surgery.
        </p>
      </div>
    </div>
  );
}
