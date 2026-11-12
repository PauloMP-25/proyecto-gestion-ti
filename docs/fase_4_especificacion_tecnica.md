# Fase 4 — Especificación Técnica: Ciclo de Vida Completo, Administración y Reportes
## Mesa de Ayuda — Hospital Santa María del Socorro (HSMSI)

> **Autor:** Arquitecto de Software (Claude) · **Fecha:** 12 de noviembre de 2026
> **Destinatarios:** Equipo Backend (2) · Equipo Frontend (2) · Agente Obrero (Antigravity / Gemini)
> **Rama base:** `develop` · **Stack:** Spring Boot 3 / Java 21 · SQL Server 2022 · Angular 19 (Standalone, Signals)
> **Estado:** Propuesta para aprobación (resolver §0.2 antes de codificar)
>
> **Aviso de alcance del análisis:** este documento se basa en la documentación del repositorio (`resumen_actualizacion…`, `informe_consolidado…`, `Diseno_BD…`, `fase_1`, `proyecto_final_gestion`) y en la especificación de Fase 3. **No tuve acceso al código fuente del backend.** Los nombres reales de tablas/columnas/clases (p. ej. `TICKET` vs `TICKETS`) deben verificarse antes de ejecutar las migraciones (marcados con ⚠️).

---

## 0. Resumen, decisiones y discrepancias

### 0.1 Alcance de la Fase 4

| Bloque | Entregable |
|---|---|
| **Backend** | 8 endpoints del ciclo de vida · endpoints complementarios que el front de Fase 3 ya consume · motor SLA `@Scheduled` · auditoría inmutable · préstamos de equipos · reasignación/carga · mantenimiento de catálogos · API editorial del Centro de Soluciones · reportes PDF · migraciones Flyway |
| **Frontend** | Conmutación gradual a HTTP real · Bandeja de Escalamientos (N2) · Reasignación y carga del equipo · Mantenimiento de catálogos · Editor del Centro de Soluciones · Reportes PDF · (Should) Módulo de Préstamos |
| **Calidad** | Pruebas unitarias, de integración (Testcontainers + SQL Server), de contrato y E2E (Playwright), UAT con el hospital |
| **Fuera de alcance** | Gestión de usuarios/contraseñas desde UI (alta/baja de cuentas), WebSockets/SSE, notificaciones push, modo nocturno, portal público sin autenticación, integración con GALENHOS/HIS |

### 0.2 Decisiones y preguntas abiertas (el equipo debe responderlas en la tarea **C0.1**)

| ID | Tema | Recomendación del Arquitecto | Por qué |
|---|---|---|---|
| **D-01** | Verbos HTTP: Fase 3 definió `PUT /tomar`, `PUT /escalar`, `POST /solucion`; esta solicitud define `POST` para todas las acciones | **Adoptar los `POST` de esta solicitud** (estilo comando). Mantener `PUT /estado`, `PUT /asignar`, `PUT /escalar` existentes como **`@Deprecated`** hasta migrar el front (D-task D2) y retirarlos en Fase 5. | Un solo estilo; no rompe lo ya implementado. Los `*.http.ts` de Fase 3 son stubs: su ajuste es barato. |
| **D-02** | `confirmar` con calificación vs. flujo ya construido (confirmar → luego calificar) | `POST /confirmar` acepta **calificación opcional** en el cuerpo y además existe `POST /calificacion` para el 2.º paso. | Satisface esta solicitud y el front entregado (que califica *después* de cerrar). |
| **D-03** | Nombres de campos: `solucionAplicada`/`articuloKedbId`/`detallesTecnicos` (solicitud) vs `accionRealizada`/`articuloConocimientoId` (front entregado) | Contrato canónico = **nombres del front** (`accionRealizada`, `articuloConocimientoId`). El backend acepta los alias con `@JsonAlias`. | Evita retrabajo de 116 pruebas y mappers. |
| **D-04** | `GET /api/contexto-cliente` “sin login previo” | **Autenticado por defecto.** Modo público solo con `servicedesk.contexto.publico=true`, allow-list de CIDR del hospital, *rate-limit* y payload mínimo (§1.6-E8). | Exponer hostname/área/anexo por IP sin autenticación revela inventario interno. |
| **D-05** | Efecto de **reabrir** sobre el compromiso de atención | Reabrir **inicia un ciclo nuevo**: `FechaInicioSLA = ahora`, nuevos límites según prioridad, `NumeroReaperturas++`. Se conservan los indicadores de incumplimiento ya ocurridos. | Si no, un ticket reabierto nace “vencido” y el semáforo pierde sentido. **Validar con la Jefatura de TI.** |
| **D-06** | Horas **24/7** (implementado en `MotorSlaService`) vs “horas laborales” para P3/P4 (capítulo V del informe académico) | Mantener **24/7** y tiempos configurables (`CONFIGURACION_SLA`). Documentar la diferencia en el capítulo XIV. | El código ya lo hace así; cambiarlo exige calendario laboral (feriados de Perú). |
| **D-07** | `spring.jpa.hibernate.ddl-auto=update` | Adoptar **Flyway** (baseline del esquema actual) y pasar a `ddl-auto=validate`. | Auditoría inmutable, triggers e índices filtrados no se pueden gestionar con `update`. |
| **D-08** | Librería PDF | **Thymeleaf + OpenHTMLtoPDF** (LGPL). Evitar iText 7+ (AGPL). | Membrete/maquetación con HTML-CSS que el equipo ya domina. |
| **D-09** | Gestión de usuarios (alta/baja de cuentas) | Fuera de alcance: cuentas por script de *seed* y Flyway. Registrar como Fase 5. | El informe académico (cap. VII.5) lo menciona; no está en esta solicitud. |
| **D-10** | Falta UI de **Préstamos** (el backend se pide, el front no) | Incluir tarea D-PREST como *Should*. | Un backend sin pantalla no se puede demostrar ni validar. |
| **D-11** | `/escalamiento` hoy figura accesible a `PRACTICANTE` en la matriz de rutas | Restringirla a **`ADMINISTRADOR`** (cola N2). El practicante ve sus derivados en *Historial del turno*. | El Administrador es el Nivel 2; el practicante no atiende esa cola. |
| **D-12** | Logo para PDF | El equipo exporta `logo-hsmsi.png` (fondo transparente, ≥ 600 px) a `backend/src/main/resources/reportes/`. | OpenHTMLtoPDF no renderiza `.ico`. |
| **D-13** | Refresh de JWT | Si `AuthController` ya emite *refresh token*, usarlo (un solo intento por 401, *single-flight*); si no, **logout limpio** al expirar. | Evitar estado a medias en turnos largos. |
| **D-14** | TLS | Servir front + API tras **nginx con HTTPS** (CA interna) en el despliegue; en desarrollo, `proxy.conf.json`. | JWT y credenciales no deben viajar en HTTP plano en la LAN hospitalaria. |

### 0.3 Ajustes a la especificación de Fase 3 (derivados de esta revisión)

| # | Cambio | Motivo |
|---|---|---|
| A1 | `SOLUCION_TICKET` pasa a tener columnas separadas `Diagnostico(600)`, `AccionRealizada(1200)`, `Insumos(200)` | **Error mío en Fase 3:** componer los tres campos en `Descripcion VARCHAR(2000)` con rótulos supera 2000 en el peor caso (600+1200+200+≈32). |
| A2 | La bandeja de turno usa un endpoint dedicado `GET /api/tickets/mi-turno?vista=…` (no `GET /api/tickets` con filtros) | La vista *Historial del turno* tiene reglas propias (hoy, mío, resueltos/cerrados/escalados). |
| A3 | `GET /api/tickets/turno/resumen` (Fase 3) → `GET /api/tickets/mi-turno/resumen` | Alinea con esta solicitud. |
| A4 | `FechaInicioSLA` (nueva) reemplaza a `FechaCreacion` como `inicioIso` en `slaVista` | Necesario para D-05. |
| A5 | Vocabulario del personal técnico: *CMDB → “Catálogo de Equipos”*, *KEDB → “Centro de Soluciones”*, *SLA → “Compromisos de Atención”* | Regla de esta solicitud; actualizar el skill `vocabulario-asistencial-sin-itil` a v1.1. |
| A6 | `environment.usarMocks` pasa a poder sobrescribirse **por dominio** (`mocksActivos`) | Conmutación gradual con *rollback* por servicio (§2.1). |

---

## 1. ARQUITECTURA Y ESPECIFICACIÓN BACKEND

### 1.1 Principios de arquitectura

1. **Capas:** `Controller → Service → Repository → Entity`. Controladores sin lógica de negocio (`AGENTS.md §2`); la lógica de SLA, transiciones y permisos vive en *services*.
2. **Máquina de estados única** (`TicketEstadoMachine`): tabla de transiciones permitidas por rol y estado; ningún *service* cambia `estado` por fuera de ella.
3. **Tiempo inyectable:** todo uso de “ahora” pasa por `java.time.Clock` (bean). Almacenamiento en **UTC** (`DATETIME2(0)`), JSON en ISO-8601 con `Z`; el front formatea en `America/Lima`. Config: `spring.jackson.serialization.write-dates-as-timestamps=false`, `spring.jpa.properties.hibernate.jdbc.time_zone=UTC`.
4. **Auditoría en la misma transacción** que el cambio (§1.8).
5. **Autorización en dos capas:** rol (`@PreAuthorize`) **y** propiedad del recurso (solicitante, técnico asignado). Para recursos ajenos del usuario final se responde **404** (no revelar existencia).
6. **Validación de servidor siempre**, con normalización equivalente al front (`textoUtil`: *trim* + espacios colapsados) mediante una restricción propia `@TextoUtil(min, max)`.
7. **Errores:** se mantiene el formato canónico del `GlobalExceptionHandler`; se añade el campo estable `codigo` (§1.4) que el front mapea a mensajes asistenciales. Nunca *stack traces*.
8. **Paquetes nuevos** bajo `com.hospital.servicedesk`:

```text
├── tickets/
│   ├── TicketEstadoMachine.java        # transiciones + roles
│   ├── TicketCicloVidaService.java     # tomar, iniciar, resolver, escalar, confirmar, reabrir, calificar
│   ├── TicketTurnoService.java         # mi-turno + resumen
│   ├── TicketSeguridad.java            # bean @ticketSeguridad (esSolicitante, esAsignado)
│   └── dto/  (records inmutables)
├── sla/        MotorSlaService.java · SlaScheduler.java · AlertaSlaEvent.java · AlertaSlaListener.java
├── auditoria/  AuditoriaTicketService.java · HistorialTicket.java (@Immutable) · HistorialTicketRepository.java
├── prestamos/  PrestamoService.java · PrestamoController.java …
├── reportes/   ReporteCumplimientoService.java · ReportePdfService.java · plantillas Thymeleaf
├── indicadores/IndicadoresService.java      # ÚNICA fuente de fórmulas de KPI (dashboard y reportes)
├── catalogos/  AreaService · EquipoService · RangoIpService · SlaConfiguracionService
├── conocimiento/ ConocimientoService (KEDB) …
└── comun/      ClienteIpResolver.java · TextoUtil.java · ClockConfig.java · CodigoError.java
```

### 1.2 Migraciones Flyway (⚠️ verificar nombres reales de tablas)

**Estrategia:** `V1__esquema_base.sql` = esquema actual (volcado del esquema generado por Hibernate; `baseline-on-migrate=true` en entornos existentes) → `V2…V6` incrementales → `ddl-auto=validate`. Perfil `demo` añade `db/demo/R__datos_demo.sql` (usuarios con BCrypt, áreas, IPs y tickets de ejemplo).

```sql
-- V2__ciclo_vida_ticket.sql
ALTER TABLE TICKET ADD
    Version                INT          NOT NULL CONSTRAINT DF_TICKET_Version DEFAULT 0,        -- @Version (bloqueo optimista)
    FechaInicioSLA         DATETIME2(0) NULL,                                                   -- D-05 / A4
    NumeroReaperturas      INT          NOT NULL CONSTRAINT DF_TICKET_Reap DEFAULT 0,
    IncumplioRespuesta     BIT          NOT NULL CONSTRAINT DF_TICKET_IncResp DEFAULT 0,        -- banderas pegajosas para KPI
    IncumplioResolucion    BIT          NOT NULL CONSTRAINT DF_TICKET_IncReso DEFAULT 0,
    CalificacionPuntuacion TINYINT      NULL,
    CalificacionComentario VARCHAR(300) NULL,
    FechaCalificacion      DATETIME2(0) NULL;
GO
UPDATE TICKET SET FechaInicioSLA = FechaCreacion WHERE FechaInicioSLA IS NULL;
ALTER TABLE TICKET ALTER COLUMN FechaInicioSLA DATETIME2(0) NOT NULL;
ALTER TABLE TICKET ADD CONSTRAINT CK_TICKET_Calificacion CHECK (CalificacionPuntuacion BETWEEN 1 AND 5);
CREATE INDEX IX_TICKET_Estado_Asignado ON TICKET (Estado, IdUsuarioAsignado)
    INCLUDE (Prioridad, EstadoSLA, FechaLimiteRespuesta, FechaLimiteResolucion, FechaCreacion);
CREATE INDEX IX_TICKET_Solicitante ON TICKET (IdUsuarioSolicitante, Estado);

ALTER TABLE SOLUCION_TICKET ADD
    Diagnostico VARCHAR(600) NULL, AccionRealizada VARCHAR(1200) NULL, Insumos VARCHAR(200) NULL;   -- A1 (Descripcion queda NULL-able/obsoleta)
ALTER TABLE ESCALAMIENTO ADD
    DetallesTecnicos VARCHAR(1000) NULL,
    IdCategoriaN2 INT NULL CONSTRAINT FK_ESC_CatN2 REFERENCES CATEGORIA(IdCategoria);
```

