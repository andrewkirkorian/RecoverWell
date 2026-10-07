#!/bin/bash
# Provision the throwaway mongod the verification rig needs.
#
# Idempotent: if a working mongod is already under MONGOD_BIN this exits 0 and
# does nothing. Otherwise it downloads the MongoDB Community tarball and extracts
# it there, so MONGOD_BIN ends up holding a mongod that the rig scripts can find
# with `find "$MONGOD_BIN" -type f -name mongod`.
#
#   bash tools/provision-mongod.sh
#   MONGOD_BIN=/opt/mongo bash tools/provision-mongod.sh     # somewhere else
#
# This is scaffolding, never part of the product, and it never touches the site
# on port 3000.
#
# Why it exists: MONGOD_BIN defaults to /tmp, and /tmp does not survive a machine
# swap. After a swap the rig has no mongod and tools/run-verify.sh stops on its
# precondition — re-run this script and carry on.
#
# Every failure names the reason and exits non-zero. The download and extraction
# happen in a staging directory beside MONGOD_BIN and only move into place after a
# `mongod --version` health check, so a failed provision never leaves a
# half-provisioned MONGOD_BIN that the rig would mistake for a ready one.
set -u

MONGOD_BIN=${MONGOD_BIN:-/tmp/mongo-bin}
MONGOD_VERSION=${MONGOD_VERSION:-7.0.14}
MONGOD_DISTRO=${MONGOD_DISTRO:-ubuntu2204}
MONGOD_ARCH=${MONGOD_ARCH:-x86_64}
TARBALL=mongodb-linux-$MONGOD_ARCH-$MONGOD_DISTRO-$MONGOD_VERSION
URL=${MONGOD_URL:-https://fastdl.mongodb.org/linux/$TARBALL.tgz}

fail() { echo "provision-mongod: $*" >&2; exit 1; }

# Already there and actually runs? Nothing to do.
FOUND=$(find "$MONGOD_BIN" -type f -name mongod -print -quit 2>/dev/null || true)
if [ -n "$FOUND" ]; then
  if [ -x "$FOUND" ] && "$FOUND" --version >/dev/null 2>&1; then
    echo "mongod already provisioned under $MONGOD_BIN — nothing to do"
    echo "  $FOUND"
    echo "  $("$FOUND" --version | head -1)"
    exit 0
  fi
  echo "provision-mongod: $FOUND exists but does not run — re-provisioning it" >&2
fi

command -v curl >/dev/null 2>&1 || fail "no curl on this machine, so the tarball cannot be downloaded"
command -v tar >/dev/null 2>&1 || fail "no tar on this machine, so the tarball cannot be unpacked"

PARENT=$(dirname "$MONGOD_BIN")
mkdir -p "$PARENT" || fail "cannot create $PARENT"
[ -w "$PARENT" ] || fail "$PARENT is not writable, so MONGOD_BIN cannot be installed there"

# ~100 MB compressed, ~350 MB unpacked; refuse rather than fail halfway through.
FREE_KB=$(df -Pk "$PARENT" | awk 'NR==2 {print $4}')
if [ -z "$FREE_KB" ] || [ "$FREE_KB" -lt 800000 ]; then
  fail "only ${FREE_KB:-0} KB free on $PARENT — need about 800000 KB for the download plus the unpacked tarball"
fi

STAGE=$(mktemp -d "$PARENT/.mongo-provision.XXXXXX") || fail "cannot create a staging directory in $PARENT"
trap 'rm -rf "$STAGE"' EXIT

echo "downloading MongoDB $MONGOD_VERSION ($MONGOD_DISTRO-$MONGOD_ARCH)"
echo "  $URL"
if ! curl -fL --retry 3 --retry-delay 2 -o "$STAGE/$TARBALL.tgz" "$URL"; then
  fail "the download failed — $URL is not fetchable. Check the version, or set MONGOD_URL to another 7.0.x linux-$MONGOD_ARCH-$MONGOD_DISTRO tarball."
fi

mkdir -p "$STAGE/unpacked" || fail "cannot create $STAGE/unpacked"
if ! tar -xzf "$STAGE/$TARBALL.tgz" -C "$STAGE/unpacked"; then
  fail "the tarball downloaded from $URL could not be unpacked — it is probably truncated; delete $STAGE and retry"
fi

STAGED_BIN="$STAGE/unpacked/$TARBALL/bin/mongod"
[ -f "$STAGED_BIN" ] || fail "the tarball from $URL did not contain $TARBALL/bin/mongod"
chmod +x "$STAGED_BIN" || fail "cannot make $STAGED_BIN executable"
if ! "$STAGED_BIN" --version >/dev/null 2>&1; then
  fail "the extracted mongod does not run on this machine (missing shared library?), so it will not be installed"
fi

# Health check passed, so swap it in. The old directory is replaced, not merged:
# a leftover partial tree is exactly what "looks ready but is not" means.
rm -rf "$MONGOD_BIN" || fail "cannot clear the old $MONGOD_BIN out of the way"
mv "$STAGE/unpacked/$TARBALL" "$MONGOD_BIN" || fail "cannot move the extracted tarball into $MONGOD_BIN"

INSTALLED=$(find "$MONGOD_BIN" -type f -name mongod -print -quit 2>/dev/null || true)
if [ -z "$INSTALLED" ] || ! "$INSTALLED" --version >/dev/null 2>&1; then
  fail "$MONGOD_BIN does not hold a working mongod after the swap — do not trust it"
fi

echo "provisioned: $INSTALLED"
echo "  $("$INSTALLED" --version | head -1)"
exit 0
