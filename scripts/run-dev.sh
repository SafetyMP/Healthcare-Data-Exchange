#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy"

echo "Starting Cloud Healthcare Exchange EU walking skeleton..."
docker compose up -d --build

echo "Waiting for gateway..."
for _ in $(seq 1 60); do
  if curl -fsS http://localhost:8081/health >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -fsS http://localhost:8081/health >/dev/null; then
  echo "gateway not healthy" >&2
  docker compose ps
  exit 1
fi

echo "Stack is up. Gateway: http://localhost:8081  HAPI: http://localhost:8080/fhir"
echo "Run ./scripts/demo.sh for end-to-end proof."
