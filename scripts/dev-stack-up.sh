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

compose_up() {
  SERVICE_NAME="$1"
  PROJECT_PATH="$2"
  COMPOSE_FILE="$3"
  ENV_FILE="$4"

  if [ ! -d "$PROJECT_PATH" ]; then
    echo "[ERROR] $SERVICE_NAME: no existe el directorio $PROJECT_PATH"
    exit 1
  fi

  if [ ! -f "$PROJECT_PATH/$COMPOSE_FILE" ]; then
    echo "[ERROR] $SERVICE_NAME: no existe el compose $PROJECT_PATH/$COMPOSE_FILE"
    exit 1
  fi

  if [ -n "$ENV_FILE" ] && [ -f "$PROJECT_PATH/$ENV_FILE" ]; then
    echo "[INFO] Levantando $SERVICE_NAME con $COMPOSE_FILE + $ENV_FILE"
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" --env-file "$PROJECT_PATH/$ENV_FILE" up -d --build
  else
    echo "[INFO] Levantando $SERVICE_NAME con $COMPOSE_FILE"
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" up -d --build
  fi
}

compose_up "auth" "$AUTH_PROJECT_PATH" "$AUTH_COMPOSE_FILE" "$AUTH_ENV_FILE"
compose_up "invoicing" "$INVOICING_PROJECT_PATH" "$INVOICING_COMPOSE_FILE" "$INVOICING_ENV_FILE"
compose_up "front" "$ROOT_DIR" "$FRONT_COMPOSE_FILE" "$FRONT_ENV_FILE"

echo "[OK] Stack levantado"
echo "[INFO] Front: http://localhost:15173"
echo "[INFO] Auth API: http://localhost:18080"
echo "[INFO] Invoicing API: http://localhost:8080"
