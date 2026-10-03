import { createFileRoute } from "@tanstack/react-router";

import { isEmailShaped, normalizeEmail, PASSWORD_MIN_LENGTH } from "~/lib/validate";
import { isDbConfigured } from "~/mongo.server";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { hashPassword } from "~/server/passwords.server";
import { createSession, sessionCookieHeader } from "~/server/session.server";
import { createUser, EmailTakenError, findUserByEmail } from "~/server/store.server";

/** Create an account and sign in. Errors come back as plain codes on /signup. */
export const Route = createFileRoute("/api/auth/signup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDbConfigured()) return seeOtherError("/signup", "nodb");
        const form = await readForm(request);
        if (!form) return seeOtherError("/signup", "problem");

        const email = normalizeEmail(formField(form, "email", 254));
        const password = formField(form, "password", 200);
        if (!isEmailShaped(email)) return seeOtherError("/signup", "email");
        if (password.length < PASSWORD_MIN_LENGTH) return seeOtherError("/signup", "password");

        try {
          const existing = await findUserByEmail(email);
          if (existing) return seeOtherError("/signup", "email_taken");
          const passwordHash = await hashPassword(password);
          const userId = await createUser(email, passwordHash);
          const token = await createSession(userId);
          return seeOther("/plan", { "Set-Cookie": sessionCookieHeader(token, request) });
        } catch (error) {
          if (error instanceof EmailTakenError) return seeOtherError("/signup", "email_taken");
          return seeOtherError("/signup", "problem");
        }
      },
    },
  },
});
