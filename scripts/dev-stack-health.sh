#!/bin/sh
set -eu

# Puertos configurables via variables de entorno.
# Docker (npm run stack:up):       AUTH_PORT=18080  INVOICING_PORT=8080  FRONT_PORT=15173 (por defecto)
# Front local (npm run dev):       FRONT_PORT=5173
FRONT_PORT="${FRONT_PORT:-15173}"
AUTH_PORT="${AUTH_PORT:-18080}"
INVOICING_PORT="${INVOICING_PORT:-8080}"

# check <nombre> <url> <código esperado>
check() {
  NAME="$1"
  URL="$2"
  EXPECTED="$3"

  CODE="$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)"
  if [ "$CODE" = "$EXPECTED" ]; then
    echo "[OK] $NAME -> $URL ($CODE)"
  else
    echo "[FAIL] $NAME -> $URL ($CODE, se esperaba $EXPECTED)"
    exit 1
  fi
}

check "front"               "http://localhost:${FRONT_PORT}" 200
check "auth"                "http://localhost:${AUTH_PORT}/health" 200
check "auth JWKS"           "http://localhost:${AUTH_PORT}/.well-known/jwks.json" 200
check "invoicing"           "http://localhost:${INVOICING_PORT}/api/v1/metrics" 200
# Sin token la API de facturación debe rechazar: confirma que la validación JWT está activa.
check "invoicing (sin JWT)" "http://localhost:${INVOICING_PORT}/api/v1/invoices?page=1&page_size=1" 401
# El front en Docker llega a facturación por su proxy (hostname invoice-api en kali-dev-net).
check "front -> invoicing"  "http://localhost:${FRONT_PORT}/api/v1/invoices?page=1&page_size=1" 401

echo "[OK] Healthcheck completado (front:${FRONT_PORT} auth:${AUTH_PORT} invoicing:${INVOICING_PORT})"
