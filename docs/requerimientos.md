# Especificación de Requerimientos de Software (Gestión TI)
## Sistema: Mesa de Ayuda (Service Desk) — Hospital Santa María del Socorro (Ica)

> **Documento Unificado de Requerimientos para Frontend y Backend**  
> **Aprobado por:** Jefatura de Informática / Área de TI del Hospital Santa María del Socorro  
> **Marco Metodológico:** ITIL v4 adaptado al contexto hospitalario público  
> **Regla de Vocabulario:** Cero referencias a siglas "ITIL" en la interfaz de usuario; denominación oficial: `"Mesa de Ayuda"`  

---

## 1. Alcance y Orientación de la Solución
El software automatiza la gestión operativa de TI para más de 700 trabajadores médicos, asistenciales y administrativos del hospital, brindando cobertura continua a áreas críticas que operan 24/7 (Emergencia, Admisión, SIS, Referencias y Cajas).

---

## 2. Requerimientos Funcionales (RF01 - RF10)

### RF01: Registro de Incidentes y Solicitudes con Captura de IP
* El sistema debe permitir registrar incidentes (interrupciones de servicio) y solicitudes de servicio (nuevos requerimientos).
* **Flujo Mixto de Autenticación y Geolocalización:**
  * El usuario inicia sesión en el portal hospitalario con DNI y credenciales.
  * Al enviar el formulario, el backend intercepta de forma silenciosa la **Dirección IP** del cliente (`HttpServletRequest.getRemoteAddr()`).
  * El backend cruza la IP en la CMDB (`DIRECCION_IP` y `HISTORIAL_ASIGNACION_IP`) para asociar automáticamente el equipo (`ELEMENTO_CONFIGURACION`) y la sala física (`AREA`), evitando digitación manual por médicos o enfermeras.
  * **Fallback:** Si la IP no existe en la BD (ej. tablet nueva o red externa), se crea el ticket asignado al usuario y se permite la selección/enlace dinámico manual.

### RF02: Categorización Asistencial
* Clasificación de tickets por servicios asistenciales y tipos de falla (Sistemas Hospitalarios como GALENHOS, Conectividad/Red, Equipos de Cómputo/CPU, Impresoras Térmicas y Periféricos, Cuentas/Accesos).

### RF03: Priorización Automática Basada en Impacto y Urgencia
* El sistema calcula la prioridad de forma determinista mediante el cruce de:
  * **Impacto:** Alcance de la afectación (Alto: hospital general/área crítica 24/7; Medio: un servicio clínico; Bajo: un solo usuario).
  * **Urgencia:** Velocidad de atención requerida (Alta: Emergencia/UCI paralizada; Media: atención con lentitud; Baja: solicitud programable).
* **Niveles de Prioridad:** P1 (Crítica), P2 (Alta), P3 (Media), P4 (Baja).

### RF04: Asignación y Reasignación de Responsables
* Asignación de tickets a Practicantes de TI o al Administrador según disponibilidad y nivel de soporte.

### RF05: Escalamiento Técnico Justificado
* Un Practicante puede escalar un incidente al Administrador o especialista adjuntando justificación técnica, actualizando el nivel de soporte y registrando el evento en auditoría.

### RF06: Registro de Soluciones y Causa Raíz
* Documentación de diagnósticos, acciones correctivas aplicadas y solución final para alimentar la trazabilidad del caso.

### RF07: Control de Acuerdos de Nivel de Servicio (SLA) y Doble Alerta
* Control en tiempo real de los tiempos máximos de primera respuesta y resolución:
  * **P1 Crítica:** Respuesta ≤ 15 min | Resolución ≤ 2 hrs.
  * **P2 Alta:** Respuesta ≤ 30 min | Resolución ≤ 4 hrs.
  * **P3 Media:** Respuesta ≤ 2 hrs | Resolución ≤ 8 hrs.
  * **P4 Baja:** Respuesta ≤ 4 hrs | Resolución ≤ 24 hrs.
