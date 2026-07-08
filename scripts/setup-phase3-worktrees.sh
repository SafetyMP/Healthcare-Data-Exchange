#!/usr/bin/env bash
# Create git worktrees for phase 3 parallel tracks (see specs/MANDATE.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(dirname "$ROOT")"
NAME="$(basename "$ROOT")"

if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "not a git repository: $ROOT" >&2
  exit 1
fi

create_wt() {
  local track="$1"
  local branch="$2"
  local dir="${PARENT}/${NAME}-${track}"
  if [[ -d "$dir" ]]; then
    echo "skip (exists): $dir"
    return 0
  fi
  git -C "$ROOT" worktree add "$dir" -b "$branch"
  echo "created: $dir -> $branch"
}

create_wt us-cell agent/us-cell
create_wt gateway-policy agent/gateway-policy
create_wt policy agent/policy

echo ""
echo "Worktrees ready. Parent stays on: $ROOT (main)"
echo "Open each path in a separate agent session."
