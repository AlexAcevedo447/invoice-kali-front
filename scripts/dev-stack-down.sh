#!/bin/sh
# Baja front + facturación + auth. Usa `docker compose down` SIN -v:
# elimina contenedores y redes, pero conserva los volúmenes de datos.
set -eu

# shellcheck source=scripts/stack-common.sh
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/stack-common.sh"

compose_down() {
  SERVICE_NAME="$1"
  PROJECT_PATH="$2"
  COMPOSE_FILE="$3"
  ENV_FILE="$4"

  if [ ! -d "$PROJECT_PATH" ] || [ ! -f "$PROJECT_PATH/$COMPOSE_FILE" ]; then
    echo "[WARN] $SERVICE_NAME: compose no encontrado en $PROJECT_PATH/$COMPOSE_FILE, se omite"
    return
  fi

  echo "[INFO] Bajando $SERVICE_NAME"
  run_compose "$PROJECT_PATH" "$COMPOSE_FILE" "$ENV_FILE" down
}

compose_down "front" "$ROOT_DIR" "$FRONT_COMPOSE_FILE" "$FRONT_ENV_FILE"
compose_down "invoicing" "$INVOICING_PROJECT_PATH" "$INVOICING_COMPOSE_FILE" "$INVOICING_ENV_FILE"
compose_down "auth" "$AUTH_PROJECT_PATH" "$AUTH_COMPOSE_FILE" "$AUTH_ENV_FILE"

echo "[OK] Stack detenido (volúmenes conservados)"
