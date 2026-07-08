#!/usr/bin/env bash
# Stop the local docker-compose dev stack (EU + US + OPAL).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy"

VOLUMES=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --volumes|-v)
      VOLUMES=1
      shift
      ;;
    *)
      echo "usage: $0 [--volumes]" >&2
      exit 1
      ;;
  esac
done

echo "Stopping Cloud Healthcare Exchange dev stack..."
if [[ "$VOLUMES" -eq 1 ]]; then
  docker compose down --remove-orphans -v
  echo "Stack stopped; named volumes removed."
else
  docker compose down --remove-orphans
  echo "Stack stopped (volumes retained). Use --volumes to delete HAPI/Postgres data."
fi
