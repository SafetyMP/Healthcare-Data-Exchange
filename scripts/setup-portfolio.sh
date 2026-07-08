#!/usr/bin/env bash
# Clone sibling repos declared in specs/portfolio.yaml (multi-repo harness support).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORTFOLIO="$ROOT/specs/portfolio.yaml"

if [[ ! -f "$PORTFOLIO" ]]; then
  echo "setup-portfolio: no specs/portfolio.yaml" >&2
  exit 1
fi

python3 - <<'PY'
import subprocess
import sys
from pathlib import Path

import yaml

root = Path(".").resolve()
doc = yaml.safe_load((root / "specs/portfolio.yaml").read_text())
repos = doc.get("repos") or {}
canonical = repos.get("canonical") or {}

for name, meta in repos.items():
    if name == "canonical" or not isinstance(meta, dict):
        continue
    url = meta.get("url")
    local = meta.get("local_path")
    if not url or not local:
        continue
    target = (root / local).resolve()
    if target.exists():
        print(f"skip (exists): {target}")
        continue
    target.parent.mkdir(parents=True, exist_ok=True)
    print(f"cloning {url} -> {target}")
    subprocess.run(["git", "clone", url, str(target)], check=True)

print("setup-portfolio: ok")
PY
