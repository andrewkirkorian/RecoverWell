import { createFileRoute } from "@tanstack/react-router";

import { isDbConfigured } from "~/mongo.server";
import { seeOther } from "~/server/http.server";
import { clearedSessionCookieHeader, destroySession } from "~/server/session.server";

/** Sign out: remove the session row (when the database is reachable) and clear the cookie. */
export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (isDbConfigured()) {
          try {
            await destroySession(request);
          } catch {
            // Cookie is cleared regardless, so the browser is signed out either way.
          }
        }
        return seeOther("/", { "Set-Cookie": clearedSessionCookieHeader(request) });
      },
    },
  },
});
