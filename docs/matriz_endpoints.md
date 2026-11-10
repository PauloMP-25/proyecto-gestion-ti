# Matriz Maestra de Endpoints — Mesa de Ayuda HSMSI

> Acuerdo entre Frontend y Backend. Si un endpoint no está aquí, **no existe**: se agrega primero a esta matriz (PR a `develop`) y luego se programa.
> DTOs y enums: [`contratos_api_y_modelos.md`](./contratos_api_y_modelos.md).

**Leyenda de roles:** `UF` = `USUARIO_FINAL` · `PR` = `PRACTICANTE` · `AD` = `ADMINISTRADOR` · `Público` = sin token
**Estado en `develop` (2026-11-10):** ✅ existe y cumple · 🔧 existe pero hay que ajustarlo · 🆕 por crear

---

## Resumen por fase

| Fase | Endpoints | Objetivo |
|---|:---:|---|
| 1 (hecha) | 1 | Inicio de sesión |
| **2 (actual)** | 22 | Ciclo completo del ticket + catálogos mínimos para operar |
| 3 (preparada) | 31 | Conformidad y encuesta, KEDB, CMDB e IPs, préstamos, gestión de accesos, indicadores, alertas por correo |
| 4 (futura) | 4 | Reportes PDF y solicitudes de cambio (RFC) |

---

## FASE 1 y 2 — Autenticación, tickets y catálogos

| # | Método | Ruta | Roles | Propósito | Request → Response | Estado | Consumidor Frontend |
|---|---|---|---|---|---|:---:|---|
| 1 | POST | `/api/auth/login` | Público | Iniciar sesión | `LoginRequest` → `Sesion` (3.1) | 🔧 hoy solo deja entrar a `TECNICO`; debe aceptar los 3 roles y devolver `usuario` | `auth.service` |
| 2 | GET | `/api/auth/me` | UF PR AD | Rehidratar sesión al recargar | — → `usuario` (3.1) | 🆕 | `auth.service` |
| 3 | GET | `/api/tickets/contexto-cliente` | UF PR AD | Detectar IP, equipo, área y anexo | — → `ContextoCliente` (3.2) | 🆕 | `contexto-cliente.service` |
| 4 | POST | `/api/tickets` | UF PR AD | Registrar incidente o solicitud | `CrearTicket` (3.3) → `TicketDetalle` 201 | 🔧 hoy es `permitAll` y usa `asunto`; exigir JWT, `titulo`, código y SLA | `solicitud-formulario` |
| 5 | GET | `/api/tickets` | PR AD | Bandeja con filtros y paginación | `?estado&prioridad&idArea&nivelSoporte&asignadoA&texto&pagina&tamano&orden` → `Pagina<TicketResumen>` | 🔧 hoy devuelve `List` sin filtros y es público | `incidente-lista` |
| 6 | GET | `/api/tickets/mis-tickets` | UF PR AD | Tickets que yo reporté | `?estado&pagina&tamano` → `Pagina<TicketResumen>` | 🆕 | `incidente-lista modo='propios'` |
| 7 | GET | `/api/tickets/{id}` | UF* PR AD | Detalle con historial, escalamientos y soluciones | — → `TicketDetalle` (3.5) | 🔧 *UF solo si es el solicitante (si no, 403) | `incidente-detalle` |
| 8 | GET | `/api/tickets/{id}/historial` | UF* PR AD | Línea de tiempo | — → `HistorialEntrada[]` | 🔧 hoy se llama `/auditoria`: renombrar | `incidente-linea-tiempo` |
| 9 | PUT | `/api/tickets/{id}/asignar` | AD | Asignar a un técnico | `{ idTecnico, comentario? }` → `TicketDetalle` | 🔧 renombrar `tecnicoId` → `idTecnico` | `dialogo-asignar` |
| 10 | PUT | `/api/tickets/{id}/tomar` | PR AD | Autoasignarse | — → `TicketDetalle` | 🆕 | botón “Tomar” |
| 11 | PUT | `/api/tickets/{id}/iniciar` | PR AD (asignado) | `ASIGNADO → EN_PROCESO` | `{ comentario? }` → `TicketDetalle` | 🆕 | `dialogo-cambiar-estado` |
| 12 | PUT | `/api/tickets/{id}/escalar` | PR AD (asignado) | Derivar N1 → N2 | `{ motivo }` 20..300 → `TicketDetalle` | 🆕 (se adelanta de Fase 3) | `dialogo-escalar` |
| 13 | PUT | `/api/tickets/{id}/resolver` | PR AD (asignado) | Registrar solución | `{ solucion }` 20..2000 → `TicketDetalle` | 🔧 guardar en `SOLUCION_TICKET` | `dialogo-resolver` |
| 14 | PUT | `/api/tickets/{id}/cerrar` | AD | `RESUELTO → CERRADO` | `{ comentario? }` → `TicketDetalle` | 🔧 validar estado previo | `dialogo-cambiar-estado` |
| 15 | PUT | `/api/tickets/{id}/reabrir` | UF* AD | `RESUELTO → REABIERTO` | `{ motivo }` 10..500 → `TicketDetalle` | 🆕 | `dialogo-cambiar-estado` |
| 16 | GET | `/api/usuarios/tecnicos` | PR AD | Técnicos activos para asignar | — → `Tecnico[]` (3.7) | 🆕 | `dialogo-asignar` |
| 17 | GET | `/api/categorias` | UF PR AD | Categorías del formulario | `?soloActivas=true` → `Categoria[]` | 🆕 | `solicitud-formulario`, filtros |
| 18 | POST | `/api/categorias` | AD | Crear categoría | `{ nombre, idPadre? }` → `Categoria` 201 | 🆕 | (pantalla admin, Fase 3 FE) |
| 19 | PUT | `/api/categorias/{id}` | AD | Editar categoría | `{ nombre, idPadre? }` → `Categoria` | 🆕 | (Fase 3 FE) |
| 20 | GET | `/api/areas` | UF PR AD | Áreas para filtros | — → `Area[]` | 🆕 | `incidente-filtros` |
| 21 | POST | `/api/areas` | AD | Crear área | `{ nombre, anexo? }` → `Area` 201 | 🆕 | (Fase 3 FE) |
| 22 | PUT | `/api/areas/{id}` | AD | Editar área | `{ nombre, anexo? }` → `Area` | 🆕 | (Fase 3 FE) |

