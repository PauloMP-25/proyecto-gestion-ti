# Sprint 3 Frontend: Gestión de Tickets (con Mocks, listo para el Backend)
## Mesa de Ayuda (Service Desk) — Hospital Santa María del Socorro (HSMSI)

> **Documento de Especificación del Frontend para Sincronización con Backend**  
> **Arquitecto:** Claude  
> **Ejecuta:** Equipo Frontend (2 desarrolladores humanos) + Agente Obrero (Antigravity / Gemini)  
> **Rama de trabajo:** `feature/gestion-tickets-frontend` (basada en `develop`)  

---

## 0. Antes de empezar: decisiones cerradas

El plan del Backend está en [`fase_2_backend.md`](./fase_2_backend.md). Ambos equipos trabajan sobre el contrato canónico [`contratos_api_y_modelos.md`](./contratos_api_y_modelos.md) y la [`matriz_endpoints.md`](./matriz_endpoints.md) (filas 1–22).

Las inconsistencias entre documentos quedaron resueltas (2026-11-10):

| Tema | Valor canónico | Nota para el Frontend |
|---|---|---|
| **Estados** | `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `ESCALADO`, `RESUELTO`, `CERRADO`, `REABIERTO` | No existe `PENDIENTE_REPUESTO`. El backend migra sus enums; el mapper sigue aceptando `ABIERTO`, `EN_PROGRESO`, `EN_ATENCION` por seguridad. |
| **Prioridad** | `P1`, `P2`, `P3`, `P4` | El mapper sigue aceptando `CRITICA`, `P1_CRITICA`, etc. |
| **Impacto / Urgencia** | `ALTO/MEDIO/BAJO` · `ALTA/MEDIA/BAJA` | Ojo: urgencia en femenino. |
| **Estado SLA** | `A_TIEMPO`, `ALERTA`, `INCUMPLIDO` | En pantalla `ALERTA` se lee “Próximo a vencer”. |
| **Nivel de soporte** | `N1`, `N2` | Se elimina `ESPECIALISTA` (la tesis define 2 niveles internos). |
| **Estado actual** | Dashboard y `/solicitudes/nuevo` ya existen en `develop`. | Las tareas 2.x son “completar y conectar”, no crear desde cero. |

> [!IMPORTANT]
> Además, `AGENTS.md` obliga al Obrero a detenerse si no hay `SKILL.md`, así que la **Tarea 0.2 es bloqueante**.

---

## 1. Alcance y objetivo

**Meta:** Que un usuario hospitalario pueda registrar un ticket con contexto de equipo detectado. Que un Practicante o Administrador pueda gestionarlo (listar, filtrar, asignar, cambiar estado, escalar, resolver). Todo sobre un `TicketService` con mock data, intercambiable por la API real con un solo flag (`environment.usarMocks`).

### Dentro del sprint:
* Modelos, enums y mappers compartidos.
* Servicios mock y real (`contexto-cliente`, `tickets`).
* Crear ticket (RF01–RF03).
* Lista y detalle de tickets, “Mis tickets” (RF04–RF07 en vista).
* Diálogos asignar / cambiar estado / escalar / resolver (RF04–RF06).
* Insignias de SLA y prioridad, pipe `tiempo-restante`.
* Rutas con guards y menú por rol.

### Fuera del sprint:
* KEDB, préstamos, CMDB, reportes PDF, correo (Fase 3 backend y sprints siguientes).

### Definición de hecho (Definition of Done):
* `ng build` sin errores.
* `ng test` verde en lo nuevo.
* Checklist de la sección 4 firmado por el equipo humano.
* PR a `develop` revisado.

---

## 2. Backlog del Sprint

| ID | Tarea | Responsable | Criterios de Aceptación |
|---|---|:---:|---|
| **0.1** | `git checkout develop && git pull`, `ng build`, `ng serve`. Listar qué rutas y componentes existen. | [Equipo Humano] | Se reporta si `/solicitudes/nuevo` y `/panel-control` están en develop. Build limpio. |
| **0.2** | Generar los `SKILL.md` en `.agents/skills/` (ver 2.1). | [Equipo Humano] + Arquitecto | Existen los 5 skills. El Obrero no improvisa. |
| **0.3** | Crear rama: `git checkout -b feature/gestion-tickets-frontend`. | [Equipo Humano] | Rama basada en `develop` actualizada. |
| **1.1** | Modelos, enums y mappers (3.1 y 3.2). | [Obrero Automático] | Tipos compilan en modo strict. Specs del mapper cubren cada alias. |
| **1.2** | `tickets.service.ts` con interfaz común, implementación Mock y Http, y flag `environment.usarMocks`. | [Obrero Automático] | Cambiar el flag cambia la fuente sin tocar componentes. Mock con 25+ tickets variados: P1–P4, los 3 estados de SLA, 6 áreas. |
| **1.3** | `contexto-cliente.service.ts` y molécula `contexto-equipo` (verificar y completar). | [Obrero Automático] | Muestra Hostname, IP, Área, Anexo. Con `ipRegistrada=false` muestra aviso: *“No se identificó su equipo. El técnico lo vinculará al atenderlo.”* Sin romper el envío. |
| **2.1** | Página `solicitud-crear` + `solicitud-formulario`. | [Obrero Automático] | Conmutador Incidente/Solicitud, categoría, impacto, urgencia, título (≤150), descripción (≤2000, con contador). Prioridad y SLA estimado en vivo. Autoguardado de borrador cada 5 s con *“Borrador guardado a las HH:mm”*. Confirmación con código `INC-2026-XXXX`. Botón enviar deshabilitado mientras envía. |
| **3.1** | `incidente-lista` con filtros (estado, prioridad, área, texto), paginación y skeleton loader. | [Obrero Automático] | Tabla en ≥1024 px y tarjetas en <1024 px. Sin scroll horizontal en 360 px. Estado vacío con `estado-vacio`. |
| **3.2** | `incidente-detalle` con datos, contexto del equipo, línea de tiempo y reloj de SLA. | [Obrero Automático] | Línea de tiempo izquierda→derecha (Gestalt: continuidad). Acciones visibles según rol y estado. |
| **3.3** | Ruta “Mis tickets” reutilizando la lista en `modo='propios'`. | [Obrero Automático] | `USUARIO_FINAL` solo ve sus tickets y no ve acciones de gestión. |
| **4.1** | Diálogos `dialogo-asignar`, `dialogo-cambiar-estado`, `dialogo-resolver`. | [Obrero Automático] | Asignar solo `ADMINISTRADOR`. Resolver exige texto de solución (≥20 car.). Foco atrapado, Esc cierra. |
| **4.2** | Diálogo `dialogo-escalar`. | [Obrero Automático] | Motivo obligatorio ≥20 y ≤300 caracteres (coincide con `Motivo VARCHAR(300)`). Muestra nivel origen→destino. |
| **4.3** | `sla-insignia` y pipe `tiempo-restante`. | [Obrero Automático] | Verde “A tiempo” / Ámbar “Próximo a vencer” / Rojo “Incumplido”, siempre con ícono + texto + color. Pipe: `"2h 15m"` / `"vencido hace 30m"`. |
| **5.1** | Rutas lazy con `authGuard` y `rolGuard`, y menú lateral filtrado por rol. | [Obrero Automático] | Cumple la matriz de acceso de `estructura_frontend_angular.md`. Acceso indebido va a `/403`. |
| **5.2** | Specs: mapper, pipe, servicio mock, cálculo de prioridad previa. | [Obrero Automático] | `ng test` verde. |
| **5.3** | Revisión visual, de accesibilidad y responsive (checklist 4). | [Equipo Humano] | Checklist completo en Desktop y Mobile. |
| **5.4** | Commits atómicos y PR a `develop`. | [Equipo Humano] | Formato Conventional Commits, un compañero revisa. |

---

### 2.1 Skills a Generar (Tarea 0.2 - Bloqueante)
1. `skill-modelos-y-mappers`
2. `skill-servicio-mock-http`
3. `skill-pagina-lista-responsive`
4. `skill-dialogo-accesible`
5. `skill-formulario-reactivo-ticket`

---

## 3. Especificación Técnica

### 3.1 Árbol de Archivos
```text
src/app/
├── compartido/
│   ├── modelos/
│   │   ├── prioridad.enum.ts
│   │   ├── impacto-urgencia.enum.ts
│   │   ├── estado-sla.enum.ts
│   │   ├── estado-ticket.enum.ts
│   │   ├── nivel-soporte.enum.ts
│   │   └── pagina.model.ts
│   ├── componentes/
│   │   └── sla-insignia/ (.ts .html .scss)
│   ├── tuberias/
│   │   └── tiempo-restante.pipe.ts
│   └── ui/moleculas/
│       └── contexto-equipo/
├── nucleo/
│   ├── config/
│   │   └── api-endpoints.ts
│   └── servicios/
│       └── contexto-cliente.service.ts
└── funcionalidades/
    ├── solicitudes/
    │   ├── solicitudes.routes.ts
    │   ├── paginas/solicitud-crear/
    │   ├── componentes/solicitud-formulario/
    │   └── servicios/prioridad-previa.service.ts
    └── incidentes/
        ├── incidentes.routes.ts
        ├── modelos/
        │   ├── ticket.model.ts
        │   ├── ticket-filtros.model.ts
        │   ├── ticket.dto.ts
        │   └── ticket.mapper.ts
        ├── servicios/
        │   ├── tickets.service.ts          # clase abstracta / token
        │   ├── tickets-mock.service.ts
        │   ├── tickets-http.service.ts
        │   └── datos-mock/tickets.mock.ts
        ├── paginas/
        │   ├── incidente-lista/
        │   └── incidente-detalle/
        └── componentes/
            ├── incidente-filtros/
            ├── incidente-linea-tiempo/
            ├── dialogo-asignar/
            ├── dialogo-cambiar-estado/
            ├── dialogo-escalar/
            └── dialogo-resolver/
