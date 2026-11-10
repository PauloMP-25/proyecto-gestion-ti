# Fase 3 Backend (preparada): Conformidad, KEDB, CMDB, Préstamos, Accesos, Indicadores y Alertas
## Mesa de Ayuda — Hospital Santa María del Socorro (HSMSI)

> **Estado:** Borrador listo para arrancar. El Backend avanza más rápido que el Frontend, así que esta fase puede empezar cuando las tareas T0.x de [`fase_2_backend.md`](./fase_2_backend.md) estén en `develop`.
> **Rama sugerida:** una por bloque: `feature/fase3-kedb`, `feature/fase3-cmdb`, etc.
> **Endpoints:** [`matriz_endpoints.md`](./matriz_endpoints.md) filas 23–53.

---

## 0. Decisiones que el equipo humano debe aprobar antes de programar

Esta fase **sí necesita tablas o columnas nuevas** que no están en la BD v2. Las dejo como propuesta para que no improvisen:

| # | Propuesta | Por qué | Alternativa si no se aprueba |
|---|---|---|---|
| D1 | Tabla `PRESTAMO_EQUIPO` | Tesis 7.4.3 (préstamo de contingencia, SLA ≤ 45 min) y `requerimientos.md` lo exigen; no existe en la BD v2. | Ninguna razonable: el préstamo tiene fechas propias. |
| D2 | Tabla `ENCUESTA_SATISFACCION` (1:1 con ticket) | KPI 7 (≥ 85 %) y tesis 12.2.1 módulo 7. | Dos columnas en `TICKET` (`Calificacion TINYINT`, `ComentarioEncuesta`). Menos limpio. |
| D3 | `USUARIO.DebeCambiarContrasena BIT DEFAULT 1` | Tesis 7.4.4 y 7.5: clave provisional con cambio obligatorio. | Omitir el cambio forzado (baja seguridad). |
| D4 | `TICKET.AlertaSlaEnviada BIT`, `TICKET.VencimientoNotificado BIT` | Evitar correos duplicados del job de alertas. | Tabla `NOTIFICACION` genérica (más flexible, más trabajo). |
| D5 | Alinear `ERROR_CONOCIDO` del código con BD v2 (`Sintoma`, `CausaRaiz`, `SolucionWorkaround`, `IdCategoria`, `IdUsuarioCreador`, `Activo`) y crear `TICKET_ERROR_CONOCIDO` | Hoy el código usa `descripcion_problema`, `solucion_trabajo`, `publicado`. | — (la BD v2 ya lo define). |

### Esquema propuesto (SQL Server, mismo estilo que el diccionario de datos)

```text
PRESTAMO_EQUIPO
  IdPrestamo              INT PK IDENTITY
  IdCI                    INT FK → ElementoConfiguracion
  IdTicket                INT NULL FK → Ticket          -- préstamo originado por una avería
  IdAreaDestino           INT FK → Area
  IdUsuarioReceptor       INT FK → Usuario              -- quien recibe en el área
  IdUsuarioEntrega        INT FK → Usuario              -- técnico que entrega
  IpTemporal              VARCHAR(15) NULL
  FechaPrestamo           DATETIME2(0)
  FechaDevolucionPrevista DATETIME2(0)
  FechaDevolucionReal     DATETIME2(0) NULL
  Estado                  VARCHAR(15) CHECK  -- ENUM EstadoPrestamo: ACTIVO, DEVUELTO, VENCIDO
  Observacion             VARCHAR(300) NULL

ENCUESTA_SATISFACCION
  IdEncuesta      INT PK IDENTITY
  IdTicket        INT UNIQUE FK → Ticket
  Calificacion    TINYINT CHECK (Calificacion BETWEEN 1 AND 5)
  Comentario      VARCHAR(500) NULL
  FechaRespuesta  DATETIME2(0)
```

> Regla: un préstamo `ACTIVO` impide prestar el mismo `IdCI` otra vez (validación en servicio + índice filtrado `WHERE Estado = 'ACTIVO'`).

---

## 1. Backlog por bloques (independientes entre sí)

### Bloque A — Conformidad y encuesta (tesis 7.2.2 pasos 9–10)
| ID | Tarea | Criterios |
|---|---|---|
| A1 | `PUT /api/tickets/{id}/conformidad` `{ "acepta": true, "comentario": "..." }` | Solo el solicitante y solo en `RESUELTO`. `acepta=true → CERRADO`; `false → REABIERTO` (comentario obligatorio ≥ 10). Historial. |
| A2 | `POST /api/tickets/{id}/encuesta` `{ "calificacion": 1..5, "comentario"? }` | Solo en `CERRADO`, una vez por ticket (409 si repite). |
| A3 | Auto-cierre: `@Scheduled` cierra tickets `RESUELTO` sin respuesta del usuario tras 72 h | Comentario en historial “Cierre automático por falta de respuesta”. Plazo configurable en `application.properties`. |

### Bloque B — KEDB (tesis 6.4, 7.3; KPI 4 y 5)
| ID | Tarea | Criterios |
|---|---|---|
| B1 | Migrar `ErrorConocido` a BD v2 (D5) y crear `TicketErrorConocido` | Tablas generadas, sin `DELETE` físico. |
| B2 | Búsqueda paginada `GET /api/kedb?texto&idCategoria` | `LIKE` sobre `Titulo` y `Sintoma`; formato `PaginaDTO`. |
| B3 | `PATCH /api/kedb/{id}/activo` reemplaza `DELETE` | El `DELETE` actual se elimina. |
| B4 | Vincular ticket ↔ error y `GET /api/kedb/sugerencias` | Sugerencias por categoría del ticket; máximo 5. |

