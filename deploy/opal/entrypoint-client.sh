#!/bin/sh
# Obtain OPAL client JWT when secure mode is enabled, then start embedded OPA.
set -eu

cd /opal

./wait-for.sh opal-server:7002 --timeout=60 -- true

if [ -n "${OPAL_AUTH_MASTER_TOKEN:-}" ]; then
  export OPAL_CLIENT_TOKEN="$(
    opal-client obtain-token "$OPAL_AUTH_MASTER_TOKEN" \
      --server-url "${OPAL_SERVER_URL:-http://opal-server:7002}" \
      --just-the-token
  )"
  if [ -z "${OPAL_CLIENT_TOKEN:-}" ]; then
    echo "entrypoint-client: failed to obtain OPAL client token" >&2
    exit 1
  fi
fi

exec ./start.sh
