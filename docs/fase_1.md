# Plan de Desarrollo y Arquitectura Backend (Spring Boot 3 + SQL Server)
## Proyecto: Mesa de Ayuda (Service Desk) — Hospital Santa María del Socorro (Ica, Perú)

> **Documento Rector para el Equipo de Backend y Planificación de Sprints con Claude**  
> **Versión:** 2.0 (Actualizada con levantamiento de información en campo, requerimientos del Ingeniero de TI y estado de implementación)  
> **Rama Base:** `develop`  
> **Motor de Persistencia:** Microsoft SQL Server 2022 (`localhost:1433`, base `db_servicedesk`)  
> **Entorno de Ejecución:** Java 21 LTS / Spring Boot 3  

---

## 1. Contexto Operativo y Diagnóstico del Hospital (Levantamiento AS-IS)

El **Hospital Santa María del Socorro (HSMSI)** es un establecimiento de salud de Categoría II-1 ubicado en Ica, Perú, con una dotación aproximada de **700 trabajadores** entre personal médico, asistencial y administrativo. El hospital opera servicios asistenciales ininterrumpidos **24 horas al día, 365 días al año** en áreas críticas como **Emergencia, Admisión, SIS, Referencias y Módulo de Cajas**.

### 1.1 Problemática Real Levantada en Entrevistas de TI
1. **Canales Informales y Pérdida de Trazabilidad:** La recepción de requerimientos de soporte se realizaba mediante llamadas telefónicas o mensajes de WhatsApp, provocando saturación y ausencia de métricas que justifiquen la carga laboral ante la dirección.
2. **Dependencia Crítica de Infraestructura:** Las caídas de conectividad (proveedores Movistar y WOW), apagones y fallas de sistema operativo (formateos recurrentes que tardaban de 1 a 2 días) paralizan el triaje y la facturación hospitalaria.
3. **Ausencia de SLA y Gestión de Direcciones IP:** El equipo de TI (4 ingenieros operativos en horario L-V 7:00 a 17:00) no contaba con tiempos estandarizados de resolución ni con una matriz organizada de IPs, generando duplicidad y conflictos de red.
4. **Falta de Documentación de Soluciones (KEDB):** Las soluciones técnicas a problemas complejos se ejecutaban de manera empírica sin quedar archivadas para futuros practicantes o técnicos de turno.
5. **Rotación de Equipos de Repuesto:** Al retirar CPUs averiadas para formateo, TI presta equipos provisionales de repuesto sin un sistema que trace la devolución ni el historial de averías acumuladas por cada máquina.

---

## 2. Decisiones Estratégicas Aprobadas por el Ingeniero de TI

En la sesión de validación técnica con la jefatura de Informática del Hospital se definieron los siguientes principios arquitectónicos:

1. **Flujo de Creación de Tickets con Enfoque Mixto (Autenticación + Captura de IP):**
   * El usuario inicia sesión en el portal hospitalario con su DNI y credenciales.
   * Al enviar el formulario de soporte, el backend captura de forma transparente la **Dirección IP de origen** (`HttpServletRequest.getRemoteAddr()`).
   * El backend cruza dicha IP contra el inventario de la CMDB (`DIRECCION_IP` y `HISTORIAL_ASIGNACION_IP`) para deducir automáticamente el equipo (`ELEMENTO_CONFIGURACION`) y la sala/pabellón (`AREA`), eliminando errores de digitación del personal médico.
   * **Fallback de contingencia:** Si la IP no está registrada en la BD (ej. laptop nueva o WiFi), el sistema crea el ticket asignándolo al usuario solicitante y notifica al técnico para que realice el enlace dinámico del equipo al momento de acudir a resolver la falla.
2. **Modelo de 3 Roles Hospitalarios Estrictos:**
   * `USUARIO_FINAL`: Personal asistencial/administrativo. Reporta solicitudes e incidentes, consulta el estado de sus tickets y accede a las guías públicas de autoayuda.
   * `PRACTICANTE`: Personal técnico operativo de TI. Atiende tickets, registra diagnósticos y resoluciones, escala incidentes complejos y **publica directamente guías técnicas en la KEDB** (sin aprobación burocrática previa, para fomentar la agilidad).
   * `ADMINISTRADOR`: Ingeniero a cargo de TI. Control total, asignación y reasignación, aprobación de parámetros de SLA, auditoría, gestión de usuarios y generación de reportes gerenciales en PDF.
3. **Motor de SLA con Doble Notificación Obligatoria:**
   * Monitoreo de tiempos de primera respuesta y resolución mediante matriz de Impacto × Urgencia calculada estrictamente en el Backend.
   * **Alertas dobles:** Alerta visual semafórica en pantalla y **envío automático de correo electrónico** al técnico responsable y a la jefatura cuando el ticket entra en estado de advertencia (`ALERTA`) o vencimiento (`INCUMPLIDO`).
