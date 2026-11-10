# Contratos de API y Modelos de Dominio Compartidos
## Frontend (Angular 19) ↔ Backend (Spring Boot 3 + SQL Server)

> **Fuente única de verdad (canónica).** Si este documento contradice a otro (`fase_*`, skills, código), **gana este documento** y el otro debe corregirse.
> Matriz completa de endpoints: [`matriz_endpoints.md`](./matriz_endpoints.md).
> Última revisión arquitectónica: 2026-11-10.

---

## 0. Por qué existe este documento (discrepancias resueltas)

En la revisión del 2026-11-10 se encontraron **cuatro versiones distintas** de los mismos enums (código Java en `develop`, `diseno_base_datos.md`, versión anterior de este archivo y los planes de fase). Esta tabla fija el valor definitivo:

| Enum | Código Java actual (`develop`) | Valor canónico definitivo | Fuente que lo respalda |
|---|---|---|---|
| `Rol` | `USUARIO_FINAL`, `TECNICO`, `ADMINISTRADOR` | `USUARIO_FINAL`, `PRACTICANTE`, `ADMINISTRADOR` | Tesis cap. VIII y XII, `requerimientos.md` |
| `NivelSoporte` | `N1`, `N2`, `ESPECIALISTA` | `N1`, `N2` | Tesis cap. 7.1 y 8.3 (solo 2 niveles internos; N3 = proveedor externo, no es usuario) |
| `TipoTicket` | `INCIDENTE`, `PETICION` | `INCIDENTE`, `SOLICITUD` | Tesis cap. 7.4, BD v2 |
| `EstadoTicket` | `ABIERTO`, `EN_PROGRESO`, `ESCALADO`, `RESUELTO`, `CERRADO` | `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `ESCALADO`, `RESUELTO`, `CERRADO`, `REABIERTO` | Tesis cap. 7.2.1, BD v2 |
| `Prioridad` | `CRITICA`, `ALTA`, `MEDIA`, `BAJA` | `P1`, `P2`, `P3`, `P4` | Tesis cap. 5.2 (P1–P4 es el lenguaje del hospital) |
| `Impacto` | `ALTO`, `MEDIO`, `BAJO` | `ALTO`, `MEDIO`, `BAJO` | Sin cambio |
| `Urgencia` | `ALTA`, `MEDIA`, `BAJA` | `ALTA`, `MEDIA`, `BAJA` | Sin cambio (la BD v2 decía `ALTO/MEDIO/BAJO`: se corrige la BD) |
| `EstadoSLA` | `DENTRO_TIEMPO`, `POR_VENCER`, `VENCIDO` | `A_TIEMPO`, `ALERTA`, `INCUMPLIDO` | BD v2, `requerimientos.md` |
| `EstadoIP` | `DISPONIBLE`, `ASIGNADA`, `RESERVADA` | `LIBRE`, `OCUPADA`, `RESERVADA` | BD v2, tesis cap. 7.5 |
| `TipoCI` | `COMPUTADORA`, `IMPRESORA`, `SERVIDOR`, `RED`, `OTRO` | `PC`, `IMPRESORA`, `SERVIDOR`, `SOFTWARE`, `RED` | BD v2, tesis cap. 6.3 (CI de software) |
| `EstadoCI` | `ACTIVO`, `EN_MANTENIMIENTO`, `DADO_DE_BAJA` | `ACTIVO`, `MANTENIMIENTO`, `BAJA` | BD v2 |

> [!IMPORTANT]
> **No existe `PENDIENTE_REPUESTO`.** La espera de repuestos se registra como comentario en `HISTORIAL_TICKET` y, si aplica, con un préstamo de contingencia (Fase 3).
> Como **no hay datos semilla todavía**, migrar estos enums en el backend cuesta casi nada ahora. Después costará una migración de datos.

---

## 1. Enums canónicos (Java ↔ TypeScript, valores idénticos)

```typescript
// Frontend: nucleo/modelos/rol.enum.ts            | Backend: entities/Rol.java
export enum Rol { USUARIO_FINAL = 'USUARIO_FINAL', PRACTICANTE = 'PRACTICANTE', ADMINISTRADOR = 'ADMINISTRADOR' }

// compartido/modelos/nivel-soporte.enum.ts         | entities/NivelSoporte.java
export enum NivelSoporte { N1 = 'N1', N2 = 'N2' }

// compartido/modelos/impacto-urgencia.enum.ts      | entities/TipoTicket.java, Impacto.java, Urgencia.java
export type TipoTicket = 'INCIDENTE' | 'SOLICITUD';
export type Impacto  = 'ALTO' | 'MEDIO' | 'BAJO';   // ALTO = área crítica 24/7 (Emergencia, Admisión, SIS, Cajas, Farmacia)
export type Urgencia = 'ALTA' | 'MEDIA' | 'BAJA';   // ALTA = paraliza la atención en este momento

