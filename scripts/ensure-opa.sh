#!/usr/bin/env bash
# Download OPA CLI to .tools/bin if missing (hermetic verify helper).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN_DIR="$ROOT/.tools/bin"
OPA="$BIN_DIR/opa"
VERSION="0.70.0"

if [[ -x "$OPA" ]]; then
  "$OPA" version 2>/dev/null | head -1
  exit 0
fi

mkdir -p "$BIN_DIR"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "unsupported arch: $ARCH" >&2; exit 1 ;;
esac

URL="https://github.com/open-policy-agent/opa/releases/download/v${VERSION}/opa_${OS}_${ARCH}_static"
echo "downloading opa ${VERSION} for ${OS}/${ARCH}..."
curl -fsSL "$URL" -o "$OPA"
chmod +x "$OPA"
"$OPA" version | head -1
