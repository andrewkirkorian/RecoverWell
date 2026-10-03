#!/bin/bash
# Wipe the throwaway database and restart the throwaway mongod + app on 3100, so
# a verification run starts from a known-empty state.
#
# Every step is checked and every wait is a poll with a deadline: reset either
# leaves the rig ready or says exactly which piece did not come up. A fixed
# `sleep` that runs out quietly is how a harness ends up testing a dead instance.
#
# Stop everything instead with tools/stop-verify.sh.
set -u
D=${D:-/tmp/rw-verify}
MONGO_PORT=${MONGO_PORT:-27018}
VERIFY_URI=mongodb://127.0.0.1:$MONGO_PORT/recoverwell_verify
SITE_ROOT=$(cd "$(dirname "$0")/.." && pwd)
TOOLS="$SITE_ROOT/tools"

if ! find "${MONGOD_BIN:-/tmp/mongo-bin}" -type f -name mongod -print -quit 2>/dev/null | grep -q .; then
  echo "missing precondition: no mongod under ${MONGOD_BIN:-/tmp/mongo-bin} — set MONGOD_BIN" >&2
  exit 1
fi
if [ ! -f "$SITE_ROOT/dist/server/server.js" ]; then
  echo "missing precondition: no $SITE_ROOT/dist/server/server.js — run 'bun run build' first" >&2
  exit 1
fi

# Anything that could be holding port 3100 or the throwaway dbpath, including a
# stale instance left behind by an earlier session.
pkill -f 'serve-verify.ts' 2>/dev/null
pkill -f 'serve-3100.ts' 2>/dev/null
pkill -f "mongod --dbpath $D" 2>/dev/null
sleep 2

bash "$TOOLS/start-mongo.sh" >/dev/null || exit 1

# The database is empty at this point, so rig-check.ts doubles as the readiness
# probe: it exits non-zero until mongod accepts connections.
MONGO_READY=0
for _ in $(seq 1 40); do
  if (cd "$SITE_ROOT" && MONGODB_URI="$VERIFY_URI" bun tools/rig-check.ts >/dev/null 2>&1); then
    MONGO_READY=1
    break
  fi
  sleep 0.5
done
if [ "$MONGO_READY" != "1" ]; then
  echo "the throwaway mongod did not answer on 127.0.0.1:$MONGO_PORT — last lines of $D/mongod.log:" >&2
  tail -n 5 "$D/mongod.log" >&2
  exit 1
fi

bash "$TOOLS/start-verify-app.sh" >/dev/null || exit 1

APP_READY=0
for _ in $(seq 1 60); do
  if curl -sf -o /dev/null http://127.0.0.1:3100/; then
    APP_READY=1
    break
  fi
  sleep 0.5
done
if [ "$APP_READY" != "1" ]; then
  echo "the verify app did not come up on http://127.0.0.1:3100 — last lines of $D/app.log:" >&2
  tail -n 5 "$D/app.log" >&2
  exit 1
fi

echo "verify rig reset: mongod (throwaway) + app on http://127.0.0.1:3100, database wiped"
exit 0