// compartido/modelos/prioridad.enum.ts             | entities/Prioridad.java
export enum Prioridad { P1 = 'P1', P2 = 'P2', P3 = 'P3', P4 = 'P4' }

// compartido/modelos/estado-ticket.enum.ts         | entities/EstadoTicket.java
export enum EstadoTicket {
  NUEVO = 'NUEVO', ASIGNADO = 'ASIGNADO', EN_PROCESO = 'EN_PROCESO', ESCALADO = 'ESCALADO',
  RESUELTO = 'RESUELTO', CERRADO = 'CERRADO', REABIERTO = 'REABIERTO'
}

// compartido/modelos/estado-sla.enum.ts            | entities/EstadoSLA.java
export enum EstadoSla { A_TIEMPO = 'A_TIEMPO', ALERTA = 'ALERTA', INCUMPLIDO = 'INCUMPLIDO' }
```

### 1.1 Etiquetas visibles (solo Frontend, nunca viajan por la API)

| Valor | Texto en pantalla |
|---|---|
| `P1` / `P2` / `P3` / `P4` | “P1 · Crítica” / “P2 · Alta” / “P3 · Media” / “P4 · Baja” |
| `EN_PROCESO` | “En atención” |
| `ESCALADO` | “Derivado a especialista” |
| `A_TIEMPO` / `ALERTA` / `INCUMPLIDO` | “A tiempo” / “Próximo a vencer” / “Incumplido” |
| `N1` / `N2` | “Soporte operativo” / “Especialista TI” |
| `PRACTICANTE` | “Soporte técnico” |

> Regla de vocabulario: nunca “ITIL”, “SLA ITIL” ni “Matriz ITIL” en pantalla.

---

## 2. Convenciones de la API

| Tema | Regla |
|---|---|
| Base URL | `/api` |
| Autenticación | `Authorization: Bearer <JWT>` en todo excepto `POST /api/auth/login` |
| Nombres JSON | `camelCase`. La entidad propia usa `id`; las referencias usan objeto anidado `{ id, nombre }` en respuestas e `idX` en peticiones (`idCategoria`, `idArea`) |
| Fechas | ISO-8601 con offset de Lima: `"2026-11-10T09:30:00-05:00"`. Zona: `America/Lima` |
| Acciones de estado | `PUT /api/tickets/{id}/{accion}` (ya implementado así en `TicketController`) |
| Transición inválida | `409 Conflict` con el error estándar |
| Lo que el cliente **nunca** envía | `prioridad`, `estado`, `estadoSla`, `codigo`, `idUsuarioSolicitante`, fechas límite. Siempre los calcula el backend |
| Usuario autenticado | Se obtiene del JWT, jamás del cuerpo de la petición |

### 2.1 Paginación (todas las listas paginadas)
```json
{ "contenido": [], "pagina": 0, "tamano": 10, "totalElementos": 45, "totalPaginas": 5 }
```
Parámetros: `?pagina=0&tamano=10&orden=fechaCreacion,desc`. El backend **no** devuelve el `Page` crudo de Spring (`content`, `number`).

### 2.2 Error estándar (`GlobalExceptionHandler`)
```json
{
  "timestamp": "2026-11-10T09:30:00-05:00",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "La validación de datos ha fallado",
  "ruta": "/api/tickets",
  "erroresValidacion": [
    { "campo": "descripcion", "detalle": "La descripción debe contener al menos 15 caracteres" }
  ]
}
```
* Nunca stack traces ni `e.getMessage()` de excepciones internas en `mensaje`.
* `erroresValidacion` solo aparece en `400`.

---

## 3. DTOs canónicos

### 3.1 Sesión — `POST /api/auth/login`
```jsonc
// Request
{ "correo": "phuaman@hsmsi.gob.pe", "contrasena": "********" }
// 200
{
  "token": "eyJ...", "tipo": "Bearer", "expiraEn": "2026-11-10T17:30:00-05:00",
  "usuario": { "id": 5, "nombreCompleto": "Patricia Huamán Ríos", "correo": "phuaman@hsmsi.gob.pe",
               "rol": "USUARIO_FINAL", "nivelSoporte": null, "area": { "id": 1, "nombre": "Emergencia" } }
}
```
El JWT incluye los claims `sub` (correo), `id`, `rol` y `nivelSoporte`. Pueden iniciar sesión los **tres** roles.

### 3.2 Contexto del equipo — `GET /api/tickets/contexto-cliente`
```jsonc
// 200 — IP registrada
{ "ip": "192.168.10.45", "hostname": "PC-EMERG-01", "idArea": 1, "area": "Emergencia",
  "anexo": "2314", "idEquipo": 14, "ipRegistrada": true }
// 200 — IP desconocida (nunca 404: el usuario no debe quedar bloqueado)
{ "ip": "192.168.99.120", "hostname": null, "idArea": null, "area": null,
  "anexo": null, "idEquipo": null, "ipRegistrada": false }
