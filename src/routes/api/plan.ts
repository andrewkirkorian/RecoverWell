import { createFileRoute } from "@tanstack/react-router";

import { isDbConfigured } from "~/mongo.server";
import { readForm, seeOther, seeOtherError } from "~/server/http.server";
import { parsePlanForm } from "~/server/plan-form.server";
import { sessionUser } from "~/server/session.server";
import { savePlan } from "~/server/store.server";

/** Save the patient's own recovery plan (replacing the previous one). */
export const Route = createFileRoute("/api/plan")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDbConfigured()) return seeOtherError("/plan", "nodb");
        const form = await readForm(request);
        if (!form) return seeOtherError("/plan", "problem");

        try {
          const user = await sessionUser(request);
          if (!user) return seeOther("/login");

          const parsed = parsePlanForm(form);
          if (!parsed.ok) return seeOtherError("/plan", parsed.error);

          await savePlan(user.id, parsed.plan);
          return seeOther("/today");
        } catch {
          return seeOtherError("/plan", "problem");
        }
      },
    },
  },
});
