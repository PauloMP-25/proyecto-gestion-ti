#!/usr/bin/env bash
# Iniciar solo el Frontend Angular
set -e
BASE_DIR="/media/paulo/datos/PROYECTOS/proyecto-gestion-ti"
FRONTEND_DIR="$BASE_DIR/frontend"

FRONT_PID=$(lsof -t -i :4200 2>/dev/null | head -n 1 || true)
if [ -n "$FRONT_PID" ]; then
    echo "✓ Frontend ya se encuentra activo en http://localhost:4200 (PID: $FRONT_PID)"
    exit 0
fi

echo "🚀 Iniciando Frontend Angular en http://localhost:4200..."
cd "$FRONTEND_DIR"
npm start
