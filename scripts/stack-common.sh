#!/bin/sh
# Configuración compartida por dev-stack-up.sh y dev-stack-down.sh.
#
# Valores por defecto: repos hermanos de este (../kali-auth-context y
# ../kali-invoice-service). Si tus repos están en otra ubicación, copia
# .env.stack.example a .env.stack (ignorado por git) y ajusta las rutas.
# Las rutas relativas se resuelven SIEMPRE desde la raíz de este repo, sin
# importar desde qué carpeta se ejecute el comando.

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
STACK_ENV_FILE="$ROOT_DIR/.env.stack"

AUTH_PROJECT_PATH="../kali-auth-context"
AUTH_COMPOSE_FILE="docker-compose.dev.yml"
AUTH_ENV_FILE=".env.dev"

INVOICING_PROJECT_PATH="../kali-invoice-service"
INVOICING_COMPOSE_FILE="docker-compose.dev.yml"
INVOICING_ENV_FILE=".env.dev"

FRONT_COMPOSE_FILE="docker-compose.dev.yml"
FRONT_ENV_FILE=".env.dev"

if [ -f "$STACK_ENV_FILE" ]; then
  echo "[INFO] Usando configuración de $STACK_ENV_FILE"
  # shellcheck disable=SC1090
  . "$STACK_ENV_FILE"
fi

# Convierte una ruta relativa (a la raíz de este repo) en absoluta.
resolve_path() {
  case "$1" in
    /*) printf '%s\n' "$1" ;;
    *) printf '%s\n' "$ROOT_DIR/$1" ;;
  esac
}

AUTH_PROJECT_PATH="$(resolve_path "$AUTH_PROJECT_PATH")"
INVOICING_PROJECT_PATH="$(resolve_path "$INVOICING_PROJECT_PATH")"

# Crea <ruta>/<env> copiando <ruta>/.env.example si el env no existe.
# Nunca sobrescribe un archivo existente. Los .env.example traen valores de
# desarrollo local coherentes entre los tres repos (sin secretos reales).
ensure_env_file() {
  PROJECT_PATH="$1"
  ENV_FILE="$2"
  [ -n "$ENV_FILE" ] || return 0
  if [ ! -f "$PROJECT_PATH/$ENV_FILE" ] && [ -f "$PROJECT_PATH/.env.example" ]; then
    cp "$PROJECT_PATH/.env.example" "$PROJECT_PATH/$ENV_FILE"
    echo "[INFO] Creado $PROJECT_PATH/$ENV_FILE desde .env.example"
  fi
}

# Ejecuta docker compose sobre un proyecto: run_compose <ruta> <compose> <env> <args...>
# El env-file solo se pasa si existe (las variables de interpolación de puertos
# y credenciales viven en él).
run_compose() {
  PROJECT_PATH="$1"
  COMPOSE_FILE="$2"
  ENV_FILE="$3"
  shift 3
  if [ -n "$ENV_FILE" ] && [ -f "$PROJECT_PATH/$ENV_FILE" ]; then
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" --env-file "$PROJECT_PATH/$ENV_FILE" "$@"
  else
    docker compose -f "$PROJECT_PATH/$COMPOSE_FILE" "$@"
  fi
}
