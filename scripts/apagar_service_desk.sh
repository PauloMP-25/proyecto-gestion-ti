#!/usr/bin/env bash
# ==============================================================================
# Hospital Santa María del Socorro - Mesa de Ayuda
# Script: apagar_service_desk.sh (Comando: apagar_service_desk)
#
# Flujo de apagado:
#   1. Detener Frontend Angular (puerto 4200)
#   2. Detener Backend Spring Boot (puerto 8080)
#   3. Detener Base de Datos SQL Server (alias: apagar_sql)
# ==============================================================================
set -e

# Colores de consola
VERDE="\033[1;32m"
ROJO="\033[1;31m"
AZUL="\033[1;34m"
AMARILLO="\033[1;33m"
CIAN="\033[1;36m"
SIN_COLOR="\033[0m"

echo -e "${CIAN}╭─────────────────────────────────────────────────────────────╮${SIN_COLOR}"
echo -e "${CIAN}│${SIN_COLOR}   🏥  ${ROJO}DETENIENDO SERVICIOS DE LA MESA DE AYUDA (HSMSI)${SIN_COLOR}   ${CIAN}│${SIN_COLOR}"
echo -e "${CIAN}╰─────────────────────────────────────────────────────────────╯${SIN_COLOR}"

# ------------------------------------------------------------------------------
# 1. Detener Frontend Angular (Puerto 4200)
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[1/3] Verificando Frontend Angular (Puerto 4200)...${SIN_COLOR}"
FRONT_PIDS=$(lsof -t -i :4200 2>/dev/null || true)
if [ -f /tmp/service_desk_frontend.pid ]; then
    SAVED_FRONT_PID=$(cat /tmp/service_desk_frontend.pid 2>/dev/null || true)
    FRONT_PIDS="$FRONT_PIDS $SAVED_FRONT_PID"
    rm -f /tmp/service_desk_frontend.pid
fi
FRONT_PIDS=$(echo "$FRONT_PIDS" | tr ' ' '\n' | sort -u | xargs)

if [ -n "$FRONT_PIDS" ]; then
    echo -e "      Deteniendo procesos de Frontend (PID: $FRONT_PIDS)..."
    kill $FRONT_PIDS 2>/dev/null || true
    sleep 1
    # Asegurar cierre
    kill -9 $FRONT_PIDS 2>/dev/null || true
    echo -e "      ${VERDE}✓ Frontend Angular detenido correctamente.${SIN_COLOR}"
else
    echo -e "      ${AMARILLO}✓ Frontend no estaba en ejecución.${SIN_COLOR}"
fi

# ------------------------------------------------------------------------------
# 2. Detener Backend Spring Boot (Puerto 8080)
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[2/3] Verificando Backend Spring Boot (Puerto 8080)...${SIN_COLOR}"
BACKEND_PIDS=$(lsof -t -i :8080 2>/dev/null || true)
if [ -f /tmp/service_desk_backend.pid ]; then
    SAVED_BACK_PID=$(cat /tmp/service_desk_backend.pid 2>/dev/null || true)
    BACKEND_PIDS="$BACKEND_PIDS $SAVED_BACK_PID"
    rm -f /tmp/service_desk_backend.pid
fi
BACKEND_PIDS=$(echo "$BACKEND_PIDS" | tr ' ' '\n' | sort -u | xargs)

if [ -n "$BACKEND_PIDS" ]; then
    echo -e "      Deteniendo procesos del Backend (PID: $BACKEND_PIDS)..."
    kill $BACKEND_PIDS 2>/dev/null || true
    sleep 2
    # Asegurar cierre si sigue escuchando
    kill -9 $BACKEND_PIDS 2>/dev/null || true
    echo -e "      ${VERDE}✓ Backend Spring Boot detenido correctamente.${SIN_COLOR}"
else
    echo -e "      ${AMARILLO}✓ Backend no estaba en ejecución.${SIN_COLOR}"
fi

# ------------------------------------------------------------------------------
# 3. Detener Base de Datos SQL Server
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[3/3] Deteniendo Base de Datos SQL Server...${SIN_COLOR}"
if command -v python3 >/dev/null 2>&1 && [ -f "$HOME/.luka-scripts/docker_launcher.py" ]; then
    python3 "$HOME/.luka-scripts/docker_launcher.py" stop sqlserver
else
    docker stop bd_sqlserver >/dev/null 2>&1 || true
fi
echo -e "      ${VERDE}✓ Base de datos SQL Server detenida.${SIN_COLOR}"

echo -e "\n${VERDE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}"
echo -e "  ${VERDE}🎉 ¡Todos los servicios han sido apagados exitosamente!${SIN_COLOR}"
echo -e "${VERDE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}\n"
