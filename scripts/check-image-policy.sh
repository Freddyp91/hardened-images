#!/usr/bin/env bash
# Enforces the rules every image in this repo must follow. Usage: check-image-policy.sh images/<name>
set -euo pipefail
dir="${1%/}"
name=$(basename "$dir")
fail() { echo "::error file=$dir::$name: $1"; exit 1; }

for f in image.json melange.yaml apko.yaml smoke-test.sh; do
  [ -f "$dir/$f" ] || fail "missing $f"
done
[ -x "$dir/smoke-test.sh" ] || fail "smoke-test.sh must be executable"

# Built from source: the package must check out upstream source at a pinned commit,
# and must not download prebuilt release artifacts.
grep -q 'uses: git-checkout' "$dir/melange.yaml" || fail "melange.yaml must build from source (uses: git-checkout)"
grep -q 'expected-commit:' "$dir/melange.yaml" || fail "git-checkout must pin expected-commit"
if grep -qE 'uses: fetch' "$dir/melange.yaml"; then
  fail "melange.yaml must not fetch prebuilt release artifacts; build from source"
fi

# Tested: melange package tests are required.
grep -q '^test:' "$dir/melange.yaml" || fail "melange.yaml needs a test: section"
echo "$name: policy OK"