### Bloque C — CMDB y direcciones IP (tesis 6.3, 7.5; RF de gestión de IP)
| ID | Tarea | Criterios |
|---|---|---|
| C1 | CRUD de equipos `/api/equipos` | Hostname y MAC únicos si no son nulos; MAC con formato `AA:BB:CC:DD:EE:FF`. |
| C2 | `PUT /api/tickets/{id}/equipo` | Vincula el CI cuando el ticket llegó con `ipRegistrada:false` (flujo mixto). |
| C3 | IPs: registrar, asignar, liberar, historial | Asignar una IP `OCUPADA` → 409 (evita la duplicidad que la tesis señala como causa de caídas). Cada asignación/liberación escribe `HISTORIAL_ASIGNACION_IP`. |
| C4 | Integrar con contexto-cliente | `GET /api/tickets/contexto-cliente` usa la asignación vigente (`FechaLiberacion IS NULL`). |

### Bloque D — Préstamos de contingencia (tesis 7.4.3)
| ID | Tarea | Criterios |
|---|---|---|
| D-1 | Entidad y endpoints `/api/prestamos` (D1) | No se presta un CI en `BAJA`, `MANTENIMIENTO` ni con préstamo `ACTIVO`. |
| D-2 | Job diario marca `VENCIDO` | `GET /api/prestamos/vencidos` para el Administrador. |

### Bloque E — Gestión de accesos (tesis 7.5)
| ID | Tarea | Criterios |
|---|---|---|
| E1 | CRUD `/api/usuarios` (solo `ADMINISTRADOR`) | Clave provisional con BCrypt; correo único; `nivelSoporte` obligatorio si rol ≠ `USUARIO_FINAL`. |
| E2 | `PATCH /api/usuarios/{id}/activo` | Revocar = `Activo = 0`; libera sus IPs asignadas; nunca `DELETE`. Un usuario inactivo no puede iniciar sesión. |
| E3 | `PUT /api/auth/cambiar-contrasena` + D3 | Si `DebeCambiarContrasena = 1`, el login devuelve `"debeCambiarContrasena": true` y el resto de endpoints responde 403 hasta cambiarla. |

### Bloque F — Indicadores (tesis cap. IX)
`GET /api/indicadores/kpis?desde&hasta` devuelve los 7 KPI ya calculados (el Frontend solo pinta):

| KPI | Cálculo con columnas existentes | Meta |
|---|---|---|
| Cumplimiento SLA | cerrados con `FechaResolucionReal ≤ FechaLimiteResolucion` / cerrados | ≥ 90 % |
| TPR | promedio `FechaAsignacion − FechaCreacion` | ≤ 20 min |
| MTTR (P1–P2) | promedio `FechaResolucionReal − FechaCreacion` | ≤ 3 h |
| FCR | resueltos por N1 sin fila en `ESCALAMIENTO` / atendidos por N1 | ≥ 65 % |
| Recurrencia | conteo en `TICKET_ERROR_CONOCIDO` por error, comparado con el trimestre anterior | −30 % |
| Disponibilidad | (minutos del periodo − minutos de tickets P1 de categoría red/sistemas abiertos) / minutos del periodo | ≥ 99.5 % |
| Satisfacción | encuestas con calificación ≥ 4 / encuestas respondidas | ≥ 85 % |

```json
{ "desde": "2026-11-01", "hasta": "2026-11-30",
  "kpis": [ { "codigo": "CUMPLIMIENTO_SLA", "valor": 92.4, "unidad": "%", "meta": 90, "cumple": true } ] }
```
> La disponibilidad es una **aproximación** basada en tickets (no hay monitoreo de red). Debe decirse así en la sustentación.

### Bloque G — Alertas por correo (tesis 11.1 “optimizar y automatizar”)
| ID | Tarea | Criterios |
|---|---|---|
| G1 | `spring-boot-starter-mail` + `@Scheduled(fixedDelay = 5 min)` | Al pasar a `ALERTA`: correo al asignado. Al pasar a `INCUMPLIDO`: correo al asignado y a los `ADMINISTRADOR`. |
| G2 | Idempotencia con D4 | Un ticket nunca dispara dos veces el mismo correo. |
| G3 | Credenciales SMTP solo por variables de entorno | Nada en `application.properties` versionado (`AGENTS.md` §3). En desarrollo, usar MailHog/Mailpit en Docker. |
| G4 | Textos sin “ITIL” | Asunto: “Ticket INC-2026-00101 próximo a vencer”. |

---

## 2. Orden recomendado
1. **E (accesos)**: desbloquea crear usuarios reales sin SQL manual.
2. **A (conformidad)**: cierra el ciclo de vida que la tesis describe.
3. **C (CMDB/IP)**: completa el flujo mixto de IP de Fase 2.
4. **B (KEDB)**, **F (indicadores)**, **D (préstamos)**, **G (correo)**.

## 3. DoD de la fase
* [ ] D1–D5 aprobadas por el equipo y reflejadas en `diseno_base_datos.md` **antes** de programar.
* [ ] Filas 23–53 de la matriz implementadas, con test de integración del caso feliz y de un caso 4xx cada una.
* [ ] Ningún `DELETE` físico sobre usuarios, artículos KEDB, equipos ni IPs.
* [ ] Jobs (`@Scheduled`) testeados con `Clock` inyectado.
* [ ] Colección Postman/Bruno actualizada.
