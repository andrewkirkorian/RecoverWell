#!/bin/bash
# End-to-end verification of RecoverWell's data layer over real HTTP.
#
# Read-only with respect to the repo and to the live site: it drives a throwaway
# app instance on 127.0.0.1:3100 talking to a throwaway local mongod on 27018.
# It never points at port 3000 and never touches a real database.
#
# Usage, from the repo root:
#   bun run build              # the 3100 instance serves whatever is in dist/
#   bash tools/reset-verify.sh # fresh mongod + fresh app on 3100
#   bash tools/verify.sh 2>&1 | tee /tmp/flow.out
#   bash tools/stop-verify.sh  # stop the rig, delete the scratch dir
#
# Steps a-g cover increment 1 (accounts, plan, ticks, isolation); steps h-o cover
# increment 2 (call-your-care-team limits, the daily log, the red-flag banner);
# steps p-u cover the safety-review fixes (mistyped limits, sign-in throttling and
# equal-cost answers, the body cap, tick dates, index setup, page hardening); step
# v covers increment 3 (the recovery timeline and the appointment summary).
#
# The script counts PASS/FAIL assertions and exits non-zero if any fail: a check
# that only printed a number could drift without anyone noticing.
#
# Repeatability: every account it creates is suffixed with RUN_TAG, so a run never
# collides with the accounts an earlier run left behind, and step 0 fails fast when
# the throwaway database is not pristine instead of quietly testing a stale one.
# Run tools/run-verify.sh to wipe the rig, run this, and capture the output; run it
# twice in a row to prove a run can be repeated with no manual cleanup.
# See tools/README.md.
BASE=http://127.0.0.1:3100
VERIFY_URI=mongodb://127.0.0.1:27018/recoverwell_verify
D=/tmp/rw-verify
SITE_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TOOLS=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$D"
rm -f $D/cookies-*.txt

# A fresh suffix for every run, so no email can already exist from an earlier one.
# RUN_TAG can be pinned to re-run one particular tag on purpose.
RUN_TAG=${RUN_TAG:-$(date -u +%y%m%d%H%M%S)-$RANDOM}
A_EMAIL="alice.$RUN_TAG@example.com"
B_EMAIL="bob.$RUN_TAG@example.com"
C_EMAIL="carol.$RUN_TAG@example.com"
D_EMAIL="dave.$RUN_TAG@example.com"
MASS_EMAIL="mass1.$RUN_TAG@example.com"
NOBODY_EMAIL="nobody.$RUN_TAG@example.com"
SHORTPW_EMAIL="shortpw.$RUN_TAG@example.com"
# The same address in capitals, for the case-insensitive sign-up check.
UP_EMAIL=$(echo "$A_EMAIL" | tr 'a-z' 'A-Z')

echo "=================== preconditions ==================="
echo "run tag        : $RUN_TAG"
echo "test accounts  : alice.$RUN_TAG@example.com (+ user B, C, D, mass, nobody, shortpw)"
# Fail fast and name the missing piece: a precondition that is only discovered
# half-way through turns into a confusing pile of failures (or worse, a run that
# looks like it passed because everything answered 000).
if [ ! -d "${MONGOD_BIN:-/tmp/mongo-bin}" ]; then
  echo "missing precondition: no mongod at ${MONGOD_BIN:-/tmp/mongo-bin} — set MONGOD_BIN to a directory holding the mongod binary" >&2
  exit 1
fi
if ! find "${MONGOD_BIN:-/tmp/mongo-bin}" -type f -name mongod -print -quit | grep -q .; then
  echo "missing precondition: no mongod file under ${MONGOD_BIN:-/tmp/mongo-bin} — the extract of the mongodb tarball is gone" >&2
  exit 1
fi
if [ ! -f "$SITE_ROOT/dist/server/server.js" ]; then
  echo "missing precondition: no $SITE_ROOT/dist/server/server.js — run 'bun run build' in the site root first" >&2
  exit 1
fi
if ! (cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/rig-check.ts); then
  echo "missing precondition: the throwaway rig is not usable (see the line above) — run 'bash tools/reset-verify.sh'" >&2
  exit 1
fi

if ! curl -s -o /dev/null http://127.0.0.1:3100/; then
  echo "missing precondition: nothing is answering on http://127.0.0.1:3100 — run 'bash tools/reset-verify.sh'" >&2
  exit 1
fi

echo; echo "=================== STEP 0: make index setup fail, before the app's first request ==================="
# The app builds its indexes on its first database call, so the two duplicate
# `users` documents have to be in place before anything touches the app. This is
# what lets step t prove index setup is neither fatal nor retried.
echo "### 0.1 seed two users documents that share one email (the unique index cannot be built)"
SEEDED=0
if (cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/seed-duplicate-emails.ts); then
  SEEDED=1
else
  # Not a skipped check: without the duplicate documents the index precondition
  # cannot be set up, so the run would no longer prove what step t claims.
  echo "missing precondition: could not seed the throwaway database (see above) — run 'bash tools/reset-verify.sh' and start the run again" >&2
  exit 1
fi

# Fail fast: an app that isn't listening makes every step below return 000 and
# look like a pass. Better to stop here and say so.
if [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")" != "200" ]; then
  echo "nothing is answering on $BASE — run 'bun run build', then 'bash tools/reset-verify.sh'" >&2
  exit 1
fi
echo "  the landing page was served anyway: status 200 (indexes were failing underneath it)"

# --- helpers -------------------------------------------------------------
# The pages carry UTF-8 (the degree sign on the log page). In this box's C
# locale grep calls such a file "binary" and then prints no matches, which would
# silently turn every check below into a zero. Force text mode for every grep in
# this script.
grep() { command grep -a "$@"; }
hdr() { echo; echo "### $1"; }
post() { # jar out data...
  local jar=$1 out=$2; shift 2
  curl -s -H 'Accept-Encoding: identity' -o "$out.body" -D "$out.hdr" -c "$jar" -b "$jar" \
    -X POST "$@" -w '%{http_code}\n'
}
get() { # jar out url
  local jar=$1 out=$2 url=$3
  curl -s -H 'Accept-Encoding: identity' -o "$out.body" -D "$out.hdr" -c "$jar" -b "$jar" \
    "$url" -w '%{http_code}\n'
}
forgedget() { # out url cookievalue
  curl -s -H 'Accept-Encoding: identity' -o "$1.body" -D "$1.hdr" \
    -H "Cookie: rw_session=$3" "$2" -w '%{http_code}\n'
}
show() { echo "  status: $2"; grep -i -E '^(location|set-cookie):' "$1.hdr" | sed 's/^/    /'; }
n() { grep -o -- "$1" "$2" | wc -l | tr -d ' '; }
txt() { sed -e 's/<[^>]*>/|/g' "$1" | tr '|' '\n' | grep -v '^[[:space:]]*$'; }
line() { txt "$1" | grep -m1 -- "$2" || echo "(not found: $2)"; }
firstafter() { txt "$1" | grep -A2 -m1 -- "$2" | tr '\n' ' '; }
# React's server renderer separates adjacent text nodes with `<!---->`, so a
# string the page shows as one run ("Pain 3 out of 10") is split in the HTML and
# a plain grep for it finds nothing. Drop the empty comments first.
plainn() { sed 's/<!--[^>]*-->//g' "$1" | grep -o -- "$2" | wc -l | tr -d ' '; }
loc() { grep -i '^location:' "$1.hdr" | head -1 | tr -d '\r' | sed 's/^[Ll]ocation: *//'; }
# The page as a visitor sees it: the framework's hydration payload duplicates the
# page's own data inside a <script> block, so drop script blocks before counting
# anything a patient would actually read.
# The rendered page arrives as one long line, so these work on the whole
# document rather than line by line.
vis() { python3 "$TOOLS/vis.py" "$1"; }
visn() { vis "$1" | grep -o -- "$2" | wc -l | tr -d ' '; }
visre() { vis "$1" | grep -oE -- "$2" | wc -l | tr -d ' '; }
# One day's row of the timeline, as plain text: from its data-day marker to the
# row's closing tag, so a check can talk about a single day rather than the page.
dayrow() { python3 "$TOOLS/vis.py" "$1" "$2"; }

# --- assertions ----------------------------------------------------------
# Every numbered fix has at least one of these, and any FAIL makes this script
# exit non-zero, so a check cannot regress quietly.
PASSED=0
FAILED=0
check() { # label actual expected
  if [ "$2" = "$3" ]; then
    PASSED=$((PASSED + 1)); echo "  PASS $1 ($2)"
  else
    FAILED=$((FAILED + 1)); echo "  FAIL $1 — got '$2', expected '$3'"
  fi
}
ge() { # label actual floor
  if [ "$2" -ge "$3" ] 2>/dev/null; then
    PASSED=$((PASSED + 1)); echo "  PASS $1 ($2 >= $3)"
  else
    FAILED=$((FAILED + 1)); echo "  FAIL $1 — got '$2', expected >= $3"
  fi
}
ratio_ok() { # label actual_ms reference_ms max_factor
  local ok
  ok=$(awk -v a="$2" -v b="$3" -v f="$4" 'BEGIN { print (a <= b * f && a >= b / f) ? "yes" : "no" }')
  if [ "$ok" = "yes" ]; then
    PASSED=$((PASSED + 1)); echo "  PASS $1 (${2}ms vs ${3}ms, within ${4}x)"
  else
    FAILED=$((FAILED + 1)); echo "  FAIL $1 — ${2}ms vs ${3}ms is more than ${4}x apart"
  fi
}
ms() { awk -v s="$1" 'BEGIN { printf "%d", s * 1000 }'; }

