# tools/ — the verification rig

Throwaway scaffolding for proving RecoverWell's data layer works over real HTTP.
**None of this is part of the product**: nothing here is imported by `src/`, the
build ignores it, and it never points at port 3000 or at a real database.

The rig is three moving parts:

| piece | what it is |
| --- | --- |
| `provision-mongod.sh` | fetches the `mongod` binary the rig needs (idempotent; see below) |
| `start-mongo.sh` | a throwaway local `mongod` on **27018**, dbpath `/tmp/rw-verify/data` |
| `serve-verify.ts` + `start-verify-app.sh` | a second instance of the built site on **127.0.0.1:3100**, with `MONGODB_URI` pointed at that mongod |
| `verify.sh` | the end-to-end harness — real form POSTs, real cookies, real 303s |

`db-count.ts` reads the throwaway database directly (and prints no logged values).

## Running it

```bash
cd /home/team/shared/site
bash tools/provision-mongod.sh # once per machine: puts mongod under /tmp/mongo-bin
bun run build                 # the 3100 instance serves whatever is in dist/
bash tools/reset-verify.sh    # fresh mongod + fresh app on 3100 (wipes the db)
bash tools/verify.sh 2>&1 | tee /tmp/flow.out
bash tools/stop-verify.sh     # stop both, delete /tmp/rw-verify
```

`reset-verify.sh` and `start-*-.sh` leave the site on **port 3000 alone** — it
keeps serving the whole time.

## What the harness checks

Steps **a–g** (increment 1, re-run as regression cover): signup, login, the plan
round-tripping through the database, ticking items, logout/login, the failure
cases, and that one account can never read or alter another's data.

Steps **h–o** (increment 2):

- `h` the patient's own call-us limits (pain, temperature + unit, free-text
  warning signs, care-team phone) are saved and read back; a pain limit outside
  0–10 is refused with a plain error.
- `i` the log page renders a 0–10 pain scale, a temperature field in the patient's
  unit, wound and general notes; a below-limit entry is stored and read back and
  raises **no** banner.
- `j` an at-or-over-limit entry raises a banner naming the value and the saved
  limit, with the saved phone number and a `tel:` link, `role="alert"`, and no
  diagnosis-flavoured or medication-advice wording; the same banner appears on
  the Today view above the checklist.
- `k` re-saving the same date **updates** that day (one entry in the page and one
  document in the database, `days logged` = `duplicate days`), and a lower value
  clears the banner.
- `l` user B cannot see or alter user A's log; a user with **no** limits gets no
  banner however extreme the value they log; a log POST with no cookie or a
  forged cookie is refused.
- `m` the flag is kept on the Today view and the log page while older entries
  exist, and clears at the next log.
- `n` the boundary is "at or over": exactly at both limits raises the flag, one
  step below does not.
- `o` switching the plan to °F re-reads the choice, compares an older °C reading
  correctly (38.5 °C is shown as 101.3 °F against a 100.4 °F limit), and prefills
  the form in the plan's current unit.

Steps **v–w** (increment 3): `v` the recovery timeline — one row per day from the
surgery date, the patient's own value/note on the day they logged it, a plain
limit-crossed marker naming the reading and the saved limit, a checklist count per
day, gap days visible as gaps, nothing of another user's. `w` the printable
appointment summary — the plan and limits as entered, the logged totals, the
crossed days, the "record, not an assessment" line, no interpretation or dosage
wording, a real print control — and the signed-out redirects for both pages.
`tools/verify-output.txt` is the captured output of a full passing run.

Two runs back to back, with no manual cleanup between them, are the real proof: the
second one catches a harness that only works on a pristine rig. `OUT=tools/verify-output-run1.txt`
and `...-run2.txt` hold the two captures, and `tools/verify-pair.log` holds both
verdict lines in one place.

## Writing an assertion
Assert what the page promised, not the shape it happened to have the day the check
was written. A harness that fails a correct app is worse than no harness.
- **Presence is a floor.** "The page shows X" is `ge … 1`. Showing X twice (once on
  a day row, once in a heading) is not a defect, and an exact count fails a correct
  app.
- **A value that must sit on one day** belongs in that day's row —
  `dayrow <body> <date> | grep -c …` — which is a stronger statement than counting
  the whole page. Note `dayrow` follows nested lists, so a row with limit-crossed
  flags still yields its checklist line.
- **Exact counts** are only for facts that *are* counts: one row per day, the
  eleven scores on the 0–10 scale, the number of days that crossed a limit.
- **A sentence the page owns** gets a tolerant pattern. The pain line reads
  "each 6 out of 10" for one distinct score and "from 3 to 9 out of 10" for two, so
  the check accepts both shapes and still requires the count and the values.
- **A zero is a real fact**: another user's data is absent, no interpretation
  wording, no 5xx.

## Gotchas this rig encodes

- **`grep` in this box's C locale calls a UTF-8 page "binary"** and then prints no
  matches, so every check silently becomes zero. `verify.sh` defines a `grep`
  shell function that adds `-a`; keep it.
- **Do not use a bare `PORT` in these scripts.** The environment exports `PORT`
  (the site's own), so `${PORT:-27018}` would put the throwaway mongod on the
  site's port. Use `MONGO_PORT`.
- **The harness fails fast** if nothing is answering on 3100. An earlier run
  reported all-zero statuses because it was pointed at a dead instance; a run that
  cannot reach the app should stop, not look like a pass.
- A stale app instance holding 3100 survives a rebuild, so `reset-verify.sh`
  kills `serve-verify.ts` **and** the older `serve-3100.ts` name before starting.
- mongod's binary lives in `/tmp/mongo-bin`, but **`/tmp` does not survive a
  machine swap or a reboot** — after one, the rig has no mongod and
  `run-verify.sh` stops on its "missing precondition" line. Re-provision with
  `bash tools/provision-mongod.sh` (idempotent: it exits 0 and does nothing when
  a working mongod is already there, and it never leaves a half-extracted
  `/tmp/mongo-bin` that looks ready). The scratch dir `/tmp/rw-verify` is
  disposable.
- `bun run publish` rebuilds `dist/`, so **restart the 3100 instance** after a
  publish or the harness tests the previous build.
