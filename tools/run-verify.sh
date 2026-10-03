#!/bin/bash
# One command for a reproducible verification run: wipe the rig, run the harness
# against this working tree, capture the output, stop the rig.
#
#   bash tools/run-verify.sh              # build, wipe, run, capture, stop
#   SKIP_BUILD=1 bash tools/run-verify.sh # use the dist/ that is already there
#   KEEP_RIG=1 bash tools/run-verify.sh   # leave the rig (3100 + mongod) running
#   OUT=/tmp/run.txt bash tools/run-verify.sh
#
# Run it twice in a row: the second run has to pass with no manual cleanup, which
# is the check that catches a harness that only works on a pristine rig. Every
# account the harness creates carries a per-run suffix, and the rig is wiped
# before each run, so nothing carries over.
#
# Deliverable: the captured output goes to tools/verify-output.txt (OUT).
set -u
TOOLS=$(cd "$(dirname "$0")" && pwd)
SITE_ROOT=$(cd "$TOOLS/.." && pwd)
D=${D:-/tmp/rw-verify}
OUT=${OUT:-$TOOLS/verify-output.txt}
BUILD_LOG=/tmp/rw-build.log

# Preconditions first, each one named, so a failure says what to fix rather than
# which of forty assertions went strange.
if ! find "${MONGOD_BIN:-/tmp/mongo-bin}" -type f -name mongod -print -quit 2>/dev/null | grep -q .; then
  echo "missing precondition: no mongod under ${MONGOD_BIN:-/tmp/mongo-bin} — set MONGOD_BIN to a directory holding the mongod binary" >&2
  exit 1
fi
if [ ! -f "$SITE_ROOT/package.json" ]; then
  echo "missing precondition: no package.json in $SITE_ROOT" >&2
  exit 1
fi

# The 3100 instance serves dist/, so a run must build from the current source or
# it would test the previous build.
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "=================== build ==================="
  if ! (cd "$SITE_ROOT" && bun run build) >"$BUILD_LOG" 2>&1; then
    echo "the build failed, so nothing was verified — last lines of $BUILD_LOG:" >&2
    tail -n 20 "$BUILD_LOG" >&2
    exit 1
  fi
  tail -n 1 "$BUILD_LOG"
fi

echo "=================== reset the throwaway rig ==================="
if ! bash "$TOOLS/reset-verify.sh"; then
  echo "the rig could not be reset, so nothing was verified (see above)" >&2
  exit 1
fi

echo "=================== run the harness ==================="
bash "$TOOLS/verify.sh" 2>&1 | tee "$OUT"
STATUS=${PIPESTATUS[0]}

if [ "${KEEP_RIG:-0}" = "1" ]; then
  echo
  echo "rig left running: app on http://127.0.0.1:3100, throwaway mongod on 27018"
  echo "stop it with: bash tools/stop-verify.sh"
else
  bash "$TOOLS/stop-verify.sh" >/dev/null 2>&1
  echo "rig stopped (app on 3100 and the throwaway mongod); no processes left from this run"
fi

echo
echo "captured output: $OUT"
if [ "$STATUS" != "0" ]; then
  echo "RESULT: the harness FAILED — this run does not prove anything" >&2
  exit "$STATUS"
fi
echo "RESULT: harness passed"
exit 0
