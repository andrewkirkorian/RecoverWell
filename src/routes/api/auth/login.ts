import { createFileRoute } from "@tanstack/react-router";

import { normalizeEmail } from "~/lib/validate";
import { isDbConfigured } from "~/mongo.server";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { verifyPassword } from "~/server/passwords.server";
import { createSession, sessionCookieHeader } from "~/server/session.server";
import { findUserByEmail } from "~/server/store.server";

/**
 * Sign in. A wrong email and a wrong password give the same answer, so this
 * cannot be used to find out who has an account.
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

        try {
          const user = await findUserByEmail(email);
          const ok = user ? await verifyPassword(password, user.passwordHash) : false;
          if (!user || !ok) return seeOtherError("/login", "bad");
          const token = await createSession(user.id);
          return seeOther("/today", { "Set-Cookie": sessionCookieHeader(token, request) });
        } catch {
          return seeOtherError("/login", "problem");
        }
      },
    },
  },
});
