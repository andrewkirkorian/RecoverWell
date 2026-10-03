import { createFileRoute, redirect } from "@tanstack/react-router";

import { Card, DatabaseNotice, FormMessage } from "~/components/AppShell";
import { messageFor, SIGNUP_ERRORS } from "~/lib/messages";
import { PASSWORD_MIN_LENGTH } from "~/lib/validate";
import { loadSessionState } from "~/server/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your account — RecoverWell" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    e: typeof search.e === "string" ? search.e : undefined,
  }),
  beforeLoad: async () => {
    const state = await loadSessionState();
    if (state.signedIn) throw redirect({ to: "/today" });
    return state;
  },
  component: Signup,
});

function Signup() {
  const { db } = Route.useRouteContext();
  const { e } = Route.useSearch();
  const message = messageFor(SIGNUP_ERRORS, e);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-xl px-5 pt-10 pb-16">
        <a className="text-lg font-semibold text-teal-800" href="/">
          RecoverWell
        </a>
        <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
        <p className="mt-2 text-slate-600">
          Your plan and your daily ticks are private to this account. Use your own email
          address.
        </p>

        {db !== "ok" ? (
          <DatabaseNotice state={db} />
        ) : (
          <Card className="mt-6">
            <form method="post" action="/api/auth/signup" className="flex flex-col gap-4">
              {message ? <FormMessage>{message}</FormMessage> : null}
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Email
                <input
                  className="min-h-12 rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-teal-600 focus:outline-none"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Password
                <input
                  className="min-h-12 rounded-xl border border-slate-300 px-3 text-base text-slate-900 focus:border-teal-600 focus:outline-none"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                />
                <span className="text-xs font-normal text-slate-500">
                  At least {PASSWORD_MIN_LENGTH} characters.
                </span>
              </label>
              <button
                type="submit"
                className="mt-1 min-h-14 rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
              >
                Create account
              </button>
            </form>
          </Card>
        )}

        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <a className="font-medium text-teal-800 underline" href="/login">
            Log in
          </a>
        </p>
        <p className="mt-4 text-xs text-slate-500">
          RecoverWell is a tracking and reminder tool. It does not give medical advice.
        </p>
      </div>
    </div>
  );
}