> [!NOTE]
> Los endpoints 17–22 existen para que las áreas y categorías reales se carguen **con el ingeniero del hospital** sin scripts semilla. En desarrollo, cada compañero puede crear 2–3 registros de prueba con Postman en su BD local.

### Máquina de estados que el backend debe hacer cumplir (Fase 2)

| Desde | Acción | Hacia | Efecto adicional |
|---|---|---|---|
| — | crear | `NUEVO` | Calcula prioridad, fechas límite, `nivelSoporte = N1`, historial |
| `NUEVO`, `REABIERTO`, `ESCALADO` | asignar / tomar | `ASIGNADO` | Primera vez: `fechaAsignacion` y `fechaRespuestaReal` |
| `ASIGNADO` | iniciar | `EN_PROCESO` | Historial |
| `EN_PROCESO` | escalar | `ESCALADO` | Fila en `ESCALAMIENTO`, `nivelSoporte = N2`, se libera `asignadoA` |
| `ASIGNADO`, `EN_PROCESO` | resolver | `RESUELTO` | Fila en `SOLUCION_TICKET`, `fechaResolucionReal`, congela `estadoSla` |
| `RESUELTO` | cerrar | `CERRADO` | `fechaCierre` |
| `RESUELTO` | reabrir | `REABIERTO` | El SLA de resolución se recalcula desde la reapertura |
| `CERRADO` | cualquiera | — | `409 Conflict` |

Toda transición escribe una fila en `HISTORIAL_TICKET` (quién, qué, cuándo). Es obligatorio por `AGENTS.md` §3.

---

## FASE 3 — Preparada para el equipo Backend (detalle en [`fase_3_backend.md`](./fase_3_backend.md))

### 3.A Conformidad del usuario y encuesta (KPI 7)
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 23 | PUT | `/api/tickets/{id}/conformidad` | UF (solicitante) | Acepta (`→ CERRADO`) o rechaza (`→ REABIERTO`) la solución | 🆕 |
| 24 | POST | `/api/tickets/{id}/encuesta` | UF (solicitante) | Calificación 1–5 y comentario, solo si `CERRADO` | 🆕 |