```sql
-- V3__auditoria_inmutable.sql
ALTER TABLE HISTORIAL_TICKET ADD
    TipoEvento     VARCHAR(20)  NOT NULL CONSTRAINT DF_HIST_Tipo DEFAULT 'CAMBIO_ESTADO',
    Visibilidad    VARCHAR(7)   NOT NULL CONSTRAINT DF_HIST_Vis DEFAULT 'INTERNA',
    MensajePublico VARCHAR(200) NULL,       -- alimenta GET /seguimiento (usuario final)
    DatoAnterior   VARCHAR(100) NULL,
    DatoNuevo      VARCHAR(100) NULL,
    IpOrigen       VARCHAR(45)  NULL;
ALTER TABLE HISTORIAL_TICKET ALTER COLUMN EstadoNuevo VARCHAR(20) NULL;
GO
ALTER TABLE HISTORIAL_TICKET ADD
  CONSTRAINT CK_HIST_Tipo CHECK (TipoEvento IN ('CREACION','ASIGNACION','REASIGNACION','CAMBIO_ESTADO','ESCALAMIENTO',
                                                'SOLUCION','REAPERTURA','CALIFICACION','SLA_ALERTA','SLA_INCUMPLIDO','PRESTAMO')),
  CONSTRAINT CK_HIST_Vis  CHECK (Visibilidad IN ('INTERNA','PUBLICA')),
  CONSTRAINT CK_HIST_Estado CHECK (TipoEvento <> 'CAMBIO_ESTADO' OR EstadoNuevo IS NOT NULL);
CREATE INDEX IX_HIST_Ticket ON HISTORIAL_TICKET (IdTicket, FechaCambio);
GO
CREATE TRIGGER TR_HISTORIAL_TICKET_INMUTABLE ON HISTORIAL_TICKET INSTEAD OF UPDATE, DELETE AS
BEGIN
    THROW 51000, 'HISTORIAL_TICKET es inmutable: no se permite UPDATE ni DELETE.', 1;
END;
GO
-- Usuario de sistema para eventos automáticos (no puede iniciar sesión)
INSERT INTO USUARIO (Nombres, Apellidos, Correo, ContrasenaHash, Rol, IdArea, Activo, FechaCreacion)
SELECT 'Sistema', 'Automático', 'sistema@hsmsi.local', 0x00, 'ADMINISTRADOR', (SELECT TOP 1 IdArea FROM AREA ORDER BY IdArea), 0, SYSUTCDATETIME()
WHERE NOT EXISTS (SELECT 1 FROM USUARIO WHERE Correo = 'sistema@hsmsi.local');
```

```sql
-- V4__prestamos.sql  (ajustar a la tabla PRESTAMO_EQUIPO ya mapeada ⚠️)
-- Columnas objetivo: IdPrestamo, IdCI (equipo prestado), IdCIOriginal NULL, IdTicket NULL, IdAreaDestino,
-- IdUsuarioEntrego, IdUsuarioRecibio NULL, FechaEntrega, FechaDevolucionPactada, FechaDevolucionReal NULL,
-- EstadoDevolucion VARCHAR(12) NULL CHECK IN ('OPERATIVO','CON_DANOS','INCOMPLETO'), Observaciones VARCHAR(300) NULL
CREATE UNIQUE INDEX UX_PRESTAMO_VIGENTE ON PRESTAMO_EQUIPO (IdCI) WHERE FechaDevolucionReal IS NULL;   -- 1 préstamo vigente por equipo
CREATE INDEX IX_PRESTAMO_Vencimiento ON PRESTAMO_EQUIPO (FechaDevolucionPactada) WHERE FechaDevolucionReal IS NULL;
```

```sql
-- V5__catalogos_y_conocimiento.sql
ALTER TABLE AREA ADD Activo BIT NOT NULL CONSTRAINT DF_AREA_Activo DEFAULT 1;       -- baja lógica; ⚠️ Anexo ya existe?
ALTER TABLE ERROR_CONOCIDO ADD
    SolucionDefinitiva VARCHAR(2000) NULL,
    EsPublico          BIT          NOT NULL CONSTRAINT DF_EC_Publico DEFAULT 0,        -- visible para USUARIO_FINAL (H5)
    Estado             VARCHAR(10)  NOT NULL CONSTRAINT DF_EC_Estado  DEFAULT 'PUBLICADO',
    FechaActualizacion DATETIME2(0) NULL,
    IdUsuarioEdicion   INT NULL REFERENCES USUARIO(IdUsuario),
    Version            INT NOT NULL CONSTRAINT DF_EC_Version DEFAULT 0;
ALTER TABLE ERROR_CONOCIDO ADD CONSTRAINT CK_EC_Estado CHECK (Estado IN ('BORRADOR','PUBLICADO','ARCHIVADO'));
CREATE INDEX IX_EC_Busqueda ON ERROR_CONOCIDO (Estado, IdCategoria) INCLUDE (Titulo);
```

> **Nota:** `HISTORIAL_TICKET` además queda protegido por **permisos**: la cuenta de la aplicación debe tener `INSERT, SELECT` y **no** `UPDATE/DELETE` (script `V3b__permisos.sql` o configuración del contenedor).

### 1.3 Máquina de estados (única fuente de verdad)

| Acción | Rol | Estado origen (y condición) | Estado destino | Efectos principales |
|---|---|---|---|---|
| `tomar` | `PRACTICANTE` | `NUEVO`, o `REABIERTO` **sin asignado**; nivel N1 | `ASIGNADO` (o `EN_PROCESO` si `iniciarAtencion`) | `IdUsuarioAsignado = yo`, `FechaAsignacion`; si inicia, `FechaRespuestaReal` |
| `tomar` | `ADMINISTRADOR` | `ESCALADO` (sin asignado) o `NUEVO` | `ASIGNADO` (nivel N2) | igual |
| `iniciar` | asignado (`PRACTICANTE`/`ADMINISTRADOR`) | `ASIGNADO` ∨ `REABIERTO` (míos) | `EN_PROCESO` | `FechaRespuestaReal` (si es nula); evalúa `IncumplioRespuesta` |
| `resolver` | asignado ∨ `ADMINISTRADOR` | `EN_PROCESO` | `RESUELTO` | crea `SOLUCION_TICKET`; `FechaResolucionReal`; evalúa `IncumplioResolucion`; vincula artículo |
| `escalar` | **solo `PRACTICANTE`** asignado | `ASIGNADO` ∨ `EN_PROCESO` ∨ `REABIERTO` | `ESCALADO` | `NivelSoporteActual = N2`, `IdUsuarioAsignado = NULL`, fila en `ESCALAMIENTO` |
| `confirmar` | `USUARIO_FINAL` solicitante | `RESUELTO` | `CERRADO` | `FechaCierre`; calificación opcional |
| `reabrir` | `USUARIO_FINAL` solicitante | `RESUELTO` | `REABIERTO` | ciclo SLA nuevo (D-05); conserva técnico si sigue activo |
| `calificar` | `USUARIO_FINAL` solicitante | `CERRADO` y sin calificación | (sin cambio) | guarda puntuación |
| `reasignar` | `ADMINISTRADOR` | `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `REABIERTO`, `ESCALADO` | (conserva; si era `ESCALADO` → `ASIGNADO`) | nivel según rol del destino (`PRACTICANTE`→N1, `ADMINISTRADOR`→N2); motivo obligatorio |

Cualquier otra combinación → `409 TRANSICION_INVALIDA`. La tabla se implementa como datos (mapa estático) y se prueba **exhaustivamente** (todas las celdas estado × acción × rol).

### 1.4 Convenciones REST

- **Base:** `/api`. JSON UTF-8. Seguridad: `Authorization: Bearer <jwt>` en todo salvo `POST /api/auth/login`.
- **Paginación** (compatible con el modelo `Pagina<T>` del front): `{ "contenido": [...], "total": 42, "tamano": 10, "pagina": 0 }` (pagina base 0). Parámetros: `pagina`, `tamano` (máx. 50).
- **Fechas:** ISO-8601 UTC (`2026-11-12T14:02:11Z`). Todos los DTO de ticket incluyen `ahoraServidorIso`.
- **Formato de error** (se añade `codigo`):

```json
{ "timestamp": "2026-11-12T14:02:11Z", "status": 409, "codigo": "TICKET_YA_TOMADO",
  "mensaje": "El ticket ya fue tomado por otro técnico.", "ruta": "/api/tickets/231/tomar", "detalles": [] }
```

| `codigo` | HTTP | Cuándo |
|---|---|---|
| `VALIDACION` | 400 | Cuerpo/parámetros inválidos (`detalles[]` con campo y motivo) |
| `NO_AUTENTICADO` | 401 | Token ausente/expirado |
| `ROL_NO_PERMITIDO` | 403 | Rol sin permiso para la acción |
| `TICKET_NO_ENCONTRADO` | 404 | No existe **o** no pertenece al usuario final |
| `TICKET_YA_TOMADO` | 409 | Otro técnico lo tomó primero |
| `TRANSICION_INVALIDA` | 409 | Estado actual no permite la acción |
| `CONFLICTO_VERSION` | 409 | `ObjectOptimisticLockingFailureException` |
| `CALIFICACION_YA_REGISTRADA` | 409 | Ya fue calificado |
| `EQUIPO_NO_DISPONIBLE` | 409 | Equipo con préstamo vigente o en baja/mantenimiento |
| `RANGO_IP_INVALIDO` | 400 | Rango mal formado o > 1024 direcciones |
| `RANGO_FECHAS_INVALIDO` | 400 | `desde > hasta` o más de 366 días |
| `RECURSO_EN_USO` | 409 | Baja de área/equipo con dependencias activas |

### 1.5 Los 8 endpoints del ciclo de vida

> `TicketTurnoResponse` (respuesta común del personal técnico):

```json
{
  "id": 231, "codigo": "INC-2026-00231", "titulo": "Sin conexión a GalenHos", "descripcion": "Desde las 7:50…",
  "prioridad": "CRITICA", "estado": "EN_PROCESO", "nivelSoporte": "N1",
  "categoriaId": 4, "categoriaNombre": "Sistemas clínicos",
  "areaNombre": "Admisión", "solicitanteNombre": "A. Ramos", "anexo": "2210",
  "equipo": { "hostname": "HSP-ADM-01", "ip": "10.20.30.15", "areaNombre": "Admisión", "anexo": "2210" },
  "asignadoA": { "id": 7, "nombre": "Carlos P." }, "esMio": true, "reabierto": false,
  "fechaCreacionIso": "2026-11-12T12:50:00Z",
  "slaVista": { "inicioIso": "2026-11-12T12:50:00Z", "limiteRespuestaIso": "2026-11-12T13:05:00Z",
                "limiteResolucionIso": "2026-11-12T14:50:00Z", "respuestaRealIso": "2026-11-12T12:58:00Z", "estadoSla": "A_TIEMPO" },
  "ahoraServidorIso": "2026-11-12T13:30:02Z"
}
```

(Los valores de `prioridad` siguen el enum **existente** en `develop`; ver hallazgo H2 de Fase 3.)

---

#### E1 · `POST /api/tickets/{id}/tomar`
- **Roles:** `PRACTICANTE`, `ADMINISTRADOR` (según §1.3).
- **Request:** `{ "iniciarAtencion": true }` (opcional; por defecto `false`).
- **Response 200:** `TicketTurnoResponse`.
- **Concurrencia (obligatoria, dos defensas):**
  1. **Actualización condicional atómica** (decide al ganador):
     ```sql
     UPDATE TICKET SET IdUsuarioAsignado = :uid, Estado = :nuevo, FechaAsignacion = :ahora, Version = Version + 1
     WHERE IdTicket = :id AND IdUsuarioAsignado IS NULL AND Estado IN (:origenesPermitidos)
     ```
     `filasAfectadas = 0` → releer: si ya es **mío** → `200` idempotente; si es de otro → `409 TICKET_YA_TOMADO`; si estado inválido → `409 TRANSICION_INVALIDA`.
  2. `@Version` en la entidad (`ObjectOptimisticLockingFailureException` → `409 CONFLICTO_VERSION`) como red de seguridad para el resto de transiciones.
- **Auditoría:** `ASIGNACION` (+ `CAMBIO_ESTADO` si inicia). Mensaje público: “Un técnico tomó su caso.”
- **Errores:** `404`, `403`, `409` (arriba).

```gherkin
Característica: Tomar un ticket
  Escenario: [G-C1-01] El practicante toma un ticket nuevo
    Dado un ticket "NUEVO" sin asignar y el practicante "Carlos" autenticado
    Cuando envía POST /api/tickets/231/tomar con iniciarAtencion=false
    Entonces responde 200 con estado "ASIGNADO" y asignadoA "Carlos"
    Y existe un evento de historial "ASIGNACION" de "Carlos"
  Escenario: [G-C1-02] Tomar y comenzar registra la primera respuesta
    Dado un ticket "NUEVO" sin asignar
    Cuando el practicante envía iniciarAtencion=true
    Entonces el estado es "EN_PROCESO" y "respuestaRealIso" tiene valor
  Escenario: [G-C1-03] Dos practicantes toman el mismo ticket a la vez
    Dado un ticket "NUEVO" y dos practicantes enviando la petición simultáneamente
    Entonces exactamente una respuesta es 200 y la otra es 409 con codigo "TICKET_YA_TOMADO"
    Y el ticket queda asignado a un único técnico y con un único evento de asignación
  Escenario: [G-C1-04] Reintento idempotente
    Dado un ticket ya tomado por "Carlos"
    Cuando "Carlos" repite POST /tomar
    Entonces responde 200 sin crear un segundo evento de historial
  Escenario: [G-C1-05] Un usuario final no puede tomar
    Cuando un "USUARIO_FINAL" envía POST /tomar
    Entonces responde 403 con codigo "ROL_NO_PERMITIDO"
```

#### E2 · `POST /api/tickets/{id}/iniciar`
- **Roles:** técnico asignado (`PRACTICANTE`/`ADMINISTRADOR`). **Sin cuerpo.**
- **Reglas:** `ASIGNADO`∨`REABIERTO` → `EN_PROCESO`; si `FechaRespuestaReal` es nula la fija a `ahora` y marca `IncumplioRespuesta` si `ahora > FechaLimiteRespuesta`; a partir de aquí el compromiso vigente es el de **resolución**.
- **Response 200:** `TicketTurnoResponse`. **Errores:** `403` si no es el asignado, `409 TRANSICION_INVALIDA`.

```gherkin
  Escenario: [G-C2-01] Iniciar atención registra el inicio real
    Dado un ticket "ASIGNADO" a "Carlos" sin respuesta real
    Cuando "Carlos" envía POST /iniciar
    Entonces el estado es "EN_PROCESO" y "respuestaRealIso" = hora del servidor
  Escenario: [G-C2-02] Respuesta tardía marca el incumplimiento
    Dado un ticket cuyo límite de respuesta ya pasó
    Cuando se inicia la atención
    Entonces "IncumplioRespuesta" queda en verdadero y el ticket sigue siendo atendible
  Escenario: [G-C2-03] Un técnico distinto no puede iniciar
    Dado un ticket "ASIGNADO" a "Carlos"
    Cuando "Luis" envía POST /iniciar
    Entonces responde 403