echo "=================== environment ==================="
echo "app under test : http://127.0.0.1:3100 (throwaway second instance of dist/server)"
echo "database       : mongodb://127.0.0.1:27018/recoverwell_verify (throwaway local mongod 7.0.14)"
echo "live site      : http://127.0.0.1:3000 untouched -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)"
DATE=$(date -u +%F); echo "server UTC date: $DATE"
SHORT=$(date -u +'%b %-d, %Y')                       # the date line the log page prints
SHORT_YDAY=$(date -u -d 'yesterday' +'%b %-d, %Y')
YDAY=$(date -u -d 'yesterday' +%F)
FUTURE3=$(date -u -d '+3 days' +%F)
PAST5=$(date -u -d '-5 days' +%F)
# User A's surgery date is 2026-09-20 throughout, so the timeline owes one row per
# day from then to today (step v counts them).
DAY_ROWS=$(( ( $(date -u -d "$DATE" +%s) - $(date -u -d '2026-09-20' +%s) ) / 86400 + 1 ))

echo; echo "=================== STEP a: signup user A ==================="
hdr "a1. POST /api/auth/signup  ($A_EMAIL)"
S=$(post $D/cookies-a.txt $D/a1 --data-urlencode "email=$A_EMAIL" --data-urlencode 'password=correct horse battery' $BASE/api/auth/signup)
show $D/a1 "$S"
echo "    cookie jar: $(grep -o 'rw_session.*' $D/cookies-a.txt | head -1)"
hdr "a2. GET /plan with that cookie"
S=$(get $D/cookies-a.txt $D/a2 $BASE/plan)
echo "  status: $S  |  plan form present: $(n 'name="surgery_date"' $D/a2.body)  |  '$(line $D/a2.body 'Signed in as')'"
hdr "a3. GET / (landing, signed in) and GET / signup while signed in"
S=$(get $D/cookies-a.txt $D/a3 $BASE/signup)
show $D/a3 "$S"

echo; echo "=================== STEP b: save a recovery plan ==================="
hdr "b1. POST /api/plan (2 meds, 1 wound-care step, 2 goals)"
S=$(post $D/cookies-a.txt $D/b1 \
  --data-urlencode 'surgery_date=2026-09-20' \
  --data-urlencode 'procedure_label=Knee replacement' \
  --data-urlencode 'med_count=2' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=2' --data-urlencode 'med_0_time_0=08:00' --data-urlencode 'med_0_time_1=20:00' \
  --data-urlencode 'med_1_id=a1medibu0002' --data-urlencode 'med_1_name=Ibuprofen' --data-urlencode 'med_1_dose=400 mg' --data-urlencode 'med_1_times=1' --data-urlencode 'med_1_time_0=13:00' \
  --data-urlencode 'wound_count=1' \
  --data-urlencode 'wound_0_id=a1wound0001' --data-urlencode 'wound_0_label=Change the dressing' --data-urlencode 'wound_0_schedule=times' --data-urlencode 'wound_0_times=1' --data-urlencode 'wound_0_time_0=09:00' \
  --data-urlencode 'goal_count=2' \
  --data-urlencode 'goal_0_id=a1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
  --data-urlencode 'goal_1_id=a1goal00002' --data-urlencode 'goal_1_label=Climb the stairs once' \
  $BASE/api/plan)