```

> [!WARNING]
> **Regla de oro de arquitectura:** Ninguna funcionalidad importa de otra funcionalidad. `solicitudes` e `incidentes` comparten solo vía `compartido/`. Si `solicitudes` necesita el modelo de ticket, se aloja en `compartido/modelos/`.

---

### 3.2 Modelos y Mappers

```typescript
// compartido/modelos/prioridad.enum.ts
export enum Prioridad { P1 = 'P1', P2 = 'P2', P3 = 'P3', P4 = 'P4' }

// compartido/modelos/estado-ticket.enum.ts
export enum EstadoTicket {
  NUEVO = 'NUEVO',
  ASIGNADO = 'ASIGNADO',
  EN_PROCESO = 'EN_PROCESO',
  ESCALADO = 'ESCALADO',
  RESUELTO = 'RESUELTO',
  CERRADO = 'CERRADO',
  REABIERTO = 'REABIERTO'
}
export enum EstadoSla { A_TIEMPO = 'A_TIEMPO', ALERTA = 'ALERTA', INCUMPLIDO = 'INCUMPLIDO' }
export enum NivelSoporte { N1 = 'N1', N2 = 'N2' }

// funcionalidades/incidentes/modelos/ticket.model.ts
export interface Ticket {
  id: number;
  codigo: string;                 // 'INC-2026-00001'
  tipo: 'INCIDENTE' | 'SOLICITUD';
  titulo: string;
  descripcion: string;
  categoria: { id: number; nombre: string };
  impacto: 'ALTO' | 'MEDIO' | 'BAJO';
  urgencia: 'ALTA' | 'MEDIA' | 'BAJA';
  prioridad: Prioridad;
  estado: EstadoTicket;
  estadoSla: EstadoSla;
  nivelSoporte: NivelSoporte;
  area: { id: number; nombre: string };
  solicitante: { id: number; nombre: string };
  asignadoA: { id: number; nombre: string } | null;
  equipo: { id: number; hostname: string | null; ip: string | null } | null;
  anexoContacto: string | null;
  fechaCreacion: string;          // ISO-8601 con -05:00
  fechaLimiteRespuesta: string | null;
  fechaLimiteResolucion: string | null;
  historial: HistorialEntrada[];
  // Detalle completo (escalamientos, soluciones): ver TicketDetalle en contratos §3.5
}

