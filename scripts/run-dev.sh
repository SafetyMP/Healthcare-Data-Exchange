#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy"

mkdir -p "$ROOT/data/keys"
rm -f "$ROOT"/data/keys/*.shredded

echo "Starting Cloud Healthcare Exchange EU + US cells..."
docker compose up -d --build

# OPA caches compiled policy at process start; restart after volume-mounted Rego changes.
docker compose restart opa

echo "Waiting for gateway..."
for _ in $(seq 1 90); do
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

echo "Waiting for EU HAPI (8080)..."
for _ in $(seq 1 90); do
  if curl -fsS http://localhost:8080/fhir/metadata >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

echo "Waiting for US HAPI (8083)..."
for _ in $(seq 1 90); do
  if curl -fsS http://localhost:8083/fhir/metadata >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if ! curl -fsS http://localhost:8083/fhir/metadata >/dev/null; then
  echo "US HAPI not healthy (demo may fail US steps)" >&2
  docker compose ps
fi

echo "Stack is up."
echo "  Gateway: http://localhost:8081"
echo "  EU HAPI: http://localhost:8080/fhir"
echo "  US HAPI: http://localhost:8083/fhir"
echo "Run ./scripts/demo.sh for end-to-end proof."
