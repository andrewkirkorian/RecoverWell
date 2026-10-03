import type { ReactNode } from "react";

/** Shared page frame for the signed-in parts of the app: a calm header with
 * the things a patient needs — today, how they feel, their plan, and a way out. */
export function AppShell({
  active,
  children,
}: {
  active: "today" | "plan" | "log";
  children: ReactNode;
}) {
  const link = (isActive: boolean) =>
    [
      "rounded-lg px-2.5 py-2 text-sm font-medium",
      isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100",
    ].join(" ");

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        {/* Wraps rather than crowds: on a 320 px phone the four links drop to
            their own line instead of squeezing or overflowing the header. */}
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-2">
          <a href="/today" className="text-base font-semibold text-teal-800">
            RecoverWell
          </a>
          <nav className="flex flex-wrap items-center justify-end gap-1">
            <a href="/today" className={link(active === "today")} aria-current={active === "today" ? "page" : undefined}>
              Today
            </a>
            <a href="/log" className={link(active === "log")} aria-current={active === "log" ? "page" : undefined}>
              My log
            </a>
            <a href="/plan" className={link(active === "plan")} aria-current={active === "plan" ? "page" : undefined}>
              My plan
            </a>
            <form method="post" action="/api/auth/logout">
              <button
                type="submit"
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-5 pb-20">{children}</main>
    </div>
  );
}

/** A plain panel used for headings, notices and prompts. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      {children}
    </section>
  );
}

/** Shown when the database isn't reachable, instead of a crash or a stack trace. */
export function DatabaseNotice({ state }: { state: "missing" | "error" }) {
  return (
    <Card className="mt-6">
      <h1 className="text-xl font-semibold">
        {state === "missing" ? "Almost ready" : "Temporarily unavailable"}
      </h1>
      <p className="mt-2 text-base text-slate-600">
        {state === "missing"
          ? "RecoverWell isn't connected to its database yet, so accounts and plans can't be saved at the moment. Nothing you have typed has been stored."
          : "We can't reach the database right now, so we can't show or save your plan. Please try again in a few minutes."}
      </p>
      <p className="mt-3 text-sm text-slate-500">
        <a className="underline" href="/">
          Back to the start page
        </a>
      </p>
    </Card>
  );
}

/** Small inline message above a form. */
export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
      {children}
    </p>
  );
}