export interface HistorialEntrada {
  fecha: string;
  usuario: string;
  estadoAnterior: EstadoTicket | null;
  estadoNuevo: EstadoTicket;
  comentario: string;
}
```

```typescript
// ticket.mapper.ts: único lugar que conoce los alias del backend
const ALIAS_ESTADO: Record<string, EstadoTicket> = { EN_ATENCION: EstadoTicket.EN_PROCESO };
const ALIAS_PRIORIDAD: Record<string, Prioridad> = {
  P1_CRITICA: Prioridad.P1, CRITICA: Prioridad.P1,
  P2_ALTA: Prioridad.P2, ALTA: Prioridad.P2,
  P3_MEDIA: Prioridad.P3, MEDIA: Prioridad.P3,
  P4_BAJA: Prioridad.P4, BAJA: Prioridad.P4
};
const ALIAS_ESTADO_LEGADO: Record<string, EstadoTicket> = {
  ABIERTO: EstadoTicket.NUEVO, EN_PROGRESO: EstadoTicket.EN_PROCESO
};
const ALIAS_SLA: Record<string, EstadoSla> = {
  DENTRO_TIEMPO: EstadoSla.A_TIEMPO, POR_VENCER: EstadoSla.ALERTA, VENCIDO: EstadoSla.INCUMPLIDO
};
// Si llega un valor desconocido: loggear con LoggerService y usar fallback visible, nunca catch vacío.
```

---

### 3.3 Contrato del Servicio (Compartido con el equipo Backend)

```typescript
export abstract class TicketsService {
  abstract contextoCliente(): Observable<ContextoCliente>;                       // GET  /tickets/contexto-cliente
  abstract crear(dto: CrearTicketDto): Observable<Ticket>;                       // POST /tickets
  abstract listar(f: TicketFiltros, p: { pagina: number; tamano: number }): Observable<Pagina<TicketResumen>>; // GET /tickets
  abstract misTickets(p: { pagina: number; tamano: number }): Observable<Pagina<TicketResumen>>;              // GET /tickets/mis-tickets
  abstract obtener(id: number): Observable<Ticket>;                              // GET  /tickets/{id}
  abstract tecnicos(): Observable<Tecnico[]>;                                    // GET  /usuarios/tecnicos
  abstract categorias(): Observable<Categoria[]>;                                // GET  /categorias
  abstract asignar(id: number, idTecnico: number, comentario?: string): Observable<Ticket>; // PUT /asignar
  abstract tomar(id: number): Observable<Ticket>;                                // PUT  /tomar
  abstract cambiarEstado(id: number, accion: 'iniciar' | 'cerrar' | 'reabrir', texto?: string): Observable<Ticket>;
  abstract escalar(id: number, motivo: string): Observable<Ticket>;              // PUT  /escalar (Fase 2 BE)
  abstract resolver(id: number, solucion: string): Observable<Ticket>;           // PUT  /resolver
}
```

#### Payloads esperados (detalle completo en `contratos_api_y_modelos.md` §3):
```jsonc
// GET /api/tickets/contexto-cliente
{ "ip": "192.168.10.24", "hostname": "PC-ADM-03", "idArea": 2, "area": "Admisión",
  "anexo": "2314", "idEquipo": 14, "ipRegistrada": true }

