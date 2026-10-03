import { createFileRoute } from "@tanstack/react-router";

import { isEmailShaped, normalizeEmail, PASSWORD_MIN_LENGTH } from "~/lib/validate";
import { isDbConfigured } from "~/mongo.server";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { hashPassword } from "~/server/passwords.server";
import { createSession, sessionCookieHeader } from "~/server/session.server";
import { createUser, EmailTakenError, findUserByEmail } from "~/server/store.server";
import { clientKey, signUpBlocked, signUpFailed, signUpSucceeded } from "~/server/throttle.server";

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

        const client = clientKey(request);
        // A lighter limit than sign-in, checked before any work: this is the only
        // guard against someone creating accounts in bulk.
        if (signUpBlocked(email, client)) return seeOtherError("/signup", "slow");

        if (!isEmailShaped(email)) {
          signUpFailed(email, client);
          return seeOtherError("/signup", "email");
        }
        if (password.length < PASSWORD_MIN_LENGTH) {
          signUpFailed(email, client);
          return seeOtherError("/signup", "password");
        }

        try {
          const existing = await findUserByEmail(email);
          if (existing) {
            signUpFailed(email, client);
            return seeOtherError("/signup", "email_taken");
          }
          const passwordHash = await hashPassword(password);
          const userId = await createUser(email, passwordHash);
          signUpSucceeded(email);
          const token = await createSession(userId);
          return seeOther("/plan", { "Set-Cookie": sessionCookieHeader(token, request) });
        } catch (error) {
          if (error instanceof EmailTakenError) {
            signUpFailed(email, client);
            return seeOtherError("/signup", "email_taken");
          }
          return seeOtherError("/signup", "problem");
        }
      },
    },
  },
});
