# Fase 2 Backend: API de Tickets, Motor de Prioridad/SLA y Contexto del Equipo
## Mesa de Ayuda — Hospital Santa María del Socorro (HSMSI)

> **Arquitecto:** Claude · **Ejecuta:** Equipo Backend + Agente Obrero
> **Rama:** `feature/api-tickets-fase2` (desde `develop`)
> **Contratos:** [`contratos_api_y_modelos.md`](./contratos_api_y_modelos.md) · **Endpoints:** [`matriz_endpoints.md`](./matriz_endpoints.md) (filas 1–22)
> **Stack:** Java 21 LTS (local) / 25 (compañeros) · Spring Boot 3 · Spring Data JPA · SQL Server 2022

---

## 0. Diagnóstico del código en `develop` (leer antes de programar)

Revisé `backend/src/main/java/com/hospital/servicedesk`. La base es buena (JWT, `GlobalExceptionHandler`, servicios separados de controladores), pero hay **desalineaciones que bloquean la integración con el Frontend**:

| # | Hallazgo | Riesgo | Corrección (tarea) |
|---|---|---|---|
| H1 | `SecurityConfig`: `/api/tickets` está en `permitAll()` para **todos los métodos**. Cualquiera sin token lista todos los tickets. | 🔴 Seguridad (`AGENTS.md` §3) | T0.3 |
| H2 | `AuthController` solo deja entrar a `rol = TECNICO`. El personal asistencial (`USUARIO_FINAL`) no puede iniciar sesión y por tanto no puede registrar tickets con JWT. | 🔴 Bloquea RF de registro | T0.3 |
| H3 | `AuthController` hace `e.printStackTrace()` y devuelve `"Error interno: " + e.getMessage()`. | 🔴 Expone internos (`AGENTS.md` §4) | T0.3 |
| H4 | Enums distintos al contrato (`ABIERTO`, `EN_PROGRESO`, `TECNICO`, `PETICION`, `CRITICA`, `DENTRO_TIEMPO`, `DISPONIBLE`…). | 🟠 Integración | T0.1 |
| H5 | `Ticket` usa `asunto` (contrato: `titulo`); faltan `codigo`, `idCategoria`, `nivelSoporteActual`, `fechaAsignacion`, `fechaLimiteRespuesta`, `fechaRespuestaReal`, `fechaResolucionReal`, `fechaCierre`, `anexoContacto`. | 🟠 SLA incompleto | T0.2 |
| H6 | Faltan tablas de la BD v2: `CATEGORIA`, `ESCALAMIENTO`, `SOLUCION_TICKET`. `HISTORIAL_TICKET` usa `accion/detalle` en vez de `estadoAnterior/estadoNuevo/comentario`. | 🟠 Auditoría y escalamiento | T0.2 |
| H7 | `GET /api/tickets` devuelve `List` completa, sin paginación ni filtros. | 🟡 Rendimiento | T2.3 |
| H8 | `ErrorResponse` usa `message`, `path`, `errors{}`; el contrato usa `mensaje`, `ruta`, `erroresValidacion[]`. | 🟡 Integración | T0.4 |

> [!IMPORTANT]
> **Ahora es el momento barato.** Como no hay datos semilla, cambiar enums y columnas con `ddl-auto=update` solo requiere borrar y recrear la BD local (`DROP DATABASE db_servicedesk; CREATE DATABASE db_servicedesk;`). Después de cargar datos reales costará una migración.

---

## 1. Respuestas oficiales a los “Puntos a coordinar” del Frontend (§5 de `fase_2_frontend.md`)

| Pregunta del Frontend | Decisión |
|---|---|
| ¿Enum definitivo de estados? ¿Existe `PENDIENTE_REPUESTO`? | `NUEVO`, `ASIGNADO`, `EN_PROCESO`, `ESCALADO`, `RESUELTO`, `CERRADO`, `REABIERTO`. **No** existe `PENDIENTE_REPUESTO` (tesis 7.2.1); la espera se registra como comentario en el historial. El backend migra sus enums (T0.1); el mapper del frontend sigue aceptando alias viejos por seguridad. |
| Formato de paginación | `{ contenido, pagina, tamano, totalElementos, totalPaginas }` con el DTO genérico `PaginaDTO<T>`. Parámetros `pagina`, `tamano`, `orden`. |
| Endpoint de técnicos asignables | `GET /api/usuarios/tecnicos` (más simple y seguro que un filtro genérico por rol). Roles `PRACTICANTE` y `ADMINISTRADOR`. |
| Escalamiento | **Se adelanta a Fase 2**: `PUT /api/tickets/{id}/escalar`. El Frontend puede quitar el flag cuando esta tarea llegue a `develop`. |
| Zona horaria | `America/Lima`. Fechas serializadas como `OffsetDateTime` ISO-8601 con `-05:00`. |

---

## 2. Backlog del Sprint

