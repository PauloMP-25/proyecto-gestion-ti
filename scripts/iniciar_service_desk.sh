#!/usr/bin/env bash
# ==============================================================================
# Hospital Santa María del Socorro - Mesa de Ayuda
# Script: iniciar_service_desk.sh (Comando: service_desk)
#
# Flujo de ejecución:
#   1. Iniciar Base de Datos SQL Server (alias: iniciar_sql)
#   2. Iniciar Backend Spring Boot (puerto 8080)
#   3. Iniciar Frontend Angular (puerto 4200)
# ==============================================================================
set -e

# Colores de consola
VERDE="\033[1;32m"
ROJO="\033[1;31m"
AZUL="\033[1;34m"
AMARILLO="\033[1;33m"
CIAN="\033[1;36m"
GUINDA="\033[1;38;2;112;28;28m"
SIN_COLOR="\033[0m"

BASE_DIR="/media/paulo/datos/PROYECTOS/proyecto-gestion-ti"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo -e "${CIAN}╭─────────────────────────────────────────────────────────────╮${SIN_COLOR}"
echo -e "${CIAN}│${SIN_COLOR}   🏥  ${VERDE}HOSPITAL SANTA MARÍA DEL SOCORRO - MESA DE AYUDA${SIN_COLOR}   ${CIAN}│${SIN_COLOR}"
echo -e "${CIAN}│${SIN_COLOR}       Iniciando Servicios del Sistema de Soporte TI         ${CIAN}│${SIN_COLOR}"
echo -e "${CIAN}╰─────────────────────────────────────────────────────────────╯${SIN_COLOR}"

# ------------------------------------------------------------------------------
# 1. Base de Datos SQL Server (iniciar_sql)
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[1/3] Iniciando Base de Datos SQL Server...${SIN_COLOR}"
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
# 2. Backend Spring Boot (Puerto 8080)
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[2/3] Verificando Backend Spring Boot...${SIN_COLOR}"
BACKEND_PID=$(lsof -t -i :8080 2>/dev/null | head -n 1 || true)

if [ -n "$BACKEND_PID" ]; then
    echo -e "      ${VERDE}✓ Backend ya se encuentra activo en http://localhost:8080 (PID: $BACKEND_PID)${SIN_COLOR}"
else
    echo -e "      🚀 Arrancando Spring Boot en segundo plano..."
    cd "$BACKEND_DIR"
    nohup ./mvnw spring-boot:run > "$BACKEND_DIR/backend.log" 2>&1 &
    NUEVO_PID=$!
    echo $NUEVO_PID > /tmp/service_desk_backend.pid
    
    echo -ne "      Esperando que el Backend responda en puerto 8080..."
    BACK_LISTO=0
    for i in {1..60}; do
        if nc -z localhost 8080 >/dev/null 2>&1; then
            echo -e " ${VERDE}[LISTO]${SIN_COLOR}"
            BACK_LISTO=1
            break
        fi
        if ! kill -0 $NUEVO_PID 2>/dev/null; then
            echo -e " ${ROJO}[FALLÓ]${SIN_COLOR}"
            echo -e "      ${ROJO}❌ Error al arrancar backend. Revisa el log: tail -n 30 $BACKEND_DIR/backend.log${SIN_COLOR}"
            break
        fi
        echo -n "."
        sleep 2
    done

    if [ $BACK_LISTO -eq 1 ]; then
        echo -e "      ${VERDE}✓ Backend Spring Boot listo en http://localhost:8080 (PID: $NUEVO_PID)${SIN_COLOR}"
    fi
fi

# ------------------------------------------------------------------------------
# 3. Frontend Angular (Puerto 4200)
# ------------------------------------------------------------------------------
echo -e "\n${AZUL}[3/3] Iniciando Frontend Angular...${SIN_COLOR}"
FRONT_PID=$(lsof -t -i :4200 2>/dev/null | head -n 1 || true)

if [ -n "$FRONT_PID" ]; then
    echo -e "      ${VERDE}✓ Frontend ya se encuentra activo en http://localhost:4200 (PID: $FRONT_PID)${SIN_COLOR}"
    echo -e "\n${CIAN}🌐 Acceso a la Mesa de Ayuda: ${VERDE}http://localhost:4200${SIN_COLOR}"
    exit 0
fi

if [ "$1" = "--bg" ] || [ "$1" = "-d" ] || [ "$1" = "--detach" ]; then
    echo -e "      🚀 Arrancando Angular en segundo plano..."
    cd "$FRONTEND_DIR"
    nohup npm start > "$FRONTEND_DIR/frontend.log" 2>&1 &
    NUEVO_FRONT_PID=$!
    echo $NUEVO_FRONT_PID > /tmp/service_desk_frontend.pid
    echo -e "      ${VERDE}✓ Frontend iniciado en segundo plano (PID: $NUEVO_FRONT_PID)${SIN_COLOR}"
    echo -e "\n${CIAN}🌐 Acceso a la Mesa de Ayuda: ${VERDE}http://localhost:4200${SIN_COLOR}"
    echo -e "${AMARILLO}💡 Para apagar todos los servicios ejecuta: apagar_service_desk${SIN_COLOR}\n"
else
    echo -e "      🚀 Arrancando servidor de desarrollo Angular..."
    echo -e "\n${CIAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}"
    echo -e "  ${VERDE}✓ Todos los servicios están en marcha:${SIN_COLOR}"
    echo -e "    • Base de Datos : SQL Server (puerto 1433)"
    echo -e "    • Backend API   : http://localhost:8080"
    echo -e "    • Frontend Web  : http://localhost:4200"
    echo -e "  ${AMARILLO}💡 Para apagar todo en cualquier momento, abre otra terminal y ejecuta:${SIN_COLOR}"
    echo -e "     ${CIAN}apagar_service_desk${SIN_COLOR}"
    echo -e "${CIAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${SIN_COLOR}\n"
    cd "$FRONTEND_DIR"
    npm start
fi