show $D/b1 "$S"
hdr "b2. GET /plan again: is it read back out of the database?"
S=$(get $D/cookies-a.txt $D/b2 $BASE/plan)
echo "  status: $S"
echo "  pre-filled values: Paracetamol=$(n 'value="Paracetamol"' $D/b2.body)  400&#x20;mg/400 mg=$(n 'value="400 mg"' $D/b2.body)  dressing=$(n 'value="Change the dressing"' $D/b2.body)  goal=$(n 'value="Walk to the kitchen"' $D/b2.body)"
echo "  round-tripped id preserved: $(n 'name="med_0_id" value="a1medpara0001"' $D/b2.body)"
echo "  time input: $(grep -o 'name="med_0_time_0"[^>]*value="[^"]*"' $D/b2.body | head -1)"
echo "  submit label: $(grep -o '>Save changes' $D/b2.body | head -1)"
hdr "b3. POST /api/plan twice: does a re-save replace rather than duplicate?"
S=$(post $D/cookies-a.txt $D/b3 \
  --data-urlencode 'surgery_date=2026-09-20' --data-urlencode 'procedure_label=Knee replacement (updated)' \
  --data-urlencode 'med_count=1' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=2 tablets' --data-urlencode 'med_0_times=2' --data-urlencode 'med_0_time_0=08:00' --data-urlencode 'med_0_time_1=20:00' \
  --data-urlencode 'wound_count=1' \
  --data-urlencode 'wound_0_id=a1wound0001' --data-urlencode 'wound_0_label=Change the dressing' --data-urlencode 'wound_0_schedule=times' --data-urlencode 'wound_0_times=1' --data-urlencode 'wound_0_time_0=09:00' \
  --data-urlencode 'goal_count=2' \
  --data-urlencode 'goal_0_id=a1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
  --data-urlencode 'goal_1_id=a1goal00002' --data-urlencode 'goal_1_label=Climb the stairs once' \
  $BASE/api/plan)
show $D/b3 "$S"
S=$(get $D/cookies-a.txt $D/b3b $BASE/today)
echo "  after re-save: $(line $D/b3b.body 'of')   ibuprofen still present: $(n 'Ibuprofen' $D/b3b.body) (expect 0)"
# put the 2-med plan back for the rest of the run
post $D/cookies-a.txt $D/b3c \
  --data-urlencode 'surgery_date=2026-09-20' \
  --data-urlencode 'procedure_label=Knee replacement' \
  --data-urlencode 'med_count=2' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=2' --data-urlencode 'med_0_time_0=08:00' --data-urlencode 'med_0_time_1=20:00' \
  --data-urlencode 'med_1_id=a1medibu0002' --data-urlencode 'med_1_name=Ibuprofen' --data-urlencode 'med_1_dose=400 mg' --data-urlencode 'med_1_times=1' --data-urlencode 'med_1_time_0=13:00' \
  --data-urlencode 'wound_count=1' \
  --data-urlencode 'wound_0_id=a1wound0001' --data-urlencode 'wound_0_label=Change the dressing' --data-urlencode 'wound_0_schedule=times' --data-urlencode 'wound_0_times=1' --data-urlencode 'wound_0_time_0=09:00' \
  --data-urlencode 'goal_count=2' \
  --data-urlencode 'goal_0_id=a1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
  --data-urlencode 'goal_1_id=a1goal00002' --data-urlencode 'goal_1_label=Climb the stairs once' \
  $BASE/api/plan >/dev/null

echo; echo "=================== STEP c: Today view ==================="
hdr "c1. GET /today"
S=$(get $D/cookies-a.txt $D/c1 $BASE/today)
echo "  status: $S"
echo "  header: $(line $D/c1.body 'recovery routine')"
echo "  subtitle: $(grep -o 'Knee replacement &middot; surgery [^<]*' $D/c1.body | head -1)"
echo "  progress: $(line $D/c1.body 'done')"
echo "  Next up block: $(firstafter $D/c1.body 'Next up')"
echo "  section headings:"
grep -o 'uppercase">[^<]*</h2>' $D/c1.body | sed -e 's/uppercase">//' -e 's|</h2>||' | sed 's/^/    /'
echo "  item rows rendered ($(n 'action="/api/tick"' $D/c1.body) tick forms):"
grep -o 'name="item" value="[^"]*"' $D/c1.body | sed 's/.*value="/    /;s/"$//'
echo "  date field in the forms: $(grep -o 'name="date" value="[^"]*"' $D/c1.body | head -1)"

echo; echo "=================== STEP d: ticks ==================="
ITEM1='med:a1medpara0001:08:00'
ITEM2='med:a1medibu0002:13:00'
hdr "d1. POST /api/tick item=$ITEM1 done=1"
S=$(post $D/cookies-a.txt $D/d1 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/d1 "$S"
hdr "d2. GET /today (reload)"
S=$(get $D/cookies-a.txt $D/d2 $BASE/today)
echo "  status: $S"
echo "  progress: $(line $D/d2.body 'done')"
echo "  aria-valuenow=$(grep -o 'aria-valuenow="[0-9]*"' $D/d2.body | head -1)  aria-valuemax=$(grep -o 'aria-valuemax="[0-9]*"' $D/d2.body | head -1)"
echo "  rows marked done: $(n 'aria-pressed="true"' $D/d2.body)   undo labels: $(n '>Undo<' $D/d2.body)"
echo "  Next up now: $(firstafter $D/d2.body 'Next up')"
hdr "d3. POST /api/tick item=$ITEM2 done=1 (second item)"
S=$(post $D/cookies-a.txt $D/d3 --data-urlencode "item=$ITEM2" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/d3 "$S"
hdr "d4. GET /today (reload)"
S=$(get $D/cookies-a.txt $D/d4 $BASE/today)
echo "  status: $S   progress: $(line $D/d4.body 'done')   rows marked done: $(n 'aria-pressed="true"' $D/d4.body)"
hdr "d5. POST /api/tick item=$ITEM1 done=0 (untick) then GET /today"
S=$(post $D/cookies-a.txt $D/d5 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=0' $BASE/api/tick)
show $D/d5 "$S"
S=$(get $D/cookies-a.txt $D/d5b $BASE/today)
echo "  status: $S   progress: $(line $D/d5b.body 'done')   rows marked done: $(n 'aria-pressed="true"' $D/d5b.body)"
hdr "d6. re-tick item1, then check a tick on a DIFFERENT date is separate"
S=$(post $D/cookies-a.txt $D/d6 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
echo "  status: $S"
# Yesterday, not a hard-coded date: a tick may only name the patient's own day or
# a neighbouring one (see step s), and this step is only about the two dates
# being kept apart.
S=$(post $D/cookies-a.txt $D/d6b --data-urlencode "item=$ITEM1" --data-urlencode "date=$YDAY" --data-urlencode 'done=1' $BASE/api/tick)
show $D/d6b "$S"
hdr "d7. POST /api/tick with an item id that is not in the user's plan"
S=$(post $D/cookies-a.txt $D/d7 --data-urlencode 'item=med:fake000000:08:00' --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/d7 "$S"
hdr "d8. POST /api/tick with a malformed date"
S=$(post $D/cookies-a.txt $D/d8 --data-urlencode "item=$ITEM1" --data-urlencode 'date=not-a-date' --data-urlencode 'done=1' $BASE/api/tick)
show $D/d8 "$S"

echo; echo "=================== STEP e: log out, log back in ==================="
hdr "e1. GET /today snapshot before logout"
S=$(get $D/cookies-a.txt $D/e1 $BASE/today)
echo "  status: $S   progress: $(line $D/e1.body 'done')   done rows: $(n 'aria-pressed="true"' $D/e1.body)"
hdr "e2. POST /api/auth/logout"
S=$(post $D/cookies-a.txt $D/e2 $BASE/api/auth/logout)
show $D/e2 "$S"
hdr "e3. GET /today after logout"
S=$(get $D/cookies-a.txt $D/e3 $BASE/today)
show $D/e3 "$S"
echo "  'Paracetamol' in body: $(n 'Paracetamol' $D/e3.body)"
hdr "e4. POST /api/auth/login (correct password)"
S=$(post $D/cookies-a.txt $D/e4 --data-urlencode "email=$A_EMAIL" --data-urlencode 'password=correct horse battery' $BASE/api/auth/login)
show $D/e4 "$S"
hdr "e5. GET /today after logging back in"
S=$(get $D/cookies-a.txt $D/e5 $BASE/today)
echo "  status: $S   progress: $(line $D/e5.body 'done')   done rows: $(n 'aria-pressed="true"' $D/e5.body)"
echo "  plan survived: Paracetamol=$(n 'Paracetamol' $D/e5.body)  'Climb the stairs once'=$(n 'Climb the stairs once' $D/e5.body)"

echo; echo "=================== STEP f: failure cases ==================="
hdr "f1. signup with an email that is already registered"
S=$(post $D/cookies-f1.txt $D/f1 --data-urlencode "email=$A_EMAIL" --data-urlencode 'password=another password here' $BASE/api/auth/signup)
show $D/f1 "$S"
echo "  session cookie set for the rejected attempt: $(grep -c 'rw_session' $D/cookies-f1.txt)"
hdr "f2. signup with the same email in different case (ALICE@Example.COM)"
S=$(post $D/cookies-f2.txt $D/f2 --data-urlencode "email=$UP_EMAIL" --data-urlencode 'password=another password here' $BASE/api/auth/signup)
show $D/f2 "$S"
hdr "f3. login with the wrong password"
S=$(post $D/cookies-anon.txt $D/f3 --data-urlencode "email=$A_EMAIL" --data-urlencode 'password=wrong password here' $BASE/api/auth/login)
show $D/f3 "$S"
echo "  session cookie set: $(grep -c 'rw_session' $D/cookies-anon.txt)"
hdr "f4. login for an email that has no account"
S=$(post $D/cookies-anon.txt $D/f4 --data-urlencode "email=$NOBODY_EMAIL" --data-urlencode 'password=whatever password' $BASE/api/auth/login)
show $D/f4 "$S"
hdr "f5. GET /today and /plan with no cookie at all"
rm -f $D/cookies-fresh.txt
S=$(get $D/cookies-fresh.txt $D/f5 $BASE/today); show $D/f5 "$S"
S=$(get $D/cookies-fresh.txt $D/f5b $BASE/plan); show $D/f5b "$S"
echo "  'Paracetamol' leaked into either body: $(n 'Paracetamol' $D/f5.body) / $(n 'Paracetamol' $D/f5b.body)"
hdr "f6. POST /api/plan with no cookie"
S=$(post $D/cookies-fresh.txt $D/f6 --data-urlencode 'surgery_date=2026-01-01' --data-urlencode 'procedure_label=Anonymous surgery' --data-urlencode 'med_count=0' --data-urlencode 'wound_count=0' --data-urlencode 'goal_count=1' --data-urlencode 'goal_0_label=Anonymous goal' $BASE/api/plan)
show $D/f6 "$S"
hdr "f7. POST /api/tick with no cookie"
S=$(post $D/cookies-fresh.txt $D/f7 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/f7 "$S"
hdr "f8. GET /today with a forged session cookie"
S=$(forgedget $D/f8 $BASE/today deadbeefdeadbeefdeadbeefdeadbeef)
show $D/f8 "$S"
echo "  'Paracetamol' in body: $(n 'Paracetamol' $D/f8.body)"
hdr "f9. POST /api/auth/signup with a too-short password"
S=$(post $D/cookies-f9.txt $D/f9 --data-urlencode "email=$SHORTPW_EMAIL" --data-urlencode 'password=abc' $BASE/api/auth/signup)
show $D/f9 "$S"
hdr "f10. POST /api/auth/signup with a non-email"
S=$(post $D/cookies-f10.txt $D/f10 --data-urlencode 'email=not an email' --data-urlencode 'password=long enough password' $BASE/api/auth/signup)
show $D/f10 "$S"
hdr "f11. user A POSTs /api/plan with no items at all"
S=$(post $D/cookies-a.txt $D/f11 --data-urlencode 'surgery_date=2026-09-20' --data-urlencode 'procedure_label=Knee replacement' --data-urlencode 'med_count=0' --data-urlencode 'wound_count=0' --data-urlencode 'goal_count=0' $BASE/api/plan)
show $D/f11 "$S"

echo; echo "=================== STEP g: isolation between two accounts ==================="
hdr "g1. signup user B ($B_EMAIL)"
S=$(post $D/cookies-b.txt $D/g1 --data-urlencode "email=$B_EMAIL" --data-urlencode 'password=a totally different pw' $BASE/api/auth/signup)
show $D/g1 "$S"
hdr "g2. user B saves a different plan"
S=$(post $D/cookies-b.txt $D/g2 \
  --data-urlencode 'surgery_date=2026-09-25' --data-urlencode 'procedure_label=Hip repair' \
  --data-urlencode 'med_count=1' \
  --data-urlencode 'med_0_id=b1medxyz0001' --data-urlencode 'med_0_name=Amoxicillin' --data-urlencode 'med_0_dose=500 mg' --data-urlencode 'med_0_times=1' --data-urlencode 'med_0_time_0=07:30' \
  --data-urlencode 'wound_count=0' \
  --data-urlencode 'goal_count=1' \
  --data-urlencode 'goal_0_id=b1goal00001' --data-urlencode 'goal_0_label=Sit up unaided' \
  $BASE/api/plan)
show $D/g2 "$S"
hdr "g3. user B GET /today"
S=$(get $D/cookies-b.txt $D/g3 $BASE/today)
echo "  status: $S   progress: $(line $D/g3.body 'done')"
echo "  B's own plan:   Amoxicillin=$(n 'Amoxicillin' $D/g3.body)  'Sit up unaided'=$(n 'Sit up unaided' $D/g3.body)"
echo "  A's plan:       Paracetamol=$(n 'Paracetamol' $D/g3.body)  Ibuprofen=$(n 'Ibuprofen' $D/g3.body)  'Change the dressing'=$(n 'Change the dressing' $D/g3.body)  'Walk to the kitchen'=$(n 'Walk to the kitchen' $D/g3.body)"
echo "  A's item ids:   $(n 'med:a1medpara0001' $D/g3.body)"
hdr "g4. user B GET /plan"
S=$(get $D/cookies-b.txt $D/g4 $BASE/plan)
echo "  status: $S   A's data: Paracetamol=$(n 'Paracetamol' $D/g4.body) 'Knee replacement'=$(n 'Knee replacement' $D/g4.body)   B's own: 'Hip repair'=$(n 'value="Hip repair"' $D/g4.body) Amoxicillin=$(n 'value="Amoxicillin"' $D/g4.body)"
hdr "g5. user B POSTs /api/tick with USER A's item id (done=1)"
S=$(post $D/cookies-b.txt $D/g5 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/g5 "$S"
hdr "g6. user B POSTs /api/tick with USER A's item id (done=0, tries to erase A's tick)"
S=$(post $D/cookies-b.txt $D/g6 --data-urlencode "item=$ITEM1" --data-urlencode "date=$DATE" --data-urlencode 'done=0' $BASE/api/tick)
show $D/g6 "$S"
hdr "g7. user B POSTs /api/plan (does it overwrite A's plan?)"
S=$(post $D/cookies-b.txt $D/g7 \
  --data-urlencode 'surgery_date=2026-09-25' --data-urlencode 'procedure_label=Hip repair (v2)' \
  --data-urlencode 'med_count=1' \
  --data-urlencode 'med_0_id=b1medxyz0001' --data-urlencode 'med_0_name=Amoxicillin' --data-urlencode 'med_0_dose=500 mg' --data-urlencode 'med_0_times=1' --data-urlencode 'med_0_time_0=07:30' \
  --data-urlencode 'wound_count=0' --data-urlencode 'goal_count=1' --data-urlencode 'goal_0_id=b1goal00001' --data-urlencode 'goal_0_label=Sit up unaided' \
  $BASE/api/plan)
show $D/g7 "$S"
hdr "g8. user A GET /today once more"
S=$(get $D/cookies-a.txt $D/g8 $BASE/today)
echo "  status: $S   progress: $(line $D/g8.body 'done')   done rows: $(n 'aria-pressed="true"' $D/g8.body)"
echo "  A's plan intact: Paracetamol=$(n 'Paracetamol' $D/g8.body) Ibuprofen=$(n 'Ibuprofen' $D/g8.body) 'Knee replacement'=$(n 'Knee replacement' $D/g8.body)"
echo "  B's data visible to A: Amoxicillin=$(n 'Amoxicillin' $D/g8.body) 'Hip repair'=$(n 'Hip repair' $D/g8.body)"
hdr "g9. user B GET /plan (own only) and 'Signed in as'"
S=$(get $D/cookies-b.txt $D/g9 $BASE/plan)
echo "  status: $S   '$(line $D/g9.body 'Signed in as')'"
S=$(get $D/cookies-a.txt $D/g9b $BASE/plan)
echo "  A  '$(line $D/g9b.body 'Signed in as')'"

na() { grep -oE -- "$1" "$2" | wc -l | tr -d ' '; }   # grep -oE count
forgedpost() { # out url "a=b&c=d" — a POST carrying someone else's session token
  curl -s -H 'Accept-Encoding: identity' -o "$1.body" -D "$1.hdr" \
    -H 'Cookie: rw_session=deadbeefdeadbeefdeadbeefdeadbeef' -X POST -d "$3" "$2" -w '%{http_code}\n'
}

echo; echo "=================== STEP h: the patient's own 'when to call' limits ==================="
hdr "h1. POST /api/plan with the 'When to call your care team' section filled in"
S=$(post $D/cookies-a.txt $D/h1 \
  --data-urlencode 'surgery_date=2026-09-20' \
  --data-urlencode 'procedure_label=Knee replacement' \
  --data-urlencode 'med_count=2' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=2' --data-urlencode 'med_0_time_0=08:00' --data-urlencode 'med_0_time_1=20:00' \
  --data-urlencode 'med_1_id=a1medibu0002' --data-urlencode 'med_1_name=Ibuprofen' --data-urlencode 'med_1_dose=400 mg' --data-urlencode 'med_1_times=1' --data-urlencode 'med_1_time_0=13:00' \
  --data-urlencode 'wound_count=1' \
  --data-urlencode 'wound_0_id=a1wound0001' --data-urlencode 'wound_0_label=Change the dressing' --data-urlencode 'wound_0_schedule=times' --data-urlencode 'wound_0_times=1' --data-urlencode 'wound_0_time_0=09:00' \
  --data-urlencode 'goal_count=2' \
  --data-urlencode 'goal_0_id=a1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
  --data-urlencode 'goal_1_id=a1goal00002' --data-urlencode 'goal_1_label=Climb the stairs once' \
  --data-urlencode 'pain_threshold=4' \
  --data-urlencode 'temp_threshold=38' \
  --data-urlencode 'temp_unit=C' \
  --data-urlencode 'warning_count=2' \
  --data-urlencode 'warning_0_text=If the wound starts to smell' \
  --data-urlencode 'warning_1_text=If I cannot keep fluids down' \
  --data-urlencode 'care_team_phone=01234 567890' \
  $BASE/api/plan)
show $D/h1 "$S"
hdr "h2. GET /plan: are the patient's own limits read back out of the database?"
S=$(get $D/cookies-a.txt $D/h2 $BASE/plan)
echo "  status: $S"
echo "  pain limit field : $(grep -o 'name="pain_threshold"[^>]*value="[^"]*"' $D/h2.body | head -1)"
echo "  temp limit field : $(grep -o 'name="temp_threshold"[^>]*value="[^"]*"' $D/h2.body | head -1)"
echo "  unit options     : $(grep -o '<option value="[CF]"[^>]*>' $D/h2.body | tr '\n' ' ')"
echo "  unit selected    : $(grep -oE '<option value="[CF]" selected' $D/h2.body | head -1)"
echo "  warning signs    : $(grep -o 'name="warning_[0-9]*_text"[^>]*value="[^"]*"' $D/h2.body | sed 's/.*value="//;s/"$//' | tr '\n' '|')"
echo "  care team phone  : $(grep -o 'name="care_team_phone"[^>]*value="[^"]*"' $D/h2.body | head -1)"
hdr "h3. POST /api/plan with a pain limit that is not 0-10 (expect a plain refusal)"
S=$(post $D/cookies-a.txt $D/h3 \
  --data-urlencode 'surgery_date=2026-09-20' --data-urlencode 'procedure_label=Knee replacement' \
  --data-urlencode 'med_count=1' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=1' --data-urlencode 'med_0_time_0=08:00' \
  --data-urlencode 'wound_count=0' --data-urlencode 'goal_count=0' \
  --data-urlencode 'pain_threshold=11' \
  $BASE/api/plan)
show $D/h3 "$S"

echo; echo "=================== STEP i: the daily log ==================="
hdr "i1. GET /log as user A, before anything is logged"
S=$(get $D/cookies-a.txt $D/i1 $BASE/log); show $D/i1 "$S"
echo "  heading: $(line $D/i1.body 'How you feel today')"
echo "  pain choices on the scale: $(n 'name="pain"' $D/i1.body) radios"
echo "  temperature field: $(grep -o 'name="temperature"[^>]*' $D/i1.body | head -1)"
echo "  unit in the field label: $(line $D/i1.body 'Temperature in')"
echo "  submit label: $(line $D/i1.body 'Save today')"
echo "  banner (expect none): $(n 'Contact your care team' $D/i1.body)"
echo "  nothing logged yet: $(line $D/i1.body 'Nothing logged yet')"
hdr "i2. POST /api/log: pain 2 and 37.1 C, both BELOW the patient's own limits"
S=$(post $D/cookies-a.txt $D/i2 --data-urlencode "date=$DATE" --data-urlencode 'pain=2' --data-urlencode 'temperature=37.1' \
  --data-urlencode 'wound_note=Wound looks clean and dry' --data-urlencode 'note=Slept better last night' $BASE/api/log)
show $D/i2 "$S"
hdr "i3. GET /log: the entry is read back, and there is no banner"
S=$(get $D/cookies-a.txt $D/i3 $BASE/log)
echo "  status: $S"
echo "  'Contact your care team' present (expect 0): $(n 'Contact your care team' $D/i3.body)"
echo "  'contact your care team' present (expect 0): $(n 'contact your care team' $D/i3.body)"
echo "  pain read back      : $(plainn $D/i3.body 'Pain 2 out of 10') occurrence(s) of 'Pain 2 out of 10'"
check "i3 the day's pain score reads back" "$(plainn $D/i3.body 'Pain 2 out of 10')" 1
echo "  temperature read back: $(line $D/i3.body '37.1')"
echo "  wound note read back : $(n 'Wound looks clean and dry' $D/i3.body)"
echo "  general note read back: $(n 'Slept better last night' $D/i3.body)"
echo "  submit label now: $(line $D/i3.body 'Update today')"
echo "  'you already have a log for today' line: $(n 'already have a log for today' $D/i3.body)"
echo "  the form still offers today: $(grep -o 'name="date" value="[^"]*"' $D/i3.body | head -1)"
hdr "i4. GET /today: the small link to the log, and still no banner"
S=$(get $D/cookies-a.txt $D/i4 $BASE/today)
echo "  status: $S"
echo "  link: $(grep -o 'href="/log"' $D/i4.body | head -1)"
echo "  link wording: $(line $D/i4.body 'How are you feeling today')"
echo "  banner (expect 0): $(n 'Contact your care team' $D/i4.body)"
echo "  checklist intact: $(n 'action="/api/tick"' $D/i4.body) tick forms, progress '$(line $D/i4.body 'of')'"

echo; echo "=================== STEP j: a value at or over the patient's own limit ==================="
hdr "j1. POST /api/log: pain 7 (limit 4) and 38.5 C (limit 38)"
S=$(post $D/cookies-a.txt $D/j1 --data-urlencode "date=$DATE" --data-urlencode 'pain=7' --data-urlencode 'temperature=38.5' \
  --data-urlencode 'wound_note=Redness along the top of the scar' --data-urlencode 'note=Felt shivery this evening' $BASE/api/log)
show $D/j1 "$S"
hdr "j2. GET /log: the banner names both values"
S=$(get $D/cookies-a.txt $D/j2 $BASE/log)
echo "  status: $S"
echo "  banner heading (expect 1): $(n 'Contact your care team' $D/j2.body)"
echo "  exact wording, lower case (expect >=1): $(n 'contact your care team' $D/j2.body)"
echo "  pain value named (expect 1): $(n 'Pain score 7 out of 10' $D/j2.body)"
echo "  temperature named (expect 1): $(n 'Temperature 38.5' $D/j2.body)"
echo "  the saved limit is named: $(line $D/j2.body 'you saved')"
echo "  the saved phone number is shown: $(n '01234 567890' $D/j2.body)   'tel:' link: $(grep -o 'href="tel:[^"]*"' $D/j2.body | head -1)"
echo "  diagnosis-flavoured words (expect 0): $(na '(you may|possibly|likely|diagnos|suggests)' $D/j2.body)"
echo "  medication advice words (expect 0): $(na '(take more|take less|increase your dose|stop taking|double)' $D/j2.body)"
echo "  role=alert on the banner (expect 1): $(n 'role="alert"' $D/j2.body)"
hdr "j3. GET /today: the same flag, above the checklist"
S=$(get $D/cookies-a.txt $D/j3 $BASE/today)
echo "  status: $S"
echo "  banner heading (expect 1): $(n 'Contact your care team' $D/j3.body)"
OFF_B=$(grep -bo 'Contact your care team' $D/j3.body | head -1 | cut -d: -f1)
OFF_C=$(grep -bo 'recovery routine' $D/j3.body | head -1 | cut -d: -f1)
echo "  banner byte offset $OFF_B vs checklist heading $OFF_C (banner is above when smaller)"
echo "  checklist untouched: $(n 'action="/api/tick"' $D/j3.body) tick forms, progress '$(line $D/j3.body 'of')'"
echo "  phone shown here too: $(n '01234 567890' $D/j3.body)"

echo; echo "=================== STEP k: re-saving the same day updates, never duplicates ==================="
hdr "k1. POST /api/log again for the SAME date with lower values"
S=$(post $D/cookies-a.txt $D/k1 --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=37.4' \
  --data-urlencode 'wound_note=Redness has settled a little' --data-urlencode 'note=Quieter evening' $BASE/api/log)
show $D/k1 "$S"
hdr "k2. GET /log: one entry for the day, holding the new values"
S=$(get $D/cookies-a.txt $D/k2 $BASE/log)
echo "  status: $S"
echo "  entries dated '$SHORT' in 'your last few days' (expect 1): $(n "$SHORT" $D/k2.body)"
echo "  new values shown  : $(plainn $D/k2.body 'Pain 3 out of 10') occurrence(s) of 'Pain 3 out of 10'  /  $(line $D/k2.body '37.4')"
check "k2 the re-saved day shows the new pain score" "$(plainn $D/k2.body 'Pain 3 out of 10')" 1
check "k2 the old pain score is gone" "$(plainn $D/k2.body 'Pain 7 out of 10')" 0
echo "  old values gone   : 'Pain 7 out of 10'=$(n 'Pain 7 out of 10' $D/k2.body)  old wound text=$(n 'Redness along the top of the scar' $D/k2.body) (expect 0 / 0)"
check "k2 the old wound note is gone" "$(n 'Redness along the top of the scar' $D/k2.body)" 0
check "k2 one entry for the day, in 'your last few days'" "$(n "$SHORT" $D/k2.body)" 1
echo "  banner cleared by the lower log (expect 0): $(n 'Contact your care team' $D/k2.body)"
hdr "k3. GET /today: banner cleared there too"
S=$(get $D/cookies-a.txt $D/k3 $BASE/today)
echo "  status: $S   banner (expect 0): $(n 'Contact your care team' $D/k3.body)   tick forms: $(n 'action="/api/tick"' $D/k3.body)"
hdr "k4. database: one log document per user per day, under a unique key"
(cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/db-count.ts)

echo; echo "=================== STEP l: what user B can and cannot reach ==================="
hdr "l1. user B GET /log: no sign of user A's log"
S=$(get $D/cookies-b.txt $D/l1 $BASE/log)
echo "  status: $S"
echo "  A's wound note in B's page (expect 0): $(n 'Redness has settled a little' $D/l1.body)"
echo "  A's general note in B's page (expect 0): $(n 'Quieter evening' $D/l1.body)"
echo "  A's temperature in B's page (expect 0): $(n '37.4' $D/l1.body)"
echo "  B's own state: $(line $D/l1.body 'Nothing logged yet')"
echo "  banner for B (expect 0): $(n 'Contact your care team' $D/l1.body)"
hdr "l2. user B saved NO limits: logging a high value raises no banner, ever"
S=$(post $D/cookies-b.txt $D/l2 --data-urlencode "date=$DATE" --data-urlencode 'pain=10' --data-urlencode 'temperature=39.5' \
  --data-urlencode 'wound_note=B wound note' --data-urlencode 'note=B general note' $BASE/api/log)
show $D/l2 "$S"
S=$(get $D/cookies-b.txt $D/l2b $BASE/log)
echo "  B's own values read back: $(plainn $D/l2b.body 'Pain 10 out of 10') occurrence(s) of 'Pain 10 out of 10'  /  $(line $D/l2b.body '39.5')"
check "l2 B's own extreme values read back to B" "$(plainn $D/l2b.body 'Pain 10 out of 10')" 1
echo "  banner on B's log page (expect 0): $(n 'Contact your care team' $D/l2b.body)"
S=$(get $D/cookies-b.txt $D/l2c $BASE/today)
echo "  banner on B's today    (expect 0): $(n 'Contact your care team' $D/l2c.body)"
hdr "l3. user B's log did not disturb user A's day"
S=$(get $D/cookies-a.txt $D/l3 $BASE/log)
echo "  A's entry still A's: $(plainn $D/l3.body 'Pain 3 out of 10') occurrence(s) of 'Pain 3 out of 10'   B's note in A's page (expect 0): $(n 'B wound note' $D/l3.body)"
check "l3 A's own entry is still A's" "$(plainn $D/l3.body 'Pain 3 out of 10')" 1
check "l3 B's note never reaches A's page" "$(n 'B wound note' $D/l3.body)" 0
hdr "l4. POST /api/log with no cookie / with a forged cookie"
rm -f $D/cookies-fresh.txt
S=$(post $D/cookies-fresh.txt $D/l4 --data-urlencode "date=$DATE" --data-urlencode 'pain=5' $BASE/api/log); show $D/l4 "$S"
S=$(forgedpost $D/l4b $BASE/api/log "date=$DATE&pain=5"); show $D/l4b "$S"
hdr "l5. POST /api/log with values that are not numbers"
S=$(post $D/cookies-a.txt $D/l5 --data-urlencode "date=$DATE" --data-urlencode 'pain=eleven' $BASE/api/log); show $D/l5 "$S"
S=$(post $D/cookies-a.txt $D/l5b --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=abc' $BASE/api/log); show $D/l5b "$S"
S=$(get $D/cookies-a.txt $D/l5c $BASE/log)
echo "  A's saved values after the refused posts (expect the pain 3 entry): $(plainn $D/l5c.body 'Pain 3 out of 10') occurrence(s)"
check "l5 A's saved entry survives two refused log posts" "$(plainn $D/l5c.body 'Pain 3 out of 10')" 1

echo; echo "=================== STEP m: the flag stays until the next log ==================="
# The flag is judged on the patient's NEWEST log by date, so the newest entry has
# to be the over-limit one for this step to mean anything: an older, quieter day
# must not mask it, and only the next (newer) log clears it.
hdr "m1. user A logs a quiet day for yesterday ($YDAY), then a high value for today"
S=$(post $D/cookies-a.txt $D/m1 --data-urlencode "date=$YDAY" --data-urlencode 'pain=1' --data-urlencode 'temperature=36.8' $BASE/api/log)
show $D/m1 "$S"
check "m1a yesterday's quiet entry saves" "$(loc $D/m1)" "/log"
S=$(post $D/cookies-a.txt $D/m1b --data-urlencode "date=$DATE" --data-urlencode 'pain=8' --data-urlencode 'temperature=38.2' $BASE/api/log)
show $D/m1b "$S"
check "m1b today's over-limit entry saves" "$(loc $D/m1b)" "/log"
hdr "m2. GET /today: today's checklist carries the flag from the newest log"
S=$(get $D/cookies-a.txt $D/m2 $BASE/today)
echo "  status: $S   banner (expect 1): $(n 'Contact your care team' $D/m2.body)   pain named: $(n 'Pain score 8 out of 10' $D/m2.body)"
check "m2 the flag is on the Today view" "$(n 'Contact your care team' $D/m2.body)" 1
check "m2 it names the reading the patient logged" "$(n 'Pain score 8 out of 10' $D/m2.body)" 1
hdr "m3. GET /log: the flag is in front of the patient there too, and today's entry is prefilled"
S=$(get $D/cookies-a.txt $D/m3 $BASE/log)
echo "  status: $S   banner (expect 1): $(n 'Contact your care team' $D/m3.body)"
echo "  today's pain still selected: $(grep -oE '<input[^>]*name="pain"[^>]*checked[^>]*>' $D/m3.body | grep -oE 'value="[0-9]+"' | head -1)"
echo "  today's temperature still prefilled: $(grep -o 'name="temperature"[^>]*value="[^"]*"' $D/m3.body | head -1)"
check "m3 the flag is on the log page" "$(n 'Contact your care team' $D/m3.body)" 1
check "m3 today's pain score is still selected" "$(grep -oE '<input[^>]*name="pain"[^>]*checked[^>]*>' $D/m3.body | grep -oE 'value="[0-9]+"' | head -1)" 'value="8"'
check "m3 today's temperature is still prefilled" "$(grep -o 'name="temperature"[^>]*value="38.2"' $D/m3.body | head -1)" 'name="temperature" value="38.2"'
echo "  both dates listed: today $(n "$SHORT" $D/m3.body) + yesterday $(n "$SHORT_YDAY" $D/m3.body)"
check "m3 the older day is still listed beside today" "$(n "$SHORT_YDAY" $D/m3.body)" 1
hdr "m4. user A logs today again below both limits: the flag clears"
S=$(post $D/cookies-a.txt $D/m4 --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=37.6' \
  --data-urlencode 'wound_note=Redness has settled a little' --data-urlencode 'note=Quieter evening' $BASE/api/log)
show $D/m4 "$S"
S=$(get $D/cookies-a.txt $D/m4b $BASE/today)
echo "  banner on /today (expect 0): $(n 'Contact your care team' $D/m4b.body)"
check "m4 the flag clears on /today after the next log" "$(n 'Contact your care team' $D/m4b.body)" 0
S=$(get $D/cookies-a.txt $D/m4c $BASE/log)
echo "  banner on /log   (expect 0): $(n 'Contact your care team' $D/m4c.body)"
check "m4 the flag clears on /log too" "$(n 'Contact your care team' $D/m4c.body)" 0

echo; echo "=================== STEP n: 'at or over' is the boundary ==================="
hdr "n1. POST /api/log exactly at both limits (pain 4, temperature 38)"
S=$(post $D/cookies-a.txt $D/n1 --data-urlencode "date=$DATE" --data-urlencode 'pain=4' --data-urlencode 'temperature=38' \
  --data-urlencode 'wound_note=Checking the boundary' --data-urlencode 'note=Boundary test' $BASE/api/log)
show $D/n1 "$S"
S=$(get $D/cookies-a.txt $D/n1b $BASE/log)
echo "  banner (expect 1): $(n 'Contact your care team' $D/n1b.body)"
echo "  pain named (expect 1): $(n 'Pain score 4 out of 10' $D/n1b.body)   temperature named (expect 1): $(n 'Temperature 38' $D/n1b.body)"
hdr "n2. POST /api/log one point below both limits (pain 3, temperature 37.9)"
S=$(post $D/cookies-a.txt $D/n2 --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=37.9' \
  --data-urlencode 'wound_note=One below' --data-urlencode 'note=Below the limit' $BASE/api/log)
show $D/n2 "$S"
S=$(get $D/cookies-a.txt $D/n2b $BASE/log)
echo "  banner (expect 0): $(n 'Contact your care team' $D/n2b.body)"

echo; echo "=================== STEP o: the patient's celsius/fahrenheit choice ==================="
hdr "o1. user A logs 38.5 C against a 38 C limit (flag, shown in C)"
S=$(post $D/cookies-a.txt $D/o1 --data-urlencode "date=$DATE" --data-urlencode 'pain=1' --data-urlencode 'temperature=38.5' $BASE/api/log)
show $D/o1 "$S"
S=$(get $D/cookies-a.txt $D/o1b $BASE/log)
echo "  banner names it in C (expect 1): $(n 'Temperature 38.5 °C' $D/o1b.body)  (raw: $(line $D/o1b.body 'Temperature 38.5'))"
hdr "o2. user A switches the plan to Fahrenheit with a 100.4 F limit"
S=$(post $D/cookies-a.txt $D/o2 \
  --data-urlencode 'surgery_date=2026-09-20' --data-urlencode 'procedure_label=Knee replacement' \
  --data-urlencode 'med_count=1' \
  --data-urlencode 'med_0_id=a1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=1' --data-urlencode 'med_0_time_0=08:00' \
  --data-urlencode 'wound_count=1' --data-urlencode 'wound_0_id=a1wound0001' --data-urlencode 'wound_0_label=Change the dressing' --data-urlencode 'wound_0_schedule=perday:1' \
  --data-urlencode 'goal_count=1' --data-urlencode 'goal_0_id=a1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
  --data-urlencode 'pain_threshold=4' \
  --data-urlencode 'temp_threshold=100.4' \
  --data-urlencode 'temp_unit=F' \
  --data-urlencode 'warning_count=1' --data-urlencode 'warning_0_text=If the wound starts to smell' \
  --data-urlencode 'care_team_phone=01234 567890' \
  $BASE/api/plan)
show $D/o2 "$S"
S=$(get $D/cookies-a.txt $D/o2b $BASE/plan)
echo "  plan read back: $(grep -o 'name="temp_threshold"[^>]*value="[^"]*"' $D/o2b.body | head -1)  unit selected: $(grep -oE '<option value="[CF]" selected' $D/o2b.body | head -1)"
hdr "o3. GET /log: the older 38.5 C entry is compared and shown in F"
S=$(get $D/cookies-a.txt $D/o3 $BASE/log)
echo "  status: $S   banner (expect 1): $(n 'Contact your care team' $D/o3.body)"
echo "  shown in the plan's unit: $(line $D/o3.body 'Temperature 101.3')   limit named: $(n '100.4' $D/o3.body)"
echo "  the form prefills the same reading in F: $(grep -o 'name="temperature"[^>]*value="[^"]*"' $D/o3.body | head -1)"
hdr "o4. POST /api/log 100.5 F (over the 100.4 limit) then 99.9 F (under it)"
S=$(post $D/cookies-a.txt $D/o4 --data-urlencode "date=$DATE" --data-urlencode 'pain=1' --data-urlencode 'temperature=100.5' $BASE/api/log); show $D/o4 "$S"
S=$(get $D/cookies-a.txt $D/o4b $BASE/log)
echo "  banner names 100.5 in F (expect 1): $(n 'Temperature 100.5' $D/o4b.body)"
S=$(post $D/cookies-a.txt $D/o5 --data-urlencode "date=$DATE" --data-urlencode 'pain=1' --data-urlencode 'temperature=99.9' $BASE/api/log); show $D/o5 "$S"
S=$(get $D/cookies-a.txt $D/o5b $BASE/log)
echo "  banner after 99.9 F (expect 0): $(n 'Contact your care team' $D/o5b.body)"
hdr "o6. GET /today with the F plan: checklist still there, no flag"
S=$(get $D/cookies-a.txt $D/o6 $BASE/today)
echo "  status: $S   banner (expect 0): $(n 'Contact your care team' $D/o6.body)   tick forms: $(n 'action="/api/tick"' $D/o6.body)"
hdr "o7. database after the whole run"
(cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/db-count.ts)

echo; echo "=================== STEP p: a mistyped limit is refused, never silently dropped ==================="
# Item 1 of the safety review: `Number("abc")` used to pass the old range checks
# (NaN compares false both ways), so a mistyped limit was stored as NaN, read back
# as "no limit", and the alert the patient believed they had set never fired.
ITEMC='med:c1medpara0001:08:00'
carol_plan() { # out extra-field...  — carol's own plan with one extra form field
  post $D/cookies-c.txt "$1" \
    --data-urlencode 'surgery_date=2026-09-20' \
    --data-urlencode 'procedure_label=Knee replacement' \
    --data-urlencode 'med_count=1' \
    --data-urlencode 'med_0_id=c1medpara0001' --data-urlencode 'med_0_name=Paracetamol' --data-urlencode 'med_0_dose=1 tablet' --data-urlencode 'med_0_times=1' --data-urlencode 'med_0_time_0=08:00' \
    --data-urlencode 'wound_count=0' \
    --data-urlencode 'goal_count=1' --data-urlencode 'goal_0_id=c1goal00001' --data-urlencode 'goal_0_label=Walk to the kitchen' \
    "${@:2}" \
    $BASE/api/plan
}
hdr "p1. signup user C ($C_EMAIL) for the limit tests"
S=$(post $D/cookies-c.txt $D/p1 --data-urlencode "email=$C_EMAIL" --data-urlencode 'password=carol password here' $BASE/api/auth/signup)
show $D/p1 "$S"
check "p1 carol has an account" "$(loc $D/p1)" "/plan"

hdr "p2. save a plan whose temperature limit is typed with a comma decimal (37,5)"
S=$(carol_plan $D/p2 --data-urlencode 'pain_threshold=3' --data-urlencode 'temp_threshold=37,5' --data-urlencode 'temp_unit=C')
show $D/p2 "$S"
check "p2 the plan saves" "$(loc $D/p2)" "/today"
S=$(get $D/cookies-c.txt $D/p2b $BASE/plan)
echo "  temp limit field: $(grep -o 'name="temp_threshold"[^>]*' $D/p2b.body | head -1)"
check "p2 '37,5' was stored as 37.5" "$(grep -o 'name="temp_threshold" value="37.5"' $D/p2b.body | head -1)" 'name="temp_threshold" value="37.5"'

hdr "p3. log 38 with that 37.5 limit: the alert the patient set actually fires"
S=$(post $D/cookies-c.txt $D/p3 --data-urlencode "date=$DATE" --data-urlencode 'pain=1' --data-urlencode 'temperature=38' $BASE/api/log)
show $D/p3 "$S"
check "p3 the log saves" "$(loc $D/p3)" "/log"
S=$(get $D/cookies-c.txt $D/p3b $BASE/log)
check "p3 the banner appears" "$(n 'Contact your care team' $D/p3b.body)" 1
check "p3 the reading is named" "$(plainn $D/p3b.body 'Temperature 38 °C')" 1
check "p3 the saved limit is named" "$(plainn $D/p3b.body 'you saved 37.5 °C as your limit.')" 1
check "p3 no diagnosis or medication wording" "$(na '(you may|possibly|likely|diagnos|suggests|take more|take less|stop taking)' $D/p3b.body)" 0

hdr "p4. a temperature limit that is not a number is refused, with the plain message"
S=$(carol_plan $D/p4 --data-urlencode 'pain_threshold=3' --data-urlencode 'temp_threshold=abc')
show $D/p4 "$S"
check "p4 refused with the temperature error code" "$(loc $D/p4)" "/plan?e=temp_threshold"
S=$(get $D/cookies-c.txt $D/p4b "$BASE/plan?e=temp_threshold")
check "p4 the plain message is shown" "$(n 'The temperature to call about has to be a number' $D/p4b.body)" 1
S=$(get $D/cookies-c.txt $D/p4c $BASE/plan)
check "p4 the temperature limit the patient already saved is untouched" "$(grep -o 'name="temp_threshold" value="37.5"' $D/p4c.body | head -1)" 'name="temp_threshold" value="37.5"'
check "p4 and so is the pain limit beside it" "$(grep -o 'name="pain_threshold" value="3"' $D/p4c.body | head -1)" 'name="pain_threshold" value="3"'

hdr "p5. an infinite value (1e999) is refused the same way — NaN never reaches storage"
S=$(carol_plan $D/p5 --data-urlencode 'pain_threshold=3' --data-urlencode 'temp_threshold=1e999')
show $D/p5 "$S"
check "p5 refused with the temperature error code" "$(loc $D/p5)" "/plan?e=temp_threshold"

hdr "p6. the pain limit takes the identical path"
S=$(carol_plan $D/p6 --data-urlencode 'pain_threshold=abc' --data-urlencode 'temp_threshold=37.5')
show $D/p6 "$S"
check "p6 refused with the pain error code" "$(loc $D/p6)" "/plan?e=pain_threshold"
S=$(get $D/cookies-c.txt $D/p6b "$BASE/plan?e=pain_threshold")
check "p6 the plain message is shown" "$(n 'The pain score to call about has to be a whole number from 0 to 10' $D/p6b.body)" 1
S=$(get $D/cookies-c.txt $D/p6c $BASE/plan)
check "p6 carol's saved limits are still both intact" "$(grep -o 'name="pain_threshold" value="3"' $D/p6c.body | head -1)$(grep -o 'name="temp_threshold" value="37.5"' $D/p6c.body | head -1)" 'name="pain_threshold" value="3"name="temp_threshold" value="37.5"'

hdr "p7. the log's own temperature field takes a comma decimal too"
S=$(post $D/cookies-c.txt $D/p7 --data-urlencode "date=$DATE" --data-urlencode 'pain=1' --data-urlencode 'temperature=36,9' $BASE/api/log)
show $D/p7 "$S"
S=$(get $D/cookies-c.txt $D/p7b $BASE/log)
check "p7 '36,9' was stored as 36.9" "$(plainn $D/p7b.body '36.9 °C')" 1
check "p7 and it is below the 37.5 limit, so no banner" "$(n 'Contact your care team' $D/p7b.body)" 0

echo; echo "=================== STEP q: sign-in throttling, and equal-cost answers ==================="
hdr "q1. signup user D ($D_EMAIL), the account the throttle test grinds"
S=$(post $D/cookies-throttle.txt $D/q1 --data-urlencode "email=$D_EMAIL" --data-urlencode 'password=dave password here' $BASE/api/auth/signup)
show $D/q1 "$S"
check "q1 dave has an account" "$(loc $D/q1)" "/plan"
rm -f $D/cookies-throttle.txt

# Item 3 of the review: an unknown email used to skip password hashing entirely,
# so the response time told an attacker whether an email had an account. Both
# paths must now cost one hash. Three attempts each, summed, so one slow request
# cannot decide the result.
timed_login() { # email password -> seconds
  curl -s -o /dev/null -w '%{time_total}' -X POST "$BASE/api/auth/login" \
    --data-urlencode "email=$1" --data-urlencode "password=$2"
}
hdr "q2. an unknown email must cost about what a wrong password costs"
UNK_TOTAL=0
for i in 1 2 3; do
  T=$(timed_login "ghost$i.$RUN_TAG@example.com" "any old password")
  UNK_TOTAL=$(awk -v a="$UNK_TOTAL" -v b="$T" 'BEGIN { print a + b }')
done
WRONG_TOTAL=0
for i in 1 2 3; do
  T=$(timed_login "$B_EMAIL" 'definitely the wrong password')
  WRONG_TOTAL=$(awk -v a="$WRONG_TOTAL" -v b="$T" 'BEGIN { print a + b }')
done
echo "  3 unknown-email sign-ins: $(ms "$UNK_TOTAL") ms total"
echo "  3 wrong-password sign-ins: $(ms "$WRONG_TOTAL") ms total"
ge "q2 the unknown-email path is doing real hash work" "$(ms "$UNK_TOTAL")" 100
ratio_ok "q2 the two paths cost about the same" "$(ms "$UNK_TOTAL")" "$(ms "$WRONG_TOTAL")" 3

hdr "q3. six wrong passwords for one account, then the right one"
for i in 1 2 3 4 5 6; do
  S=$(post $D/cookies-throttle.txt $D/q3_$i --data-urlencode "email=$D_EMAIL" --data-urlencode 'password=not dave password' $BASE/api/auth/login)
done
show $D/q3_1 "$S"
show $D/q3_6 "$S"
check "q3a a wrong password is refused with the plain code" "$(loc $D/q3_1)" "/login?e=bad"
check "q3b the sixth wrong password is refused the same way" "$(loc $D/q3_6)" "/login?e=bad"
S=$(post $D/cookies-throttle.txt $D/q3_end --data-urlencode "email=$D_EMAIL" --data-urlencode 'password=dave password here' $BASE/api/auth/login)
show $D/q3_end "$S"
check "q3c even the CORRECT password is refused while throttled" "$(loc $D/q3_end)" "/login?e=bad"
check "q3d the throttled answer is the same code as a wrong password" "$(loc $D/q3_end)" "$(loc $D/q3_1)"
check "q3e no session cookie is handed out while throttled" "$(grep -c 'rw_session' $D/cookies-throttle.txt)" 0
S=$(get $D/cookies-throttle.txt $D/q3_page "$BASE/login?e=bad")
check "q3f the page shows the one plain message" "$(n 'Email or password is incorrect.' $D/q3_page.body)" 1
check "q3g and never says which it was" "$(na '(too many|slow down|try again later|throttl|locked out|rate limit)' $D/q3_page.body)" 0

hdr "q4. the wait is a backoff, not a permanent lockout"
sleep 2
S=$(post $D/cookies-throttle.txt $D/q4 --data-urlencode "email=$D_EMAIL" --data-urlencode 'password=dave password here' $BASE/api/auth/login)
show $D/q4 "$S"
check "q4 after the wait the correct password works again" "$(loc $D/q4)" "/today"
check "q4 and a session is handed out" "$(grep -c 'rw_session' $D/cookies-throttle.txt)" 1

hdr "q5. sign-up is limited too (lighter: it guards bulk account creation)"
for i in 1 2 3 4 5 6; do
  S=$(post $D/cookies-mass.txt $D/q5_$i --data-urlencode "email=$MASS_EMAIL" --data-urlencode 'password=short' $BASE/api/auth/signup)
done
show $D/q5_1 "$S"
check "q5a a short password is refused with its own plain code" "$(loc $D/q5_1)" "/signup?e=password"
S=$(post $D/cookies-mass.txt $D/q5_end --data-urlencode "email=$MASS_EMAIL" --data-urlencode 'password=a perfectly fine password' $BASE/api/auth/signup)
show $D/q5_end "$S"
check "q5b the next attempt is slowed, even with a good password" "$(loc $D/q5_end)" "/signup?e=slow"
check "q5c and no account was created" "$(grep -c 'rw_session' $D/cookies-mass.txt)" 0
S=$(get $D/cookies-mass.txt $D/q5_page "$BASE/signup?e=slow")
check "q5d the sign-up message is plain and says nothing about accounts" "$(n 'Too many sign-up attempts just now.' $D/q5_page.body)" 1

echo; echo "=================== STEP r: the request-body cap (content-length is only a hint) ==================="
{
  printf 'date=%s&pain=2&note=' "$DATE"
  head -c 150000 /dev/zero | tr '\0' 'a'
} > $D/big.txt
echo "  oversized body: $(wc -c < $D/big.txt) bytes (cap is 100000)"
hdr "r1. POST /api/log with a 150 kB body and a content-length header"
S=$(post $D/cookies-a.txt $D/r1 --data-binary @$D/big.txt $BASE/api/log)
show $D/r1 "$S"
check "r1 refused cleanly, not a crash" "$(loc $D/r1)" "/log?e=problem"
check "r1 the response is a 303, not a 5xx" "$S" 303
hdr "r2. the same body sent chunked (no content-length at all)"
S=$(post $D/cookies-a.txt $D/r2 -H 'Transfer-Encoding: chunked' --data-binary @$D/big.txt $BASE/api/log)
show $D/r2 "$S"
check "r2 refused cleanly" "$(loc $D/r2)" "/log?e=problem"
check "r2 the response is a 303, not a 5xx" "$S" 303
hdr "r3. a small chunked post is still accepted (the cap is a size limit, not a ban)"
S=$(post $D/cookies-a.txt $D/r3 -H 'Transfer-Encoding: chunked' --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=37.2' $BASE/api/log)
show $D/r3 "$S"
check "r3 a small chunked post is accepted" "$(loc $D/r3)" "/log"
hdr "r4. the oversized posts changed nothing that was already saved"
S=$(get $D/cookies-a.txt $D/r4 $BASE/log)
check "r4 today's entry still holds the small post's value" "$(plainn $D/r4.body 'Pain 3 out of 10')" 1
check "r4 the oversized body's value was never stored" "$(plainn $D/r4.body 'Pain 2 out of 10')" 0

echo; echo "=================== STEP s: a tick may only name the patient's own day ==================="
# Item 6 of the review: /api/tick used to accept any well-formed date, so a crafted
# request could write ticks on arbitrary past or future days of the user's account.
hdr "s1. user C ticks item $ITEMC for $FUTURE3 (three days ahead)"
S=$(post $D/cookies-c.txt $D/s1 --data-urlencode "item=$ITEMC" --data-urlencode "date=$FUTURE3" --data-urlencode 'done=1' $BASE/api/tick)
show $D/s1 "$S"
check "s1 a tick three days ahead is refused" "$(loc $D/s1)" "/today?e=problem"
hdr "s2. user C ticks it for $PAST5 (five days back)"
S=$(post $D/cookies-c.txt $D/s2 --data-urlencode "item=$ITEMC" --data-urlencode "date=$PAST5" --data-urlencode 'done=1' $BASE/api/tick)
show $D/s2 "$S"
check "s2 a tick five days back is refused" "$(loc $D/s2)" "/today?e=problem"
hdr "s3. the neighbouring day ($YDAY) is still allowed — that is the time-zone window"
S=$(post $D/cookies-c.txt $D/s3 --data-urlencode "item=$ITEMC" --data-urlencode "date=$YDAY" --data-urlencode 'done=1' $BASE/api/tick)
show $D/s3 "$S"
check "s3 yesterday is accepted" "$(loc $D/s3)" "/today"
hdr "s4. today still works, and shows up on the checklist"
S=$(post $D/cookies-c.txt $D/s4 --data-urlencode "item=$ITEMC" --data-urlencode "date=$DATE" --data-urlencode 'done=1' $BASE/api/tick)
show $D/s4 "$S"
check "s4 today is accepted" "$(loc $D/s4)" "/today"
S=$(get $D/cookies-c.txt $D/s4b $BASE/today)
check "s4 the ticked item is marked done on today's checklist" "$(n 'aria-pressed="true"' $D/s4b.body)" 1

echo; echo "=================== STEP t: index setup is logged once, not retried, never fatal ==================="
(cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/db-count.ts) | tee $D/dbcount.txt
if [ "$SEEDED" = "1" ]; then
  check "t1 the index failure was reported exactly once for the whole run" "$(grep -c 'could not build indexes' $D/app.log)" 1
else
  echo "  (index failure check skipped: step 0 could not seed the throwaway database)"
fi
check "t2 the unique key that keeps one log per user per day was still built" "$(na '\{"userId":1,"date":1\} unique' $D/dbcount.txt)" 1
check "t3 no request in this run answered 5xx" "$(grep -lE '^HTTP/[0-9.]+ 5' $D/*.hdr 2>/dev/null | wc -l | tr -d ' ')" 0

echo; echo "=================== STEP u: page hardening and tap targets ==================="
hdr "u1. every page carries a strict Content-Security-Policy"
S=$(get $D/cookies-a.txt $D/u1 $BASE/today)
check "u1 the Today view carries the policy" "$(na '<meta http-equiv="Content-Security-Policy"' $D/u1.body)" 1
check "u1 it pins resources to this origin" "$(na 'default-src &#x27;self&#x27;' $D/u1.body)" 1
check "u1 it forbids plugins" "$(na 'object-src &#x27;none&#x27;' $D/u1.body)" 1
check "u1 it forbids a posted form going elsewhere" "$(na 'form-action &#x27;self&#x27;' $D/u1.body)" 1
check "u1 it does not allow unsafe-eval" "$(na 'unsafe-eval' $D/u1.body)" 0
check "u1 the stylesheet link is still there" "$(na 'rel="stylesheet"' $D/u1.body)" 1
ge "u1 the tick checklist is still rendered under it" "$(na 'action="/api/tick"' $D/u1.body)" 1
hdr "u2. the pain scale is five per row, so every cell clears 44 px on a 320 px phone"
S=$(get $D/cookies-a.txt $D/u2 $BASE/log)
check "u2 the pain scale is a five-column grid" "$(na 'grid grid-cols-5 gap-2' $D/u2.body)" 1
check "u2 no six-column grid is left" "$(na 'grid-cols-6' $D/u2.body)" 0
check "u2 all eleven scores are still offered" "$(na 'name="pain"' $D/u2.body)" 11
hdr "u3. the header wraps rather than overflowing at 320 px"
check "u3 the header row may wrap" "$(na 'flex max-w-2xl flex-wrap items-center justify-between' $D/u2.body)" 1
check "u3 the nav may wrap too" "$(na 'flex flex-wrap items-center justify-end gap-1' $D/u2.body)" 1
ge "u3 the nav still links to the three pages" "$(na 'href="/(today|log|plan)"' $D/u2.body)" 3

echo; echo "=================== STEP v: the recovery timeline ==================="
# User A's plan at this point (step o2): one medication (Paracetamol, 1 tablet,
# 08:00), one wound-care step (Change the dressing, once daily), one goal — so
# three checklist items per day — a pain limit of 4 out of 10, a temperature limit
# of 100.4 °F and the care-team phone 01234 567890. A's ticks are on the med's
# 08:00 item for today and yesterday (step d6).
GAP=$(date -u -d '-2 days' +%F)
hdr "v1. user A logs an over-limit day for yesterday ($YDAY): pain 9 against the saved limit of 4"
S=$(post $D/cookies-a.txt $D/v1a --data-urlencode "date=$YDAY" --data-urlencode 'pain=9' --data-urlencode 'temperature=37.1' \
  --data-urlencode 'wound_note=V wound note' --data-urlencode 'note=V general note' $BASE/api/log)
show $D/v1a "$S"
check "v1 the over-limit day saves" "$(loc $D/v1a)" "/log"
hdr "v2. GET /timeline as user A"
S=$(get $D/cookies-a.txt $D/v2 $BASE/timeline); show $D/v2 "$S"
check "v2 the timeline loads for the signed-in patient" "$S" 200
check "v2 A's own logged value is shown" "$(visn $D/v2.body 'Pain 9 out of 10')" 1
check "v2 A's own note is shown" "$(visn $D/v2.body 'V wound note')" 1
check "v2 the day a limit was crossed carries a plain marker" "$(visn $D/v2.body 'You logged a value at or above a limit you saved')" 1
check "v2 the marker names the reading and the limit the patient saved" "$(visn $D/v2.body 'Pain score 9 out of 10 — you saved 4 out of 10 as your limit.')" 1
check "v2 the checklist count is shown for a day" "$(visn $D/v2.body 'Checklist: 1 of 3 done')" 2
check "v2 a day with no entry still has a row" "$(dayrow $D/v2.body "$GAP" | grep -c 'Nothing logged')" 1
check "v2 and that gap row carries no logged value" "$(dayrow $D/v2.body "$GAP" | grep -c 'out of 10')" 0
check "v2 every day from the surgery date to today has a row"
  "$(grep -o 'data-day="' $D/v2.body | wc -l | tr -d ' ')" "$DAY_ROWS"
check "v2 the page links to the appointment summary" "$(n 'href="/summary"' $D/v2.body)" 1
check "v2 the page keeps no patient values in its address" "$(loc $D/v2)" ""
hdr "v3. user B's timeline: B's own days, and nothing of A's"
S=$(get $D/cookies-b.txt $D/v3 $BASE/timeline); show $D/v3 "$S"
check "v3 B's own logged note is shown to B" "$(visn $D/v3.body 'B wound note')" 1
check "v3 A's note never reaches B's timeline" "$(visn $D/v3.body 'V wound note')" 0
check "v3 A's marked day never reaches B's timeline" "$(visn $D/v3.body 'Pain score 9 out of 10')" 0
check "v3 A's pain score never reaches B's timeline" "$(visn $D/v3.body 'Pain 9 out of 10')" 0
check "v3 B's own marked day is absent (B saved no limits)" "$(visn $D/v3.body 'You logged a value at or above a limit you saved')" 0
hdr "v4. a signed-out visitor and a forged cookie get nothing"
rm -f $D/cookies-v.txt
S=$(get $D/cookies-v.txt $D/v4 $BASE/timeline); show $D/v4 "$S"
check "v4 /timeline sends a signed-out visitor to the log-in page" "$(loc $D/v4)" "/login"
check "v4 with no query string of its own" "$(loc $D/v4)" "/login"
check "v4 no patient value is carried in the redirect" "$(na 'V wound note|Pain 9' $D/v4.hdr)" 0

echo; echo "=================== STEP w: the follow-up appointment summary ==================="
hdr "w1. GET /summary as user A"
S=$(get $D/cookies-a.txt $D/w1 $BASE/summary); show $D/w1 "$S"
check "w1 the summary loads for the signed-in patient" "$S" 200
ge "w1 the surgery date is shown as entered" "$(visn $D/w1.body 'Sep 20, 2026')" 1
ge "w1 the procedure label is shown as entered" "$(visn $D/w1.body 'Knee replacement')" 1
ge "w1 the medication and dose are shown as entered" "$(visn $D/w1.body 'Paracetamol — 1 tablet')" 1
ge "w1 the wound-care step is shown as entered" "$(visn $D/w1.body 'Change the dressing')" 1
ge "w1 the pain limit the patient saved is shown" "$(visn $D/w1.body 'Pain score to call about:')" 1
ge "w1 the temperature limit and its unit are shown" "$(visn $D/w1.body '100.4 °F')" 1
ge "w1 the care-team phone number is shown" "$(visn $D/w1.body '01234 567890')" 1
ge "w1 the warning signs the patient saved are shown" "$(visn $D/w1.body 'If the wound starts to smell')" 1
check "w1 the days logged are counted" "$(visn $D/w1.body 'Days you logged: 2')" 1
check "w1 the pain-score range is given" "$(visre $D/w1.body 'Pain scores: 2 logged, from [0-9]+ to [0-9]+ out of 10\.')" 1
check "w1 the temperature readings are counted" "$(visn $D/w1.body 'Temperature readings: 2 logged')" 1
check "w1 the days a saved limit was met or passed are counted" "$(visn $D/w1.body 'Days a limit you saved was met or passed: 1')" 1
check "w1 and those days are named" "$(visn $D/w1.body "you were told to contact your care team.")" 1
check "w1 it says plainly that it is a record, not an assessment" "$(visn $D/w1.body 'It is not a clinical assessment, and it is not medical advice.')" 1
check "w1 the page keeps no patient values in its address" "$(loc $D/w1)" ""
hdr "w2. the summary carries no interpretation, prediction or advice wording"
check "w2 no diagnosis, prognosis or 'getting better/worse' wording" "$(na '(healing|on track|improv|getting better|getting worse|diagnos|prognos|suggests|may indicate|likely|possibly|you may|we recommend|you should|take more|take less|stop taking|increase your dose)' $D/w1.body)" 0
check "w2 no medication instruction of any kind" "$(na '(dosage advice|change your dose|double your)' $D/w1.body)" 0
hdr "w3. the printable sheet: one page, no app frame, no chart library"
CSS_PATH=$(grep -o 'href="/assets/[^"]*\.css"' $D/w1.body | head -1 | sed 's/href="//;s/"$//')
curl -s "$BASE$CSS_PATH" -o $D/app.css
check "w3 a print stylesheet ships with the page" "$(grep -c '@media print' $D/app.css)" 1
ge "w3 the app frame is hidden on paper" "$(visn $D/w1.body 'no-print')" 1
ge "w3 the print control is there for a phone as well" "$(visn $D/w1.body 'Print this page')" 1
check "w3 no chart or canvas markup on the printable sheet" "$(vis $D/w1.body | grep -c -E '<svg|<canvas')" 0
hdr "w4. the summary is reachable from the Today view, and only for the signed-in patient"
S=$(get $D/cookies-a.txt $D/w4 $BASE/today)
check "w4 the Today view links to the summary" "$(n 'href="/summary"' $D/w4.body)" 1
ge "w4 the Today view links to the timeline" "$(n 'href="/timeline"' $D/w4.body)" 2
S=$(get $D/cookies-fresh.txt $D/w4b $BASE/summary); show $D/w4b "$S"
check "w4 /summary sends a signed-out visitor to the log-in page" "$(loc $D/w4b)" "/login"
S=$(forgedget $D/w4c $BASE/summary deadbeefdeadbeefdeadbeefdeadbeef); show $D/w4c "$S"
check "w4 a forged cookie gets the log-in page too" "$(loc $D/w4c)" "/login"
hdr "w5. neither page puts a patient value in the server's output"
check "w5 no logged value, note, limit or phone number reaches the app log" "$(grep -c -a -E 'V wound note|V general note|B wound note|01234 567890|Pain score' $D/app.log)" 0
check "w5 no 5xx answered any request in this run" "$(grep -lE '^HTTP/[0-9.]+ 5' $D/*.hdr 2>/dev/null | wc -l | tr -d ' ')" 0

echo; echo "=================== summary ==================="
echo "  assertions: $PASSED passed, $FAILED failed"
if [ "$FAILED" != "0" ]; then
  echo "  FAILURES above — this run does NOT prove the fixes"
  exit 1
fi
echo "  every check passed"

echo; echo "=================== done ==================="
