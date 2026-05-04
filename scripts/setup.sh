#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

echo "[INFO] Setup invoice-kali-front"

# Crear .env.local si no existe
if [ ! -f "$ROOT_DIR/.env.local" ]; then
  if [ -f "$ROOT_DIR/.env.local.example" ]; then
    echo "[INFO] Creando .env.local desde .env.local.example"
    cp "$ROOT_DIR/.env.local.example" "$ROOT_DIR/.env.local"
  fi
fi

# Crear .env.stack si no existe (para modo stack)
if [ ! -f "$ROOT_DIR/.env.stack" ]; then
  if [ -f "$ROOT_DIR/.env.stack.example" ]; then
    echo "[INFO] Creando .env.stack desde .env.stack.example"
    cp "$ROOT_DIR/.env.stack.example" "$ROOT_DIR/.env.stack"
  fi
fi

echo "[OK] Setup completado"
echo ""
echo "Para desarrollo local:"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Para Docker:"
echo "  npm run stack:up"
echo ""
echo "Para healthcheck:"
echo "  npm run stack:health  (Docker)"
echo "  FRONT_PORT=5173 AUTH_PORT=8082 INVOICING_PORT=8083 npm run stack:health  (local)"
