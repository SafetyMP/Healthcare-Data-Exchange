#!/usr/bin/env bash
# Emit compose platform hints for OPAL images (native arm64 on Apple Silicon).
set -euo pipefail

arch="$(uname -m)"
case "$arch" in
  arm64|aarch64)
    echo "arm64"
    ;;
  x86_64|amd64)
    echo "amd64"
    ;;
  *)
    echo "amd64"
    ;;
esac