```

#### E3 · `GET /api/tickets/mi-turno/resumen`
- **Roles:** `PRACTICANTE`. **Response 200:**
```json
{ "asignados": 3, "porVencer": 1, "vencidos": 1, "resueltosHoy": 5, "hayP1SinTomar": true, "ahoraServidorIso": "2026-11-12T13:30:02Z" }
```
- **Definiciones:** `asignados` = míos en `ASIGNADO/EN_PROCESO/REABIERTO`; `porVencer` = míos con `EstadoSLA='ALERTA'`; `vencidos` = míos con `'INCUMPLIDO'`; `resueltosHoy` = míos con `FechaResolucionReal ≥ inicio del día en America/Lima` (convertido a UTC); `hayP1SinTomar` = existe `NUEVO`, prioridad crítica, sin asignado (**global**, no solo míos).
- **Implementación:** **una sola consulta** con agregación condicional (`SUM(CASE WHEN … THEN 1 ELSE 0 END)`) sobre `IX_TICKET_Estado_Asignado`. Objetivo < 150 ms con 10 000 tickets.
- **Ruta:** literal `/mi-turno/resumen` (no choca con `/{id}`).

```gherkin
  Escenario: [G-C3-01] Contadores del turno
    Dado "Carlos" con 2 tickets en proceso (1 en ALERTA), 1 INCUMPLIDO y 5 resueltos hoy
    Y un ticket crítico NUEVO sin asignar
    Cuando consulta /mi-turno/resumen
    Entonces asignados=3, porVencer=1, vencidos=1, resueltosHoy=5, hayP1SinTomar=true
  Escenario: [G-C3-02] El día se mide en hora de Lima
    Dado un ticket resuelto a las 23:30 de ayer (hora Lima)
    Entonces no cuenta en resueltosHoy
```

#### E4 · `POST /api/tickets/{id}/confirmar`
- **Roles:** `USUARIO_FINAL` **solicitante**. **Request (todo opcional):** `{ "puntuacion": 5, "comentario": "Rápido, gracias" }` (D-02).
- **Reglas:** `RESUELTO → CERRADO`; `FechaCierre = ahora`; si viene `puntuacion` (1–5) se guarda en la misma transacción (`comentario ≤ 300` útiles).
- **Response 200:** `SolicitudDetalleResponse` (§1.6). **Errores:** `404` (no es suyo / no existe), `409 TRANSICION_INVALIDA`, `400 VALIDACION` (puntuación fuera de rango).
- **Auditoría:** `CAMBIO_ESTADO` (+ `CALIFICACION` si aplica), público: “Solicitud cerrada. ¡Gracias por avisarnos!”.

```gherkin
  Escenario: [G-C4-01] Confirmar sin calificación
    Dado un ticket "RESUELTO" de la usuaria "Dra. Ramírez"
    Cuando ella envía POST /confirmar sin cuerpo
    Entonces el estado es "CERRADO" y la calificación queda vacía
  Escenario: [G-C4-02] Confirmar con calificación
    Cuando envía { "puntuacion": 5, "comentario": "Excelente" }
    Entonces el estado es "CERRADO" y la puntuación guardada es 5
  Escenario: [G-C4-03] No puede confirmar un ticket ajeno
    Dado un ticket "RESUELTO" de otra persona
    Cuando la usuaria envía POST /confirmar
    Entonces responde 404 con codigo "TICKET_NO_ENCONTRADO"
  Escenario: [G-C4-04] No se confirma un ticket que no está resuelto
    Dado un ticket "EN_PROCESO" propio
    Entonces POST /confirmar responde 409 "TRANSICION_INVALIDA"
```

#### E5 · `POST /api/tickets/{id}/reabrir`
- **Roles:** `USUARIO_FINAL` solicitante. **Request:** `{ "motivo": "Sigue sin imprimir" }` (`@TextoUtil(10, 300)`).
- **Reglas (D-05):** `RESUELTO → REABIERTO`; `NumeroReaperturas++`; `FechaInicioSLA = ahora`; recalcular `FechaLimiteRespuesta/Resolucion` con la configuración vigente de su prioridad; `FechaRespuestaReal = NULL`, `EstadoSLA = A_TIEMPO`; conservar `IdUsuarioAsignado` si el técnico sigue activo (si no, `NULL` → vuelve a la cola). Las banderas `Incumplio*` **no** se limpian.
- **Auditoría:** `REAPERTURA` con el motivo (`INTERNA`) + hito público “Reabierta por usted”.

```gherkin
  Escenario: [G-C5-01] Reabrir con motivo
    Dado un ticket "RESUELTO" propio atendido por "Carlos"
    Cuando envía POST /reabrir con motivo "Sigue sin imprimir"
    Entonces el estado es "REABIERTO", asignadoA sigue siendo "Carlos" y numeroReaperturas=1
    Y los límites de compromiso se recalculan desde ahora
  Escenario: [G-C5-02] Motivo insuficiente
    Cuando el motivo tiene 5 caracteres útiles
    Entonces responde 400 "VALIDACION" con detalle del campo "motivo"
  Escenario: [G-C5-03] El técnico inactivo libera el ticket
    Dado que "Carlos" fue dado de baja
    Cuando se reabre el ticket
    Entonces queda sin asignado y visible en "Por tomar"
```

#### E6 · `POST /api/tickets/{id}/resolver`
- **Roles:** técnico asignado o `ADMINISTRADOR`. **Request (D-03, alias aceptados):**
```json
{ "diagnostico": "Cable de red dañado en el puesto", "accionRealizada": "Se reemplazó el cable y se probó GalenHos",
  "insumosUtilizados": "Cable UTP Cat6 3 m", "tipoSolucion": "DEFINITIVA", "articuloConocimientoId": 12 }
```
  (`@JsonAlias`: `solucionAplicada` → `accionRealizada`; `articuloKedbId` → `articuloConocimientoId`.)
- **Validación:** `diagnostico` 20–600, `accionRealizada` 20–1200, `insumosUtilizados` ≤ 200 (opcional), `tipoSolucion ∈ {DEFINITIVA, TEMPORAL}`; `articuloConocimientoId` debe existir y estar `PUBLICADO`.
- **Reglas:** `EN_PROCESO → RESUELTO`; inserta `SOLUCION_TICKET` (`EsSolucionFinal = tipo==='DEFINITIVA'`); `FechaResolucionReal = ahora`; `IncumplioResolucion` si `ahora > límite`; si hay artículo, inserta `TICKET_ERROR_CONOCIDO` (ignorar duplicado). Congela `EstadoSLA`.
- **Auditoría:** `SOLUCION` (interna, con resumen) + `CAMBIO_ESTADO` (público: “Su solicitud fue atendida. Necesitamos su confirmación.”).
- **Response 200:** `TicketTurnoResponse`.

```gherkin
  Escenario: [G-C6-01] Resolver con solución definitiva y artículo
    Dado un ticket "EN_PROCESO" asignado a "Carlos" y un artículo "PUBLICADO"
    Cuando envía diagnóstico, acción y el artículo
    Entonces el estado es "RESUELTO", existe 1 fila en SOLUCION_TICKET con EsSolucionFinal=1
    Y existe el vínculo ticket-artículo
  Escenario: [G-C6-02] Solución temporal
    Cuando tipoSolucion es "TEMPORAL"
    Entonces EsSolucionFinal=0 y el ticket igualmente queda "RESUELTO"
  Escenario: [G-C6-03] Resolver fuera de plazo
    Dado un ticket con límite de resolución vencido
    Cuando se resuelve
    Entonces "IncumplioResolucion" es verdadero
  Escenario: [G-C6-04] Textos demasiado cortos
    Cuando el diagnóstico tiene 10 caracteres útiles
    Entonces responde 400 "VALIDACION"
  Escenario: [G-C6-05] Artículo no publicado
    Cuando articuloConocimientoId apunta a un artículo "BORRADOR"
    Entonces responde 400 "VALIDACION"
```

#### E7 · `POST /api/tickets/{id}/escalar`
- **Roles:** **solo `PRACTICANTE`** asignado (el Administrador no escala).
- **Request:** `{ "motivo": "…", "detallesTecnicos": "…", "categoriaN2Id": 9 }` — `motivo` obligatorio `@TextoUtil(20, 300)`; `detallesTecnicos` opcional ≤ 1000; `categoriaN2Id` opcional (categoría sugerida para Nivel 2, debe existir).
- **Reglas:** `ASIGNADO|EN_PROCESO|REABIERTO → ESCALADO`; `NivelSoporteActual = N2`; `IdUsuarioAsignado = NULL`; `ESCALAMIENTO(NivelOrigen=N1, NivelDestino=N2, IdUsuarioOrigen, Motivo, DetallesTecnicos, IdCategoriaN2)`. El **cronómetro de resolución continúa** (el ticket no pausa).
- **Auditoría:** `ESCALAMIENTO` (interna con motivo) + público “Su caso está siendo atendido por un especialista.” (sin motivo).
- **Notificación:** `AlertaEscalamientoEvent` → correo a `ADMINISTRADOR`es activos (async, sin bloquear).

```gherkin
  Escenario: [G-C7-01] Escalar con motivo válido
    Dado un ticket "EN_PROCESO" de "Carlos"
    Cuando envía POST /escalar con un motivo de 35 caracteres útiles
    Entonces el estado es "ESCALADO", nivelSoporte "N2" y asignadoA es nulo
    Y existe una fila en ESCALAMIENTO con el motivo
  Escenario: [G-C7-02] Motivo de 19 caracteres
    Entonces responde 400 "VALIDACION" y el ticket no cambia
  Escenario: [G-C7-03] El administrador no puede escalar
    Cuando un "ADMINISTRADOR" envía POST /escalar
    Entonces responde 403 "ROL_NO_PERMITIDO"
  Escenario: [G-C7-04] El usuario final nunca ve el motivo
    Cuando la usuaria consulta GET /seguimiento
    Entonces ningún hito contiene el texto del motivo
```

#### E8 · `GET /api/contexto-cliente`
- **Roles:** autenticado (D-04). **Response 200:**
```json
{ "ipDetectada": "10.20.30.15", "hostname": "HSP-ADM-01", "equipoId": 18, "areaId": 3,
  "areaNombre": "Admisión", "anexo": "2210", "origen": "CATALOGO" }
```
  `origen ∈ {CATALOGO, NO_REGISTRADA}`. Si la IP no está registrada: `hostname/equipoId = null`, `origen = NO_REGISTRADA` y `areaNombre/anexo` se toman del **área del usuario autenticado** (fallback acordado en `fase_1`).
- **Resolución de IP (`ClienteIpResolver`, compartido con `POST /api/tickets`):**
  - Usa `request.getRemoteAddr()`. **Solo** si la conexión viene de un *proxy de confianza* (`servicedesk.proxies-confiables=10.0.0.5`) se lee `X-Forwarded-For` (primer valor no confiable de derecha a izquierda). **Nunca** confiar en el encabezado sin proxy (suplantación).
  - Valida IPv4; `0:0:0:0:0:0:0:1` → `127.0.0.1` (desarrollo; origen `NO_REGISTRADA`).
  - Búsqueda: `DIRECCION_IP.Direccion` → `HISTORIAL_ASIGNACION_IP` con `FechaLiberacion IS NULL` → `ELEMENTO_CONFIGURACION` → `AREA`. **Sin DNS inverso** (lento y falsificable).
- **Cabeceras:** `Cache-Control: no-store`.
- **Modo público (opcional, apagado):** `servicedesk.contexto.publico=true` + CIDR permitidos + máx. 30 solicitudes/min/IP; devuelve solo `areaNombre`, `anexo`, `origen`.

```gherkin
  Escenario: [G-C8-01] IP registrada
    Dado la IP 10.20.30.15 asignada al equipo "HSP-ADM-01" del área "Admisión"
    Cuando una petición autenticada llega desde esa IP
    Entonces devuelve hostname "HSP-ADM-01", área "Admisión" y origen "CATALOGO"
  Escenario: [G-C8-02] IP desconocida
    Cuando llega desde una IP no registrada
    Entonces devuelve origen "NO_REGISTRADA" y el área del perfil del usuario
  Escenario: [G-C8-03] No se confía en cabeceras falsificadas
    Dado una petición directa (no del proxy) con "X-Forwarded-For: 10.20.30.15"
    Entonces la IP usada es la de la conexión real
  Escenario: [G-C8-04] Sin token
    Cuando no se envía Authorization y el modo público está apagado
    Entonces responde 401