// POST /api/tickets (request)
{
  "tipo": "INCIDENTE",
  "idCategoria": 4,
  "impacto": "ALTO",
  "urgencia": "ALTA",
  "titulo": "Sin red en triaje",
  "descripcion": "Desde las 07:40 no hay conexión…",
  "anexoContacto": "2314"
}
// → 201: TicketDetalle con "codigo": "INC-2026-00101", "prioridad": "P1", fechas límite, "estado": "NUEVO"

// Error estándar (GlobalExceptionHandler)
{
  "timestamp": "2026-11-10T09:30:00-05:00", "status": 400, "error": "Bad Request",
  "mensaje": "La validación de datos ha fallado", "ruta": "/api/tickets",
  "erroresValidacion": [{ "campo": "titulo", "detalle": "El título no puede estar vacío" }]
}
```

* El Frontend nunca envía prioridad, estado ni usuario. La prioridad previa en el formulario es solo visual; el backend recalcula.
* El flag va en `environment.ts`: `usarMocks: true`.
* En `app.config.ts`:
  ```typescript
  { provide: TicketsService, useClass: environment.usarMocks ? TicketsMockService : TicketsHttpService }
  ```

---

### 3.4 Prioridad Previa (Solo Vista)

**Matriz Hospitalaria:**

| Impacto \ Urgencia | Alta | Media | Baja |
|---|:---:|:---:|:---:|
| **Alto** | P1 | P1 | P2 |
| **Medio** | P1 | P2 | P3 |
| **Bajo** | P2 | P3 | P4 |

* **SLA para mostrar al usuario:**
  * P1: 15 min / 2 h
  * P2: 30 min / 4 h
  * P3: 2 h / 8 h
  * P4: 4 h / 24 h
* **Texto obligatorio en pantalla:** *“Tiempo de atención estimado”*, nunca *“SLA ITIL”*.

---

### 3.5 Transiciones Visibles en UI (El Backend es la Autoridad)

| Estado Actual | Acciones Ofrecidas | Rol con Permiso |
|---|---|---|
| `NUEVO` | Asignar | `ADMINISTRADOR`; `PRACTICANTE` puede “Tomar” |
| `ASIGNADO` | Iniciar atención | `PRACTICANTE` / `ADMINISTRADOR` |
| `EN_PROCESO` | Escalar, Resolver | `PRACTICANTE` / `ADMINISTRADOR` |
| `ESCALADO` | Resolver | `ADMINISTRADOR` |
| `RESUELTO` | Cerrar, Reabrir | `ADMINISTRADOR` (cierre con conformidad) |
| `CERRADO` | Ninguna | — |

---

### 3.6 Estructura HTML/SCSS Esperada

Tokens globales en `src/styles/_tokens.scss` (Design System institucional).

```html
<!-- incidente-lista.component.html (resumen) -->
<app-cabecera-pagina titulo="Gestión de Tickets" />
<app-incidente-filtros (cambio)="filtros.set($event)" />

