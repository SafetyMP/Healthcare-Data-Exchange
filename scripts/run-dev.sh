#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy"

mkdir -p "$ROOT/data/keys"
rm -f "$ROOT"/data/keys/*.shredded

echo "Starting Cloud Healthcare Exchange EU + US cells (with OPAL consent sync)..."
docker compose up -d --build

wait_for() {
  local name="$1" url="$2" tries="${3:-90}"
  echo "Waiting for $name ..."
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  echo "$name not healthy at $url" >&2
  docker compose ps
  return 1
}

wait_for "gateway" "http://localhost:8081/health"
wait_for "consent-service" "http://localhost:8084/health"
# OPAL client runs the OPA PDP on 8181; policy is pulled from the git policy repo.
wait_for "OPA (via opal-client)" "http://localhost:8181/health"
wait_for "EU HAPI" "http://localhost:8080/fhir/metadata"
wait_for "US HAPI" "http://localhost:8083/fhir/metadata" || echo "(US demo steps may fail)"

echo "Stack is up."
echo "  Gateway:         http://localhost:8081"
echo "  Consent service: http://localhost:8084"
echo "  OPA (opal):      http://localhost:8181"
echo "  OPAL server:     http://localhost:7002"
echo "  EU HAPI:         http://localhost:8080/fhir"
echo "  US HAPI:         http://localhost:8083/fhir"
echo "Run ./scripts/demo.sh for end-to-end proof."
