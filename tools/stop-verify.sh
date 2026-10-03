#!/bin/bash
# Stop the throwaway verification rig (app on 3100 + throwaway mongod) and delete
# the scratch dir. Port 3000 and /tmp/mongo-bin are deliberately left alone.
#
#   KEEP_SCRATCH=1  stop the processes but leave /tmp/rw-verify in place
set -u
D=${D:-/tmp/rw-verify}

pkill -f 'serve-verify.ts' 2>/dev/null
pkill -f 'serve-3100.ts' 2>/dev/null
pkill -f "mongod --dbpath $D" 2>/dev/null
sleep 2

if [ "${KEEP_SCRATCH:-0}" = "1" ]; then
  echo "verify rig stopped; scratch dir kept at $D"
else
  rm -rf "$D"
  echo "verify rig stopped; scratch dir $D removed"
fi

echo "still running (expect: nothing; the site on 3000 is not listed here):"
pgrep -fa 'serve-verify.ts|serve-3100.ts|mongod --dbpath' || echo "  (nothing)"
exit 0
