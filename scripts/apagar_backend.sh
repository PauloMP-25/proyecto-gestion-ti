#!/usr/bin/env bash
# Apagar solo el Backend Spring Boot
set -e
echo "🛑 Deteniendo Backend Spring Boot (puerto 8080)..."
BACKEND_PIDS=$(lsof -t -i :8080 2>/dev/null || true)
if [ -f /tmp/service_desk_backend.pid ]; then
    SAVED_PID=$(cat /tmp/service_desk_backend.pid 2>/dev/null || true)
    BACKEND_PIDS="$BACKEND_PIDS $SAVED_PID"
    rm -f /tmp/service_desk_backend.pid
fi
BACKEND_PIDS=$(echo "$BACKEND_PIDS" | tr ' ' '\n' | sort -u | xargs)

if [ -n "$BACKEND_PIDS" ]; then
    kill $BACKEND_PIDS 2>/dev/null || true
    sleep 2
    kill -9 $BACKEND_PIDS 2>/dev/null || true
    echo "✓ Backend Spring Boot detenido correctamente."
else
    echo "✓ Backend no estaba en ejecución."
fi