| ID | Tarea | Criterios de aceptación |
|---|---|---|
| **T0.1** | Migrar enums a los valores canónicos (`contratos_api_y_modelos.md` §0). `Usuario.rol` y `Usuario.nivelSoporte` pasan de `String` a `@Enumerated(EnumType.STRING)`. | Compila. Ningún literal `"TECNICO"`, `"ABIERTO"`, `"CRITICA"` en el código (`grep` vacío). |
| **T0.2** | Alinear entidades con BD v2: `Ticket` (campos de H5), `Area.anexo`, nuevas `Categoria`, `Escalamiento`, `SolucionTicket`; `HistorialTicket` con `estadoAnterior`, `estadoNuevo`, `comentario`. | Hibernate genera las tablas en BD limpia. `@Column(length)` igual al diccionario de datos. |
| **T0.3** | Seguridad: quitar `permitAll` de `/api/tickets`; login para los 3 roles; JWT con claims `id`, `rol`, `nivelSoporte`; `@EnableMethodSecurity` + `@PreAuthorize` por endpoint; quitar `printStackTrace` y `e.getMessage()`. | Test: `GET /api/tickets` sin token → 401; con `USUARIO_FINAL` → 403. Login `USUARIO_FINAL` → 200. |
| **T0.4** | `GlobalExceptionHandler` con el formato canónico (`mensaje`, `ruta`, `erroresValidacion[]`) y manejo de `TransicionInvalidaException` → 409, `AccessDeniedException` → 403, `EntityNotFoundException` → 404, `Exception` → 500 genérico + `log.error` con contexto. | Test `MockMvc` por cada código. |
| **T0.5** | Jackson: `spring.jackson.time-zone=America/Lima`, fechas como `OffsetDateTime`; `CORS` para `http://localhost:4200`. | El JSON muestra `-05:00`. |
| **T1.1** | `MotorPrioridadService` (matriz 3×3) y `MotorSlaService` (fechas límite + estado SLA). Ver §3. | 9 tests de matriz + tests de umbral 80 % / 100 %. |
| **T1.2** | `GeneradorCodigoService`: `INC-2026-00001` / `SOL-2026-00001`, correlativo por tipo y año. | Único bajo concurrencia (`@Transactional` + bloqueo o secuencia SQL Server). |
| **T2.1** | `GET /api/tickets/contexto-cliente` (fila 3). | IP desconocida → 200 con `ipRegistrada:false`, nunca 404. |
| **T2.2** | `POST /api/tickets` (fila 4). | Prioridad, código, fechas y `N1` calculados por backend; historial `null → NUEVO`; 201 + `Location`. |
| **T2.3** | `GET /api/tickets` paginado con filtros (`Specification`) y `GET /api/tickets/mis-tickets` (filas 5–6). | Formato `PaginaDTO`. `estadoSla` recalculado al leer. |
| **T2.4** | `GET /api/tickets/{id}` y `/historial` (filas 7–8). | `USUARIO_FINAL` ajeno → 403. |
| **T3.1** | `TransicionTicketService` con la máquina de estados (matriz, sección “Máquina de estados”). | Transición inválida → 409. Cada transición escribe historial. |
| **T3.2** | Acciones `asignar`, `tomar`, `iniciar`, `escalar`, `resolver`, `cerrar`, `reabrir` (filas 9–15). | Validaciones de longitud del contrato §3.6. `escalar` crea `Escalamiento` y pone `N2`. `resolver` crea `SolucionTicket`. |
| **T4.1** | `GET /api/usuarios/tecnicos` (fila 16). | Solo usuarios activos con rol `PRACTICANTE`/`ADMINISTRADOR`. |
| **T4.2** | Catálogos `categorias` y `areas` (filas 17–22). | `POST`/`PUT` solo `ADMINISTRADOR`. Sin script semilla en el repo. |
| **T5.1** | Tests: unitarios de motores y transiciones; integración `MockMvc` de `POST /api/tickets` (válido, inválido, sin token). | `./mvnw test` verde. Cobertura de `MotorSlaService` y `TransicionTicketService` ≥ 80 %. |
| **T5.2** | Colección Postman/Bruno en `backend/docs/api/` con un ejemplo por endpoint. | El Frontend puede probar sin leer código. |
| **T5.3** | Commits atómicos y PR a `develop`. | Conventional Commits (`feat(tickets): …`, `fix(sla): …`). |

---

## 3. Motor de prioridad y SLA (tesis cap. 5.2)

### 3.1 Matriz Impacto × Urgencia
| Impacto \ Urgencia | ALTA | MEDIA | BAJA |
|---|:---:|:---:|:---:|
| **ALTO** | P1 | P1 | P2 |
| **MEDIO** | P1 | P2 | P3 |
| **BAJO** | P2 | P3 | P4 |

