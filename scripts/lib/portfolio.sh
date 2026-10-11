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
    | LC_ALL=C sort -z \
    | xargs -0 cat 2>/dev/null \
    | shasum -a 256 \
    | awk '{print $1}'
}

# Hash the same bytes as portfolio_rego_bundle_hash: top-level policy/*.rego
# only, excluding *_test.rego, LC_ALL=C path order, raw blob bytes. Nested
# paths are not included. No git-show metadata.
portfolio_commit_rego_bundle_hash() {
  local root="$1"
  local commit="$2"
  local tmp names name
  tmp="$(mktemp)"
  if ! git -C "$root" cat-file -e "${commit}:policy" 2>/dev/null; then
    rm -f "$tmp"
    echo "portfolio: no policy tree at ${commit}" >&2
    return 1
  fi
  # ls-tree of the policy tree is not recursive, so nested files stay out.
  names="$(git -C "$root" ls-tree --name-only "${commit}:policy" \
    | grep -E '[.]rego$' \
    | grep -v '_test[.]rego$' \
    | LC_ALL=C sort || true)"
  if [[ -z "$names" ]]; then
    rm -f "$tmp"
    echo "portfolio: no top-level policy rego at ${commit}" >&2
    return 1
  fi
  while IFS= read -r name; do
    [[ -n "$name" ]] || continue
    case "$name" in
      */*)
        rm -f "$tmp"
        echo "portfolio: nested policy path at ${commit}: ${name}" >&2
        return 1
        ;;
    esac
    git -C "$root" cat-file blob "${commit}:policy/${name}" >> "$tmp"
  done <<< "$names"
  shasum -a 256 "$tmp" | awk '{print $1}'
  rm -f "$tmp"
}

portfolio_field() {
  local file="$1" key="$2"
  grep -E "^${key}:" "$file" | head -1 | sed "s/^${key}:[[:space:]]*//"
}
