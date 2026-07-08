#!/usr/bin/env bash
# Validate specs/portfolio.yaml and policy-mirror sync state (canonical repo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORTFOLIO="$ROOT/specs/portfolio.yaml"
if [[ ! -f "$PORTFOLIO" ]]; then
  echo "check-portfolio: skip (no specs/portfolio.yaml)" >&2
  exit 0
fi

echo "== portfolio: contract =="
python3 - <<'PY'
import sys
from pathlib import Path
import yaml

root = Path(".")
doc = yaml.safe_load((root / "specs/portfolio.yaml").read_text())
if doc.get("schema") != "portfolio/v1":
    sys.exit("BAD: schema must be portfolio/v1")
repos = doc.get("repos") or {}
if "canonical" not in repos:
    sys.exit("BAD: repos.canonical required")
canon = repos["canonical"]
if not canon.get("agent_root"):
    sys.exit("BAD: canonical must set agent_root: true")
mirrors = [k for k, v in repos.items() if v.get("role") == "policy-mirror"]
if mirrors:
    sync = canon.get("sync_script")
    for m in mirrors:
        if not repos[m].get("url"):
            sys.exit(f"BAD: repos.{m}.url required")
    if sync and not (root / sync.removeprefix("./")).is_file():
        sys.exit(f"BAD: sync_script missing: {sync}")
print("portfolio contract: ok")
PY

if [[ -x "$ROOT/scripts/check-policy-sync.sh" ]]; then
  echo "== portfolio: policy sync drift =="
  "$ROOT/scripts/check-policy-sync.sh"
fi

echo "check-portfolio: ok"