4. **Gestión de Préstamos Temporales (CMDB):**
   * Registro obligatorio de laptops, impresoras térmicas y lectores de DNIe prestados a servicios asistenciales mientras sus equipos principales están en reparación.
5. **Regla de Oro de Vocabulario en Interfaz (Cero Menciones ITIL):**
   * Toda la terminología en pantallas y reportes debe ser hospitalaria y accesible (`"Mesa de Ayuda"`, `"Nivel de Prioridad de Soporte"`, `"Compromisos de Atención"`). Las siglas "ITIL" se reservan exclusivamente para la arquitectura de código y el compendio académico.

---

## 3. Arquitectura del Backend (Spring Boot 3 + SQL Server)

El backend adopta una arquitectura en capas desacopladas (Controller -> Service -> Repository -> Entity) con las siguientes directrices:

```text
backend/src/main/java/com/hospital/servicedesk/
├── config/              # SecurityConfig (JWT + CORS), OpenAPI / Swagger
├── controllers/         # Endpoints REST (consumen y devuelven DTOs inmutables)
│   ├── AuthController.java           # Login, refresh token, sesión actual
│   ├── TicketController.java         # Operaciones de tickets de soporte
│   └── ErrorConocidoController.java  # Biblioteca KEDB
├── dtos/                # Request y Response DTOs con validaciones @Valid / @NotNull
├── entities/            # Entidades JPA mapped a SQL Server 2022
│   ├── Ticket.java, Usuario.java, Area.java, DireccionIP.java,
│   ├── ElementoConfiguracion.java, ErrorConocido.java,
│   ├── HistorialTicket.java, HistorialAsignacionIP.java
│   └── Enums: Prioridad, Impacto, Urgencia, EstadoTicket, EstadoSLA, Rol, TipoTicket, TipoCI
├── exceptions/          # GlobalExceptionHandler (@ControllerAdvice) con JSON consistente
├── repositories/        # Interfaces Spring Data JPA con consultas derivadas y JPQL
├── security/            # JwtAuthenticationFilter, JwtService, CustomUserDetailsService
└── services/            # Interfaces de lógica de negocio (SLA, cálculo de prioridad, auditoría)
    └── impl/            # Implementaciones transaccionales (@Service, @Transactional)
```

### 3.1 Modelo Relacional Núcleo (SQL Server 2022 — `db_servicedesk`)
Se conservan **12 tablas núcleo** de alta cohesión. Toda la lógica de negocio y conjuntos finitos (catálogos) se modelan en Java mediante `ENUM`s persistidos como `VARCHAR`:
* `area`: Pabellones y áreas asistenciales (Emergencia, Admisión, SIS, Cajas, UCI).
* `usuario`: Cuentas con roles `USUARIO_FINAL`, `PRACTICANTE` y `ADMINISTRADOR`.
* `elemento_configuracion`: Activos CMDB (CPUs, impresoras térmicas, switches, servidores).
* `direccion_ip`: Rango institucional de IPs con estado (`LIBRE`, `OCUPADA`, `RESERVADA`).
* `historial_asignacion_ip`: Trazabilidad histórica de asignación y liberación de IPs por equipo.
* `ticket`: Tabla transaccional central con fechas de SLA calculadas, impacto, urgencia y prioridad.
* `historial_ticket`: Auditoría append-only de cualquier cambio de estado o reasignación.
* `error_conocido`: Base de conocimiento (KEDB) con síntomas, causa raíz y workaround.

---

## 4. Estado de Avance: Lo Completado en Fase 1 (Hito A)

En la rama `develop` (fusionada desde `origin/BACKEND`) se encuentran implementados y probados:
* [x] **Configuración de Spring Security 6:** Autenticación Stateless basada en tokens Bearer JWT con clave secreta y expiración configurable.
* [x] **Manejo Centralizado de Excepciones:** `@RestControllerAdvice` que captura `MethodArgumentNotValidException`, `BadCredentialsException`, `EntityNotFoundException` y excepciones generales devolviendo estructuras JSON limpias sin stacktraces internos.
* [x] **Entidades JPA y Repositorios:** Mapeo de tablas y relaciones foráneas contra SQL Server 2022.
* [x] **Creación Automática del Esquema de Datos:** La base de datos `db_servicedesk` fue creada en el contenedor Docker `bd_sqlserver` (puerto 1433) y Hibernate generó las tablas con sus llaves y restricciones mediante `spring.jpa.hibernate.ddl-auto=update`.
* [x] **Batería de Pruebas Unitarias:** Ejecución de 5 tests (`SlaAndAuditServiceTest`, `TicketServiceTest`, `ServicedeskApplicationTests`) con resultado **BUILD SUCCESS** bajo Java 21 LTS.

---

