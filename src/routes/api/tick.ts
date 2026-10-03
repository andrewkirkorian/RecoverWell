import { createFileRoute } from "@tanstack/react-router";

import { buildDayItems } from "~/lib/plan";
import { isDbConfigured } from "~/mongo.server";
import { formField, readForm, seeOther, seeOtherError } from "~/server/http.server";
import { isAcceptableDayFor } from "~/server/local-day.server";
import { sessionUser } from "~/server/session.server";
import { getPlan, setCompletion } from "~/server/store.server";

/**
 * Tick (or untick) one item on one date, for the signed-in user only. The item
 * must be one of the items the user's own saved plan produces, the date must be
 * the day this patient is living (their own local day, or a neighbouring one —
 * the same rule the pages use), and the record is keyed by the authenticated user
 * id — one account can never touch another's day.
 */
export const Route = createFileRoute("/api/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDbConfigured()) return seeOtherError("/today", "nodb");
        const form = await readForm(request);
        if (!form) return seeOtherError("/today", "problem");

        try {
          const user = await sessionUser(request);
          if (!user) return seeOther("/login");

          const date = formField(form, "date", 10);
          const itemId = formField(form, "item", 120);
          const done = formField(form, "done", 1) !== "0";
          if (!isAcceptableDayFor(date, request)) return seeOtherError("/today", "problem");

          const plan = await getPlan(user.id);
          const known = buildDayItems(plan).some((item) => item.id === itemId);
          if (!known) return seeOtherError("/today", "problem");

          await setCompletion(user.id, date, itemId, done);
          return seeOther("/today");
        } catch {
          return seeOtherError("/today", "problem");
        }
      },
    },
  },
});