* **Estados de SLA:** `A_TIEMPO` (Verde), `ALERTA` (Ámbar - 80% del tiempo transcurrido), `INCUMPLIDO` (Rojo - tiempo vencido).
* **Doble Alerta:** Alerta visual semafórica en pantalla y **notificación automática por correo electrónico** al técnico y a jefatura al entrar en Alerta o Incumplido.
* **Panel de Configuración:** Interfaz para que el Administrador calibre los tiempos de SLA sin requerir cambios de código.

### RF08: Base de Conocimiento (KEDB) y Portal Público
* Registro de Errores Conocidos con síntoma, causa raíz y solución temporal o definitiva.
* **Publicación Directa:** Los practicantes pueden publicar artículos y tutoriales técnicos directamente sin burocracia previa.
* **Portal de Autoayuda:** Módulo público accesible sin login para consultar soluciones a problemas frecuentes (ej. configuración de impresoras térmicas, atascos de papel) desviando tickets repetitivos.

### RF09: Gestión de Inventario (CMDB) y Préstamos Temporales de Equipos
* Inventario de activos informáticos (CPUs, impresoras, switches, lectores de DNIe).
* Enlace dinámico de tickets a equipos físicos al momento de atender la falla.
* **Control de Préstamos:** Registro de equipos provisionales prestados a servicios asistenciales mientras su máquina titular entra a taller de formateo, con control de fecha estimada y devolución.

### RF10: Dashboard de Indicadores y Reportes Formales en PDF
* Dashboard interactivo con 4 KPIs hospitalarios: volumen mensual, tiempo promedio de resolución, % de cumplimiento de SLA y distribución por servicio asistencial.
* Visualizaciones gráficas tipo reporte ejecutivo (dona, barras con selectores dinámicos Top 5/8/10 y matriz interactiva de cuadrantes).
* **Exportación a PDF:** Generador de reportes formales descargables para sustentar carga de trabajo y presupuestos ante la dirección del hospital.

---

## 3. Modelo de Roles y Seguridad

El sistema implementa 3 roles hospitalarios oficiales con control de acceso estricto:

| Rol | Código | Alcance y Permisos |
|---|---|---|
| **Usuario Final** | `USUARIO_FINAL` | Médicos, enfermeras y administrativos. Registra solicitudes/incidentes, consulta el estado de sus tickets y accede al portal público de autoayuda. |
| **Practicante de TI** | `PRACTICANTE` | Personal técnico operativo. Atiende tickets, registra diagnósticos y soluciones, escala incidentes complejos, gestiona préstamos y publica directamente en la KEDB. |
| **Administrador** | `ADMINISTRADOR` | Ingeniero a cargo de TI. Control total: asignación/reasignación, calibración de matriz de SLA, auditoría, gestión de usuarios, KEDB y reportes PDF. |

---

## 4. Requerimientos No Funcionales (RNF)

1. **Arquitectura:** N-Capas desacopladas (Frontend Angular 19 SPA -> Backend Spring Boot 3 REST API -> Base de Datos SQL Server 2022).
2. **Seguridad:** Autenticación Stateless basada en JWT (tokens Bearer), contraseñas con hashing criptográfico, protección de rutas y endpoints por rol, y cabeceras CORS controladas.
3. **Auditoría y Trazabilidad:** Todo cambio de estado de ticket o reasignación debe persistirse obligatoriamente en `HISTORIAL_TICKET` (quién, qué acción, fecha/hora y observación).
4. **Manejo de Errores:** Respuestas JSON limpias y consistentes gestionadas por `@ControllerAdvice` sin exponer stacktraces internos al usuario.
5. **Responsividad Total (Frontend):** Diseño adaptativo al 100% (Desktop, Tablet y Mobile) sin desbordamientos horizontales.
6. **Usabilidad y Rendimiento:** Tiempos de respuesta de API < 500ms en consultas estándar y feedback visual inmediato con skeleton loaders.
