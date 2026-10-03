import { createFileRoute } from "@tanstack/react-router";

import { normalizeEmail } from "~/lib/validate";
import { isDbConfigured } from "~/mongo.server";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { verifyPassword, verifyPasswordWhenUnknown } from "~/server/passwords.server";
import { createSession, sessionCookieHeader } from "~/server/session.server";
import { findUserByEmail } from "~/server/store.server";
import { clientKey, signInBlocked, signInFailed, signInSucceeded } from "~/server/throttle.server";

/**
 * Sign in. A wrong email, a wrong password and a throttled attempt all give the
 * same answer, so this cannot be used to find out who has an account.
 */
export const Route = createFileRoute("/api/auth/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDbConfigured()) return seeOtherError("/login", "nodb");
        const form = await readForm(request);
        if (!form) return seeOtherError("/login", "bad");

        const email = normalizeEmail(formField(form, "email", 254));
        const password = formField(form, "password", 200);
        if (email.length === 0 || password.length === 0) return seeOtherError("/login", "bad");

        const client = clientKey(request);
        // Checked before any database work, and answered exactly like a wrong
        // password: being slowed down must not say whether the account exists.
        if (signInBlocked(email, client)) return seeOtherError("/login", "bad");

        try {
          const user = await findUserByEmail(email);
          // Both branches cost one password-hash verification: an unknown email
          // must not answer faster than a wrong password, or the timing alone
          // would reveal who has an account.
          const ok = user
            ? await verifyPassword(password, user.passwordHash)
            : await verifyPasswordWhenUnknown(password);
          if (!user || !ok) {
            signInFailed(email, client);
            return seeOtherError("/login", "bad");
          }
          signInSucceeded(email, client);
          const token = await createSession(user.id);
          return seeOther("/today", { "Set-Cookie": sessionCookieHeader(token, request) });
        } catch {
          return seeOtherError("/login", "problem");
        }
      },
    },
  },
});
