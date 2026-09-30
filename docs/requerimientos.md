# Requerimientos del Software - Service Desk ITIL v4

## Requerimientos Funcionales
1. **Gestión de Incidentes y Peticiones:** El sistema debe permitir registrar, clasificar, asignar y dar seguimiento a tickets. Al crear el ticket desde el panel de usuario, el sistema debe capturar automáticamente la dirección IP de la PC de origen por detrás.
2. **Asignación de SLA y Matriz de Prioridad:** El sistema debe calcular tiempos de resolución/respuesta. Se debe incluir un **Panel de Configuración en la interfaz** para que los administradores editen las reglas de impacto y urgencia.
3. **Alertas de SLA:** Si el tiempo de SLA se vence, el sistema debe emitir una alerta visual en pantalla y enviar un mensaje automático por correo electrónico.
4. **Escalamiento de Tickets:** Permitir escalar tickets entre distintos niveles de soporte (N1, N2, Especialista).
5. **Base de Conocimiento (KEDB):** Permitir registrar soluciones. Los practicantes deben poder **publicar directamente** sin aprobación previa estricta. Además, debe existir un **módulo público de autoayuda** para usuarios finales.
6. **Gestión de Inventario (CMDB):** Registro dinámico de activos (el técnico puede enlazar o registrar el equipo al atender el ticket). Debe incluir una función para registrar explícitamente el **préstamo temporal de equipos**.
7. **Gestión de Problemas:** El sistema debe agrupar automáticamente incidentes similares para alertar al área TI sobre un problema mayor subyacente.
8. **Dashboards y Reportes:** Panel principal con lista de métricas clave, y opción para **exportar los gráficos y reportes a formato PDF**.

## Requerimientos No Funcionales
1. **Seguridad e Inicio de Sesión:** El usuario debe iniciar sesión (DNI/Contraseña) para crear tickets, y ningún endpoint estará expuesto sin validación de token/sesión y rol.
2. **Auditoría y Trazabilidad:** Todo cambio de estado de los incidentes y SLAs registrará el usuario, acción y fecha (log de auditoría).
3. **Manejo de Errores:** Respuestas JSON consistentes sin exponer stack traces.
4. **Validación de Datos:** Toda entrada de datos debe validarse estrictamente en el backend.
5. **Pruebas:** Cobertura de tests unitarios y de integración exigida para la lógica crítica (SLA, escalamiento).
