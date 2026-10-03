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
# increment 2 (call-your-care-team limits, the daily log, the red-flag banner).
# See tools/README.md.
BASE=http://127.0.0.1:3100
VERIFY_URI=mongodb://127.0.0.1:27018/recoverwell_verify
D=/tmp/rw-verify
SITE_ROOT=$(cd "$(dirname "$0")/.." && pwd)
mkdir -p "$D"
rm -f $D/cookies-*.txt

# Fail fast: an app that isn't listening makes every step below return 000 and
# look like a pass. Better to stop here and say so.
if [ "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/")" != "200" ]; then
  echo "nothing is answering on $BASE — run 'bun run build', then 'bash tools/reset-verify.sh'" >&2
  exit 1
fi

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

echo "=================== environment ==================="
echo "app under test : http://127.0.0.1:3100 (throwaway second instance of dist/server)"
echo "database       : mongodb://127.0.0.1:27018/recoverwell_verify (throwaway local mongod 7.0.14)"
echo "live site      : http://127.0.0.1:3000 untouched -> $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)"
DATE=$(date -u +%F); echo "server UTC date: $DATE"

echo; echo "=================== STEP a: signup user A ==================="
hdr "a1. POST /api/auth/signup  (alice@example.com)"
S=$(post $D/cookies-a.txt $D/a1 --data-urlencode 'email=alice@example.com' --data-urlencode 'password=correct horse battery' $BASE/api/auth/signup)
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
S=$(post $D/cookies-a.txt $D/d6b --data-urlencode "item=$ITEM1" --data-urlencode 'date=2026-10-02' --data-urlencode 'done=1' $BASE/api/tick)
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
S=$(post $D/cookies-a.txt $D/e4 --data-urlencode 'email=alice@example.com' --data-urlencode 'password=correct horse battery' $BASE/api/auth/login)
show $D/e4 "$S"
hdr "e5. GET /today after logging back in"
S=$(get $D/cookies-a.txt $D/e5 $BASE/today)
echo "  status: $S   progress: $(line $D/e5.body 'done')   done rows: $(n 'aria-pressed="true"' $D/e5.body)"
echo "  plan survived: Paracetamol=$(n 'Paracetamol' $D/e5.body)  'Climb the stairs once'=$(n 'Climb the stairs once' $D/e5.body)"

echo; echo "=================== STEP f: failure cases ==================="
hdr "f1. signup with an email that is already registered"
S=$(post $D/cookies-f1.txt $D/f1 --data-urlencode 'email=alice@example.com' --data-urlencode 'password=another password here' $BASE/api/auth/signup)
show $D/f1 "$S"
echo "  session cookie set for the rejected attempt: $(grep -c 'rw_session' $D/cookies-f1.txt)"
hdr "f2. signup with the same email in different case (ALICE@Example.COM)"
S=$(post $D/cookies-f2.txt $D/f2 --data-urlencode 'email=ALICE@Example.COM' --data-urlencode 'password=another password here' $BASE/api/auth/signup)
show $D/f2 "$S"
hdr "f3. login with the wrong password"
S=$(post $D/cookies-anon.txt $D/f3 --data-urlencode 'email=alice@example.com' --data-urlencode 'password=wrong password here' $BASE/api/auth/login)
show $D/f3 "$S"
echo "  session cookie set: $(grep -c 'rw_session' $D/cookies-anon.txt)"
hdr "f4. login for an email that has no account"
S=$(post $D/cookies-anon.txt $D/f4 --data-urlencode 'email=nobody@example.com' --data-urlencode 'password=whatever password' $BASE/api/auth/login)
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
S=$(post $D/cookies-f9.txt $D/f9 --data-urlencode 'email=shortpw@example.com' --data-urlencode 'password=abc' $BASE/api/auth/signup)
show $D/f9 "$S"
hdr "f10. POST /api/auth/signup with a non-email"
S=$(post $D/cookies-f10.txt $D/f10 --data-urlencode 'email=not an email' --data-urlencode 'password=long enough password' $BASE/api/auth/signup)
show $D/f10 "$S"
hdr "f11. user A POSTs /api/plan with no items at all"
S=$(post $D/cookies-a.txt $D/f11 --data-urlencode 'surgery_date=2026-09-20' --data-urlencode 'procedure_label=Knee replacement' --data-urlencode 'med_count=0' --data-urlencode 'wound_count=0' --data-urlencode 'goal_count=0' $BASE/api/plan)
show $D/f11 "$S"