```

---

### 1.6 Endpoints complementarios (ya consumidos por el front de Fase 3)

**Tabla de contrato front ↔ back** (insumo directo de la conmutación HTTP, §2.1):

| Método del front (clase `*Api`) | Endpoint | Rol | Notas |
|---|---|---|---|
| `PortalSolicitudesApi.listar` | `GET /api/tickets/mis-tickets?filtro=&texto=&pagina=&tamano=` | `USUARIO_FINAL` | `filtro ∈ TODAS, EN_CURSO, POR_CONFIRMAR, CERRADAS`. Respuesta `SolicitudResumenResponse` (incluye `etapa`, `requiereConfirmacion`, `calificada`, `fechaUltimaNovedadIso`). |
| `PortalSolicitudesApi.contarPorConfirmar` | `GET /api/tickets/mis-tickets/resumen` → `{ "porConfirmar": 1, "enCurso": 2 }` | `USUARIO_FINAL` | |
| `PortalSolicitudesApi.obtenerDetalle` | `GET /api/tickets/{id}/seguimiento` | `USUARIO_FINAL` (solicitante) | `SolicitudDetalleResponse`: detalle + `hitos[]` **públicos** (`Visibilidad='PUBLICA'`, solo `MensajePublico`) + `tecnicoVisible` ("Carlos P.") + `tiempoEstimadoSolucionIso` + `calificacion`. Sin motivos ni notas internas. `404` si no es suyo. |
| `PortalSolicitudesApi.confirmarSolucion` | `POST /api/tickets/{id}/confirmar` | `USUARIO_FINAL` | E4 |
| `PortalSolicitudesApi.reabrir` | `POST /api/tickets/{id}/reabrir` | `USUARIO_FINAL` | E5 |
| `PortalSolicitudesApi.calificar` | `POST /api/tickets/{id}/calificacion` `{puntuacion, comentario?}` | `USUARIO_FINAL` | Solo `CERRADO` y sin calificación previa → si no, `409 CALIFICACION_YA_REGISTRADA`. |
| `PortalAyudaApi.buscar/destacados/obtener` | `GET /api/errores-conocidos?publico=true&estado=PUBLICADO&texto=&categoriaId=&orden=uso&limite=` y `GET /api/errores-conocidos/{id}` | autenticado | Para `USUARIO_FINAL` el servidor **fuerza** `EsPublico=1 AND Estado='PUBLICADO'` (ignora el parámetro). `destacados` = `orden=uso&limite=4` (por cantidad de vínculos en `TICKET_ERROR_CONOCIDO`). |
| `TurnoApi.resumen` | `GET /api/tickets/mi-turno/resumen` | `PRACTICANTE` | E3 |
| `TurnoApi.listar` | `GET /api/tickets/mi-turno?vista=POR_TOMAR\|EN_ATENCION\|HISTORIAL&texto=&soloP1P2=&pagina=&tamano=` | `PRACTICANTE` | `POR_TOMAR`: `NUEVO` sin asignar **y** `REABIERTO` sin asignar. `EN_ATENCION`: `ASIGNADO/EN_PROCESO/REABIERTO` míos. `HISTORIAL`: míos `RESUELTO/CERRADO/ESCALADO` del día (Lima). Orden: el definido en el skill de cronómetro (aplicado en servidor para `POR_TOMAR`). |
| `TurnoApi.obtener` | `GET /api/tickets/{id}` | `PRACTICANTE`, `ADMINISTRADOR` | `TicketTurnoResponse`. |
| `TurnoApi.tomar` / `iniciarAtencion` / `resolver` / `escalar` | E1 / E2 / E6 / E7 | técnico | |
| `ConsultaRapidaApi.buscarActivos` | `GET /api/equipos?texto=&pagina=&tamano=` | `PRACTICANTE`, `ADMINISTRADOR` | Respuesta `ActivoResumenResponse`: `enPrestamo` (existe préstamo vigente) y `fallasUltimos90Dias` (conteo de tickets con ese `IdCI`). |
| `ConsultaRapidaApi.buscarArticulos/obtenerArticulo/sugerirArticulos` | `GET /api/errores-conocidos?…` | `PRACTICANTE`, `ADMINISTRADOR` | `sugerirArticulos`: `categoriaId=&limite=5&orden=uso`. |
| Auth | `POST /api/auth/login` | todos | JWT con claims `id`, `username`, `rol`, `nombreCompleto`. |
| Contexto | `GET /api/contexto-cliente` | autenticado | E8 |

El `GET /api/tickets/{id}/historial` (§1.8) **no** lo usa el usuario final.

### 1.7 Motor de SLA en segundo plano (`@Scheduled`)

**Objetivo:** mantener `EstadoSLA` al día sin depender de que alguien consulte el ticket, y emitir alertas una sola vez por transición.

```java
@Component
class SlaScheduler {
  @Scheduled(fixedDelayString = "${servicedesk.sla.intervalo-ms:60000}", initialDelayString = "${servicedesk.sla.retardo-inicial-ms:15000}")
  // @SchedulerLock(name = "sla-evaluacion", lockAtMostFor = "PT55S")   // ShedLock: solo si hay >1 instancia
  void evaluar() { motor.evaluarActivos(); }
}
```

- **`fixedDelay`, no `fixedRate`:** una ejecución lenta no se solapa consigo misma.
- **Candidatos:** tickets en `NUEVO, ASIGNADO, EN_PROCESO, ESCALADO, REABIERTO` (los `RESUELTO/CERRADO` están **congelados**). Se cargan por lotes de 500 con el índice `IX_TICKET_Estado_Asignado`.
- **Cálculo (puro, probado con `Clock` fijo)** `MotorSlaService.calcular(ticket, ahora)`:
  - Fase vigente: **respuesta** si `FechaRespuestaReal IS NULL`, si no **resolución**.
  - `limiteEfectivo = limiteFase + MinutosPausados`; `total = limiteEfectivo − FechaInicioSLA`; `restante = limiteEfectivo − ahora`.
  - `INCUMPLIDO` si `restante ≤ 0`; `ALERTA` si `restante/total ≤ 0,20`; si no `A_TIEMPO`. (Mismo umbral que el cronómetro del front.)
  - Al pasar a `INCUMPLIDO` fija `IncumplioRespuesta` o `IncumplioResolucion` según la fase.
- **Persistencia:** solo se guardan los tickets cuyo estado calculado cambió (`@Transactional` por lote). Una **regresión** (p. ej., por minutos pausados) se guarda **sin** evento.
- **Eventos:** progresión `A_TIEMPO→ALERTA` o `→INCUMPLIDO` publica `AlertaSlaEvent(ticketId, fase, estadoNuevo, prioridad)` y escribe historial (`SLA_ALERTA`/`SLA_INCUMPLIDO`, usuario *Sistema*, `INTERNA`). El *listener* (`@TransactionalEventListener(AFTER_COMMIT)` + `@Async`):
  - **Prioridad crítica:** correo inmediato al técnico asignado (o, si no hay, a todos los practicantes activos) **y** a la jefatura (`servicedesk.alertas.jefatura-correo`).
  - Otras prioridades: solo historial (visible en el semáforo).
  - Fallo de correo: se registra con contexto y **no** revierte nada (la transición ya está persistida). *Outbox* con reintentos queda para Fase 5.
- **Observabilidad:** contador Micrometer `servicedesk_sla_transiciones_total{estado,prioridad}`, log `INFO` solo si hubo cambios, `DEBUG` con duración por ejecución.

```gherkin
Característica: Motor de compromisos de atención
  Escenario: [G-C9-01] Transición a ALERTA
    Dado un ticket crítico con 120 min de compromiso y 100 min transcurridos (queda 16,7 %)
    Cuando corre el motor
    Entonces EstadoSLA = "ALERTA" y se publica un evento una sola vez
  Escenario: [G-C9-02] Transición a INCUMPLIDO
    Dado un ticket cuyo límite pasó hace 1 minuto
    Cuando corre el motor
    Entonces EstadoSLA = "INCUMPLIDO", IncumplioResolucion = 1 y existe un evento "SLA_INCUMPLIDO"
  Escenario: [G-C9-03] Idempotencia
    Cuando el motor corre dos veces sin que pase el tiempo
    Entonces no hay eventos ni escrituras en la segunda corrida
  Escenario: [G-C9-04] Tickets resueltos no cambian
    Dado un ticket "RESUELTO" cuyo límite ya pasó
    Entonces su EstadoSLA permanece congelado
  Escenario: [G-C9-05] Cambio de fase
    Dado un ticket en ALERTA por respuesta y luego iniciado con tiempo de resolución holgado
    Cuando corre el motor
    Entonces EstadoSLA = "A_TIEMPO" (fase de resolución) sin evento
  Escenario: [G-C9-06] La falla del correo no revierte la transición
    Dado que el servidor de correo no responde
    Entonces el ticket queda en "INCUMPLIDO" y se registra el error con el id del ticket
```

**Configuración editable:** `CONFIGURACION_SLA` (⚠️ ya existe) por prioridad: minutos de respuesta y resolución. `PUT /api/sla/configuracion` solo afecta a **tickets nuevos** (los límites se fijan al crear/reabrir; no se recalculan los existentes).

### 1.8 Auditoría e historial inmutable

**Modelo:** `HISTORIAL_TICKET` ampliada (V3): `TipoEvento`, `Visibilidad`, `MensajePublico`, `DatoAnterior/Nuevo`, `IpOrigen`, además de `IdTicket`, `IdUsuario`, `EstadoAnterior/Nuevo`, `Comentario` (el **por qué**), `FechaCambio`.

**Cuatro capas de inmutabilidad:**
1. Entidad JPA `@Immutable`, solo constructor (sin *setters*).
2. Repositorio que extiende `Repository<HistorialTicket, Long>` con **solo** `save` (alta) y consultas; sin `delete*`.
3. `AuditoriaTicketService.registrar(...)` con `@Transactional(propagation = MANDATORY)`: obliga a registrar **dentro** de la transacción del cambio (si el cambio falla, el historial tampoco queda; si el historial falla, el cambio tampoco).
4. Trigger `INSTEAD OF UPDATE, DELETE` + permisos de la cuenta de aplicación (solo `INSERT, SELECT`).

*(Opcional, Could)* **Cadena de *hash*** por ticket: `HashAnterior`/`Hash = SHA-256(HashAnterior + campos)` para detectar manipulación directa en BD.

**Endpoint `GET /api/tickets/{id}/historial`** — roles `PRACTICANTE`, `ADMINISTRADOR`:
```json
[ { "id": 1001, "tipoEvento": "ASIGNACION", "fechaIso": "2026-11-12T12:55:10Z",
    "usuario": { "id": 7, "nombre": "Carlos P." }, "estadoAnterior": "NUEVO", "estadoNuevo": "ASIGNADO",
    "datoAnterior": null, "datoNuevo": null, "comentario": null, "visibilidad": "PUBLICA", "ipOrigen": "10.20.30.44" } ]
```
Orden ascendente por `FechaCambio, IdHistorial`. Paginable (`tamano` ≤ 200). **No existe** `PUT/DELETE` de historial.

```gherkin
Característica: Auditoría inmutable
  Escenario: [G-C10-01] Cada acción deja rastro
    Cuando un practicante toma, inicia y resuelve un ticket
    Entonces el historial contiene eventos en ese orden con usuario, estados, fecha y la IP de origen
  Escenario: [G-C10-02] Atomicidad
    Dado que el registro de historial falla
    Entonces el cambio de estado también se revierte
  Escenario: [G-C10-03] La base de datos rechaza modificaciones
    Cuando se intenta UPDATE o DELETE sobre HISTORIAL_TICKET (incluso por SQL directo)
    Entonces SQL Server lanza el error 51000
  Escenario: [G-C10-04] El usuario final no accede al historial interno
    Cuando un "USUARIO_FINAL" llama GET /historial
    Entonces responde 403
```

### 1.9 Préstamos temporales de equipos

Entidad existente `PrestamoEquipo` (⚠️ ajustar a sus columnas). **Regla clave:** el estado “en préstamo” **se deriva** de la existencia de un préstamo vigente (`FechaDevolucionReal IS NULL`), no de un nuevo estado en `ELEMENTO_CONFIGURACION`. El índice filtrado único `UX_PRESTAMO_VIGENTE` garantiza **un préstamo vigente por equipo** incluso con peticiones simultáneas.

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/api/prestamos` | `PRACTICANTE`, `ADMINISTRADOR` | Registra la **entrega**. |
| `POST` | `/api/prestamos/{id}/devolver` | `PRACTICANTE`, `ADMINISTRADOR` | Registra la **devolución**. |
| `GET` | `/api/prestamos?estado=VIGENTE\|VENCIDO\|DEVUELTO&areaId=&texto=` | `PRACTICANTE`, `ADMINISTRADOR` | Listado paginado. `VENCIDO` se **calcula** (`FechaDevolucionPactada < ahora` y sin devolución). |
| `GET` | `/api/prestamos/{id}` | ídem | Detalle. |

**Entrega — request:**
```json
{ "equipoPrestadoId": 55, "equipoOriginalId": 18, "ticketId": 231, "areaDestinoId": 3,
  "fechaDevolucionPactada": "2026-11-15T22:00:00Z", "observaciones": "Laptop con cargador", "ipTemporalId": 120 }
```
- **Reglas:** equipo prestado en `ACTIVO` y sin préstamo vigente (`409 EQUIPO_NO_DISPONIBLE`); `fechaDevolucionPactada > ahora` y ≤ 90 días; `ticketId` opcional (si existe, evento `PRESTAMO` en su historial); `ipTemporalId` opcional (si viene, se asigna vía `HISTORIAL_ASIGNACION_IP`; debe estar `LIBRE`).
- **Devolución — request:** `{ "estadoDevolucion": "OPERATIVO|CON_DANOS|INCOMPLETO", "observaciones": "…" }` → fija `FechaDevolucionReal`, `IdUsuarioRecibio`; libera la IP temporal; si `CON_DANOS` el equipo pasa a `MANTENIMIENTO`.
- *(Could)* tarea diaria 08:00: correo a la jefatura con préstamos **vencidos**.

```gherkin
Característica: Préstamos de equipos
  Escenario: [G-C11-01] Entrega
    Dado un equipo "ACTIVO" sin préstamo vigente
    Cuando el practicante registra la entrega al área "Admisión" con devolución en 3 días
    Entonces existe un préstamo VIGENTE y el equipo figura "enPrestamo=true" en la consulta de equipos
  Escenario: [G-C11-02] Equipo ya prestado
    Dado un equipo con préstamo vigente
    Cuando se intenta prestar de nuevo
    Entonces responde 409 "EQUIPO_NO_DISPONIBLE"
  Escenario: [G-C11-03] Doble entrega simultánea
    Dado dos peticiones simultáneas para el mismo equipo
    Entonces solo una crea el préstamo y la otra recibe 409
  Escenario: [G-C11-04] Devolución con daños
    Cuando se devuelve con estadoDevolucion "CON_DANOS"
    Entonces el préstamo queda DEVUELTO, la IP temporal LIBRE y el equipo en "MANTENIMIENTO"
  Escenario: [G-C11-05] Vencimiento calculado
    Dado un préstamo con devolución pactada ayer y sin devolver
    Entonces el listado lo muestra con estado "VENCIDO"
```

### 1.10 Reasignación, carga del equipo, catálogos y Centro de Soluciones (API administrativa)

