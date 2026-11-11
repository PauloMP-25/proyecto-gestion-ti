#!/usr/bin/env bash
# Apagar solo el Frontend Angular
set -e
echo "🛑 Deteniendo Frontend Angular (puerto 4200)..."
FRONT_PIDS=$(lsof -t -i :4200 2>/dev/null || true)
if [ -f /tmp/service_desk_frontend.pid ]; then
    SAVED_FRONT_PID=$(cat /tmp/service_desk_frontend.pid 2>/dev/null || true)
    FRONT_PIDS="$FRONT_PIDS $SAVED_FRONT_PID"
    rm -f /tmp/service_desk_frontend.pid
fi
FRONT_PIDS=$(echo "$FRONT_PIDS" | tr ' ' '\n' | sort -u | xargs)

if [ -n "$FRONT_PIDS" ]; then
    kill $FRONT_PIDS 2>/dev/null || true
    sleep 1
    kill -9 $FRONT_PIDS 2>/dev/null || true
    echo "✓ Frontend Angular detenido correctamente."
else
    echo "✓ Frontend no estaba en ejecución."
fi
