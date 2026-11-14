#!/bin/sh
# Levanta auth + facturación + front en Docker (modo desarrollo).
# Configuración de rutas: ver scripts/stack-common.sh y .env.stack.example.
# No borra volúmenes: solo hace `up -d --build`.
set -eu

# shellcheck source=scripts/stack-common.sh
. "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/stack-common.sh"

compose_up() {
  SERVICE_NAME="$1"
  PROJECT_PATH="$2"
  COMPOSE_FILE="$3"
  ENV_FILE="$4"

  if [ ! -d "$PROJECT_PATH" ]; then
    echo "[ERROR] $SERVICE_NAME: no existe el directorio $PROJECT_PATH"
    echo "        Copia .env.stack.example a .env.stack y ajusta la ruta del repo."
    exit 1
  fi

  if [ ! -f "$PROJECT_PATH/$COMPOSE_FILE" ]; then
    echo "[ERROR] $SERVICE_NAME: no existe el compose $PROJECT_PATH/$COMPOSE_FILE"
    exit 1
  fi

  ensure_env_file "$PROJECT_PATH" "$ENV_FILE"
  echo "[INFO] Levantando $SERVICE_NAME con $PROJECT_PATH/$COMPOSE_FILE"
  run_compose "$PROJECT_PATH" "$COMPOSE_FILE" "$ENV_FILE" up -d --build
}

# Orden: auth y facturación crean las redes (kali-auth-dev-net, kali-dev-net)
# a las que se conecta el contenedor del front.
compose_up "auth" "$AUTH_PROJECT_PATH" "$AUTH_COMPOSE_FILE" "$AUTH_ENV_FILE"
compose_up "invoicing" "$INVOICING_PROJECT_PATH" "$INVOICING_COMPOSE_FILE" "$INVOICING_ENV_FILE"
compose_up "front" "$ROOT_DIR" "$FRONT_COMPOSE_FILE" "$FRONT_ENV_FILE"

echo "[OK] Stack levantado"
echo "[INFO] Front: http://localhost:15173"
echo "[INFO] Auth API: http://localhost:18080"
echo "[INFO] Invoicing API: http://localhost:8080"
echo "[INFO] Verifica con: npm run stack:health"
