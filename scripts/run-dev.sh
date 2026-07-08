#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy"

DOWN_FIRST=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --down-first)
      DOWN_FIRST=1
      shift
      ;;
    *)
      echo "usage: $0 [--down-first]" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$ROOT/data/keys"
rm -f "$ROOT"/data/keys/*.shredded

if [[ ! -f "$ROOT/deploy/opal/dev-secrets.env" ]]; then
  echo "Generating OPAL dev secrets (first run)..."
  "$ROOT/scripts/generate-opal-dev-secrets.sh"
fi
chmod +x "$ROOT/deploy/opal/entrypoint-client.sh"

if [[ "$DOWN_FIRST" -eq 1 ]]; then
  echo "Recycling stack (--down-first)..."
  docker compose down --remove-orphans
fi

ARCH="$("$ROOT/scripts/lib/docker-platform.sh")"
echo "Starting Cloud Healthcare Exchange EU + US cells (OPAL consent sync; arch=$ARCH)..."
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
wait_for "identity-broker" "http://localhost:8085/health"
wait_for "OPA (via opal-client)" "http://localhost:8181/health"
wait_for "EU HAPI" "http://localhost:8080/fhir/metadata"
wait_for "US HAPI" "http://localhost:8083/fhir/metadata" || echo "(US demo steps may fail)"

echo "Stack is up."
echo "  Gateway:         http://localhost:8081"
echo "  Consent service: http://localhost:8084"
echo "  Identity broker: http://localhost:8085"
echo "  OPA (opal):      http://localhost:8181"
echo "  OPAL server:     http://localhost:7002"
echo "  EU HAPI:         http://localhost:8080/fhir"
echo "  US HAPI:         http://localhost:8083/fhir"
echo "Run ./scripts/demo.sh for end-to-end proof."
echo "Stop with: ./scripts/teardown-dev.sh"
