#!/usr/bin/env bash
# ==============================================================================
# Hospital Santa María del Socorro - Mesa de Ayuda
# Script: iniciar_service_desk.sh (Comando: service_desk / iniciar_service_desk)
#
# Flujo de ejecución:
#   1. Iniciar Base de Datos SQL Server (puerto 1433)
#   2. Iniciar Frontend Angular en segundo plano (puerto 4200)
#   3. Iniciar Backend Spring Boot (puerto 8080)
# ==============================================================================
set -e

# Colores de consola
VERDE="\033[1;32m"
ROJO="\033[1;31m"
AZUL="\033[1;34m"
AMARILLO="\033[1;33m"
CIAN="\033[1;36m"
BOLD="\033[1m"
SIN_COLOR="\033[0m"

BASE_DIR="/media/paulo/datos/PROYECTOS/proyecto-gestion-ti"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo -e "\n${CIAN}╭─────────────────────────────────────────────────────────────╮${SIN_COLOR}"
echo -e "${CIAN}│${SIN_COLOR}   🏥  ${VERDE}${BOLD}HOSPITAL SANTA MARÍA DEL SOCORRO - MESA DE AYUDA${SIN_COLOR}   ${CIAN}│${SIN_COLOR}"
echo -e "${CIAN}│${SIN_COLOR}       Iniciando Servicios del Sistema de Soporte TI         ${CIAN}│${SIN_COLOR}"
echo -e "${CIAN}╰─────────────────────────────────────────────────────────────╯${SIN_COLOR}"

# ------------------------------------------------------------------------------
# 1. Base de Datos SQL Server
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[1/3] 📦 Iniciando Base de Datos SQL Server...${SIN_COLOR}"
if command -v python3 >/dev/null 2>&1 && [ -f "$HOME/.luka-scripts/docker_launcher.py" ]; then
    python3 "$HOME/.luka-scripts/docker_launcher.py" start sqlserver
else
    docker start bd_sqlserver >/dev/null 2>&1 || true
fi

echo -ne "      Verificando conexión al puerto 1433..."
SQL_LISTO=0
for i in {1..30}; do
    if nc -z localhost 1433 >/dev/null 2>&1; then
        echo -e " ${VERDE}[EN LÍNEA]${SIN_COLOR}"
        SQL_LISTO=1
        break
    fi
    echo -n "."
    sleep 1
done

if [ $SQL_LISTO -ne 1 ]; then
    echo -e " ${AMARILLO}[AVISO: Puerto 1433 aún no reporta listo, continuando...]${SIN_COLOR}"
fi

# ------------------------------------------------------------------------------
# 2. Frontend Angular (Puerto 4200) - Primero
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[2/3] 🌐 Iniciando Frontend Angular...${SIN_COLOR}"
FRONT_PID=$(lsof -t -i :4200 2>/dev/null | head -n 1 || true)

if [ -n "$FRONT_PID" ]; then
    echo -e "      ${VERDE}✓ Frontend ya se encuentra activo en http://localhost:4200 (PID: $FRONT_PID)${SIN_COLOR}"
else
    echo -e "      🚀 Levantando Angular en segundo plano..."
    cd "$FRONTEND_DIR"
    nohup npm start > "$FRONTEND_DIR/frontend.log" 2>&1 &
    NUEVO_FRONT_PID=$!
    echo $NUEVO_FRONT_PID > /tmp/service_desk_frontend.pid
    
    echo -ne "      Esperando que el Frontend responda en puerto 4200..."
    FRONT_LISTO=0
    for i in {1..40}; do
        if nc -z localhost 4200 >/dev/null 2>&1; then
            echo -e " ${VERDE}[LISTO]${SIN_COLOR}"
            FRONT_LISTO=1
            break
        fi
        echo -n "."
        sleep 2
    done
    if [ $FRONT_LISTO -eq 1 ]; then
        echo -e "      ${VERDE}✓ Frontend listo en http://localhost:4200 (PID: $NUEVO_FRONT_PID)${SIN_COLOR}"
    else
        echo -e " ${AMARILLO}[Compilando en segundo plano...]${SIN_COLOR}"
    fi
fi

# ------------------------------------------------------------------------------
# 3. Backend Spring Boot (Puerto 8080) - Luego
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[3/3] ⚙️  Iniciando Backend Spring Boot...${SIN_COLOR}"
BACKEND_PID=$(lsof -t -i :8080 2>/dev/null | head -n 1 || true)

if [ -n "$BACKEND_PID" ]; then
    echo -e "      ${VERDE}✓ Backend ya se encuentra activo en http://localhost:8080 (PID: $BACKEND_PID)${SIN_COLOR}"
else
    echo -e "${CIAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}"
    echo -e "  ${VERDE}✓ Sistema inicializado con éxito:${SIN_COLOR}"
    echo -e "    • Base de Datos : SQL Server (puerto 1433)"
    echo -e "    • Frontend Web  : ${CIAN}http://localhost:4200${SIN_COLOR}"
    echo -e "    • Backend API   : ${CIAN}http://localhost:8080${SIN_COLOR}"
    echo -e "  ${AMARILLO}💡 Para apagar todos los servicios ejecuta en otra terminal:${SIN_COLOR}"
    echo -e "     ${CIAN}apagar_service_desk${SIN_COLOR}"
    echo -e "${CIAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}\n"
    echo -e "      🚀 Arrancando Spring Boot..."
    cd "$BACKEND_DIR"
    exec ./mvnw spring-boot:run
fi