```java
// services/sla/MotorPrioridadService.java — tabla, no if/else anidados
private static final Map<Impacto, Map<Urgencia, Prioridad>> MATRIZ = Map.of(
    Impacto.ALTO,  Map.of(Urgencia.ALTA, Prioridad.P1, Urgencia.MEDIA, Prioridad.P1, Urgencia.BAJA, Prioridad.P2),
    Impacto.MEDIO, Map.of(Urgencia.ALTA, Prioridad.P1, Urgencia.MEDIA, Prioridad.P2, Urgencia.BAJA, Prioridad.P3),
    Impacto.BAJO,  Map.of(Urgencia.ALTA, Prioridad.P2, Urgencia.MEDIA, Prioridad.P3, Urgencia.BAJA, Prioridad.P4)
);
```

### 3.2 Tiempos comprometidos (en el propio enum, no en BD)
```java
public enum Prioridad {
    P1(Duration.ofMinutes(15), Duration.ofHours(2)),
    P2(Duration.ofMinutes(30), Duration.ofHours(4)),
    P3(Duration.ofHours(2),    Duration.ofHours(8)),
    P4(Duration.ofHours(4),    Duration.ofHours(24));
    // getters: tiempoRespuesta(), tiempoResolucion()
}
```
> Reloj **continuo 24/7** (decisión del cap. II: Emergencia, Admisión, SIS y Cajas no paran). El cálculo en horas laborables queda como mejora futura documentada.

### 3.3 Estado SLA (calculado al leer, no por job en Fase 2)
* Ticket abierto: `transcurrido / plazo` → `< 0.8` `A_TIEMPO` · `≥ 0.8` `ALERTA` · `≥ 1.0` `INCUMPLIDO`.
* Ticket `RESUELTO`/`CERRADO`: se congela comparando `fechaResolucionReal` con `fechaLimiteResolucion`.
* Usar un `Clock` inyectable para poder testear sin esperar.

---

## 4. Estructura de paquetes esperada (N-capas, sin lógica en controladores)

```text
com.hospital.servicedesk
├── config/            SecurityConfig, JacksonConfig, CorsConfig, ClockConfig
├── controllers/       AuthController, TicketController, UsuarioController, CategoriaController, AreaController
├── dtos/              auth/, ticket/, catalogo/, comun/PaginaDTO, comun/ErrorResponse
├── entities/          + Categoria, Escalamiento, SolucionTicket ; enums canónicos
├── exceptions/        GlobalExceptionHandler, TransicionInvalidaException, RecursoNoEncontradoException
├── mappers/           TicketMapper (entidad ↔ DTO, sin lógica de negocio)
├── repositories/      + CategoriaRepository, EscalamientoRepository, SolucionTicketRepository, TicketSpecifications
├── security/          JwtService (claims id, rol, nivelSoporte), filtro, UserDetails
└── services/
    ├── TicketService / impl
    ├── TransicionTicketService
    ├── ContextoClienteService
    └── sla/ MotorPrioridadService, MotorSlaService, GeneradorCodigoService
```

---

## 5. Cambios mínimos al diseño de BD (registrados en `diseno_base_datos.md`)

| Tabla | Cambio | Motivo |
|---|---|---|
| `AREA` | + `Anexo VARCHAR(10) NULL` | El contexto del equipo muestra el anexo de la sala |
| `TICKET` | + `IpOrigen VARCHAR(15) NULL` | Ya existe en el código; flujo mixto de IP |
| `TICKET` | + `AnexoContacto VARCHAR(10) NULL` | El usuario puede corregir el anexo detectado |
| `TICKET` | `Codigo VARCHAR(15)` → `VARCHAR(20)` | `SOL-2026-00001` y margen futuro |
| Enums | `Rol`, `NivelSoporte`, `Urgencia`, `Prioridad` según contrato | Coherencia con la tesis |

No se agregan tablas en Fase 2 fuera de las 12 de la BD v2.

---

## 6. Definición de hecho (DoD)
* [ ] `./mvnw clean test` verde (también con Java 25 de los compañeros).
* [ ] Ningún endpoint de la matriz responde sin token salvo `/api/auth/login`.
* [ ] Las 9 combinaciones de la matriz y los umbrales 80 %/100 % tienen test.
* [ ] Toda transición deja fila en `HISTORIAL_TICKET`.
* [ ] La colección Postman/Bruno cubre las filas 1–22.
* [ ] El Frontend cambia `usarMocks: false` y los flujos 1, 2 y 5 de su checklist pasan.

---

## 7. Siguiente paso
Al cerrar este sprint se arranca [`fase_3_backend.md`](./fase_3_backend.md) (conformidad y encuesta, KEDB, CMDB e IPs, préstamos, gestión de accesos, indicadores y alertas por correo). Como el Backend avanza más rápido que el Frontend, puede empezar T3-0 de esa fase en paralelo cuando T0.x de esta fase esté en `develop`.