### 3.B Base de conocimiento (KEDB)
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 25 | GET | `/api/kedb` | PR AD | Buscar artículos (`?texto&idCategoria&pagina`) | 🔧 hoy sin paginación ni búsqueda |
| 26 | GET | `/api/kedb/{id}` | PR AD | Ver artículo | ✅ |
| 27 | POST | `/api/kedb` | PR AD | Publicar artículo | 🔧 alinear campos con BD v2 (`sintoma`, `causaRaiz`, `solucionWorkaround`, `idCategoria`, creador del JWT) |
| 28 | PUT | `/api/kedb/{id}` | PR AD | Editar artículo | 🔧 |
| 29 | PATCH | `/api/kedb/{id}/activo` | AD | Activar/desactivar (borrado lógico) | 🆕 reemplaza al `DELETE` físico actual |
| 30 | POST | `/api/tickets/{id}/errores-conocidos` | PR AD | Vincular ticket ↔ error conocido (KPI 5) | 🆕 |
| 31 | GET | `/api/kedb/sugerencias` | PR AD | Sugerir artículos por `?idCategoria&texto` al atender | 🆕 |

### 3.C CMDB y direcciones IP
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 32 | GET | `/api/equipos` | PR AD | Inventario paginado (`?tipo&estado&idArea&texto`) | 🆕 |
| 33 | GET | `/api/equipos/{id}` | PR AD | Ficha con IP actual y tickets relacionados | 🆕 |
| 34 | POST | `/api/equipos` | AD | Registrar CI | 🆕 |
| 35 | PUT | `/api/equipos/{id}` | AD | Editar CI | 🆕 |
| 36 | PATCH | `/api/equipos/{id}/estado` | AD | `ACTIVO` / `MANTENIMIENTO` / `BAJA` | 🆕 |
| 37 | PUT | `/api/tickets/{id}/equipo` | PR AD | Vincular el equipo al ticket cuando la IP no estaba registrada | 🆕 |
| 38 | GET | `/api/direcciones-ip` | PR AD | Listar IPs (`?estado&subred`) | 🆕 |
| 39 | POST | `/api/direcciones-ip` | AD | Registrar IP | 🆕 |
| 40 | POST | `/api/direcciones-ip/{id}/asignar` | AD | Asignar IP a un equipo (rechaza duplicados con 409) | 🆕 |
| 41 | POST | `/api/direcciones-ip/{id}/liberar` | AD | Liberar IP (`→ LIBRE`) | 🆕 |
| 42 | GET | `/api/direcciones-ip/{id}/historial` | AD | Trazabilidad de asignaciones | 🆕 |

### 3.D Préstamos de equipos de contingencia
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 43 | GET | `/api/prestamos` | PR AD | Listar (`?estado&idArea`) | 🆕 |
| 44 | POST | `/api/prestamos` | PR AD | Prestar equipo (opcional: vinculado a ticket) | 🆕 |
| 45 | PUT | `/api/prestamos/{id}/devolver` | PR AD | Registrar devolución | 🆕 |
| 46 | GET | `/api/prestamos/vencidos` | AD | Préstamos fuera de plazo | 🆕 |

### 3.E Gestión de accesos (usuarios)
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 47 | GET | `/api/usuarios` | AD | Listar (`?rol&activo&idArea&texto`) | 🆕 |
| 48 | POST | `/api/usuarios` | AD | Crear cuenta con clave provisional (BCrypt) | 🆕 |
| 49 | PUT | `/api/usuarios/{id}` | AD | Editar datos, rol, área | 🆕 |
| 50 | PATCH | `/api/usuarios/{id}/activo` | AD | Revocar/activar (`Activo = 0`, nunca `DELETE`) | 🆕 |
| 51 | PUT | `/api/auth/cambiar-contrasena` | UF PR AD | Cambio obligatorio en primer ingreso | 🆕 |

### 3.F Indicadores (panel de control)
| # | Método | Ruta | Roles | Propósito | Estado |
|---|---|---|---|---|:---:|
| 52 | GET | `/api/indicadores/kpis` | AD | Los 7 KPI de la tesis (`?desde&hasta`) | 🆕 |
| 53 | GET | `/api/indicadores/tickets-por-area` | AD | Datos del gráfico de dona | 🆕 |

> Las alertas por correo (80 % y vencimiento) son un `@Scheduled` interno: **no exponen endpoint**.

---

## FASE 4 — Futura

| # | Método | Ruta | Roles | Propósito |
|---|---|---|---|---|
| 54 | GET | `/api/reportes/kpis.pdf` | AD | Reporte mensual exportable |
| 55 | GET | `/api/rfc` | AD | Listar solicitudes de cambio |
| 56 | POST | `/api/rfc` | PR AD | Registrar RFC vinculada a ticket |
| 57 | PUT | `/api/rfc/{id}/decision` | AD | Aprobar / rechazar RFC |
