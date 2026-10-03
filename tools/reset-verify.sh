#!/bin/bash
# Wipe the throwaway database and restart the throwaway mongod + app on 3100, so
# a verification run starts from a known-empty state.
#
# Stop everything instead with tools/stop-verify.sh.
set -u
D=${D:-/tmp/rw-verify}
TOOLS=$(cd "$(dirname "$0")" && pwd)

# Anything that could be holding port 3100 or the throwaway dbpath, including a
# stale instance left behind by an earlier session.
pkill -f 'serve-verify.ts' 2>/dev/null
pkill -f 'serve-3100.ts' 2>/dev/null
pkill -f "mongod --dbpath $D" 2>/dev/null
sleep 3
bash "$TOOLS/start-mongo.sh" >/dev/null || exit 1
sleep 6
bash "$TOOLS/start-verify-app.sh" >/dev/null || exit 1
sleep 5

if curl -sf -o /dev/null http://127.0.0.1:3100/; then
  echo "verify rig reset: mongod (throwaway) + app on http://127.0.0.1:3100"
  exit 0
fi
echo "verify app did not come up — see $D/app.log and $D/mongod.log" >&2
exit 1