```

### 3.3 Crear ticket — `POST /api/tickets`
```jsonc
// Request
{
  "tipo": "INCIDENTE",              // INCIDENTE | SOLICITUD
  "idCategoria": 4,
  "impacto": "ALTO",
  "urgencia": "ALTA",
  "titulo": "Sin red en triaje",    // 1..150
  "descripcion": "Desde las 07:40 no hay conexión con GALENHOS en la estación de triaje.", // 15..2000
  "anexoContacto": "2314"           // opcional, ≤10. El usuario puede corregir el anexo detectado
}
// 201 → TicketDetalle (3.5). Header Location: /api/tickets/101
```
La IP de origen la toma el backend de la petición HTTP (`X-Forwarded-For` → `X-Real-IP` → `getRemoteAddr()`), no del cuerpo.

### 3.4 `TicketResumen` (filas de listas)
```json
{
  "id": 101, "codigo": "INC-2026-00101", "tipo": "INCIDENTE", "titulo": "Sin red en triaje",
  "prioridad": "P1", "estado": "EN_PROCESO", "estadoSla": "ALERTA", "nivelSoporte": "N1",
  "area": { "id": 1, "nombre": "Emergencia" },
  "solicitante": { "id": 5, "nombre": "Patricia Huamán Ríos" },
  "asignadoA": { "id": 8, "nombre": "Luis Quispe" },
  "fechaCreacion": "2026-11-10T09:30:00-05:00",
  "fechaLimiteResolucion": "2026-11-10T11:30:00-05:00"
}
```

### 3.5 `TicketDetalle`
```jsonc
{
  // ...todos los campos de TicketResumen, más:
  "descripcion": "Desde las 07:40 ...",
  "categoria": { "id": 4, "nombre": "Conectividad / Red" },
  "impacto": "ALTO", "urgencia": "ALTA",
  "anexoContacto": "2314",
  "equipo": { "id": 14, "hostname": "PC-EMERG-01", "ip": "192.168.10.45" },   // null si no se identificó
  "ipOrigen": "192.168.10.45",
  "fechaAsignacion": "2026-11-10T09:38:00-05:00",
  "fechaLimiteRespuesta": "2026-11-10T09:45:00-05:00",
  "fechaRespuestaReal": "2026-11-10T09:38:00-05:00",
  "fechaResolucionReal": null,
  "fechaCierre": null,
  "historial": [
    { "fecha": "2026-11-10T09:30:00-05:00", "usuario": "Patricia Huamán Ríos",
      "estadoAnterior": null, "estadoNuevo": "NUEVO", "comentario": "Ticket registrado" }
  ],
  "escalamientos": [
    { "fecha": "...", "nivelOrigen": "N1", "nivelDestino": "N2",
      "usuarioOrigen": "Luis Quispe", "usuarioDestino": null, "motivo": "Switch del pabellón no responde ..." }
  ],
  "soluciones": [
    { "fecha": "...", "usuario": "Ing. Carlos Mendoza", "descripcion": "...", "esSolucionFinal": true }
  ]
}
```

### 3.6 Cuerpos de las acciones
| Acción | Cuerpo | Validación |
|---|---|---|
| `asignar` | `{ "idTecnico": 8, "comentario": "opcional" }` | `idTecnico` debe ser `PRACTICANTE` o `ADMINISTRADOR` activo |
| `tomar` | — | Asigna al usuario del JWT |
| `iniciar` | `{ "comentario": "opcional" }` | — |
| `escalar` | `{ "motivo": "..." }` | 20..300 caracteres (`Motivo VARCHAR(300)`) |
| `resolver` | `{ "solucion": "..." }` | 20..2000 caracteres |
| `cerrar` | `{ "comentario": "opcional" }` | — |
| `reabrir` | `{ "motivo": "..." }` | 10..500 caracteres |

### 3.7 Técnicos asignables — `GET /api/usuarios/tecnicos`
```json
[
  { "id": 8, "nombreCompleto": "Luis Quispe", "rol": "PRACTICANTE", "nivelSoporte": "N1", "ticketsAbiertos": 3 },
  { "id": 2, "nombreCompleto": "Ing. Carlos Mendoza", "rol": "ADMINISTRADOR", "nivelSoporte": "N2", "ticketsAbiertos": 1 }
]
```
`ticketsAbiertos` ayuda al Administrador a repartir la carga (no es obligatorio para el MVP, puede devolver `0`).

### 3.8 Catálogos — `GET /api/categorias`, `GET /api/areas`
```json
[ { "id": 4, "nombre": "Conectividad / Red", "idPadre": null } ]
```
> Las áreas y categorías reales se cargarán con el ingeniero del hospital **mediante estos endpoints** (`POST`, solo `ADMINISTRADOR`), no con un script semilla en el repositorio.
