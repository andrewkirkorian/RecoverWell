#!/bin/bash
# Throwaway local mongod for verification. Never part of the product, and never
# pointed at by the site on port 3000.
#
#   MONGOD_BIN  directory holding the mongod binary (default /tmp/mongo-bin; the
#               extracted tarball lives there so we never re-download it)
#   D           scratch dir for the dbpath and logs (default /tmp/rw-verify)
set -u
MONGOD_BIN=${MONGOD_BIN:-/tmp/mongo-bin}
D=${D:-/tmp/rw-verify}
# Namespaced on purpose: the environment already exports PORT (the site's own),
# so a bare ${PORT:-27018} would put the throwaway mongod on the site's port.
MONGO_PORT=${MONGO_PORT:-27018}

MONGOD=$(find "$MONGOD_BIN" -type f -name mongod 2>/dev/null | head -1)
if [ -z "$MONGOD" ]; then
  echo "no mongod under $MONGOD_BIN — set MONGOD_BIN" >&2
  exit 1
fi

rm -rf "$D/data"
mkdir -p "$D/data"
setsid nohup "$MONGOD" \
  --dbpath "$D/data" \
  --port "$MONGO_PORT" \
  --bind_ip 127.0.0.1 \
  --wiredTigerCacheSizeGB 0.25 \
  --quiet </dev/null >"$D/mongod.log" 2>&1 &
echo "mongod pid $! on port $MONGO_PORT (dbpath $D/data)"
exit 0