**Reasignación y carga (`ADMINISTRADOR`)**

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/tickets/{id}/reasignar` `{ "tecnicoId": 7, "motivo": "…" }` | Motivo `@TextoUtil(10,300)`. El destino debe estar `Activo`, rol `PRACTICANTE` (→ N1) o `ADMINISTRADOR` (→ N2). Evento `REASIGNACION`. Usa `@Version` → `409 CONFLICTO_VERSION`. Reemplaza a `PUT /asignar` (deprecado). |
| `POST` | `/api/tickets/reasignar-lote` `{ "ticketIds": [...], "tecnicoId": 7, "motivo": "…" }` | Máx. 50. Resultado **por ticket** `{ id, ok, codigoError? }` (no es todo-o-nada). *Should.* |
| `GET` | `/api/usuarios/tecnicos?conCarga=true` | Por técnico: `{ id, nombre, rol, activos, porVencer, vencidos, resueltosHoy }`. |
| `GET` | `/api/tickets/escalados?asignacion=SIN_ASIGNAR\|MIOS\|TODOS&texto=&pagina=&tamano=` | `TicketEscaladoResponse` = `TicketTurnoResponse` + `escalamiento { fechaIso, derivadoPor {id,nombre}, motivo, detallesTecnicos, categoriaN2Id, categoriaN2Nombre }`. Orden: `INCUMPLIDO` → `ALERTA` → antigüedad. |

**Catálogos (`ADMINISTRADOR`; **baja siempre lógica**, nunca `DELETE`)**

| Recurso | Endpoints | Reglas |
|---|---|---|
| Áreas | `GET/POST /api/areas`, `PUT /api/areas/{id}`, `PATCH /api/areas/{id}/activo` | Nombre único (sin distinguir mayúsculas); desactivar con tickets activos o equipos activos → `409 RECURSO_EN_USO` con conteos. Los selectores del front muestran solo `Activo=1`; el historial conserva el nombre. |
| Equipos | `GET/POST /api/equipos`, `PUT /api/equipos/{id}`, `PATCH /api/equipos/{id}/estado` | `MAC` formato `AA:BB:CC:DD:EE:FF` y única; `Hostname` único; **baja** exige sin préstamo vigente y libera su IP (historial). |
| Direcciones IP | `GET /api/direcciones-ip?subred=&estado=`, `POST /api/direcciones-ip/rangos` `{ "subred":"VLAN-20", "desde":"10.20.20.1", "hasta":"10.20.20.60" }`, `PATCH /api/direcciones-ip/{id}/estado` (`LIBRE`/`RESERVADA`) | Rango IPv4 válido, mismo /24, ≤ 1024; **omite duplicadas** y devuelve `{ creadas, omitidas[] }`; no permite pasar a `LIBRE` una IP `OCUPADA` (primero se libera por equipo). |
| Compromisos de atención | `GET /api/sla/configuracion`, `PUT /api/sla/configuracion/{prioridad}` `{ "minutosRespuesta": 15, "minutosResolucion": 120 }` | `respuesta < resolución`; rangos 1–10 080 min; orden de prioridades monótono (P1 ≤ P2 ≤ P3 ≤ P4); **solo afecta a tickets nuevos**; auditar quién cambió qué (tabla de cambios o log estructurado). |

**Centro de Soluciones (KEDB) — editorial**

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/api/errores-conocidos?texto=&categoriaId=&estado=&publico=&orden=&limite=&pagina=&tamano=` | autenticado | `texto`: `LIKE` en título/síntoma (índice `IX_EC_Busqueda`; *full-text* queda opcional por la imagen Docker). `USUARIO_FINAL` ve solo públicos y publicados. |
| `GET` | `/api/errores-conocidos/{id}` | ídem | Devuelve `pasos[]` (líneas de `SolucionWorkaround`). |
| `POST` | `/api/errores-conocidos` | `PRACTICANTE`, `ADMINISTRADOR` | Crea (`BORRADOR` o `PUBLICADO`). |
| `PUT` | `/api/errores-conocidos/{id}` | ídem | Edita con `If-Match`/`version` (409 si otro editó). |
| `PATCH` | `/api/errores-conocidos/{id}/estado` `{ "estado": "PUBLICADO\|ARCHIVADO\|BORRADOR" }` | publicar: ambos; **archivar: solo `ADMINISTRADOR`** | Sin aprobación previa (decisión de `fase_1`). |

Campos: `titulo (5–150)`, `categoriaId`, `sintoma (≤1000)`, `causaRaiz (≤1000)`, `solucionTemporal (≤1000; una línea = un paso, máx. 12 pasos)`, `solucionDefinitiva (≤2000)`, `esPublico`. **Texto plano:** el backend rechaza etiquetas HTML (`<`/`>`) y el front interpola con escape automático (nunca `[innerHTML]`).

### 1.11 Reportes ejecutivos en PDF (backend)

- **Endpoints (`ADMINISTRADOR`):**
  - `GET /api/reportes/cumplimiento?desde=2026-10-01&hasta=2026-10-31&areaId=` → JSON de **vista previa** (`ReporteCumplimientoResponse`).
  - `GET /api/reportes/cumplimiento/pdf?…` → `application/pdf`, `Content-Disposition: attachment; filename="reporte-compromisos-2026-10.pdf"`. Ambos usan **el mismo servicio** (`ReporteCumplimientoService`) → la vista previa y el PDF **nunca difieren**.
  - Validación: `desde ≤ hasta`, máx. 366 días (`RANGO_FECHAS_INVALIDO`); fechas interpretadas en `America/Lima`.
- **Contenido del reporte:**
  1. Membrete: logo HSMSI, “Hospital Santa María del Socorro · Mesa de Ayuda”, periodo, filtros, fecha/hora de generación y usuario que lo generó.
  2. **Indicadores** (fórmulas del capítulo IX, calculadas por `IndicadoresService`): Cumplimiento de compromisos (`tickets sin IncumplioRespuesta ni IncumplioResolucion / cerrados+resueltos`), Tiempo promedio de respuesta, Tiempo promedio de resolución, Resolución en primer contacto (resueltos por N1 sin escalar / atendidos por N1), Incidentes recurrentes (tickets vinculados a un mismo artículo), Satisfacción (% de calificaciones ≥ 4). **Disponibilidad del servicio** se muestra como “N/D — requiere monitoreo” (no hay fuente de datos de caídas) para no inventar una cifra.
  3. Cumplimiento por prioridad (total / a tiempo / incumplidos / %) y por área (barras).
  4. Top 10 equipos con más fallas (por `IdCI`).
  5. Calificaciones: distribución 1–5 y comentarios (anonimizados: sin nombre del solicitante).
  6. Préstamos: vigentes, vencidos, devueltos con daños.
  7. Pie: “Página n de m”, líneas de firma (Jefatura de Estadística e Informática / Dirección).
- **Privacidad:** el reporte **no** lista rendimiento por persona (agrega por nivel N1/N2). Si la Jefatura lo requiere, se habilita con una opción explícita y auditada.
- **Implementación (D-08):** plantilla Thymeleaf (`reportes/cumplimiento.html`) con CSS de impresión (`@page { size: A4; margin: 24mm 16mm; }`, encabezado/pie con `position: running()`), fuentes TTF **incrustadas** (acentos y ñ), barras de gráfico con `div` de ancho porcentual (sin librerías de gráficos). Render con OpenHTMLtoPDF. Tiempo objetivo < 5 s para un mes con 5 000 tickets; consulta agregada en BD (no cargar entidades).
- **Seguridad:** `Cache-Control: no-store`; escapar todo texto proveniente de la BD en la plantilla (`th:text`, nunca `th:utext`).

```gherkin
Característica: Reporte de cumplimiento
  Escenario: [G-E1-01] Descarga del PDF
    Dado un administrador autenticado y tickets en octubre de 2026
    Cuando solicita el PDF del 01/10/2026 al 31/10/2026
    Entonces recibe 200, tipo "application/pdf", el archivo empieza con "%PDF"
    Y el texto del PDF contiene "Hospital Santa María del Socorro" y el periodo solicitado
  Escenario: [G-E1-02] Coherencia vista previa / PDF
    Entonces el porcentaje de cumplimiento del JSON es igual al del PDF
  Escenario: [G-E1-03] Rango inválido
    Cuando desde es posterior a hasta
    Entonces responde 400 "RANGO_FECHAS_INVALIDO"
  Escenario: [G-E1-04] Periodo sin tickets
    Entonces el PDF se genera con los indicadores en "Sin datos" (no falla)
  Escenario: [G-E1-05] Solo el administrador
    Cuando un practicante solicita el reporte
    Entonces responde 403
```

### 1.12 Matriz endpoint × rol (base de la prueba de seguridad automatizada)

| Endpoint | `USUARIO_FINAL` | `PRACTICANTE` | `ADMINISTRADOR` | Restricción adicional |
|---|:--:|:--:|:--:|---|
| `POST /tickets` | ✅ | ✅ | ✅ | |
| `GET /tickets/mis-tickets(/resumen)`, `GET /tickets/{id}/seguimiento` | ✅ | ✅ | ✅ | solo propios (otro → 404) |
| `POST /tickets/{id}/confirmar·reabrir·calificacion` | ✅ | ❌ | ❌ | solicitante |
| `GET /tickets/mi-turno(/resumen)` | ❌ | ✅ | ❌ | |
| `POST /tickets/{id}/tomar` | ❌ | ✅ | ✅ | origen según rol |
| `POST /tickets/{id}/iniciar·resolver` | ❌ | ✅ | ✅ | asignado (o admin en `resolver`) |
| `POST /tickets/{id}/escalar` | ❌ | ✅ | ❌ | asignado |
| `GET /tickets/{id}`, `GET /tickets/{id}/historial` | ❌ | ✅ | ✅ | |
| `GET /tickets/escalados`, `POST /tickets/{id}/reasignar(-lote)`, `GET /usuarios/tecnicos` | ❌ | ❌ | ✅ | |
| `GET/POST/PUT/PATCH /prestamos` | ❌ | ✅ | ✅ | |
| `GET /equipos` · `GET /errores-conocidos` | ❌* | ✅ | ✅ | *usuario final: solo artículos públicos |
| `POST/PUT /errores-conocidos`, `PATCH …/estado` | ❌ | ✅ (no archivar) | ✅ | |
| Catálogos (`areas`, `equipos` escritura, `direcciones-ip`, `sla/configuracion`) | ❌ | ❌ (lectura de equipos/IP ✅) | ✅ | |
| `GET /reportes/**` | ❌ | ❌ | ✅ | |
| `GET /contexto-cliente` | ✅ | ✅ | ✅ | autenticado (D-04) |

---

## 2. ARQUITECTURA Y PANTALLAS FRONTEND

### 2.1 Plan de conmutación a HTTP real

**Preparación (D1):**
- **Flags por dominio** (A6): `environment.mocksActivos?: Partial<Record<'auth'|'catalogos'|'tickets'|'portal'|'turno'|'cmdb'|'sla'|'conocimiento'|'prestamos'|'reportes'|'escalamiento', boolean>>`. Helper `usaMock(dominio) = environment.mocksActivos?.[dominio] ?? environment.usarMocks`. Los `*.providers.ts` lo usan (actualizar el skill `servicio-api-mock-http` a v1.1). *Rollback* = poner el dominio en `true`.
- **Proxy de desarrollo:** `proxy.conf.json` (`/api → http://localhost:8080`) y `apiUrl: '/api'` (evita CORS). Backend: CORS solo para el origen del front en perfiles distintos a `dev`.
- **Tipos desde OpenAPI** (*Should*): `springdoc` expone `/v3/api-docs`; `openapi-typescript` genera `dtos.generated.ts` y los `mapear*` fallan al compilar si el contrato cambia.
- **Interceptores:**
  - `jwt.interceptor`: agrega `Authorization` salvo en `/api/auth/login`; no adjuntar token a URLs externas.
  - `error.interceptor` + **`mapearErrorApi(err): ErrorApi { status, codigo, mensajeUsuario, detalles }`** (función pura, probada). Reglas: `401` → cerrar sesión y `/login?returnUrl=…` (con *single-flight* de refresh si D-13); `403` en **navegación** → `/403`, en **acción** (botón) → mensaje sin redirigir; `404` de recursos → estado vacío; `409` → mensaje por `codigo` (p. ej. `TICKET_YA_TOMADO` → “Otro técnico ya tomó este ticket”); `0` → modo sin conexión; `5xx` → mensaje genérico + `logger.service`.
  - Los mensajes salen del diccionario (`vocabulario-asistencial.ts`), nunca de `error.message`.
- **Reloj:** verificar que `ahoraServidorIso` llega en cada DTO de ticket y que el desfase se calcula al **recibir** la respuesta (no al renderizar).

**Orden de conmutación** (un dominio por vez; criterio de salida = checklist de humo en verde + pruebas de contrato):

| Paso | Dominio | Depende de | Criterio de salida |
|---|---|---|---|
| 1 | `auth` (login real) | C0, D1 | Login de los 3 roles, claims correctos, logout y expiración limpia |
| 2 | `catalogos` solo lectura (áreas, categorías) | C14 | Selectores del formulario de solicitud cargan |
| 3 | `tickets` (`contexto-cliente`, crear, `mis-tickets`) | C8, C9b | Crear solicitud desde un equipo registrado muestra hostname/área |
| 4 | `portal` (seguimiento, confirmar, reabrir, calificar, ayuda) | C4, C5, C9b, C15 | Escenario E2E de usuario final completo |
| 5 | `turno` (resumen, bandeja, tomar, iniciar, resolver, escalar, consulta) | C1–C3, C6, C7 | Escenario E2E de practicante + prueba de concurrencia manual (2 navegadores) |
| 6 | `cmdb`, `sla` (configuración), `conocimiento` (lectura) | C13, C14, C15 | Pantallas de Fase 2 sobre datos reales |
| 7 | Dashboard (`indicadores`) | C16 | KPIs coinciden con consultas SQL de control |
| 8 | Nuevos módulos (D4–D9) | sus tareas C | — |

### 2.2 Rutas y menú nuevos

| Ruta | Página | Rol | Notas |
|---|---|---|---|
| `/escalamiento` | `EscalamientoColaPage` | `ADMINISTRADOR` | D-11 |
| `/escalamiento/ticket/:id` | `EscalamientoDetallePage` | `ADMINISTRADOR` | |
| `/administracion/carga-equipo` | `CargaEquipoPage` | `ADMINISTRADOR` | |
| `/administracion/areas` | `AreasPage` | `ADMINISTRADOR` | |
| `/cmdb/activos` *(existente)* | `CmdbListaComponent` | `ADMINISTRADOR` edición · `PRACTICANTE` lectura | + alta/edición/baja y alta de rangos IP |
| `/sla/configuracion` *(existente)* | `SlaConfiguracionComponent` | `ADMINISTRADOR` | conectar a HTTP |
| `/conocimiento` | `CentroSolucionesListaPage` | `PRACTICANTE`, `ADMINISTRADOR` | |
| `/conocimiento/nuevo` · `/conocimiento/:id/editar` | `CentroSolucionesEditorPage` | `PRACTICANTE`, `ADMINISTRADOR` | archivar: solo admin |
| `/prestamos` | `PrestamoListaPage` | `PRACTICANTE`, `ADMINISTRADOR` | *Should* (D-10) |
| `/reportes` | `ReportesPanelPage` | `ADMINISTRADOR` | |

**Menú (texto visible):** Administrador → *Panel de control · Escalamientos (con contador) · Bandeja general · Carga del equipo · Catálogo de equipos · Servicios y áreas · Compromisos de atención · Centro de Soluciones · Préstamos de equipos · Reportes*. Practicante → *Mi turno · Consultar · Centro de Soluciones · Préstamos de equipos · …(Fase 3)*.

### 2.3 Pantallas (wireframes lógicos)