echo; echo "=================== STEP g: isolation between two accounts ==================="
hdr "g1. signup user B (bob@example.com)"
S=$(post $D/cookies-b.txt $D/g1 --data-urlencode 'email=bob@example.com' --data-urlencode 'password=a totally different pw' $BASE/api/auth/signup)
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
SHORT=$(date -u +'%b %-d, %Y')                       # the date line the log page prints
YDAY=$(date -u -d 'yesterday' +%F)

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
echo "  pain read back      : $(line $D/i3.body 'Pain 2 out of 10')"
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
echo "  new values shown  : $(line $D/k2.body 'Pain 3 out of 10')  /  $(line $D/k2.body '37.4')"
echo "  old values gone   : 'Pain 7 out of 10'=$(n 'Pain 7 out of 10' $D/k2.body)  old wound text=$(n 'Redness along the top of the scar' $D/k2.body) (expect 0 / 0)"
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
echo "  B's own values read back: $(line $D/l2b.body 'Pain 10 out of 10')  /  $(line $D/l2b.body '39.5')"
echo "  banner on B's log page (expect 0): $(n 'Contact your care team' $D/l2b.body)"
S=$(get $D/cookies-b.txt $D/l2c $BASE/today)
echo "  banner on B's today    (expect 0): $(n 'Contact your care team' $D/l2c.body)"
hdr "l3. user B's log did not disturb user A's day"
S=$(get $D/cookies-a.txt $D/l3 $BASE/log)
echo "  A's entry still A's: $(line $D/l3.body 'Pain 3 out of 10')   B's note in A's page (expect 0): $(n 'B wound note' $D/l3.body)"
hdr "l4. POST /api/log with no cookie / with a forged cookie"
rm -f $D/cookies-fresh.txt
S=$(post $D/cookies-fresh.txt $D/l4 --data-urlencode "date=$DATE" --data-urlencode 'pain=5' $BASE/api/log); show $D/l4 "$S"
S=$(forgedpost $D/l4b $BASE/api/log "date=$DATE&pain=5"); show $D/l4b "$S"
hdr "l5. POST /api/log with values that are not numbers"
S=$(post $D/cookies-a.txt $D/l5 --data-urlencode "date=$DATE" --data-urlencode 'pain=eleven' $BASE/api/log); show $D/l5 "$S"
S=$(post $D/cookies-a.txt $D/l5b --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=abc' $BASE/api/log); show $D/l5b "$S"
S=$(get $D/cookies-a.txt $D/l5c $BASE/log)
echo "  A's saved values after the refused posts (expect the pain 3 entry): $(line $D/l5c.body 'Pain 3 out of 10')"

echo; echo "=================== STEP m: the flag stays until the next log ==================="
hdr "m1. user A logs a high value on a different date ($YDAY)"
S=$(post $D/cookies-a.txt $D/m1 --data-urlencode "date=$YDAY" --data-urlencode 'pain=8' --data-urlencode 'temperature=38.2' $BASE/api/log)
show $D/m1 "$S"
hdr "m2. GET /today: today's checklist carries the flag from that log"
S=$(get $D/cookies-a.txt $D/m2 $BASE/today)
echo "  status: $S   banner (expect 1): $(n 'Contact your care team' $D/m2.body)   pain named: $(n 'Pain score 8 out of 10' $D/m2.body)"
hdr "m3. GET /log: the flag is in front of the patient there too, and today's entry is prefilled"
S=$(get $D/cookies-a.txt $D/m3 $BASE/log)
echo "  status: $S   banner (expect 1): $(n 'Contact your care team' $D/m3.body)"
echo "  today's pain still selected: $(grep -o 'name="pain" value="3" checked' $D/m3.body | head -1)"
echo "  today's temperature still prefilled: $(grep -o 'name="temperature"[^>]*value="[^"]*"' $D/m3.body | head -1)"
echo "  the older entry is still listed (both dates, expect 2 days): $(n "$SHORT" $D/m3.body)"
hdr "m4. user A logs today again below both limits: the flag clears"
S=$(post $D/cookies-a.txt $D/m4 --data-urlencode "date=$DATE" --data-urlencode 'pain=3' --data-urlencode 'temperature=37.6' \
  --data-urlencode 'wound_note=Redness has settled a little' --data-urlencode 'note=Quieter evening' $BASE/api/log)
show $D/m4 "$S"
S=$(get $D/cookies-a.txt $D/m4b $BASE/today)
echo "  banner on /today (expect 0): $(n 'Contact your care team' $D/m4b.body)"
S=$(get $D/cookies-a.txt $D/m4c $BASE/log)
echo "  banner on /log   (expect 0): $(n 'Contact your care team' $D/m4c.body)"

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

echo; echo "=================== done ==================="
