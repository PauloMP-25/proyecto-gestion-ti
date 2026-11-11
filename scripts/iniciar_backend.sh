#!/usr/bin/env bash
# Iniciar solo el Backend Spring Boot
set -e
BASE_DIR="/media/paulo/datos/PROYECTOS/proyecto-gestion-ti"
BACKEND_DIR="$BASE_DIR/backend"

BACKEND_PID=$(lsof -t -i :8080 2>/dev/null | head -n 1 || true)
if [ -n "$BACKEND_PID" ]; then
    echo "✓ Backend ya se encuentra activo en http://localhost:8080 (PID: $BACKEND_PID)"
    exit 0
fi

echo "🚀 Iniciando Backend Spring Boot en http://localhost:8080..."
cd "$BACKEND_DIR"
./mvnw spring-boot:run
