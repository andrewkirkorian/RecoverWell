import { createFileRoute } from "@tanstack/react-router";

import { isDbConfigured } from "~/mongo.server";
import { isDateValue } from "~/lib/dates";
import type { TempUnit } from "~/lib/logs";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { parseLogForm } from "~/server/log-form.server";
import { sessionUser } from "~/server/session.server";
import { getPlan, saveLog } from "~/server/store.server";

/**
 * Save one day's symptom and pain log for the signed-in user.
 *
 * The entry is keyed by the authenticated user id and the date, so a second save
 * on the same day updates that day rather than adding another. The temperature
 * unit comes from the user's own saved plan — never from the posted form — so a
 * reading can't be filed under a unit the patient didn't choose. The response
 * carries no body: nothing the patient typed appears in a URL or a payload.
 */
export const Route = createFileRoute("/api/log")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDbConfigured()) return seeOtherError("/log", "nodb");
        const form = await readForm(request);
        if (!form) return seeOtherError("/log", "problem");

        try {
          const user = await sessionUser(request);
          if (!user) return seeOther("/login");

          const date = formField(form, "date", 10);
          if (!isDateValue(date)) return seeOtherError("/log", "date");

          const plan = await getPlan(user.id);
          const unit: TempUnit = plan?.careTeam.tempUnit ?? "C";

          const parsed = parseLogForm(form, unit);
          if (!parsed.ok) return seeOtherError("/log", parsed.error);

          await saveLog(user.id, parsed.entry);
          return seeOther("/log");
        } catch {
          return seeOtherError("/log", "problem");
        }
      },
    },
  },
});