@if (cargando()) {
  <div class="skeleton-lista" aria-busy="true"> … </div>
} @else if (pagina().contenido.length === 0) {
  <app-estado-vacio mensaje="No hay tickets con esos filtros" />
} @else {
  <div class="tabla-wrap">                       <!-- visible >=1024px -->
    <table class="tabla" aria-label="Lista de tickets"> … </table>
  </div>
  <ul class="tarjetas">                          <!-- visible <1024px -->
    @for (t of pagina().contenido; track t.id) {
      <li class="tarjeta">
        <app-prioridad-insignia [prioridad]="t.prioridad" />
        <app-sla-insignia [estado]="t.estadoSla" [limite]="t.fechaLimiteResolucion" />
      </li>
    }
  </ul>
}
```

```scss
.tarjeta {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 16px;
  min-width: 0; // evita overflow en flex/grid
}
.tabla-wrap { display: none; overflow-x: auto; }
.tarjetas   { display: grid; gap: 12px; padding: 0; list-style: none; }

@media (min-width: 1024px) {
  .tabla-wrap { display: block; }
  .tarjetas   { display: none; }
}

button, a, .control { min-height: 44px; min-width: 44px; }
:focus-visible { outline: 3px solid var(--hsmsi-verde-salud); outline-offset: 2px; }
```

#### Reglas para el Obrero:
1. **Insignias:** Ícono + texto + color (`warning`, `schedule`, `check_circle` de `mat-icon`).
2. **Contraste:** Texto menor a 18 px con contraste ≥7:1. Usar `--text-main` y `--text-muted`.
3. **Botones:** Botón primario guinda `#701C1C`. Botón de resolver verde `#1B5E20`.
4. **Diálogos:** Overlay con `backdrop-filter: blur(4px)` y rol `dialog` con `aria-labelledby`.
5. **Cero ITIL:** Textos permitidos: *“Mesa de Ayuda”*, *“Nivel de prioridad”*, *“Compromisos de atención”*.
6. **Validación:** Reactive Forms más `aria-describedby` en errores. El backend revalida siempre.
7. **Manejo de errores:** `error.interceptor` muestra mensaje limpio con `NotificacionService` y registra en `LoggerService`. Prohibido catch vacío.

