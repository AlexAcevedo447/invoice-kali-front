#!/bin/sh
set -eu

# Puertos configurables via variables de entorno.
# Docker:  AUTH_PORT=18080  INVOICING_PORT=8080  FRONT_PORT=15173
# Local:   AUTH_PORT=8082   INVOICING_PORT=8083   FRONT_PORT=5173
FRONT_PORT="${FRONT_PORT:-15173}"
AUTH_PORT="${AUTH_PORT:-18080}"
INVOICING_PORT="${INVOICING_PORT:-8080}"

check() {
  NAME="$1"
  URL="$2"

  CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)"
  if [ "$CODE" = "200" ] || [ "$CODE" = "401" ]; then
    echo "[OK] $NAME -> $URL ($CODE)"
  else
    echo "[FAIL] $NAME -> $URL ($CODE)"
    exit 1
  fi
}

check "front"     "http://localhost:${FRONT_PORT}"
check "auth"      "http://localhost:${AUTH_PORT}/health"
check "invoicing" "http://localhost:${INVOICING_PORT}/api/v1/invoices?page=1&page_size=20"

echo "[OK] Healthcheck completado (front:${FRONT_PORT} auth:${AUTH_PORT} invoicing:${INVOICING_PORT})"
