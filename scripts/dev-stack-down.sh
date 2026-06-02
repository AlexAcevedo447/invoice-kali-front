#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
STACK_ENV_FILE="$ROOT_DIR/.env.stack"

# Defaults
AUTH_PROJECT_PATH="../kali-auth-context"
AUTH_COMPOSE_FILE="docker-compose.dev.yml"
AUTH_ENV_FILE=".env.dev"

INVOICING_PROJECT_PATH="../kali-invoice-service"
INVOICING_COMPOSE_FILE="docker-compose.debug.yml"
INVOICING_ENV_FILE=".env.dev"

FRONT_COMPOSE_FILE="docker-compose.dev.yml"
FRONT_ENV_FILE=".env.dev"

if [ -f "$STACK_ENV_FILE" ]; then
  # shellcheck disable=SC1090
  . "$STACK_ENV_FILE"
fi

compose_down() {
  SERVICE_NAME="$1"
  PROJECT_PATH="$2"
  COMPOSE_FILE="$3"
  ENV_FILE="$4"

  if [ ! -d "$PROJECT_PATH" ] || [ ! -f "$PROJECT_PATH/$COMPOSE_FILE" ]; then
    echo "[WARN] $SERVICE_NAME: compose no encontrado, se omite"
    return
  fi

  if [ -n "$ENV_FILE" ] && [ -f "$PROJECT_PATH/$ENV_FILE" ]; then
    echo "[INFO] Bajando $SERVICE_NAME"
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" --env-file "$PROJECT_PATH/$ENV_FILE" down
  else
    echo "[INFO] Bajando $SERVICE_NAME"
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" down
  fi
}

compose_down "front" "$ROOT_DIR" "$FRONT_COMPOSE_FILE" "$FRONT_ENV_FILE"
compose_down "invoicing" "$INVOICING_PROJECT_PATH" "$INVOICING_COMPOSE_FILE" "$INVOICING_ENV_FILE"
compose_down "auth" "$AUTH_PROJECT_PATH" "$AUTH_COMPOSE_FILE" "$AUTH_ENV_FILE"

echo "[OK] Stack detenido"