---

## 4. Plan de Pruebas Rápidas (Para el Equipo Humano)

Preparación: `ng serve`, DevTools con dispositivos 360×640, 768×1024 y 1440×900. Ejecutar con `usarMocks: true`. Con el backend integrado, repetir los puntos 1, 2 y 5 con `false`.

### 1. Crear Ticket
* [ ] El contexto muestra IP, hostname, área y anexo. Con `ipRegistrada=false` aparece el aviso y se puede enviar igual.
* [ ] Impacto Alto + Urgencia Alta muestra P1 y “15 min / 2 h” al instante.
* [ ] Título vacío o de más de 150 caracteres bloquea el envío con mensaje accesible.
* [ ] Se pierde la red o se recarga: el borrador reaparece con su hora.
* [ ] Doble clic en Enviar crea un solo ticket.
* [ ] Aparece el código `INC-2026-…` en la confirmación.

### 2. Lista y Filtros
* [ ] Skeleton visible antes de los datos.
* [ ] Filtros por estado, prioridad, área y texto funcionan, también combinados.
* [ ] Paginación correcta y estado vacío cuando no hay coincidencias.
* [ ] 360 px: sin scroll horizontal y tarjetas legibles. 1440 px: tabla completa.

### 3. Detalle y Diálogos
* [ ] Línea de tiempo coherente con el historial.
* [ ] Escalar con 19 caracteres falla y con 20 pasa.
* [ ] Resolver exige solución. `Esc` cierra. El foco vuelve al botón que abrió el diálogo.
* [ ] Un ticket `CERRADO` no muestra acciones.

### 4. Roles (Cambiar el Rol del Mock)
* [ ] `USUARIO_FINAL`: Solo ve “Mis tickets” y “Nuevo”. `/panel-control` lo manda a `/403`.
* [ ] `PRACTICANTE`: Ve la bandeja y puede escalar, pero no reasignar.
* [ ] `ADMINISTRADOR`: Ve todas las acciones.

### 5. Accesibilidad y Diseño
* [ ] Navegación completa solo con teclado (`Tab`, `Enter`, `Esc`) con anillo de foco visible.
* [ ] Ningún estado se distingue solo por color.
* [ ] Áreas táctiles ≥44×44 px en móvil.
* [ ] Colores solo desde tokens, sin hex sueltos.
* [ ] Sin la palabra “ITIL” en pantalla.

### 6. Cierre Técnico
* [ ] `ng build` sin warnings nuevos y `ng test` verde.
* [ ] Commits tipo `feat(incidentes): agregar lista paginada con filtros` y `style(incidentes): ajustar tarjetas móviles`.
* [ ] PR a `develop` con capturas Desktop y Mobile, revisado por un compañero.

---

## 5. Puntos Coordinados con Backend — RESUELTOS (2026-11-10)

| # | Pregunta | Respuesta del Backend |
|---|---|---|
| 1 | Enum definitivo de estados / `PENDIENTE_REPUESTO` | `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `ESCALADO`, `RESUELTO`, `CERRADO`, `REABIERTO`. **No** existe `PENDIENTE_REPUESTO` (tesis 7.2.1). |
| 2 | Formato de paginación | Aceptado: `{ contenido, pagina, tamano, totalElementos, totalPaginas }`. Parámetros `pagina`, `tamano`, `orden`. |
| 3 | Técnicos asignables | `GET /api/usuarios/tecnicos` (matriz fila 16). |
| 4 | Escalamiento | **Se adelanta a Fase 2**: `PUT /api/tickets/{id}/escalar`. El flag del botón se retira cuando llegue a `develop`. |
| 5 | Zona horaria | ISO-8601 con `-05:00`, zona `America/Lima`. |

> Nuevos endpoints que el Frontend puede usar desde ya en el mock: `tomar`, `iniciar`, `reabrir`, `GET /api/categorias`, `GET /api/areas`, `GET /api/auth/me`. Ver [`matriz_endpoints.md`](./matriz_endpoints.md).

