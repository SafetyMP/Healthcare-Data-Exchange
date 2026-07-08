#!/usr/bin/env bash
# Remove phase 3 git worktrees and merged agent branches (see specs/MANDATE.md).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARENT="$(dirname "$ROOT")"
NAME="$(basename "$ROOT")"

remove_wt() {
  local track="$1"
  local branch="$2"
  local dir="${PARENT}/${NAME}-${track}"

  if [[ -d "$dir" ]]; then
    git -C "$ROOT" worktree remove "$dir" --force
    echo "removed worktree: $dir"
  else
    echo "skip (missing worktree): $dir"
  fi

  if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$branch"; then
    git -C "$ROOT" branch -d "$branch"
    echo "deleted branch: $branch"
  else
    echo "skip (no branch): $branch"
  fi
}

remove_wt us-cell agent/us-cell
remove_wt gateway-policy agent/gateway-policy
remove_wt policy agent/policy

echo ""
echo "Phase 3 worktrees torn down. Parent: $ROOT (main)"
