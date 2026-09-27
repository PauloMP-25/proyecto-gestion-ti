# Requerimientos del Software - Service Desk ITIL v4

## Requerimientos Funcionales
1. **Gestión de Incidentes y Peticiones:** El sistema debe permitir registrar, clasificar, asignar y dar seguimiento a tickets de incidentes y peticiones.
2. **Asignación de SLA:** El sistema debe calcular y asignar automáticamente tiempos de resolución y respuesta según matriz de prioridad, urgencia e impacto.
3. **Escalamiento de Tickets:** Permitir escalar tickets entre distintos niveles de soporte (N1, N2, Especialista).
4. **Base de Conocimiento (KEDB):** Permitir registrar soluciones y errores conocidos, vinculándolos a los tickets resueltos.
5. **Autenticación y Autorización:** Validar el acceso mediante usuarios, contraseñas encriptadas y roles bien definidos.
6. **Gestión de Inventario (CMDB):** Control de Elementos de Configuración y asignación de IPs.

## Requerimientos No Funcionales
1. **Seguridad:** Ningún endpoint o vista estará expuesto sin previa validación del token/sesión y rol del usuario.
2. **Auditoría y Trazabilidad:** Todo cambio de estado de los incidentes y cambios en el SLA debe registrar el usuario, acción y fecha (log de auditoría).
3. **Manejo de Errores:** Respuestas JSON consistentes sin exponer stack traces al cliente.
4. **Validación de Datos:** Toda entrada de datos debe validarse estrictamente en el backend.
5. **Separación de Lógica:** Toda la lógica de negocio (SLA, escalamiento, matriz de prioridad) residirá en la capa de servicios del Backend (Java) en vez de base de datos.
6. **Pruebas:** Cobertura de tests unitarios y de integración exigida para la lógica crítica (SLA, escalamiento).
