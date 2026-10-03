#!/bin/bash
# Start the throwaway verification app on 127.0.0.1:3100 against the throwaway
# mongod. Port 3000 (the published site) is never touched.
#
#   D  scratch dir (default /tmp/rw-verify)
#   MONGO_PORT  throwaway mongod port (default 27018)
set -u
D=${D:-/tmp/rw-verify}
MONGO_PORT=${MONGO_PORT:-27018}
SITE_ROOT=$(cd "$(dirname "$0")/.." && pwd)

if [ ! -f "$SITE_ROOT/dist/server/server.js" ]; then
  echo "no dist/server/server.js — run 'bun run build' in $SITE_ROOT first" >&2
  exit 1
fi

cd "$SITE_ROOT" || exit 1
mkdir -p "$D"
export MONGODB_URI="mongodb://127.0.0.1:$MONGO_PORT/recoverwell_verify"
setsid nohup bun "$SITE_ROOT/tools/serve-verify.ts" </dev/null >"$D/app.log" 2>&1 &
echo "verify app pid $! on port 3100 (db recoverwell_verify)"
exit 0
