#!/usr/bin/env bash
# Shared portfolio helpers (source from other scripts).
set -euo pipefail

portfolio_read_pointer() {
  local file="$1"
  [[ -f "$file" ]] || return 1
  grep -E '^[a-z_]+:' "$file" | while IFS=': ' read -r key value; do
    printf '%s=%s\n' "$key" "${value# }"
  done
}

portfolio_rego_bundle_hash() {
  local dir="$1"
  find "$dir" -maxdepth 1 -name '*.rego' ! -name '*_test.rego' -print0 \
    | sort -z \
    | xargs -0 cat 2>/dev/null \
    | shasum -a 256 \
    | awk '{print $1}'
}

portfolio_field() {
  local file="$1" key="$2"
  grep -E "^${key}:" "$file" | head -1 | sed "s/^${key}:[[:space:]]*//"
}