## 5. Plan de Ejecución para la FASE 2: API de Tickets, Motor de SLA y Detección de IP

La **Fase 2** debe cerrar el circuito transaccional entre el Frontend maquetado (`/solicitudes/nuevo`) y el Backend de Spring Boot.

### 5.1 Especificación de Endpoints REST a Consolidar

| Método | Endpoint | Rol Requerido | Propósito |
|---|---|---|---|
| `POST` | `/api/tickets` | Autenticado | Crear ticket registrando usuario del token, capturando IP del cliente (`request.getRemoteAddr()`) y calculando prioridad y fechas límites de SLA. |
| `GET` | `/api/tickets/contexto-cliente` | Autenticado | Devuelve los metadatos de red del cliente: IP remota detectada, hostname, área deducida y anexo hospitalario (para poblar la molécula `contexto-equipo` del frontend). |
| `GET` | `/api/tickets` | `PRACTICANTE`, `ADMINISTRADOR` | Listar tickets con paginación, filtros por estado, prioridad, área y rango de fechas. |
| `GET` | `/api/tickets/mis-tickets` | `USUARIO_FINAL` | Listar únicamente los tickets reportados por el usuario de la sesión actual. |
| `GET` | `/api/tickets/{id}` | Autenticado | Obtener detalle completo del ticket con su historial cronológico de auditoría y relojes de SLA. |
| `PUT` | `/api/tickets/{id}/asignar` | `ADMINISTRADOR` | Asignar o reasignar un ticket a un técnico o practicante con registro en `historial_ticket`. |
| `PUT` | `/api/tickets/{id}/cambiar-estado` | `PRACTICANTE`, `ADMINISTRADOR` | Transición de estado (`EN_ATENCION`, `PENDIENTE_REPUESTO`, `RESUELTO`, `CERRADO`) validando transiciones permitidas. |

### 5.2 Lógica del Motor de SLA y Prioridad (Service Layer)
1. **Cálculo de Prioridad:** Cruzar los enums `Impacto` (`ALTO`, `MEDIO`, `BAJO`) y `Urgencia` (`ALTA`, `MEDIA`, `BAJA`) para determinar `Prioridad` (`P1_CRITICA`, `P2_ALTA`, `P3_MEDIA`, `P4_BAJA`).
2. **Cálculo de Fechas Límites de SLA:**
   * **P1 (Crítica - Emergencia / Sala de Operaciones):** Primera respuesta ≤ 15 minutos; Resolución ≤ 2 horas.
   * **P2 (Alta - Admisión / SIS):** Primera respuesta ≤ 30 minutos; Resolución ≤ 4 horas.
   * **P3 (Media - Consultorios / Estadística):** Primera respuesta ≤ 2 horas; Resolución ≤ 8 horas.
   * **P4 (Baja - Consultas generales / Equipos de soporte secundario):** Primera respuesta ≤ 4 horas; Resolución ≤ 24 horas.
3. **Auditoría Obligatoria:** Toda creación o modificación de estado debe persistir en `HistorialTicket` el ID del ticket, el usuario responsable, el estado anterior, el estado nuevo, la fecha/hora exacta y una observación técnica.

---

## 6. Comentario y Hoja de Ruta para lo que Seguirá en la FASE 3 (Backend)

> [!IMPORTANT]
> **Lo que se desarrollará en la FASE 3 del Backend:**
> Una vez consolidado el flujo transaccional de tickets y SLA de la Fase 2, la **Fase 3** se enfocará en:
> 1. **Servicio de Notificaciones Asíncronas por Correo Electrónico (`spring-boot-starter-mail`):** Envío automático de alertas cuando un ticket esté próximo al 80% de su tiempo de SLA o haya sido incumplido, notificando al técnico asignado y a la jefatura de guardia.
> 2. **Módulo de Escalamiento Formal:** Endpoint `POST /api/tickets/{id}/escalar` para que un Practicante pueda derivar el ticket al Administrador/Especialista adjuntando motivo técnico detallado, actualizando el nivel de soporte en el ticket y en la tabla de auditoría.
> 3. **Gestión de Préstamos Temporales de Activos CMDB:** Endpoints para registrar la salida temporal de CPUs, impresoras térmicas y periféricos con fecha pactada de retorno y estado de devolución.
> 4. **Módulo de Conocimiento (KEDB) y Enlace a Tickets:** Endpoint para asociar un ticket resuelto con una solución documentada (`TICKET_ERROR_CONOCIDO`) y portal público de autoayuda sin autenticación para derivación de incidentes comunes.
> 5. **Generador de Reportes Analíticos en PDF:** Servicio con librería de renderizado PDF para exportar el reporte gerencial de KPIs mensuales (tiempos de respuesta, volumen por servicio asistencial y % de cumplimiento de SLA) para sustentar presupuesto ante la dirección administrativa del hospital.