**Reglas comunes (heredadas de Fase 3):** tarjetas < 1024 px / tabla ≥ 1024 px con **un solo DOM** (skill `vista-hibrida-tabla-tarjetas`), touch ≥ 44 px, sin scroll horizontal a 360 px, color + ícono + texto, tokens `--hsmsi-*`, estado en URL, esqueleto/vacío/error/*Reintentar*.

#### D-A1 · Bandeja de Escalamientos (`/escalamiento`)

```text
Escritorio (≥1024)                                        Móvil (<1024)
┌ Escalamientos a Nivel 2 ──────────── Actualizado 14:02 ⟳┐   ┌────────────────────────────┐
│ [Sin asignar 3][Míos 2][Todos 7]   🔍 código o equipo   │   │ Escalamientos     ⟳        │
├──────┬────────────┬───────────┬─────────┬───────────────┤   │ [Sin asignar 3][Míos][Todos]│
│Prior.│ Ticket     │ Derivado  │ Motivo  │ Compromiso    │   │ ┌────────────────────────┐ │
│P1 ⚠  │ …231 GalenH│ Carlos 13:10│ "Servidor BD…"│ ⚠ Por vencer 12:30│ │ │▌P1 …231 · Admisión     │ │
│      │ Admisión   │           │         │ [Asumir]      │   │ │ Derivado por Carlos    │ │
└──────┴────────────┴───────────┴─────────┴───────────────┘   │ │ "Servidor BD sin resp…"│ │
                                                              │ │ ⚠ Por vencer 12:30     │ │
                                                              │ │ [ Asumir ]             │ │
                                                              └────────────────────────────┘
```
- **Detalle** (`/escalamiento/ticket/:id`): cronómetro grande · **“Lo que ya revisó el practicante”** (motivo, detalles técnicos, tipo de problema sugerido, hora y quién derivó) · contexto de equipo · línea de tiempo de auditoría (`GET /historial`) · soluciones sugeridas por categoría.
- **Acciones (barra fija en móvil):** **Asumir** (`tomar` como Administrador → `ASIGNADO` N2; luego **Iniciar atención**) · **Devolver a un técnico** (diálogo reasignar, motivo obligatorio) · **Resolver** (reutiliza `dialogo-resolver-ticket`).
- Contador de pendientes en el menú (sondeo 30 s, `aria-live="polite"` cuando aumenta). Orden: `INCUMPLIDO` → `ALERTA` → antigüedad.

#### D-A2 · Carga del equipo y reasignación (`/administracion/carga-equipo`)

```text
┌ Carga del equipo ─────────────────────── Actualizado 14:02 ⟳┐
│ Carlos P.   ● En turno    Activos 4  Por vencer 1  Vencidos 0│
│ [Ver tickets]                                               │
│ Luis M.     ● En turno    Activos 1  Por vencer 0  Vencidos 0│
│ Ver tickets de Carlos ▾                                     │
│  ☐ …231 Sin conexión GalenHos      ⚠ Por vencer 12:30        │
│  ☐ …244 Impresora de Farmacia      ✓ A tiempo                │
│  [Reasignar 2 seleccionados a ▾ Luis M.]  Motivo (obligatorio)│
└─────────────────────────────────────────────────────────────┘
```
- Tarjetas por técnico (indicador de carga con texto: “Carga alta/media/baja” además de color). Selección múltiple con casillas ≥ 44 px, **reasignación individual** (diálogo) o **en lote** (≤ 50). Resultado por ticket (éxito/fallo con motivo) en un resumen accesible. Diálogo `dialogo-reasignar-ticket` (promover `dialogo-asignar` a `compartido/`, añadir motivo y carga actual del técnico destino).
- Defensa: confirmación con texto “REASIGNAR” solo cuando el lote contiene tickets críticos (Patrón 4).

#### D-A3 · Mantenimiento de catálogos

Un solo contenedor `/administracion/**` con pestañas persistentes en la URL:

| Pestaña | Contenido | Particularidades |
|---|---|---|
| **Servicios y áreas** (`/administracion/areas`) | Tabla/tarjetas con nombre, anexo, estado; formulario modal | Desactivar pide confirmación y muestra conteos si hay dependencias (`RECURSO_EN_USO`) |
| **Catálogo de equipos** (`/cmdb/activos`, existente) | Inventario + matriz de IP (Fase 2) | Alta/edición/baja con `ActivoFormularioModal`; **alta de rango de IP** (subred, desde, hasta → vista previa “se crearán 60, se omitirán 3 existentes”) |
| **Compromisos de atención** (`/sla/configuracion`, existente) | Tabla P1–P4 editable (minutos de respuesta y resolución) | Validación cruzada (respuesta < resolución; orden P1 ≤ P4); aviso fijo “Los cambios aplican solo a solicitudes nuevas”; confirmación defensiva con resumen del cambio |

- Formularios con validación inmediata y mensajes en texto; `409 RECURSO_EN_USO` mostrado como lista de impedimentos (“Tiene 3 solicitudes activas”).
- Todas las bajas son **lógicas**; el texto del botón dice “Desactivar”, no “Eliminar”.

#### D-A4 · Centro de Soluciones: lista y editor

```text
┌ Editor de solución ─────────────── [Borrador] [Vista previa] ┐
│ Título *            [Impresora de recetas no imprime        ]│
│ Servicio/categoría * [Impresoras ▾]                          │
│ ¿Qué se observa? *   [La impresora no responde…        ] 0/1000│
│ Causa probable       [Cable o cola de impresión…        ] 0/1000│
│ Pasos de la solución temporal *  (máx. 12)                   │
│  1. [Apague y encienda la impresora…            ] [↑][↓][✕]  │
│  2. [Verifique que el cable de red…             ] [↑][↓][✕]  │
│  [＋ Agregar paso]                                           │
│ Solución definitiva  [ …                              ] 0/2000│
│ ☐ Visible para el personal asistencial (Ayuda rápida)        │
│ ⚠ Este texto contiene términos técnicos: "SLA" (línea 3)     │
│ Borrador guardado a las 14:02 hrs                            │
│  [Guardar borrador] [Publicar] [Archivar (solo administrador)]│
└──────────────────────────────────────────────────────────────┘
```
- **Lista:** buscador, filtros (categoría, estado, visibilidad), tarjetas/tabla; el practicante ve todos y edita los suyos o los de otros (sin aprobación, `fase_1`).
- **Editor de pasos accesible:** botones ↑/↓/✕ (≥ 44 px) con `aria-label` (“Mover paso 2 hacia arriba”); **sin arrastrar y soltar** como único medio; foco coherente tras mover; anuncio `aria-live` (“Paso 2 movido a la posición 1”). Serializa a líneas de `SolucionWorkaround`.
- **Vista previa** (panel lateral ≥ 1024 px / pestaña en móvil): renderiza el artículo **como lo verá el personal asistencial** (lista numerada).
- **Control de lenguaje:** si `esPublico`, se valida el texto con `TERMINOS_PROHIBIDOS_USUARIO_FINAL` (skill de vocabulario): **bloquea “Publicar como visible”** y marca las líneas; no bloquea artículos técnicos (no públicos).
- **Concurrencia:** `409 CONFLICTO_VERSION` → aviso “Otra persona editó este artículo” con opción de recargar sin perder lo escrito (copia local).
- Autoguardado de borrador local cada 5 s (`borrador-local.ts`, clave `borrador:solucion:{id|nuevo}`).

#### D-A5 · Reportes (`/reportes`)

```text
┌ Reportes ───────────────────────────────────────────────────┐
│ Periodo: (•) Mes [Octubre 2026 ▾]  ( ) Rango [desde][hasta] │
│ Servicio: [Todos ▾]                         [ Generar vista ]│
├─────────────────────────────────────────────────────────────┤
│ Vista previa — Hospital Santa María del Socorro · Mesa de Ayuda│
│ Periodo 01/10/2026 – 31/10/2026 · Generado 12/11/2026 14:02  │
│ ┌──────────┬──────────┬──────────┬──────────┐               │
│ │Cumplim.  │Resp. prom│Resol.prom│Satisfac. │               │
│ │ 91 %     │ 12 min   │ 2 h 40   │ 88 %     │               │
│ └──────────┴──────────┴──────────┴──────────┘               │
│ Cumplimiento por urgencia · por servicio · equipos con más fallas │
│ [ ⬇ Descargar PDF ]  [ Abrir en otra pestaña ]               │
└─────────────────────────────────────────────────────────────┘
```
- **Flujo:** “Generar vista” → `GET /reportes/cumplimiento` (JSON, tarjetas y tablas accesibles) → “Descargar PDF” → `HttpClient` con `responseType: 'blob'`, `URL.createObjectURL`, nombre del archivo desde `Content-Disposition` (con respaldo `reporte-compromisos-AAAA-MM.pdf`) y `URL.revokeObjectURL` al terminar.
- **Estados:** botón con `aria-busy` y texto “Generando…” (nunca doble clic), `role="status"` al terminar (“Reporte descargado”), error con *Reintentar*. En móvil **no** se incrusta el PDF (iOS/Android no lo soportan bien en `iframe`): se ofrece descarga/abrir.
- Rango máximo 366 días validado en el formulario (mismo mensaje que el servidor).
- Los indicadores se muestran con **etiquetas hospitalarias** (“Cumplimiento de compromisos de atención”); “Disponibilidad” aparece como “Sin datos disponibles” si el servidor devuelve `null`.

#### D-A6 · Préstamos de equipos (`/prestamos`) — *Should*

Lista híbrida (Vigentes · Vencidos · Devueltos) con búsqueda por equipo/servicio; modal **Registrar entrega** (equipo disponible vía `GET /equipos?disponibles=true`, equipo en reparación, servicio destino, fecha de devolución, ticket relacionado opcional) y modal **Registrar devolución** (estado: Operativo / Con daños / Incompleto). Insignia **“Vencido”** con ícono + texto. Conecta con la tarjeta de equipo de *Consulta rápida* (`enPrestamo`).

### 2.4 Componentes, modelos y contratos TypeScript nuevos

**Compartidos (nuevos o promovidos):**

| Componente | Ruta | Notas |
|---|---|---|
| `linea-tiempo-auditoria` | `compartido/componentes/linea-tiempo-auditoria/` | Presentacional; entrada `EventoAuditoria[]`; agrupa por día; ícono + texto por `tipoEvento`; reemplaza el marcador interno de la ficha de Mi Turno y de `incidentes/detalle`. |
| `dialogo-reasignar-ticket` | `compartido/componentes/dialogo-reasignar-ticket/` | Promoción de `dialogo-asignar` + motivo + carga del destino. Mismo patrón `alEnviar` (skill de diálogos). |
| `dialogo-escalar-ticket` *(extender)* | existente | Agrega `detallesTecnicos` (opcional, ≤ 1000) y selector “Tipo de problema para Nivel 2” (`categoriaN2Id`, opcional). |
| `editor-pasos` | `funcionalidades/conocimiento/componentes/` | Lista reordenable accesible (↑/↓/✕). |
| `descarga-archivo` (servicio) | `nucleo/servicios/descarga-archivo.service.ts` | `descargarBlob(blob, nombre)`; extrae nombre de `Content-Disposition`; revoca la URL. |

**Modelos y APIs (resumen; seguir skill `servicio-api-mock-http`):**

```ts
// compartido/modelos/auditoria.model.ts
export type TipoEvento = 'CREACION'|'ASIGNACION'|'REASIGNACION'|'CAMBIO_ESTADO'|'ESCALAMIENTO'|'SOLUCION'|'REAPERTURA'|'CALIFICACION'|'SLA_ALERTA'|'SLA_INCUMPLIDO'|'PRESTAMO';
export interface EventoAuditoria {
  id: number; tipoEvento: TipoEvento; fechaIso: string; usuarioNombre: string;
  estadoAnterior: EstadoTicket | null; estadoNuevo: EstadoTicket | null;
  datoAnterior: string | null; datoNuevo: string | null; comentario: string | null;
  visibilidad: 'INTERNA' | 'PUBLICA'; ipOrigen: string | null;
}
export abstract class AuditoriaApi { abstract historial(ticketId: number): Observable<EventoAuditoria[]>; }

// funcionalidades/escalamiento/modelos
export interface TicketEscalado extends TicketTurno {
  escalamiento: { fechaIso: string; derivadoPor: { id: number; nombre: string }; motivo: string;
                  detallesTecnicos: string | null; categoriaN2Id: number | null; categoriaN2Nombre: string | null };
}
export abstract class EscalamientosApi {
  abstract listar(c: { asignacion: 'SIN_ASIGNAR'|'MIOS'|'TODOS'; texto?: string; pagina: number; tamano: number }): Observable<Pagina<TicketEscalado>>;
  abstract obtener(id: number): Observable<TicketEscalado>;
  abstract asumir(id: number): Observable<TicketTurno>;                       // POST /tomar como ADMIN
  abstract reasignar(id: number, p: ReasignarPayload): Observable<TicketTurno>;
}
export interface ReasignarPayload { tecnicoId: number; motivo: string }       // 10–300 útiles
export interface ReasignarLotePayload { ticketIds: number[]; tecnicoId: number; motivo: string }
export interface ResultadoLote { id: number; ok: boolean; codigoError?: string }
export interface CargaTecnico { id: number; nombre: string; rol: Rol; activos: number; porVencer: number; vencidos: number; resueltosHoy: number }

// funcionalidades/administracion/modelos
export interface Area { id: number; nombre: string; anexo: string | null; activo: boolean }
export interface RangoIpPayload { subred: string; desde: string; hasta: string }
export interface ResultadoRangoIp { creadas: number; omitidas: string[] }
export interface ConfigCompromiso { prioridad: Prioridad; minutosRespuesta: number; minutosResolucion: number }

// funcionalidades/conocimiento/modelos
export type EstadoArticulo = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';
export interface ArticuloEditable { id?: number; titulo: string; categoriaId: number; sintoma: string; causaRaiz: string | null;
  pasos: string[]; solucionDefinitiva: string | null; esPublico: boolean; estado: EstadoArticulo; version?: number }

// funcionalidades/prestamos/modelos
export type EstadoPrestamo = 'VIGENTE' | 'VENCIDO' | 'DEVUELTO';
export interface Prestamo { id: number; equipo: ActivoResumen; equipoOriginal: ActivoResumen | null; areaDestinoNombre: string; ticketCodigo: string | null;
  entregadoPor: string; fechaEntregaIso: string; fechaDevolucionPactadaIso: string; fechaDevolucionRealIso: string | null; estado: EstadoPrestamo }
export interface EntregarPrestamoPayload { equipoPrestadoId: number; equipoOriginalId?: number; ticketId?: number; areaDestinoId: number; fechaDevolucionPactadaIso: string; observaciones?: string; ipTemporalId?: number }
export interface DevolverPrestamoPayload { estadoDevolucion: 'OPERATIVO'|'CON_DANOS'|'INCOMPLETO'; observaciones?: string }

// funcionalidades/reportes/modelos
export interface ConsultaReporte { desde: string; hasta: string; areaId?: number }   // AAAA-MM-DD, hora de Lima
export interface ReporteCumplimiento { periodo: { desde: string; hasta: string }; generadoIso: string; generadoPor: string;
  indicadores: { cumplimiento: number | null; respuestaPromedioMin: number | null; resolucionPromedioMin: number | null;
                 primerContacto: number | null; recurrentes: number | null; satisfaccion: number | null; disponibilidad: number | null };
  porPrioridad: { prioridad: Prioridad; total: number; aTiempo: number; incumplidos: number }[];
  porArea: { areaNombre: string; total: number; cumplimiento: number | null }[];
  equiposConMasFallas: { nombre: string; areaNombre: string; fallas: number }[]; }
export abstract class ReportesApi {
  abstract vistaPrevia(c: ConsultaReporte): Observable<ReporteCumplimiento>;
  abstract descargarPdf(c: ConsultaReporte): Observable<{ blob: Blob; nombreArchivo: string }>;
}
```

Cada `*Api` tiene `Mock` y `Http` (y `providers` con `usaMock('dominio')`). El `Mock` del reporte devuelve datos plausibles y un `Blob` PDF mínimo embebido para desarrollar sin backend.

---

## 3. NUEVAS SKILLS PARA EL AGENTE OBRERO (`.agents/skills/`)

> Regla de `AGENTS.md §7`: sin `SKILL.md`, el Obrero se detiene. **Pedir los de prioridad P0 antes de iniciar el sprint** (T-C0.2).

| # | Skill | Alcance | Cubre | Prior. | Bloquea |
|---|---|---|---|:-:|---|
| 1 | `skill-api-ciclo-vida-ticket` | BE | Máquina de estados, `@PreAuthorize` + propiedad, DTO *records*, `@TextoUtil`, códigos de error, actualización condicional + `@Version`, idempotencia, respuestas `Pagina` | **P0** | C1–C9 |
| 2 | `skill-auditoria-historial-tickets` | BE + FE | `AuditoriaTicketService` (`MANDATORY`), tipos de evento, visibilidad pública/interna, trigger/permisos, endpoint; componente `linea-tiempo-auditoria` | **P0** | C10, D-A1 |
| 3 | `skill-motor-sla-scheduler` | BE | `Clock`, `@Scheduled` con `fixedDelay`, cálculo puro, eventos *after-commit*, correo asíncrono, banderas de incumplimiento, pruebas con reloj fijo | **P0** | C9 |
| 4 | `skill-migraciones-flyway-sqlserver` | BE | Baseline, convención `V#__`, `GO`, filtrados/índices, *seed* por perfil, `ddl-auto=validate`, reversión manual | **P0** | C0, todas las migraciones |
| 5 | `skill-gestion-prestamos-cmdb` | BE + FE | Estado derivado, índice filtrado único, IP temporal, vencimiento calculado, UI de entrega/devolución | P1 | C11, D-A6 |
| 6 | `skill-generador-reportes-pdf` | BE + FE | Thymeleaf + OpenHTMLtoPDF, `@page`, fuentes incrustadas, membrete, `IndicadoresService` único, descarga *blob* en Angular | P1 | E1, E2 |
| 7 | `skill-mantenimiento-catalogos` | BE + FE | CRUD con baja lógica, `RECURSO_EN_USO`, alta de rangos IP, validaciones cruzadas de compromisos, confirmación defensiva | P1 | C13, D-A3 |
| 8 | `skill-editor-centro-soluciones` | FE (+BE) | Editor de pasos accesible, vista previa, control de lenguaje, concurrencia (`version`), borrador local, texto plano sin `innerHTML` | P1 | C14, D-A4 |
| 9 | `skill-conmutacion-http-real` | FE | Flags por dominio, proxy, `mapearErrorApi`, interceptores, orden y criterios de salida, pruebas de contrato Mock↔Http, OpenAPI→TS | **P0** | D1–D3 |
| 10 | `skill-pruebas-backend-integracion` | BE | Testcontainers MSSQL, `@WebMvcTest` por rol, concurrencia con `CountDownLatch`, `Clock` fijo, prueba del trigger, `MockMvc` + PDF (PDFBox) | **P0** | C-todas |
| 11 | `skill-pruebas-e2e-playwright` | FE/QA | Proyecto Playwright, perfiles móvil 360×640 y desktop, datos *seed*, esperas por estado (no `sleep`), accesibilidad con axe | P1 | E3 |

**Actualizaciones a skills existentes (v1.1):**
- `servicio-api-mock-http`: `usaMock(dominio)` y `mocksActivos` (A6); descarga `blob`.
- `vocabulario-asistencial-sin-itil`: nuevos términos del personal técnico — *Catálogo de Equipos, Centro de Soluciones, Compromisos de Atención, Solicitud de cambio* (A5) — y `ETIQUETA_TIPO_EVENTO` para la línea de tiempo de auditoría (sin “SLA”, “escalado” → “Derivado a Nivel 2”).
- `dialogo-accesible-movil`: caso del diálogo con lista de resultados (reasignación en lote).

*(Todos siguen el formato de los 5 skills de Fase 3: cuándo usar, reglas de oro, plantillas, prohibiciones, pruebas y checklist.)*

---

## 4. BACKLOG DE TAREAS

**Leyenda:** `[Obrero]` Agente Obrero · `[Humano-BE]` / `[Humano-FE]` equipo humano · `[Humano]` ambos · Tamaño **S** ≤ 4 h · **M** ½–1 día · **L** 1–2 días · **XL** > 2 días (dividir si es posible). **Prior.:** **Must** / **Should** / **Could**.
**Ramas** (desde `develop`): `feature/be-ciclo-vida-ticket`, `feature/be-sla-auditoria`, `feature/be-prestamos-catalogos`, `feature/be-reportes-pdf`, `feature/fe-conmutacion-http`, `feature/fe-administracion`, `feature/fe-reportes`, `feature/e2e-playwright`. Commits en español imperativo (`feat(tickets): agregar endpoint para tomar ticket`).

### Definition of Done global
- [ ] Backend: `./mvnw verify` verde (unitarias + integración con Testcontainers); sin `catch` vacío; sin stack traces al cliente; auditoría en toda mutación; `@PreAuthorize` + propiedad del recurso; validación de servidor.
- [ ] Frontend: `ng build` limpio y **116/116 pruebas previas verdes** + las nuevas; skills de Fase 3 respetados (`npm run verificar:vocabulario` ✔).
- [ ] Cero términos prohibidos en texto visible; responsive 360/768/1024/1440 sin overflow; touch ≥ 44 px; contraste ≥ 7:1; doble codificación.
- [ ] Contrato documentado en OpenAPI (`@Operation`, `@ApiResponse`) y coherente con §1.
- [ ] PR revisado por un compañero; sin secretos en el repositorio.

---

### ÉPICA C — Backend: Endpoints, Auditoría y Motor SLA

| ID | Tarea | Ejec. | Tam. | Prior. | Depende | Criterios de aceptación |
|---|---|---|:-:|:-:|---|---|
| **C0.1** | Resolver decisiones D-01…D-14 y confirmar nombres reales de tablas/columnas ⚠️ | Humano | S | Must | — | Tabla de decisiones firmada en el PR; lista de diferencias entre este documento y el código real |
| **C0.2** | Emitir skills P0 (#1, 2, 3, 4, 9, 10) | Humano (pide a Claude) | S | Must | — | 6 `SKILL.md` en `.agents/skills/` |
| **C0.3** | Flyway: baseline + `V2…V5`, `ddl-auto=validate`, perfil `demo` con *seed* | Obrero + Humano-BE | L | Must | C0.1, skill #4 | Arranque limpio sobre BD vacía **y** sobre BD existente; `validate` sin errores; trigger de historial probado (**G-C10-03**) |
| **C0.4** | Infraestructura común: `Clock`, Jackson/UTC, `CodigoError`, `@TextoUtil`, `PaginaResponse`, formato de error con `codigo` | Obrero | M | Must | C0.3 | Pruebas de `@TextoUtil` (19/20 caracteres útiles, espacios) y de serialización de fechas en UTC |
| **C0.5** | `TicketEstadoMachine` + `TicketSeguridad` + método de seguridad habilitado | Obrero | M | Must | C0.4, skill #1 | Prueba exhaustiva estado × acción × rol (§1.3) y de propiedad del recurso (404 ajeno) |
| **C1** | `POST /tickets/{id}/tomar` (E1) | Obrero | L | Must | C0.5 | **G-C1-01…05**; prueba de concurrencia con 2 hilos (exactamente un 200 y un 409) |
| **C2** | `POST /tickets/{id}/iniciar` (E2) | Obrero | M | Must | C1 | **G-C2-01…03** |
| **C3** | `GET /tickets/mi-turno` y `/mi-turno/resumen` (E3 + A2) | Obrero | L | Must | C0.5 | **G-C3-01…02**; consulta única agregada; < 150 ms con 10 000 tickets (prueba de humo) |
| **C4** | `POST /tickets/{id}/confirmar` (E4) | Obrero | M | Must | C0.5 | **G-C4-01…04** |
| **C5** | `POST /tickets/{id}/reabrir` (E5, D-05) | Obrero | M | Must | C4 | **G-C5-01…03**; límites recalculados con la configuración vigente |
| **C6** | `POST /tickets/{id}/resolver` (E6, A1) | Obrero | L | Must | C2 | **G-C6-01…05**; `SOLUCION_TICKET` con columnas separadas |
| **C7** | `POST /tickets/{id}/escalar` (E7) | Obrero | M | Must | C2 | **G-C7-01…04**; evento de correo a administradores |
| **C8** | `GET /contexto-cliente` + `ClienteIpResolver` (E8, D-04) | Obrero | M | Must | C0.4 | **G-C8-01…04**; `POST /tickets` reutiliza el mismo resolvedor |
| **C9** | Motor SLA `@Scheduled` + `AlertaSlaEvent` + correo (§1.7) | Obrero | XL→2×L | Must | C0.4, skill #3 | **G-C9-01…06**; pruebas con `Clock` fijo; contador Micrometer; correo con servidor SMTP simulado (GreenMail) |
| **C9b** | Complementarios del portal: `mis-tickets` (+`resumen`), `seguimiento`, `calificacion` (§1.6) | Obrero | L | Must | C4, C10 | El usuario final jamás ve notas internas ni motivo de escalamiento (**G-C7-04**); `409 CALIFICACION_YA_REGISTRADA` |
| **C10** | Auditoría inmutable: servicio, 4 capas, `GET /tickets/{id}/historial` (§1.8) | Obrero | L | Must | C0.3, skill #2 | **G-C10-01…04**; todas las acciones C1–C7 registran evento con IP de origen |
| **C11** | Préstamos: entrega, devolución, listado, vencidos (§1.9) | Obrero | L | Must | C0.3, skill #5 | **G-C11-01…05**; índice filtrado verificado con prueba concurrente |
| **C12** | Reasignación individual y en lote + `usuarios/tecnicos?conCarga` + `tickets/escalados` | Obrero | L | Must | C7 | Motivo obligatorio; destino activo y con rol válido; `CONFLICTO_VERSION` probado; resultado por ticket en el lote |
| **C13** | Catálogos: áreas, equipos, rangos IP, configuración de compromisos (§1.10) | Obrero | XL→2×L | Must | C0.3, skill #7 | Baja lógica; `RECURSO_EN_USO` con conteos; rango IP idempotente (omite duplicadas); validaciones cruzadas de compromisos; cambios solo afectan tickets nuevos |
| **C14** | API editorial del Centro de Soluciones (§1.10) | Obrero | L | Must | C0.3 | Visibilidad por rol (usuario final solo público/publicado); `version` → 409; rechazo de HTML; archivar solo administrador |
| **C15** | `IndicadoresService` único + `GET /indicadores/dashboard` y rango | Obrero | L | Should | C4, C9 | Fórmulas del capítulo IX; coincide con consultas SQL de control (tolerancia 0) |
| **C16** | Seguridad transversal: CORS por perfil, cabeceras, límite de intentos de login, `no-store` en datos sensibles | Obrero | M | Should | C0.4 | Pruebas de matriz endpoint × rol (§1.12) 100 % verdes; login con bloqueo temporal tras 5 fallos |
| **C17** | OpenAPI (`springdoc`) completo y estable | Obrero | M | Should | C1–C14 | `/v3/api-docs` sin advertencias; ejemplos de §1 incluidos |

### ÉPICA D — Frontend: Conmutación HTTP, Administración y Centro de Soluciones

| ID | Tarea | Ejec. | Tam. | Prior. | Depende | Criterios de aceptación |
|---|---|---|:-:|:-:|---|---|
| **D1** | Infraestructura de conmutación: `mocksActivos`/`usaMock`, `proxy.conf.json`, `mapearErrorApi`, ajuste de interceptores, `descarga-archivo.service`, (Should) tipos desde OpenAPI | Obrero | L | Must | skill #9 | Pruebas de `mapearErrorApi` (401/403/404/409/0/5xx); 401 limpia sesión y conserva `returnUrl`; token no se envía a otros hosts |
| **D2** | Ajuste de `*.http.ts` de Fase 3 a los contratos finales (verbos `POST`, `mi-turno`, DTO, alias, `ahoraServidorIso`) | Obrero | M | Must | C0.1, D1 | Pruebas de contrato Mock↔Http en verde (`HttpTestingController`) para las 4 `*Api` de Fase 3 |
| **D3** | Conmutación pasos 1–5 (§2.1) con checklist de humo por paso | Obrero + Humano-FE | L | Must | C1–C9b, D2 | Cada paso: flag en `false`, flujo manual OK, *rollback* verificado; escenario de concurrencia en 2 navegadores |
| **D3b** | Conmutación pasos 6–7 (cmdb, sla, conocimiento lectura, dashboard) | Obrero | M | Must | C13, C14, C15 | Pantallas de Fase 2 sobre datos reales; KPIs coinciden con SQL |
| **D4** | `linea-tiempo-auditoria` + integración en ficha de Mi Turno e `incidentes/detalle` | Obrero | M | Must | C10, skill #2 | Orden cronológico, ícono + texto por tipo, sin términos prohibidos; lectura accesible (`<ol>`) |
| **D5** | **Bandeja de Escalamientos** (lista + detalle + asumir) | Obrero | XL→2×L | Must | C12, D4 | Orden por urgencia; “Lo que ya revisó el practicante” visible; **Asumir** mueve el ticket a *Mis tickets* del admin; contador en menú; no aparece el botón “Escalar” |
| **D5b** | Extender `dialogo-escalar-ticket` (detalles técnicos, tipo de problema N2) | Obrero | S | Must | C7 | Campos opcionales; el valor viaja en `escalar`; pruebas de diálogo actualizadas |
| **D6** | **Carga del equipo + reasignación** (individual y lote) + `dialogo-reasignar-ticket` | Obrero | L | Must | C12 | Selección múltiple accesible; resumen por ticket; motivo obligatorio; manejo de `409` |
| **D7** | **Mantenimiento de catálogos**: áreas, alta/edición/baja de equipos, alta de rangos IP, compromisos de atención | Obrero | XL→3×L | Must | C13, skill #7 | Vista previa del rango (“se crearán N, se omitirán M”); mensajes de `RECURSO_EN_USO`; aviso “aplica a solicitudes nuevas”; confirmación defensiva |
| **D8** | **Centro de Soluciones**: lista + editor + vista previa + control de lenguaje | Obrero | XL→2×L | Must | C14, skill #8 | Reordenar pasos con teclado; bloqueo de “visible para personal asistencial” con términos prohibidos; borrador local; conflicto de versión sin perder texto |
| **D9** | **Módulo de Préstamos** (lista + modales entrega/devolución) | Obrero | L | Should | C11, skill #5 | Insignia “Vencido” con ícono + texto; equipo ya prestado no seleccionable; coherente con `enPrestamo` de Consulta rápida |
| **D10** | Menús por rol, rutas, `rolGuard` y redirección (D-11) | Obrero | S | Must | D5–D8 | Matriz de rutas por rol probada; `/escalamiento` bloqueado al practicante |
| **D11** | Revisión humana: accesibilidad + responsive de las pantallas nuevas | Humano-FE | M | Must | D5–D9 | Checklist §5.4 completo |

### ÉPICA E — Reportes y Pruebas E2E

| ID | Tarea | Ejec. | Tam. | Prior. | Depende | Criterios de aceptación |
|---|---|---|:-:|:-:|---|---|
| **E0** | `docker-compose` del stack (SQL Server + backend + nginx/front) + *seed* demo + `.env.example` | Obrero + Humano | M | Must | C0.3 | `docker compose up` deja el sistema usable con los 3 perfiles; ningún secreto versionado |
| **E1** | **Reportes backend**: servicio, plantilla, PDF, vista previa (§1.11); `logo-hsmsi.png` (D-12) | Obrero | XL→2×L | Must | C15, skill #6 | **G-E1-01…05**; texto extraído con PDFBox contiene membrete y periodo; vista previa = PDF |
| **E2** | **Pantalla de reportes** y descarga (D-A5) | Obrero | L | Must | E1, D1 | Flujo completo; `aria-busy`/`role="status"`; archivo con nombre correcto; sin incrustar PDF en móvil |
| **E3** | **Pruebas E2E (Playwright)**: proyecto, *fixtures* de sesión por rol, perfiles 360×640 y 1440×900 | Obrero | L | Must | E0, skill #11 | Los 6 escenarios de §5.5 en verde contra el stack del compose |
| **E4** | Accesibilidad automatizada (axe) en E2E de las pantallas clave | Obrero | M | Should | E3 | 0 violaciones críticas/serias |
| **E5** | Matriz de casos de prueba formal (formato capítulo XV: ID, pasos, resultado esperado, **obtenido**) + trazabilidad (§6) | Humano | M | Must | E3 | Tabla en el informe con evidencia (capturas / reporte Playwright) |
| **E6** | Script de creación de BD consolidado para la entrega (derivado de Flyway) + manual de instalación | Humano-BE | S | Must | C0.3 | `script_creacion_bd.sql` ejecutable en SQL Server 2022 limpio |
| **E7** | UAT con el hospital (Ingeniero de TI + 1 practicante + 1 usuario asistencial) y registro de observaciones | Humano | M | Must | D3, D5–D8, E1 | Acta con observaciones y decisiones |
| **E8** | Cierre: actualizar `roadmap-maestro`, `contexto_claude.md`, manuales; PR final a `develop` | Humano | S | Must | todas | `./mvnw verify` + `ng build` + `ng test` + E2E verdes |

### Calendario sugerido (supuesto: 4 semanas; ajustar a la fecha de sustentación)

| Semana | Backend | Frontend | Calidad |
|---|---|---|---|
| **1** | C0.1–C0.5, C1, C2, C3, C4 | D1, D2 (con mocks) | E0 (inicio) |
| **2** | C5–C8, C10, C9 (parte 1) | D3 pasos 1–3, D4 | Pruebas de integración de C1–C8 |
| **3** | C9 (parte 2), C9b, C11, C12, C14 | D3 pasos 4–5, D5, D5b, D6 | E1 (inicio), prueba de concurrencia en 2 navegadores |
| **4** | C13, C15, C16, C17 | D3b, D7, D8, D9, D10, E2 | E3–E8, UAT |

---

## 5. PLAN DE PRUEBAS

### 5.1 Pirámide y herramientas

| Nivel | Herramienta | Qué cubre | Meta |
|---|---|---|---|
| Unitarias backend | JUnit 5 + Mockito + AssertJ | `TicketEstadoMachine` (100 % de celdas), `MotorSlaService` (reloj fijo), `@TextoUtil`, `ClienteIpResolver`, cálculo de KPI | ≥ 85 % líneas en servicios críticos |
| Slice web | `@WebMvcTest` + `spring-security-test` | Matriz endpoint × rol (§1.12), códigos de error, validación de cuerpo | Todas las celdas de la matriz |
| Integración | **Testcontainers (SQL Server 2022)** + `@SpringBootTest` | Migraciones Flyway sobre BD vacía, trigger de inmutabilidad, índice filtrado de préstamos, **concurrencia** (`CountDownLatch`), consulta agregada de resumen | Todos los escenarios **G-** marcados de BD |
| Correo | GreenMail | Alertas de SLA y de escalamiento | G-C9-06 |
| PDF | PDFBox (extracción de texto) | `%PDF`, membrete, periodo, coherencia con JSON | G-E1-01…02 |
| Unitarias frontend | Runner del proyecto | `mapearErrorApi`, pruebas de contrato Mock↔Http, páginas nuevas, `editor-pasos`, diálogos, `descarga-archivo` | 116 previas + nuevas, 0 fallos |
| E2E | **Playwright** (Chromium; perfiles móvil/desktop) + axe | Escenarios de §5.5 sobre el stack real | 100 % verde |
| Seguridad | Pruebas automatizadas + revisión manual | IDOR/BOLA, tokens manipulados/expirados, *spoofing* de `X-Forwarded-For`, inyección HTML en artículos, límites de rango | Lista §5.3 completa |
| UAT | Checklist con el hospital | Flujos reales con personal | Acta firmada |

### 5.2 Comandos de verificación

```bash
# Backend
./mvnw verify                                   # unitarias + integración (requiere Docker para Testcontainers)
./mvnw -Dtest=TicketEstadoMachineTest test      # tabla exhaustiva de transiciones
# Frontend
ng build && ng test --watch=false && npm run verificar:vocabulario
# Stack completo + E2E
docker compose up -d --build && npx playwright test
```

### 5.3 Checklist de seguridad y concurrencia (manual + automatizado)

- [ ] **BOLA/IDOR:** un usuario final pide el `id` de un ticket ajeno en `seguimiento`, `confirmar`, `reabrir`, `calificacion` → **404** (nunca 403/200).
- [ ] Practicante intenta `escalar` un ticket asignado a otro → 403; administrador intenta `escalar` → 403.
- [ ] Token expirado/alterado → 401 (sin detalle del motivo).
- [ ] `X-Forwarded-For` falsificado en conexión directa → ignorado.
- [ ] Dos navegadores pulsan **Tomar** a la vez → uno gana, el otro ve “Otro técnico ya tomó este ticket” y su lista se refresca.
- [ ] `UPDATE`/`DELETE` directo en `HISTORIAL_TICKET` desde SSMS → error 51000.
- [ ] Artículo con `<script>` → rechazado por la API; con `&lt;` → se muestra como texto.
- [ ] Reporte con rango > 366 días → 400; peticiones concurrentes de PDF no degradan el resto de la API (prueba de humo con 5 descargas simultáneas).
- [ ] Ningún correo de alerta contiene datos de pacientes (solo código de ticket, servicio y prioridad).

### 5.4 Checklist visual y de accesibilidad (pantallas nuevas; Chrome/Edge + Android real)

- [ ] 360 / 768 / 1024 / 1440 px sin scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] Tabla ≥ 1024 y tarjetas < 1024, **nunca ambas**; targets ≥ 44 px; foco visible.
- [ ] **Escalamientos:** contador del menú se actualiza; “Asumir” no muestra “Escalar”; el motivo del practicante se lee completo.
- [ ] **Carga del equipo:** selección múltiple por teclado; el resumen del lote se anuncia; motivo obligatorio.
- [ ] **Catálogos:** vista previa del rango IP; mensaje claro ante `RECURSO_EN_USO`; “Desactivar” (no “Eliminar”).
- [ ] **Editor:** mover pasos con teclado y anuncio; marca de términos prohibidos; borrador reaparece tras recargar; vista previa = lo que ve el usuario final.
- [ ] **Reportes:** botón “Generando…” con `aria-busy`; el PDF descargado coincide con la vista previa; nombre `reporte-compromisos-AAAA-MM.pdf`.
- [ ] Búsqueda de “ITIL”, “SLA”, “CMDB”, “KEDB”, “RFC” (`Ctrl+F`) en todas las vistas: **0 coincidencias** en texto visible.

### 5.5 Escenarios E2E (Playwright, sobre datos *seed*)

1. **Ciclo completo feliz:** usuaria reporta (contexto de equipo detectado) → practicante **toma y comienza** → **resuelve** con artículo → usuaria **confirma** y **califica 5** → el historial interno muestra la secuencia completa y el panel refleja el KPI.
2. **Reapertura:** usuaria responde “No, sigue fallando” → ticket vuelve al mismo técnico como *Reabierto* con compromiso reiniciado.
3. **Escalamiento y N2:** practicante **escala** con motivo → administrador lo ve en *Escalamientos*, **asume**, inicia y resuelve; usuaria nunca ve el motivo.
4. **Concurrencia:** dos contextos de navegador toman el mismo ticket; exactamente uno gana.
5. **Compromiso de atención:** un ticket crítico cruza ALERTA e INCUMPLIDO (reloj acelerado en entorno de pruebas con `servicedesk.sla.intervalo-ms` reducido) → semáforo cambia, hay historial `SLA_*` y correo capturado por GreenMail.
6. **Administración:** el administrador crea un área y un rango de IP, edita compromisos (solo afectan a nuevas solicitudes), publica una solución visible para el personal asistencial (aparece en *Ayuda rápida*), registra y devuelve un préstamo, y descarga el reporte PDF.

### 5.6 Rendimiento y datos (humo)

- *Seed* de 10 000 tickets: `mi-turno/resumen` < 150 ms, `mi-turno` (página de 10) < 300 ms, reporte mensual < 5 s.
- Motor SLA con 1 000 tickets activos: ejecución < 2 s.

---

## 6. TRAZABILIDAD (exigida por `requisitos_software.md §8`)

`PROBLEMA → PRÁCTICA ITIL → PROCESO → MEJORA → RF → FUNCIONALIDAD`

| Problema diagnosticado | Práctica | Proceso | Mejora | RF | Funcionalidad Fase 4 |
|---|---|---|---|:-:|---|
| Atención desordenada y pérdida de tickets | Service Desk / Gestión de incidentes | Ciclo de vida del ticket | Registro único con estados trazables | RF01, RF04 | E1, E2, E4, E5, E6 · Historial inmutable |
| Fallas críticas atendidas como menores | Gestión de niveles de servicio | Priorización y control de compromisos | Motor de compromisos automático con alertas | RF03, RF07 | Motor `@Scheduled`, alertas P1, configuración de compromisos |
| Escalamiento informal | Gestión de incidentes (escalamiento funcional) | Derivación N1→N2 con motivo | Cola N2 con diagnóstico previo y reasignación | RF05 | E7, Bandeja de Escalamientos, Carga del equipo |
| Soluciones no documentadas | Gestión del conocimiento / Gestión de problemas | Centro de Soluciones (KEDB) | Artículos vinculados a tickets y editor | RF06, RF09 | Editor, vínculo ticket-artículo en E6 |
| Equipos de repuesto sin control | Gestión de activos y configuración | Préstamos temporales | Trazabilidad de entrega/devolución | RF08* | Módulo de Préstamos |
| Conflictos de IP e inventario sin registro | Gestión de configuración | Catálogo de equipos y rangos IP | Alta de rangos, detección por IP | RF01 | E8 `contexto-cliente`, mantenimiento de catálogos |
| Falta de métricas para sustentar presupuesto | Mejora continua / Medición | KPI e informes | Reporte ejecutivo con membrete | RF10 | Indicadores únicos, Reportes PDF |
| Satisfacción no medida | Mejora continua | Validación del usuario | Confirmación, reapertura y calificación | RF10 | E4, E5, calificación |

\* Préstamos y portal público son requerimientos acordados con el hospital (`contexto_claude.md §5`) más allá de RF01–RF10 de la rúbrica.

---

## 7. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | Diferencias entre este documento y el código/esquema real (no revisé el código) | Tarea **C0.1** obligatoria; migraciones con `IF NOT EXISTS`/verificaciones y probadas sobre una copia de la BD |
| R2 | Adoptar Flyway sobre una BD generada por Hibernate puede revelar diferencias de tipos (`VARCHAR` vs `NVARCHAR`) | Baseline + `validate` en una rama; corregir con migraciones, no con `update` |
| R3 | Carga de trabajo (≈ 45 tareas) para un equipo estudiantil | *Must/Should/Could* explícitos; **recorte propuesto si hay atraso:** C16, C17, D9, E4 y la reasignación en lote pasan a Fase 5 |
| R4 | Alertas por correo sin servidor SMTP institucional | Configurable por perfil; en demo, GreenMail/MailHog; el valor del semáforo y del historial no depende del correo |
| R5 | Reabrir reinicia el compromiso (D-05) y podría “maquillar” incumplimientos | Banderas `Incumplio*` y `NumeroReaperturas` conservados y visibles en reportes |
| R6 | Reportes pesados bloquean el hilo del servidor | Consultas agregadas en BD, límite de rango, tiempo objetivo y prueba de humo (§5.6); async con *job* si se supera en Fase 5 |
| R7 | TLS/JWT sobre HTTP en la red del hospital | D-14: nginx con HTTPS y cabeceras de seguridad en el despliegue |
| R8 | Privacidad (Ley N.º 29733): textos libres con datos de pacientes en soluciones, motivos o correos | Avisos permanentes, correos sin texto libre, reportes sin datos personales del solicitante |

---

*Fin del documento. Siguiente paso recomendado: ejecutar **C0.1** (resolver D-01…D-14 y verificar el esquema real) y solicitar los 6 skills **P0** de §3 para habilitar al Agente Obrero.*
