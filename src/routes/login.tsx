import { createFileRoute, redirect } from "@tanstack/react-router";

import { Card, DatabaseNotice, FormMessage } from "~/components/AppShell";
import { LOGIN_ERRORS, messageFor } from "~/lib/messages";
import { loadSessionState } from "~/server/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — RecoverWell" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    e: typeof search.e === "string" ? search.e : undefined,
  }),
  beforeLoad: async () => {
    const state = await loadSessionState();
    if (state.signedIn) throw redirect({ to: "/today" });
    return state;
  },
  component: Login,
});

function Login() {
  const { db } = Route.useRouteContext();
  const { e } = Route.useSearch();
  const message = messageFor(LOGIN_ERRORS, e);

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-xl px-5 pt-10 pb-16">
        <a className="text-lg font-semibold text-teal-800" href="/">
          RecoverWell
        </a>
        <h1 className="mt-6 text-2xl font-semibold">Log in</h1>

        {db !== "ok" ? (
          <DatabaseNotice state={db} />
        ) : (
          <Card className="mt-6">
            <form method="post" action="/api/auth/login" className="flex flex-col gap-4">
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
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="submit"
                className="mt-1 min-h-14 rounded-2xl bg-teal-700 px-6 text-lg font-semibold text-white hover:bg-teal-800"
              >
                Log in
              </button>
            </form>
          </Card>
        )}

        <p className="mt-6 text-sm text-slate-600">
          New here?{" "}
          <a className="font-medium text-teal-800 underline" href="/signup">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
