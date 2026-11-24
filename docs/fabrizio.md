# Guía de Implementación Backend para Fabrizio — Service Desk Hospital Santa María del Socorro (HSMSI)

> **Autor:** Arquitectura de Software — Mesa de Ayuda HSMSI
> **Destinatario:** Fabrizio (Desarrollador Backend Java)
> **Fecha:** 24/11/2026
> **Rama sugerida:** `feat/backend-cambios-guias-compromisos`
> **Guía hermana (frontend):** [`docs/fernando.md`](./fernando.md) — los contratos de esta guía están alineados con los que Fernando ya consume.

---

## Índice

1. [Introducción, contexto y alcance](#1-introducción-contexto-y-alcance)
2. [Reglas no negociables de la arquitectura backend](#2-reglas-no-negociables-de-la-arquitectura-backend)
3. [Módulo 1 — Solicitudes de Cambio Técnico](#3-módulo-1--solicitudes-de-cambio-técnico)
4. [Módulo 2 — Centro de Soluciones y Guías](#4-módulo-2--centro-de-soluciones-y-guías)
5. [Módulo 3 — Monitor de Compromisos de Atención en segundo plano](#5-módulo-3--monitor-de-compromisos-de-atención-en-segundo-plano)
6. [Módulo 4 — Migraciones SQL Server y datos semilla](#6-módulo-4--migraciones-sql-server-y-datos-semilla)
7. [Plan de pruebas](#7-plan-de-pruebas)
8. [Checklist de validación y entrega antes del PR](#8-checklist-de-validación-y-entrega-antes-del-pr)
9. [Anexos](#9-anexos)

---

## 1. Introducción, contexto y alcance

### 1.1 Contexto

La Mesa de Ayuda del HSMSI atiende al personal asistencial (médicos, enfermería, obstetricia, farmacia, caja, admisión) y al equipo técnico de Informática. El frontend (Angular 19) avanza en paralelo: Fernando está construyendo las pantallas de **Solicitudes de Cambio Técnico** y del **Centro de Soluciones y Guías** sobre servicios *mock*. Tu trabajo es que esas pantallas puedan pasar a `usarMocks: false` sin tocar un solo componente, y además dotar al backend de un **monitor de compromisos de atención** que hoy no existe.

### 1.2 Lo que verifiqué en el código antes de escribir esta guía

Esta guía se escribió **después de revisar el backend real**. Varias premisas del encargo original no coinciden con el repositorio; aquí está la verdad del código:

| Tema | Lo que se suponía | Lo que hay realmente | Consecuencia para ti |
|---|---|---|---|
| Versión de Spring Boot | 3.3+ | **4.1.1** (`backend/pom.xml`), Jackson 3 (`tools.jackson`), Hibernate 7 | Las anotaciones de test cambian de paquete (§7.1). `ObjectMapper` de Jackson 2 no está; en tests usa *text blocks* JSON. |
| Roles | `ADMINISTRADOR`, `TECNICO`, `MEDICO` | En BD: `ADMINISTRADOR`, `TECNICO`, `PRACTICANTE`, `USUARIO_FINAL` (`Usuario.rol` es `String`; `DataInitializer` crea `PRACTICANTE`) | **No se crea un rol `MEDICO`.** El personal asistencial es `USUARIO_FINAL`; su profesión se expresa con `GradoProfesional` (`DR`, `DRA`, `LIC`, `TEC`…). |
| Migraciones | Flyway | **No hay Flyway.** `ddl-auto=update` + scripts manuales idempotentes en `src/main/resources/db/migraciones/` (V1_1, V1_2) | Tus scripts siguen el mismo patrón `IF OBJECT_ID(...) IS NULL` / `IF COL_LENGTH(...) IS NULL` y se ejecutan con `sqlcmd` **antes** de levantar la app. |
| Auditoría de tickets | Guarda usuario, IP, motivo, estados | `HistorialTicket` solo tiene `accion`, `detalle`, `usuario`, `fechaAccion` | Hay que ampliarla (§2.4). |
| Compromisos de atención | Hay un motor | `Ticket.estadoSla` existe pero **nadie lo recalcula**; `fechaLimiteResolucion` se fija a mano (`plusHours(2 : 8)`, `TicketServiceImpl:62`) ignorando `configuracion_sla`; no hay `@EnableScheduling` ni `@EnableAsync` | Módulo 3 completo + corrección del cálculo del plazo. |
| `Clock` inyectable | Se usa | Existe el bean en `ApplicationConfig` pero **no se usa**; todo es `LocalDateTime.now()` | Regla §2.5: todo código nuevo recibe `Clock`. |
| Búsqueda full‑text | Full‑Text Search de SQL Server | La imagen Docker estándar `mssql/server` **no trae Full‑Text**; los tests corren en **H2** (sin intercalaciones sin tildes) | Columna `texto_busqueda` normalizada (minúsculas, sin tildes) + puntuación en Java. Full‑Text queda como evolución (§4.9). |
| Contrato de cambios | `/api/cambios` | Fernando ya programó `/api/rfc`, `PUT /{id}/decision`, códigos `SC-2026-0001` y 6 estados | El controlador publica **`/api/solicitudes-cambio` y `/api/rfc`** (alias) y agrega `CANCELADO` como 7.º estado (nota para Fernando). |
| Base de conocimiento | Nueva entidad | Ya existe `error_conocido` + `ErrorConocidoController` en `/api/kedb` y `/api/conocimiento`; el frontend (`ConocimientoHttp`) ya consume `/api/conocimiento` | **Se extiende `error_conocido` de forma retrocompatible**, no se crea una tabla paralela. |
| Fechas de BD con `insertable = false` | — | `HistorialTicket.fechaAccion` y `ErrorConocido.fechaCreacion` dependen de un `DEFAULT` de SQL Server que **H2 no tiene** → `NOT NULL` violado en tests de integración | Se corrigen para asignarse con `Clock` (§2.5). |
| `ErrorConocidoController` | Protegido | **Sin `@PreAuthorize`**: un `USUARIO_FINAL` puede crear y borrar guías | Se corrige en el Módulo 2. |

### 1.3 Qué SÍ entra en tu alcance

1. **Solicitudes de Cambio Técnico**: entidad, historial, generador de código `SC-AAAA-NNNN`, máquina de estados, validaciones V1–V12 del frontend replicadas en servidor, permisos por rol con segregación de funciones, endpoints REST.
2. **Centro de Soluciones y Guías**: extensión de `error_conocido` (categoría, ámbito, síntoma, causa, pasos numerados, precauciones, palabras clave, contadores), búsqueda sin tildes con puntuación, votos de utilidad, visitas, destacados, seguridad por ámbito.
3. **Monitor de Compromisos de Atención**: `@Scheduled` que recalcula el estado de los tickets activos (≥ 70 % → *en riesgo*, ≥ 100 % → *vencido*), auditoría automática, eventos de dominio y notificaciones asíncronas por correo para P1/P2, más el cálculo correcto del plazo al crear el ticket.
4. **Transversal**: ampliación de `HistorialTicket`, uso de `Clock`, nuevos manejadores en `GlobalExceptionHandler`, resolutor de contexto del actor (usuario + IP).
5. **Migraciones V1_3 a V1_6** y **semillero Java de personal** con BCrypt.
6. **Pruebas**: unitarias (JUnit 5 + Mockito), integración (`@SpringBootTest` + MockMvc + H2) y colección cURL.

### 1.4 Qué NO entra en tu alcance

- Pantallas Angular (Fernando).
- Flyway/Liquibase: se propone para una fase posterior; no lo introduzcas en este PR.
- Calendario laboral (las reglas P3/P4 tienen `laboral=true` en `SlaConfiguracionController`): el monitor de este PR usa **reloj 24/7**, que es lo correcto para un hospital. El ajuste por horario laboral es una fase futura (§5.9).
- Pausa del reloj por "en espera del usuario": `EstadoTicket` no tiene ese estado; queda fuera.
- Bloqueo distribuido del monitor (ShedLock): el despliegue es de **una sola instancia**; se documenta la propiedad para desactivarlo en réplicas.

### 1.5 Resultado esperado

- `./mvnw test` en verde, con las pruebas nuevas de §7.
- El frontend de Fernando funciona contra el backend real en `/api/rfc` y `/api/conocimiento`.
- Un ticket P1 creado a las 10:00 aparece "en riesgo" a las 10:42 y "vencido" a las 11:00, deja huella en su historial y dispara un correo **sin** que la petición del usuario espere al SMTP.
- Ningún texto que llegue al usuario contiene "ITIL", "SLA", "RFC", "KEDB" ni "CMDB".

---

## 2. Reglas no negociables de la arquitectura backend

### 2.1 N‑capas estricta y organización por módulo

```
Controller (api)  →  Service (aplicacion)  →  Repository  →  Entity
      │                    │
      │                    └── usa reglas puras de dominio (dominio/) — sin Spring, 100 % testeables
      └── solo: validar (@Valid), resolver actor/IP, delegar, devolver ResponseEntity
```

Los módulos nuevos siguen la convención que ya usan `administrativo/areas` y `administrativo/equipos`:

```
com.hospital.servicedesk
├── entities/                      ← entidades JPA (convención existente del repo)
├── repositories/                  ← repositorios Spring Data (convención existente)
├── compartido/
│   ├── auditoria/                 ← NUEVO: ContextoActor, ResolutorContextoActor, AuditoriaTicketService
│   ├── correlativo/               ← NUEVO: GeneradorCorrelativo
│   └── util/NormalizadorBusqueda  ← NUEVO
├── administrativo/
│   ├── cambios/                   ← NUEVO — Módulo 1
│   │   ├── api/ aplicacion/ aplicacion/impl/ dominio/ dto/ mapper/ eventos/
│   └── conocimiento/              ← NUEVO — Módulo 2 (absorbe ErrorConocidoController)
│       ├── api/ aplicacion/ aplicacion/impl/ dominio/ dto/ mapper/
└── operaciones/
    └── compromisos/               ← NUEVO — Módulo 3
        ├── api/ aplicacion/ config/ dominio/ eventos/ notificacion/
```

**Prohibido:**
- Lógica de negocio en controladores (ni un `if` de estado).
- Devolver entidades JPA en la API (todo sale por DTO `record`).
- `@Data` en entidades **nuevas** (rompe `equals/hashCode` con relaciones *lazy*): usa `@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder`.
- `LocalDateTime.now()` sin `Clock`.
- `@Autowired` en campos: inyección por constructor con `@RequiredArgsConstructor`.

### 2.2 DTOs inmutables (Java `record`) con Jakarta Bean Validation

```java
public record TransicionCambioSolicitud(
        @NotNull(message = "Indique la acción a realizar.")
        AccionCambio accion,

        @Size(max = 1000, message = "La observación no puede superar los 1000 caracteres.")
        String observacion
) {}
```

- Mensajes de validación **en español asistencial**, en segunda persona formal ("Indique…", "Seleccione…").
- Validación de **forma** en el DTO (`@NotBlank`, `@Size`, `@Positive`); validación de **negocio** (fechas, coherencias entre campos, estados) en el dominio/servicio, lanzando `ReglaNegocioException(campo, mensaje)` → 400 o `ConflictoNegocioException` → 409.
- Las listas se validan por elemento: `List<@NotBlank @Size(max = 30) String>`.
- Los enums se reciben tipados; un valor inválido produce 400 limpio gracias al manejador de §2.3.

### 2.3 Manejo global de excepciones

`GlobalExceptionHandler` ya devuelve `ErrorResponse` con `correlationId` y sin *stack traces*. Debes **agregar** estos manejadores (hoy caen en el genérico 500):

```java
// exceptions/GlobalExceptionHandler.java — AGREGAR

@ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
public ResponseEntity<ErrorResponse> handleCuerpoIlegible(
        org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
    log.warn("Cuerpo de solicitud ilegible en {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
    return construir(HttpStatus.BAD_REQUEST,
            "Los datos enviados tienen un formato inválido o contienen un valor no permitido.", request, null);
}

@ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
public ResponseEntity<ErrorResponse> handleTipoParametro(
        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
    return construir(HttpStatus.BAD_REQUEST,
            "El valor del parámetro '" + ex.getName() + "' no es válido.", request, null);
}

@ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
public ResponseEntity<ErrorResponse> handleConcurrencia(
        org.springframework.orm.ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
    log.warn("Conflicto de concurrencia optimista en {}", request.getRequestURI());
    return construir(HttpStatus.CONFLICT,
            "Otra persona modificó este registro mientras usted lo editaba. Recargue la información e intente nuevamente.",
            request, null);
}

/** Helper para no repetir el builder en cada manejador nuevo. */
private ResponseEntity<ErrorResponse> construir(HttpStatus estado, String mensaje,
                                                HttpServletRequest request, Map<String, String> errores) {
    ErrorResponse response = ErrorResponse.builder()
            .status(estado.value())
            .error(estado.getReasonPhrase())
            .message(mensaje)
            .path(request.getRequestURI())
            .correlationId(obtenerCorrelationId())
            .errors(errores)
            .build();
    return new ResponseEntity<>(response, estado);
}
```

Y **modifica** los manejadores de `ReglaNegocioException` y `ConflictoNegocioException` para que, si traen `campo`, lo devuelvan en `errors`. Así el frontend puede pintar el error junto al campo:

```java
@ExceptionHandler(ReglaNegocioException.class)
public ResponseEntity<ErrorResponse> handleReglaNegocio(ReglaNegocioException ex, HttpServletRequest request) {
    log.warn("Regla de negocio no satisfecha: {} en {}", ex.getMessage(), request.getRequestURI());
    Map<String, String> errores = ex.getCampo() != null ? Map.of(ex.getCampo(), ex.getMessage()) : null;
    return construir(HttpStatus.BAD_REQUEST, ex.getMessage(), request, errores);
}
```

Formato de respuesta (ejemplo real de una transición inválida):

```json
{
  "timestamp": "2026-11-24T10:15:02.114",
  "status": 409,
  "error": "Conflict",
  "message": "No se puede aprobar una solicitud que está en estado «Borrador».",
  "path": "/api/rfc/12/decision",
  "correlationId": "c0a8011e-3f6b-4b1e-9b0a-1d2f3e4a5b6c",
  "errors": { "estado": "No se puede aprobar una solicitud que está en estado «Borrador»." }
}
```

### 2.4 Seguridad y control de acceso

**Roles reales y su uso:**

| Rol (`Usuario.rol`) | Quién es | Authority en Spring | Cambios | Guías | Monitor |
|---|---|---|---|---|---|
| `ADMINISTRADOR` | Jefatura de Informática / comité de evaluación | `ROLE_ADMINISTRADOR` | Todo + **decidir** (aprobar/rechazar/devolver) | Todo (incluye archivar) | Ejecutar ciclo manual, ver último ciclo |
| `TECNICO` | Soporte N1/N2 | `ROLE_TECNICO` | Ver, crear, editar propios borradores, enviar, **ejecutar** | Ver todas, crear, editar | — |
| `PRACTICANTE` | Practicante de soporte | `ROLE_PRACTICANTE` | Ver, crear y editar propios borradores, enviar | Ver todas | — |
| `USUARIO_FINAL` | Personal asistencial (Dr., Lic., Téc.) | `ROLE_USUARIO_FINAL` | **Sin acceso** (403) | Solo guías **públicas y vigentes** | — |

`CustomUserDetailsService` usa `.roles(usuario.getRol())`, que antepone `ROLE_`. Por eso en `@PreAuthorize` se usa `hasRole('TECNICO')`, **no** `hasAuthority('TECNICO')`.

**Reglas:**
1. `@PreAuthorize` a nivel de **clase** del controlador con el mínimo común, y a nivel de **método** para lo más restringido.
2. Las reglas que dependen del **dato** (¿es el solicitante?, ¿el aprobador es distinto del solicitante?) van en una clase de política del servicio (`PoliticaAccesoCambios`), nunca en el controlador.
3. Un `USUARIO_FINAL` que pide una guía interna recibe **404**, no 403: no se revela que existe.
4. `/api/admin/**` ya está restringido a `ADMINISTRADOR` en `SecurityConfig`; los endpoints del monitor viven ahí.
5. **Mejora recomendada (pequeña):** sin token, Spring Security responde hoy 403 vacío. Agrega un `authenticationEntryPoint` que responda 401 con `ErrorResponse` (opcional en este PR, pero anótalo si no lo haces).

**Contexto del actor** — un solo objeto con lo que necesita la auditoría, resuelto en el borde HTTP y pasado al servicio (el servicio no conoce `HttpServletRequest`):

```java
package com.hospital.servicedesk.compartido.auditoria;

/**
 * Quién ejecuta la operación y desde dónde. Se construye en el controlador
 * y viaja hacia la capa de aplicación para auditoría y reglas de permiso.
 */
public record ContextoActor(String correo, String rol, String ipOrigen) {

    public boolean esAdministrador() { return "ADMINISTRADOR".equalsIgnoreCase(rol); }
    public boolean esTecnico()       { return "TECNICO".equalsIgnoreCase(rol); }
    public boolean esPracticante()   { return "PRACTICANTE".equalsIgnoreCase(rol); }

    /** Personal de Informática: puede ver contenido interno. */
    public boolean esPersonalTecnico() { return esAdministrador() || esTecnico() || esPracticante(); }
}
```

```java
package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.security.red.ResolutorIpCliente;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResolutorContextoActor {

    private static final String PREFIJO_ROL = "ROLE_";
    private final ResolutorIpCliente resolutorIp;

    public ContextoActor resolver(Authentication autenticacion, HttpServletRequest request) {
        String rol = autenticacion.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith(PREFIJO_ROL))
                .map(a -> a.substring(PREFIJO_ROL.length()))
                .findFirst()
                .orElse("USUARIO_FINAL");
        return new ContextoActor(autenticacion.getName(), rol, resolutorIp.resolverIp(request));
    }
}
```

> `autenticacion.getName()` es el **correo** (así lo arma `CustomUserDetailsService`). En los tests con `user("correo@…")` funciona igual.

### 2.5 Auditoría obligatoria de tickets

**Problema:** `HistorialTicket` no guarda IP, motivo ni estados; además `fechaAccion` es `insertable = false` (depende de un `DEFAULT` que H2 no tiene).

**Cambios en la entidad** (`entities/HistorialTicket.java`):

```java
@Column(name = "estado_anterior", length = 30)
private String estadoAnterior;

@Column(name = "estado_nuevo", length = 30)
private String estadoNuevo;

@Column(name = "motivo", length = 500)
private String motivo;

/** IPv4 de origen; null cuando la acción la ejecuta el sistema (monitor). */
@Column(name = "ip_origen", length = 45)
private String ipOrigen;

// ANTES: @Column(name = "fecha_accion", nullable = false, insertable = false, updatable = false)
@Column(name = "fecha_accion", nullable = false, updatable = false)
private LocalDateTime fechaAccion;
```

**Servicio único de auditoría** — todos los cambios de estado de tickets (manuales o del monitor) pasan por aquí:

```java
package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.entities.Ticket;
import com.hospital.servicedesk.entities.Usuario;
import lombok.Builder;

public interface AuditoriaTicketService {

    void registrar(RegistroAuditoriaTicket registro);

    /** Datos de un evento auditable. `actor` null ⇒ acción del sistema. */
    @Builder
    record RegistroAuditoriaTicket(
            Ticket ticket,
            Usuario actor,
            String accion,
            String estadoAnterior,
            String estadoNuevo,
            String motivo,
            String detalle,
            String ipOrigen) {}
}
```

```java
package com.hospital.servicedesk.compartido.auditoria.impl;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.entities.HistorialTicket;
import com.hospital.servicedesk.repositories.HistorialTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditoriaTicketServiceImpl implements AuditoriaTicketService {

    private final HistorialTicketRepository historialRepository;
    private final Clock clock;

    /** MANDATORY: la auditoría debe confirmarse o revertirse junto con el cambio que describe. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(RegistroAuditoriaTicket r) {
        historialRepository.save(HistorialTicket.builder()
                .ticket(r.ticket())
                .usuario(r.actor())
                .accion(r.accion())
                .estadoAnterior(r.estadoAnterior())
                .estadoNuevo(r.estadoNuevo())
                .motivo(r.motivo())
                .detalle(r.detalle())
                .ipOrigen(r.ipOrigen())
                .fechaAccion(LocalDateTime.now(clock))
                .build());
    }
}
```

**Refactor mínimo en `TicketServiceImpl`:** reemplaza los 6 bloques `HistorialTicket.builder()...` (líneas ~68, 340, 390, 412, 431, 451) por llamadas a `auditoria.registrar(...)` pasando `estadoAnterior`/`estadoNuevo` y la IP. No cambies la firma pública de `TicketService` en este PR; si un método no recibe IP, envía `null` y déjalo anotado como deuda.

> **Infraestructura:** las asignaciones de IP ya se auditan en `historial_asignacion_ip`. No dupliques esa auditoría.

### 2.6 `Clock` inyectable y zona horaria

El hospital opera en **America/Lima (UTC‑5)**. Modifica `ApplicationConfig.clock()`:

```java
@Bean
public Clock clock(@Value("${servicedesk.zona-horaria:America/Lima}") String zona) {
    return Clock.system(java.time.ZoneId.of(zona));
}
```

- Todo código nuevo: `LocalDateTime.now(clock)`.
- Tests unitarios: `Clock.fixed(Instant.parse("2026-12-01T15:00:00Z"), ZoneId.of("America/Lima"))` → 10:00 hora de Lima.
- **Contrato de fechas con el frontend:** el backend recibe y devuelve `LocalDateTime` **sin zona** (`"2026-12-02T21:00:00"`), en hora de Lima. **Nota para Fernando:** no enviar `toISOString()` (añade `Z` y desplaza 5 horas); enviar el valor del `<input type="datetime-local">` tal cual.

### 2.7 Vocabulario (regla de oro)

| Interno (código, BD, logs) | Lo que ve el usuario (mensajes de error, correos, `etiqueta` en DTOs) |
|---|---|
| `SolicitudCambio`, `/api/rfc` | "Solicitud de cambio técnico" |
| `EstadoSLA`, `estado_sla`, `configuracion_sla` | "Compromiso de atención" (en tiempo / en riesgo / vencido) |
| `ErrorConocido`, `/api/kedb` | "Centro de Soluciones y Guías" |
| `ElementoConfiguracion` | "Equipo" / "Catálogo de Equipos y Red" |

Antes del PR ejecuta (debe devolver **cero** líneas):

```bash
cd backend
grep -rnE '"[^"]*\b(ITIL|SLA|RFC|KEDB|CMDB)\b[^"]*"' src/main/java \
  | grep -vE '@(RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping|Query|Table|Column|Value)' \
  | grep -vE 'log\.(debug|info|warn|error)'
```

---

## 3. Módulo 1 — Solicitudes de Cambio Técnico

**Propósito de negocio:** ninguna intervención sobre el sistema clínico, la red o los servidores se ejecuta sin que quede escrito qué se hará, a qué áreas asistenciales afecta, cómo se vuelve atrás y quién lo autorizó. El caso típico: actualizar el módulo de admisión del HIS sin dejar a Emergencia sin registrar pacientes.

### 3.1 Estructura de archivos

```
entities/
├── SolicitudCambio.java
├── PasoPlanCambio.java              (@Embeddable)
├── HistorialSolicitudCambio.java
├── CorrelativoDocumento.java
├── EstadoCambio.java  TipoCambio.java  CategoriaCambio.java
├── ImpactoAsistencial.java  NivelRiesgo.java  AccionCambio.java
repositories/
├── SolicitudCambioRepository.java
├── HistorialSolicitudCambioRepository.java
└── CorrelativoDocumentoRepository.java
compartido/correlativo/GeneradorCorrelativo.java
administrativo/cambios/
├── api/SolicitudCambioController.java
├── aplicacion/SolicitudCambioService.java
├── aplicacion/impl/SolicitudCambioServiceImpl.java
├── dominio/FlujoSolicitudCambio.java
├── dominio/ValidadorSolicitudCambio.java
├── dominio/EvaluadorRiesgoCambio.java
├── dominio/PoliticaAccesoCambios.java
├── dto/  (formularios y respuestas — §3.5)
├── mapper/SolicitudCambioMapper.java
└── eventos/SolicitudCambioTransicionadaEvento.java
```

### 3.2 Enumeraciones

```java
package com.hospital.servicedesk.entities;

import lombok.Getter;

@Getter
public enum EstadoCambio {
    BORRADOR("Borrador"),
    EN_EVALUACION("En evaluación"),
    APROBADO("Aprobado"),
    RECHAZADO("Rechazado"),
    EN_EJECUCION("En ejecución"),
    IMPLEMENTADO("Implementado"),
    CANCELADO("Cancelado");

    private final String etiqueta;

    EstadoCambio(String etiqueta) { this.etiqueta = etiqueta; }

    public boolean esTerminal() {
        return this == RECHAZADO || this == IMPLEMENTADO || this == CANCELADO;
    }
}
```

```java
public enum TipoCambio { RUTINARIO, PROGRAMADO, URGENTE }

public enum CategoriaCambio { SISTEMA_CLINICO, RED, SERVIDOR, EQUIPO_USUARIO, SEGURIDAD }

public enum ImpactoAsistencial {
    BAJO, MEDIO, ALTO, CRITICO;
    public boolean exigeContinuidad() { return this == ALTO || this == CRITICO; }
}

/** Calculado por el servidor; el cliente nunca lo envía. */
public enum NivelRiesgo { BAJO, MEDIO, ALTO }
```

```java
package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.EnumSet;
import java.util.Set;

import static com.hospital.servicedesk.entities.EstadoCambio.*;

/**
 * Acciones de la máquina de estados. Cada acción conoce sus estados de origen,
 * su destino y si exige observación. Es la ÚNICA fuente de verdad de transiciones.
 */
@Getter
public enum AccionCambio {
    ENVIAR_EVALUACION(EnumSet.of(BORRADOR), EN_EVALUACION, false, "enviar a evaluación"),
    APROBAR(EnumSet.of(EN_EVALUACION), APROBADO, false, "aprobar"),
    RECHAZAR(EnumSet.of(EN_EVALUACION), RECHAZADO, true, "rechazar"),
    DEVOLVER_BORRADOR(EnumSet.of(EN_EVALUACION), BORRADOR, true, "devolver para correcciones"),
    INICIAR_EJECUCION(EnumSet.of(APROBADO), EN_EJECUCION, false, "iniciar la intervención de"),
    MARCAR_IMPLEMENTADO(EnumSet.of(EN_EJECUCION), IMPLEMENTADO, true, "registrar como implementada"),
    CANCELAR(EnumSet.of(BORRADOR, EN_EVALUACION, APROBADO), CANCELADO, true, "cancelar");

    private final Set<EstadoCambio> origenes;
    private final EstadoCambio destino;
    private final boolean requiereObservacion;
    private final String verbo;

    AccionCambio(Set<EstadoCambio> origenes, EstadoCambio destino, boolean requiereObservacion, String verbo) {
        this.origenes = origenes;
        this.destino = destino;
        this.requiereObservacion = requiereObservacion;
        this.verbo = verbo;
    }

    public boolean permiteDesde(EstadoCambio estado) { return origenes.contains(estado); }
}
```

Diagrama (con el estado nuevo `CANCELADO`):

```
                ENVIAR_EVALUACION          APROBAR             INICIAR_EJECUCION        MARCAR_IMPLEMENTADO
  ┌──────────┐ ───────────────▶ ┌──────────────┐ ──────▶ ┌──────────┐ ─────────────▶ ┌──────────────┐ ───────────────▶ ┌──────────────┐
  │ BORRADOR │                   │ EN_EVALUACION│         │ APROBADO │                 │ EN_EJECUCION │                   │ IMPLEMENTADO │
  └──────────┘ ◀─────────────── └──────────────┘         └──────────┘                 └──────────────┘                   └──────────────┘
       │        DEVOLVER_BORRADOR       │  │ RECHAZAR          │
       │                                │  ▼                   │
       │ CANCELAR              CANCELAR │ ┌───────────┐        │ CANCELAR
       └──────────────┬─────────────────┘ │ RECHAZADO │        │
                      ▼                   └───────────┘        │
               ┌───────────┐ ◀────────────────────────────────┘
               │ CANCELADO │   (terminal; no se cancela algo ya en ejecución: se usa el plan de reversa)
               └───────────┘
```

> **Nota para Fernando:** agregar `'CANCELADO'` a `EstadoCambio` y `'CANCELAR'` a `AccionCambio` (botón "Cancelar solicitud", variante `outline`, motivo obligatorio). La respuesta de detalle trae `accionesPermitidas`, así que el frontend puede dejar de calcularlas en `flujo-cambio.ts` y solo mostrarlas.

### 3.3 Entidades

```java
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

/** Paso de un plan (implementación o reversa). El orden lo da la @OrderColumn de la colección. */
@Embeddable
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PasoPlanCambio {

    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Column(name = "responsable", length = 120)
    private String responsable;

    @Column(name = "minutos_estimados")
    private Integer minutosEstimados;
}
```

```java
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "solicitud_cambio")
public class SolicitudCambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_solicitud_cambio")
    private Integer id;

    @Column(name = "codigo", nullable = false, unique = true, length = 20)
    private String codigo;                                   // SC-2026-0001

    @Column(name = "titulo", nullable = false, length = 120)
    private String titulo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoCambio tipo;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaCambio categoria;

    @Column(name = "descripcion", nullable = false, length = 4000)
    private String descripcion;

    @Column(name = "justificacion", nullable = false, length = 4000)
    private String justificacion;                            // "motivo" del cambio

    // ── Evaluación de impacto asistencial ──
    @Enumerated(EnumType.STRING)
    @Column(name = "impacto", nullable = false, length = 20)
    private ImpactoAsistencial impacto;

    @Enumerated(EnumType.STRING)
    @Column(name = "riesgo", nullable = false, length = 20)
    private NivelRiesgo riesgo;

    @Column(name = "requiere_interrupcion", nullable = false)
    private boolean requiereInterrupcion;

    @Column(name = "minutos_interrupcion")
    private Integer minutosInterrupcion;

    @Column(name = "pacientes_afectados", length = 500)
    private String pacientesPotencialmenteAfectados;

    @Column(name = "descripcion_impacto", nullable = false, length = 2000)
    private String descripcionImpacto;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "solicitud_cambio_area",
            joinColumns = @JoinColumn(name = "id_solicitud_cambio"),
            inverseJoinColumns = @JoinColumn(name = "id_area"))
    @Builder.Default
    private Set<Area> areasAfectadas = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_servicio", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Column(name = "nombre_servicio", nullable = false, length = 150)
    @Builder.Default
    private List<String> serviciosAfectados = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_equipo", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Column(name = "codigo_inventario", nullable = false, length = 30)
    @Builder.Default
    private List<String> equiposAfectados = new ArrayList<>();

    // ── Planes ──
    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_paso_implementacion", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<PasoPlanCambio> pasosImplementacion = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "solicitud_cambio_paso_reversa", joinColumns = @JoinColumn(name = "id_solicitud_cambio"))
    @OrderColumn(name = "orden")
    @Builder.Default
    private List<PasoPlanCambio> pasosReversa = new ArrayList<>();

    @Column(name = "criterio_reversa", nullable = false, length = 500)
    private String criterioReversa;

    @Column(name = "minutos_reversa", nullable = false)
    private Integer minutosReversa;

    @Column(name = "plan_continuidad", length = 1000)
    private String planContinuidad;

    @Column(name = "responsable_reversa", nullable = false, length = 120)
    private String responsableReversa;

    @Column(name = "responsable_ejecucion", length = 120)
    private String responsableEjecucion;

    // ── Horarios ──
    @Column(name = "horario_inicio")
    private LocalDateTime horarioInicio;                     // fecha de ejecución programada

    @Column(name = "horario_fin")
    private LocalDateTime horarioFin;

    @Column(name = "fecha_inicio_real")
    private LocalDateTime fechaInicioReal;

    @Column(name = "fecha_fin_real")
    private LocalDateTime fechaFinReal;

    // ── Personas y decisión ──
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket_origen")
    private Ticket ticketOrigen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitante", nullable = false)
    private Usuario solicitante;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_aprobador")
    private Usuario aprobador;

    @Column(name = "fecha_decision")
    private LocalDateTime fechaDecision;

    @Column(name = "observacion_decision", length = 1000)
    private String observacionDecision;

    @Column(name = "resultado_implementacion", length = 2000)
    private String resultadoImplementacion;

    // ── Estado y control ──
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    @Builder.Default
    private EstadoCambio estado = EstadoCambio.BORRADOR;

    /** Minúsculas y sin tildes: código + título + áreas. Lo mantiene el servicio. */
    @Column(name = "texto_busqueda", nullable = false, length = 1000)
    private String textoBusqueda;

    @Column(name = "fecha_registro", nullable = false, updatable = false)
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
```

```java
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "historial_solicitud_cambio")
public class HistorialSolicitudCambio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial_cambio")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_solicitud_cambio", nullable = false)
    private SolicitudCambio solicitud;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    /** CREAR, ACTUALIZAR o el nombre de una AccionCambio. */
    @Column(name = "accion", nullable = false, length = 30)
    private String accion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_anterior", length = 20)
    private EstadoCambio estadoAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado_nuevo", nullable = false, length = 20)
    private EstadoCambio estadoNuevo;

    @Column(name = "observacion", length = 1000)
    private String observacion;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
```

```java
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

/** Contador por prefijo y año: clave "SC-2026" → último = 7 ⇒ siguiente SC-2026-0008. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Entity
@Table(name = "correlativo_documento")
public class CorrelativoDocumento {

    @Id
    @Column(name = "clave", length = 20)
    private String clave;

    @Column(name = "ultimo", nullable = false)
    private int ultimo;
}
```

### 3.4 Repositorios y generador de código

```java
package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SolicitudCambioRepository extends JpaRepository<SolicitudCambio, Integer> {

    @Query("""
            select s from SolicitudCambio s
            where (:estado is null or s.estado = :estado)
              and (:impacto is null or s.impacto = :impacto)
              and (:tipo is null or s.tipo = :tipo)
              and (:texto is null or s.textoBusqueda like concat('%', :texto, '%'))
            order by s.fechaRegistro desc
            """)
    @EntityGraph(attributePaths = {"solicitante", "areasAfectadas"})
    List<SolicitudCambio> buscar(@Param("estado") EstadoCambio estado,
                                 @Param("impacto") ImpactoAsistencial impacto,
                                 @Param("tipo") TipoCambio tipo,
                                 @Param("texto") String textoNormalizado);

    @EntityGraph(attributePaths = {"solicitante", "aprobador", "areasAfectadas", "ticketOrigen"})
    Optional<SolicitudCambio> findDetalleById(Integer id);
}
```

```java
public interface HistorialSolicitudCambioRepository extends JpaRepository<HistorialSolicitudCambio, Integer> {

    @EntityGraph(attributePaths = "usuario")
    List<HistorialSolicitudCambio> findBySolicitud_IdOrderByFechaAscIdAsc(Integer idSolicitud);

    void deleteBySolicitud_Id(Integer idSolicitud);
}
```

```java
public interface CorrelativoDocumentoRepository extends JpaRepository<CorrelativoDocumento, String> {

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CorrelativoDocumento c where c.clave = :clave")
    Optional<CorrelativoDocumento> bloquear(@Param("clave") String clave);
}
```

```java
package com.hospital.servicedesk.compartido.correlativo;

import com.hospital.servicedesk.entities.CorrelativoDocumento;
import com.hospital.servicedesk.repositories.CorrelativoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Genera códigos correlativos por año sin huecos por concurrencia:
 * el SELECT ... WITH (UPDLOCK) (PESSIMISTIC_WRITE) serializa a quienes piden el mismo prefijo.
 * El año sale del Clock del llamador, para que los tests sean deterministas.
 */
@Component
@RequiredArgsConstructor
public class GeneradorCorrelativo {

    private final CorrelativoDocumentoRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public String siguiente(String prefijo, int anio) {
        String clave = prefijo + "-" + anio;
        CorrelativoDocumento contador = repository.bloquear(clave)
                .orElseGet(() -> repository.saveAndFlush(new CorrelativoDocumento(clave, 0)));
        contador.setUltimo(contador.getUltimo() + 1);
        return "%s-%d-%04d".formatted(prefijo, anio, contador.getUltimo());
    }
}
```

> Si dos personas crean la **primera** solicitud del año en el mismo milisegundo, una recibirá 409 por la PK de `correlativo_documento` y reintentará. La migración V1_3 siembra la fila del año en curso para evitarlo en la práctica.

### 3.5 DTOs (contrato exacto con `cambios.model.ts`)

Archivo único `administrativo/cambios/dto/SolicitudCambioDTOs.java` con *records* anidados (mismo estilo que `TicketDTOs`):

```java
package com.hospital.servicedesk.administrativo.cambios.dto;

import com.hospital.servicedesk.entities.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class SolicitudCambioDTOs {

    private SolicitudCambioDTOs() {}

    // ══════════════════════ ENTRADA ══════════════════════

    public record HorarioProgramado(
            @NotNull(message = "Indique la fecha y hora de inicio.") LocalDateTime inicioIso,
            @NotNull(message = "Indique la fecha y hora de fin.") LocalDateTime finIso) {}

    public record PasoPlanFormulario(
            @NotBlank(message = "Describa el paso.")
            @Size(max = 500, message = "Cada paso admite hasta 500 caracteres.") String descripcion,
            @Size(max = 120) String responsable,
            @Positive(message = "Los minutos estimados deben ser mayores a cero.")
            @Max(value = 1440, message = "Un paso no puede durar más de 24 horas.") Integer minutosEstimados) {}

    public record EvaluacionImpactoFormulario(
            @NotNull(message = "Seleccione el nivel de impacto asistencial.") ImpactoAsistencial nivel,
            @NotEmpty(message = "Seleccione al menos un área del hospital afectada.")
            List<@NotNull Integer> idsAreasAfectadas,
            boolean requiereInterrupcion,
            Integer minutosInterrupcion,
            @Size(max = 20) List<@NotBlank @Size(max = 150) String> serviciosAfectados,
            @Size(max = 500) String pacientesPotencialmenteAfectados,
            @NotBlank(message = "Describa el impacto sobre la atención.")
            @Size(max = 2000) String descripcion) {}

    public record PlanReversaFormulario(
            @NotBlank(message = "Indique en qué situación se activará la reversa.")
            @Size(max = 500) String criterioActivacion,
            @NotEmpty(message = "Todo cambio necesita un plan de reversa.")
            @Size(max = 30) List<@Valid PasoPlanFormulario> pasos,
            @NotNull(message = "Indique el tiempo total de reversa.")
            @Positive(message = "Indique el tiempo total de reversa.") Integer minutosEstimados,
            @Size(max = 1000) String planContinuidad,
            @NotBlank(message = "Indique quién ejecutará la reversa.")
            @Size(max = 120) String responsableReversa) {}

    /** Equivale a CambioFormulario del frontend. */
    public record SolicitudCambioFormulario(
            @NotBlank(message = "Describa el cambio en al menos 10 caracteres.")
            @Size(min = 10, max = 120, message = "Describa el cambio en al menos 10 caracteres.") String titulo,
            @NotNull(message = "Seleccione el tipo de cambio.") TipoCambio tipo,
            @NotNull(message = "Seleccione la categoría.") CategoriaCambio categoria,
            @NotBlank(message = "Describa en qué consiste el cambio.")
            @Size(max = 4000) String descripcion,
            @NotBlank(message = "Explique por qué este cambio es necesario.")
            @Size(min = 20, max = 4000, message = "Explique por qué este cambio es necesario.") String justificacion,
            @Size(max = 50) List<@NotBlank @Size(max = 30) String> equiposAfectados,
            Integer idTicketOrigen,
            @Size(max = 120) String responsableEjecucion,
            @Valid HorarioProgramado horario,
            @NotNull @Valid EvaluacionImpactoFormulario evaluacion,
            @NotEmpty(message = "Agregue al menos un paso de implementación.")
            @Size(max = 50) List<@Valid PasoPlanFormulario> pasosImplementacion,
            @NotNull @Valid PlanReversaFormulario planReversa) {}

    public record TransicionCambioSolicitud(
            @NotNull(message = "Indique la acción a realizar.") AccionCambio accion,
            @Size(max = 1000, message = "La observación no puede superar los 1000 caracteres.") String observacion) {}

    // ══════════════════════ SALIDA ══════════════════════

    public record AreaAfectadaRespuesta(Integer idArea, String nombre, boolean esCritica) {}

    public record PasoPlanRespuesta(int orden, String descripcion, String responsable, Integer minutosEstimados) {}

    public record EvaluacionImpactoRespuesta(
            ImpactoAsistencial nivel,
            List<AreaAfectadaRespuesta> areasAfectadas,
            boolean requiereInterrupcion,
            Integer minutosInterrupcion,
            List<String> serviciosAfectados,
            String pacientesPotencialmenteAfectados,
            String descripcion) {}

    public record PlanReversaRespuesta(
            String criterioActivacion,
            List<PasoPlanRespuesta> pasos,
            Integer minutosEstimados,
            String planContinuidad,
            String responsableReversa) {}

    public record EventoCambioRespuesta(
            LocalDateTime fechaIso,
            String usuarioNombre,
            EstadoCambio estadoAnterior,
            EstadoCambio estadoNuevo,
            String observacion) {}

    public record CambioResumenRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso) {}

    /** Superconjunto de CambioDetalle del frontend (campos extra: riesgo, accionesPermitidas, advertencias, version...). */
    public record CambioDetalleRespuesta(
            Integer id,
            String codigo,
            String titulo,
            TipoCambio tipo,
            CategoriaCambio categoria,
            EstadoCambio estado,
            ImpactoAsistencial impacto,
            NivelRiesgo riesgo,
            List<String> areasAfectadas,
            HorarioProgramado horario,
            String solicitante,
            String responsableEjecucion,
            LocalDateTime fechaRegistroIso,
            String descripcion,
            String justificacion,
            List<String> equiposAfectados,
            Integer idTicketOrigen,
            EvaluacionImpactoRespuesta evaluacion,
            List<PasoPlanRespuesta> pasosImplementacion,
            PlanReversaRespuesta planReversa,
            String aprobador,
            LocalDateTime fechaDecisionIso,
            String observacionDecision,
            String resultadoImplementacion,
            LocalDateTime fechaInicioRealIso,
            LocalDateTime fechaFinRealIso,
            List<EventoCambioRespuesta> historial,
            List<AccionCambio> accionesPermitidas,
            List<String> advertencias,
            Long version) {}
}
```

### 3.6 Reglas de dominio puras

#### 3.6.1 Máquina de estados

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;

import java.util.Arrays;
import java.util.List;

/** Función pura: sin Spring, sin BD. Toda la lógica de transición está en AccionCambio. */
public final class FlujoSolicitudCambio {

    private FlujoSolicitudCambio() {}

    public static EstadoCambio aplicar(EstadoCambio actual, AccionCambio accion, String observacion) {
        if (!accion.permiteDesde(actual)) {
            throw new ConflictoNegocioException("estado",
                    "No se puede %s una solicitud que está en estado «%s»."
                            .formatted(accion.getVerbo(), actual.getEtiqueta()));
        }
        if (accion.isRequiereObservacion() && (observacion == null || observacion.isBlank())) {
            throw new ReglaNegocioException("observacion", switch (accion) {
                case RECHAZAR -> "Indique el motivo del rechazo.";
                case DEVOLVER_BORRADOR -> "Indique qué debe corregirse.";
                case MARCAR_IMPLEMENTADO -> "Describa el resultado de la implementación.";
                case CANCELAR -> "Indique el motivo de la cancelación.";
                default -> "Escriba una observación.";
            });
        }
        return accion.getDestino();
    }

    public static List<AccionCambio> accionesDesde(EstadoCambio estado) {
        return Arrays.stream(AccionCambio.values()).filter(a -> a.permiteDesde(estado)).toList();
    }

    public static boolean esEditable(EstadoCambio estado) {
        return estado == EstadoCambio.BORRADOR;
    }
}
```

#### 3.6.2 Riesgo calculado

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.entities.*;

/** Matriz simple y explicable; el comité la ve, no la edita. */
public final class EvaluadorRiesgoCambio {

    private EvaluadorRiesgoCambio() {}

    public static NivelRiesgo calcular(TipoCambio tipo, ImpactoAsistencial impacto, boolean requiereInterrupcion) {
        if (impacto == ImpactoAsistencial.CRITICO
                || (impacto == ImpactoAsistencial.ALTO && requiereInterrupcion)) {
            return NivelRiesgo.ALTO;
        }
        if (impacto == ImpactoAsistencial.ALTO
                || (impacto == ImpactoAsistencial.MEDIO && requiereInterrupcion)
                || tipo == TipoCambio.URGENTE) {
            return NivelRiesgo.MEDIO;
        }
        return NivelRiesgo.BAJO;
    }
}
```

#### 3.6.3 Validaciones de negocio (V1–V12 del frontend, replicadas en servidor)

V1, V2, V3, V7 (parcial) y V8 (parcial) ya las cubren las anotaciones del DTO. El resto:

| # | Regla | Dónde | Bloquea |
|---|---|---|---|
| V4 | Fin > inicio; duración ≤ 72 h | `validarParaGuardar` | Sí (400) |
| V5 | Inicio en el futuro si tipo ≠ `URGENTE` | `validarParaGuardar` y `validarParaEnviar` | Sí |
| V6 | Horario obligatorio para enviar a evaluación | `validarParaEnviar` | Sí |
| V7 | `minutosInterrupcion > 0` si `requiereInterrupcion` | `validarParaGuardar` | Sí |
| V9 | Plan de continuidad obligatorio si impacto `ALTO`/`CRITICO` | `validarParaGuardar` | Sí |
| V10 | Impacto `CRITICO` y tipo ≠ `URGENTE` ⇒ horario fuera de 07:00–19:00 | `validarParaGuardar` | Sí |
| V11 | Área crítica seleccionada con impacto < `CRITICO` | `advertencias` | No (aviso) |
| V12 | Reversa más larga que la ventana programada | `advertencias` | No (aviso) |
| V13 🆕 | No iniciar ejecución más de 15 min antes del horario (salvo `URGENTE`) | servicio, en `INICIAR_EJECUCION` | Sí (409) |
| V14 🆕 | Áreas inexistentes o inactivas | servicio | Sí (400) |

**Área crítica (backend):** `area.prioridad_defecto = 'P1'` (Emergencia Admisión, Farmacia Emergencia, Materno 1, Triaje Principal, Cardiología, Diagnóstico por Imágenes ‑ Piso 2, Centro Quirúrgico…). **Nota para Fernando:** usa `esCritica` de `GET /api/rfc/areas-seleccionables` y elimina la lista de nombres *hardcodeada*.

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.*;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ValidadorSolicitudCambio {

    static final LocalTime INICIO_ALTA_DEMANDA = LocalTime.of(7, 0);
    static final LocalTime FIN_ALTA_DEMANDA = LocalTime.of(19, 0);
    static final Duration DURACION_MAXIMA = Duration.ofHours(72);

    private final Clock clock;

    /** Reglas que aplican al crear o editar un borrador. */
    public void validarParaGuardar(SolicitudCambioFormulario f) {
        EvaluacionImpactoFormulario ev = f.evaluacion();

        if (f.horario() != null) {
            validarHorario(f.horario().inicioIso(), f.horario().finIso(), f.tipo());
            if (ev.nivel() == ImpactoAsistencial.CRITICO && f.tipo() != TipoCambio.URGENTE
                    && invadeHorarioAltaDemanda(f.horario().inicioIso(), f.horario().finIso())) {
                throw new ReglaNegocioException("horario",
                        "Los cambios de impacto crítico deben programarse entre las 19:00 y las 07:00.");
            }
        }
        if (ev.requiereInterrupcion() && (ev.minutosInterrupcion() == null || ev.minutosInterrupcion() <= 0)) {
            throw new ReglaNegocioException("evaluacion.minutosInterrupcion",
                    "Indique cuántos minutos se interrumpirá el servicio.");
        }
        if (ev.nivel().exigeContinuidad()
                && (f.planReversa().planContinuidad() == null || f.planReversa().planContinuidad().isBlank())) {
            throw new ReglaNegocioException("planReversa.planContinuidad",
                    "Indique cómo seguirá atendiendo el área mientras dure la intervención.");
        }
    }

    /** Reglas adicionales al pasar de BORRADOR a EN_EVALUACION. */
    public void validarParaEnviar(SolicitudCambio s) {
        if (s.getHorarioInicio() == null || s.getHorarioFin() == null) {
            throw new ReglaNegocioException("horario", "Defina el horario programado de intervención.");
        }
        validarHorario(s.getHorarioInicio(), s.getHorarioFin(), s.getTipo());
    }

    /** V11 y V12: avisos no bloqueantes que se devuelven en el detalle. */
    public List<String> advertencias(SolicitudCambio s) {
        List<String> avisos = new ArrayList<>();
        boolean hayAreaCritica = s.getAreasAfectadas().stream().anyMatch(ValidadorSolicitudCambio::esAreaCritica);
        if (hayAreaCritica && s.getImpacto() != ImpactoAsistencial.CRITICO) {
            avisos.add("Seleccionó un área crítica. Le sugerimos marcar el impacto como crítico.");
        }
        if (s.getHorarioInicio() != null && s.getHorarioFin() != null && s.getMinutosReversa() != null) {
            long ventana = Duration.between(s.getHorarioInicio(), s.getHorarioFin()).toMinutes();
            if (s.getMinutosReversa() > ventana) {
                avisos.add("El tiempo de reversa supera el horario programado.");
            }
        }
        return avisos;
    }

    public static boolean esAreaCritica(Area area) {
        return "P1".equalsIgnoreCase(area.getPrioridadDefecto());
    }

    private void validarHorario(LocalDateTime inicio, LocalDateTime fin, TipoCambio tipo) {
        if (!fin.isAfter(inicio)) {
            throw new ReglaNegocioException("horario.finIso", "La hora de fin debe ser posterior a la de inicio.");
        }
        if (Duration.between(inicio, fin).compareTo(DURACION_MAXIMA) > 0) {
            throw new ReglaNegocioException("horario.finIso", "La intervención no puede programarse por más de 72 horas.");
        }
        if (tipo != TipoCambio.URGENTE && !inicio.isAfter(LocalDateTime.now(clock))) {
            throw new ReglaNegocioException("horario.inicioIso", "Programe la intervención en una fecha futura.");
        }
    }

    /** ¿El intervalo [inicio, fin) toca alguna franja diaria [07:00, 19:00)? */
    static boolean invadeHorarioAltaDemanda(LocalDateTime inicio, LocalDateTime fin) {
        for (LocalDate dia = inicio.toLocalDate(); !dia.isAfter(fin.toLocalDate()); dia = dia.plusDays(1)) {
            LocalDateTime bandaInicio = dia.atTime(INICIO_ALTA_DEMANDA);
            LocalDateTime bandaFin = dia.atTime(FIN_ALTA_DEMANDA);
            if (inicio.isBefore(bandaFin) && fin.isAfter(bandaInicio)) {
                return true;
            }
        }
        return false;
    }
}
```

#### 3.6.4 Política de acceso (permisos que dependen del dato)

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.SolicitudCambio;
import com.hospital.servicedesk.entities.Usuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class PoliticaAccesoCambios {

    public void verificarEdicion(SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        exigir(ctx.esAdministrador() || esSolicitante(s, actor),
                "Solo quien registró la solicitud puede modificarla.");
    }

    public void verificarTransicion(AccionCambio accion, SolicitudCambio s, Usuario actor, ContextoActor ctx) {
        boolean solicitante = esSolicitante(s, actor);
        switch (accion) {
            case ENVIAR_EVALUACION, CANCELAR ->
                    exigir(ctx.esAdministrador() || solicitante, "Solo quien registró la solicitud puede hacerlo.");
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> {
                exigir(ctx.esAdministrador(), "Solo el comité de evaluación puede decidir sobre una solicitud.");
                // Segregación de funciones: nadie evalúa su propia solicitud.
                exigir(!solicitante, "Quien registró la solicitud no puede evaluarla.");
            }
            case INICIAR_EJECUCION, MARCAR_IMPLEMENTADO ->
                    exigir(ctx.esAdministrador() || ctx.esTecnico(), "Solo el personal técnico puede ejecutar cambios.");
        }
    }

    private static boolean esSolicitante(SolicitudCambio s, Usuario actor) {
        return s.getSolicitante().getIdUsuario().equals(actor.getIdUsuario());
    }

    private static void exigir(boolean condicion, String mensaje) {
        if (!condicion) throw new AccessDeniedException(mensaje);
    }
}
```

> `AccessDeniedException` → 403 con el mensaje genérico del `GlobalExceptionHandler`. El mensaje específico queda en el log (útil para soporte) y no se filtra al cliente.

### 3.7 Servicio de aplicación

```java
package com.hospital.servicedesk.administrativo.cambios.aplicacion;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;

import java.util.List;

public interface SolicitudCambioService {
    List<CambioResumenRespuesta> listar(EstadoCambio estado, ImpactoAsistencial impacto, TipoCambio tipo, String texto);
    CambioDetalleRespuesta obtener(Integer id);
    CambioDetalleRespuesta crear(SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta actualizar(Integer id, SolicitudCambioFormulario formulario, ContextoActor ctx);
    CambioDetalleRespuesta transicionar(Integer id, TransicionCambioSolicitud transicion, ContextoActor ctx);
    void eliminar(Integer id, ContextoActor ctx);
    List<AreaAfectadaRespuesta> listarAreasSeleccionables();
}
```

```java
package com.hospital.servicedesk.administrativo.cambios.aplicacion.impl;

import com.hospital.servicedesk.administrativo.cambios.aplicacion.SolicitudCambioService;
import com.hospital.servicedesk.administrativo.cambios.dominio.*;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.administrativo.cambios.eventos.SolicitudCambioTransicionadaEvento;
import com.hospital.servicedesk.administrativo.cambios.mapper.SolicitudCambioMapper;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.compartido.correlativo.GeneradorCorrelativo;
import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import com.hospital.servicedesk.repositories.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SolicitudCambioServiceImpl implements SolicitudCambioService {

    private static final String PREFIJO_CODIGO = "SC";
    private static final long TOLERANCIA_INICIO_MINUTOS = 15;

    private final SolicitudCambioRepository repository;
    private final HistorialSolicitudCambioRepository historialRepository;
    private final AreaRepository areaRepository;
    private final TicketRepository ticketRepository;
    private final UsuarioRepository usuarioRepository;
    private final GeneradorCorrelativo generadorCorrelativo;
    private final ValidadorSolicitudCambio validador;
    private final PoliticaAccesoCambios politica;
    private final ApplicationEventPublisher eventos;
    private final Clock clock;

    // ───────────────────────── Consultas ─────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<CambioResumenRespuesta> listar(EstadoCambio estado, ImpactoAsistencial impacto,
                                               TipoCambio tipo, String texto) {
        String textoNormalizado = NormalizadorBusqueda.normalizar(texto);
        return repository.buscar(estado, impacto, tipo, textoNormalizado.isEmpty() ? null : textoNormalizado)
                .stream().map(SolicitudCambioMapper::aResumen).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CambioDetalleRespuesta obtener(Integer id) {
        return aDetalle(buscar(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AreaAfectadaRespuesta> listarAreasSeleccionables() {
        return areaRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(a -> new AreaAfectadaRespuesta(a.getIdArea(), a.getNombre(), ValidadorSolicitudCambio.esAreaCritica(a)))
                .toList();
    }

    // ───────────────────────── Comandos ─────────────────────────

    @Override
    @Transactional
    public CambioDetalleRespuesta crear(SolicitudCambioFormulario f, ContextoActor ctx) {
        validador.validarParaGuardar(f);
        Usuario actor = actor(ctx);
        LocalDateTime ahora = LocalDateTime.now(clock);

        SolicitudCambio s = new SolicitudCambio();
        s.setCodigo(generadorCorrelativo.siguiente(PREFIJO_CODIGO, ahora.getYear()));
        s.setSolicitante(actor);
        s.setEstado(EstadoCambio.BORRADOR);
        s.setFechaRegistro(ahora);
        aplicarFormulario(s, f, ahora);

        repository.save(s);
        registrarHistorial(s, actor, "CREAR", null, EstadoCambio.BORRADOR, null, ctx, ahora);
        log.info("Solicitud de cambio {} creada por {}", s.getCodigo(), ctx.correo());
        return aDetalle(s);
    }

    @Override
    @Transactional
    public CambioDetalleRespuesta actualizar(Integer id, SolicitudCambioFormulario f, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        Usuario actor = actor(ctx);
        exigirEditable(s);
        politica.verificarEdicion(s, actor, ctx);
        validador.validarParaGuardar(f);

        LocalDateTime ahora = LocalDateTime.now(clock);
        aplicarFormulario(s, f, ahora);
        registrarHistorial(s, actor, "ACTUALIZAR", s.getEstado(), s.getEstado(), null, ctx, ahora);
        return aDetalle(s);
    }

    @Override
    @Transactional
    public CambioDetalleRespuesta transicionar(Integer id, TransicionCambioSolicitud t, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        Usuario actor = actor(ctx);
        AccionCambio accion = t.accion();
        String observacion = t.observacion() == null ? null : t.observacion().trim();

        politica.verificarTransicion(accion, s, actor, ctx);
        EstadoCambio anterior = s.getEstado();
        EstadoCambio nuevo = FlujoSolicitudCambio.aplicar(anterior, accion, observacion);
        LocalDateTime ahora = LocalDateTime.now(clock);

        switch (accion) {
            case ENVIAR_EVALUACION -> validador.validarParaEnviar(s);
            case APROBAR, RECHAZAR, DEVOLVER_BORRADOR -> {
                s.setAprobador(actor);
                s.setFechaDecision(ahora);
                s.setObservacionDecision(observacion);
            }
            case INICIAR_EJECUCION -> {
                exigirVentanaDeInicio(s, ahora);
                s.setFechaInicioReal(ahora);
            }
            case MARCAR_IMPLEMENTADO -> {
                s.setFechaFinReal(ahora);
                s.setResultadoImplementacion(observacion);
            }
            case CANCELAR -> s.setObservacionDecision(observacion);
        }

        s.setEstado(nuevo);
        s.setFechaActualizacion(ahora);
        registrarHistorial(s, actor, accion.name(), anterior, nuevo, observacion, ctx, ahora);
        eventos.publishEvent(new SolicitudCambioTransicionadaEvento(
                s.getId(), s.getCodigo(), s.getTitulo(), accion, anterior, nuevo, s.getImpacto(), ctx.correo()));
        log.info("Solicitud {}: {} → {} por {}", s.getCodigo(), anterior, nuevo, ctx.correo());
        return aDetalle(s);
    }

    @Override
    @Transactional
    public void eliminar(Integer id, ContextoActor ctx) {
        SolicitudCambio s = buscar(id);
        exigirEditable(s);
        politica.verificarEdicion(s, actor(ctx), ctx);
        historialRepository.deleteBySolicitud_Id(id);
        repository.delete(s);
        log.info("Borrador {} eliminado por {}", s.getCodigo(), ctx.correo());
    }

    // ───────────────────────── Internos ─────────────────────────

    private void aplicarFormulario(SolicitudCambio s, SolicitudCambioFormulario f, LocalDateTime ahora) {
        EvaluacionImpactoFormulario ev = f.evaluacion();
        PlanReversaFormulario pr = f.planReversa();

        s.setTitulo(f.titulo().trim());
        s.setTipo(f.tipo());
        s.setCategoria(f.categoria());
        s.setDescripcion(f.descripcion().trim());
        s.setJustificacion(f.justificacion().trim());
        s.setResponsableEjecucion(vacioANulo(f.responsableEjecucion()));
        s.setHorarioInicio(f.horario() == null ? null : f.horario().inicioIso());
        s.setHorarioFin(f.horario() == null ? null : f.horario().finIso());
        s.setTicketOrigen(f.idTicketOrigen() == null ? null
                : ticketRepository.findById(f.idTicketOrigen()).orElseThrow(() ->
                        new ReglaNegocioException("idTicketOrigen", "El ticket de origen indicado no existe.")));

        s.setImpacto(ev.nivel());
        s.setRequiereInterrupcion(ev.requiereInterrupcion());
        s.setMinutosInterrupcion(ev.requiereInterrupcion() ? ev.minutosInterrupcion() : null);
        s.setPacientesPotencialmenteAfectados(vacioANulo(ev.pacientesPotencialmenteAfectados()));
        s.setDescripcionImpacto(ev.descripcion().trim());
        s.setRiesgo(EvaluadorRiesgoCambio.calcular(f.tipo(), ev.nivel(), ev.requiereInterrupcion()));

        reemplazar(s.getAreasAfectadas(), resolverAreas(ev.idsAreasAfectadas()));
        reemplazar(s.getServiciosAfectados(), limpiar(ev.serviciosAfectados()));
        reemplazar(s.getEquiposAfectados(), limpiar(f.equiposAfectados()).stream()
                .map(c -> c.toUpperCase(Locale.ROOT)).distinct().toList());
        reemplazar(s.getPasosImplementacion(), SolicitudCambioMapper.aPasos(f.pasosImplementacion()));
        reemplazar(s.getPasosReversa(), SolicitudCambioMapper.aPasos(pr.pasos()));

        s.setCriterioReversa(pr.criterioActivacion().trim());
        s.setMinutosReversa(pr.minutosEstimados());
        s.setPlanContinuidad(vacioANulo(pr.planContinuidad()));
        s.setResponsableReversa(pr.responsableReversa().trim());

        s.setFechaActualizacion(ahora);
        s.setTextoBusqueda(NormalizadorBusqueda.componer(
                s.getCodigo(), s.getTitulo(),
                String.join(" ", s.getAreasAfectadas().stream().map(Area::getNombre).toList())));
    }

    private List<Area> resolverAreas(List<Integer> ids) {
        Set<Integer> unicos = new LinkedHashSet<>(ids);
        List<Area> areas = areaRepository.findAllById(unicos);
        if (areas.size() != unicos.size() || areas.stream().anyMatch(a -> !Boolean.TRUE.equals(a.getActivo()))) {
            throw new ReglaNegocioException("evaluacion.idsAreasAfectadas",
                    "Alguna de las áreas seleccionadas no existe o está inactiva.");
        }
        return areas;
    }

    private void exigirVentanaDeInicio(SolicitudCambio s, LocalDateTime ahora) {
        if (s.getTipo() == TipoCambio.URGENTE || s.getHorarioInicio() == null) return;
        if (ahora.isBefore(s.getHorarioInicio().minusMinutes(TOLERANCIA_INICIO_MINUTOS))) {
            throw new ConflictoNegocioException("horario",
                    "Aún no llega el horario programado para esta intervención.");
        }
    }

    private void exigirEditable(SolicitudCambio s) {
        if (!FlujoSolicitudCambio.esEditable(s.getEstado())) {
            throw new ConflictoNegocioException("estado",
                    "Solo se pueden modificar o eliminar solicitudes en estado «Borrador».");
        }
    }

    private void registrarHistorial(SolicitudCambio s, Usuario actor, String accion, EstadoCambio anterior,
                                    EstadoCambio nuevo, String observacion, ContextoActor ctx, LocalDateTime ahora) {
        historialRepository.save(HistorialSolicitudCambio.builder()
                .solicitud(s).usuario(actor).accion(accion)
                .estadoAnterior(anterior).estadoNuevo(nuevo)
                .observacion(observacion).ipOrigen(ctx.ipOrigen()).fecha(ahora)
                .build());
    }

    private CambioDetalleRespuesta aDetalle(SolicitudCambio s) {
        return SolicitudCambioMapper.aDetalle(s,
                historialRepository.findBySolicitud_IdOrderByFechaAscIdAsc(s.getId()),
                FlujoSolicitudCambio.accionesDesde(s.getEstado()),
                validador.advertencias(s));
    }

    private SolicitudCambio buscar(Integer id) {
        return repository.findDetalleById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("Solicitud de cambio", id));
    }

    private Usuario actor(ContextoActor ctx) {
        return usuarioRepository.findByCorreoIgnoreCase(ctx.correo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", ctx.correo()));
    }

    private static <T> void reemplazar(Collection<T> destino, Collection<T> origen) {
        destino.clear();
        destino.addAll(origen);
    }

    private static List<String> limpiar(List<String> valores) {
        return valores == null ? List.of()
                : valores.stream().filter(Objects::nonNull).map(String::trim).filter(v -> !v.isEmpty()).toList();
    }

    private static String vacioANulo(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
```

> **Por qué `reemplazar` y no `setAreasAfectadas(nuevaLista)`:** Hibernate rastrea la instancia de la colección. Reemplazarla en un `@ElementCollection` provoca `HibernateException: A collection with cascade=all-delete-orphan was no longer referenced` o borrados/inserciones innecesarias. `clear()` + `addAll()` es seguro.

**Evento** (lo consume un *listener* asíncrono opcional que avisa al comité por correo cuando llega algo a evaluación — mismo patrón del Módulo 3):

```java
package com.hospital.servicedesk.administrativo.cambios.eventos;

import com.hospital.servicedesk.entities.*;

public record SolicitudCambioTransicionadaEvento(
        Integer idSolicitud, String codigo, String titulo, AccionCambio accion,
        EstadoCambio estadoAnterior, EstadoCambio estadoNuevo, ImpactoAsistencial impacto, String correoActor) {}
```

### 3.8 Mapper

```java
package com.hospital.servicedesk.administrativo.cambios.mapper;

import com.hospital.servicedesk.administrativo.cambios.dominio.ValidadorSolicitudCambio;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;

import java.util.List;
import java.util.stream.IntStream;

public final class SolicitudCambioMapper {

    private SolicitudCambioMapper() {}

    public static CambioResumenRespuesta aResumen(SolicitudCambio s) {
        return new CambioResumenRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante().getNombreVisible(), s.getResponsableEjecucion(), s.getFechaRegistro());
    }

    public static CambioDetalleRespuesta aDetalle(SolicitudCambio s, List<HistorialSolicitudCambio> historial,
                                                  List<AccionCambio> acciones, List<String> advertencias) {
        List<AreaAfectadaRespuesta> areas = s.getAreasAfectadas().stream()
                .map(a -> new AreaAfectadaRespuesta(a.getIdArea(), a.getNombre(), ValidadorSolicitudCambio.esAreaCritica(a)))
                .toList();
        return new CambioDetalleRespuesta(
                s.getId(), s.getCodigo(), s.getTitulo(), s.getTipo(), s.getCategoria(), s.getEstado(),
                s.getImpacto(), s.getRiesgo(), nombresAreas(s), horario(s),
                s.getSolicitante().getNombreVisible(), s.getResponsableEjecucion(), s.getFechaRegistro(),
                s.getDescripcion(), s.getJustificacion(), List.copyOf(s.getEquiposAfectados()),
                s.getTicketOrigen() == null ? null : s.getTicketOrigen().getIdTicket(),
                new EvaluacionImpactoRespuesta(s.getImpacto(), areas, s.isRequiereInterrupcion(),
                        s.getMinutosInterrupcion(), List.copyOf(s.getServiciosAfectados()),
                        s.getPacientesPotencialmenteAfectados(), s.getDescripcionImpacto()),
                aPasosRespuesta(s.getPasosImplementacion()),
                new PlanReversaRespuesta(s.getCriterioReversa(), aPasosRespuesta(s.getPasosReversa()),
                        s.getMinutosReversa(), s.getPlanContinuidad(), s.getResponsableReversa()),
                s.getAprobador() == null ? null : s.getAprobador().getNombreVisible(),
                s.getFechaDecision(), s.getObservacionDecision(), s.getResultadoImplementacion(),
                s.getFechaInicioReal(), s.getFechaFinReal(),
                historial.stream().map(h -> new EventoCambioRespuesta(h.getFecha(), h.getUsuario().getNombreVisible(),
                        h.getEstadoAnterior(), h.getEstadoNuevo(), h.getObservacion())).toList(),
                acciones, advertencias, s.getVersion());
    }

    public static List<PasoPlanCambio> aPasos(List<PasoPlanFormulario> pasos) {
        return pasos.stream().map(p -> PasoPlanCambio.builder()
                .descripcion(p.descripcion().trim())
                .responsable(p.responsable() == null || p.responsable().isBlank() ? null : p.responsable().trim())
                .minutosEstimados(p.minutosEstimados())
                .build()).toList();
    }

    private static List<PasoPlanRespuesta> aPasosRespuesta(List<PasoPlanCambio> pasos) {
        return IntStream.range(0, pasos.size())
                .mapToObj(i -> new PasoPlanRespuesta(i + 1, pasos.get(i).getDescripcion(),
                        pasos.get(i).getResponsable(), pasos.get(i).getMinutosEstimados()))
                .toList();
    }

    private static List<String> nombresAreas(SolicitudCambio s) {
        return s.getAreasAfectadas().stream().map(Area::getNombre).sorted().toList();
    }

    private static HorarioProgramado horario(SolicitudCambio s) {
        return s.getHorarioInicio() == null ? null : new HorarioProgramado(s.getHorarioInicio(), s.getHorarioFin());
    }
}
```

### 3.9 Controlador REST

```java
package com.hospital.servicedesk.administrativo.cambios.api;

import com.hospital.servicedesk.administrativo.cambios.aplicacion.SolicitudCambioService;
import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.entities.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * Solicitudes de cambio técnico. "/api/rfc" es un alias interno que ya consume el frontend;
 * la ruta canónica es "/api/solicitudes-cambio". Ninguna de las dos se muestra en pantalla.
 */
@RestController
@RequestMapping({"/api/solicitudes-cambio", "/api/rfc"})
@PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO', 'PRACTICANTE')")
@RequiredArgsConstructor
public class SolicitudCambioController {

    private final SolicitudCambioService service;
    private final ResolutorContextoActor resolutorActor;

    @GetMapping
    public List<CambioResumenRespuesta> listar(@RequestParam(required = false) EstadoCambio estado,
                                               @RequestParam(required = false) ImpactoAsistencial impacto,
                                               @RequestParam(required = false) TipoCambio tipo,
                                               @RequestParam(required = false) String texto) {
        return service.listar(estado, impacto, tipo, texto);
    }

    @GetMapping("/areas-seleccionables")
    public List<AreaAfectadaRespuesta> areasSeleccionables() {
        return service.listarAreasSeleccionables();
    }

    @GetMapping("/{id}")
    public CambioDetalleRespuesta obtener(@PathVariable Integer id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<CambioDetalleRespuesta> crear(@Valid @RequestBody SolicitudCambioFormulario formulario,
                                                        Authentication auth, HttpServletRequest request) {
        CambioDetalleRespuesta creada = service.crear(formulario, resolutorActor.resolver(auth, request));
        return ResponseEntity.created(URI.create("/api/solicitudes-cambio/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    public CambioDetalleRespuesta actualizar(@PathVariable Integer id,
                                             @Valid @RequestBody SolicitudCambioFormulario formulario,
                                             Authentication auth, HttpServletRequest request) {
        return service.actualizar(id, formulario, resolutorActor.resolver(auth, request));
    }

    /** Todas las acciones del flujo (no solo aprobar/rechazar) — nombre "decision" conservado por compatibilidad. */
    @PutMapping("/{id}/decision")
    public CambioDetalleRespuesta transicionar(@PathVariable Integer id,
                                               @Valid @RequestBody TransicionCambioSolicitud transicion,
                                               Authentication auth, HttpServletRequest request) {
        return service.transicionar(id, transicion, resolutorActor.resolver(auth, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Integer id, Authentication auth, HttpServletRequest request) {
        service.eliminar(id, resolutorActor.resolver(auth, request));
    }
}
```

### 3.10 Contrato de endpoints (para la matriz y para Fernando)

| # | Método | Ruta | Roles | Cuerpo | Éxito | Errores |
|---|---|---|---|---|---|---|
| 55 | GET | `/api/rfc?estado&impacto&tipo&texto` | ADM, TEC, PRA | — | 200 `CambioResumen[]` | 400 enum inválido, 403 |
| 55b 🆕 | GET | `/api/rfc/areas-seleccionables` | ADM, TEC, PRA | — | 200 `AreaAfectada[]` | 403 |
| 56 🆕 | GET | `/api/rfc/{id}` | ADM, TEC, PRA | — | 200 `CambioDetalle` | 404 |
| 57 | POST | `/api/rfc` | ADM, TEC, PRA | `CambioFormulario` | 201 + `Location` | 400 (validación / V4–V10 / V14) |
| 57b 🆕 | PUT | `/api/rfc/{id}` | ADM o solicitante | `CambioFormulario` | 200 | 400, 403, 404, 409 no editable / concurrencia |
| 57c 🆕 | PUT | `/api/rfc/{id}/decision` | según acción (§3.6.4) | `{ accion, observacion }` | 200 | 400 sin observación / sin horario, 403, 404, 409 transición inválida / V13 |
| 57d 🆕 | DELETE | `/api/rfc/{id}` | ADM o solicitante | — | 204 | 403, 404, 409 no es borrador |

Los mismos endpoints responden bajo `/api/solicitudes-cambio`.

---

## 4. Módulo 2 — Centro de Soluciones y Guías

**Propósito de negocio:** que la Lic. de Triaje resuelva sola el atasco de la impresora de pulseras a las 3 a. m. siguiendo pasos claros y con las precauciones **antes** de los pasos, y que el técnico N1 encuentre la guía interna correcta escribiendo "zebra pulsera" o "admision" sin tilde.

### 4.1 Decisión: extender `error_conocido`, no duplicarlo

`ErrorConocido` ya está enlazado a tickets (`ticket_error_conocido`) y el frontend ya consume `/api/conocimiento`. Se **amplía** la tabla con columnas nuevas *nullable* o con `DEFAULT`, y la respuesta conserva los campos antiguos (`idError`, `descripcionProblema`, `solucionTrabajo`, `publicado`, `fechaCreacion`) para que `mapearArticuloConocimiento` no se rompa.

| Concepto | Columna/campo existente | Nuevo | Semántica |
|---|---|---|---|
| Resumen | `descripcion_problema` | — | se expone también como `resumen` |
| Solución temporal | `solucion_trabajo` | — | se expone también como `solucionTemporal` y `contenidoHtml` (texto plano) |
| Vigencia | `publicado` | — | `false` = archivada (el DELETE archiva) |
| Ámbito | — | `ambito` | `PUBLICO_ASISTENCIAL` / `INTERNO_TECNICO`; `esPublico` se deriva |
| Categoría | — | `categoria` | enum de 5 valores con `id` 1–5 (los de Fernando) |
| Pasos / precauciones | — | tablas `guia_paso`, `guia_precaucion` | listas ordenadas |
| Otros | — | `sintoma`, `causa_raiz`, `palabras_clave`, `equipos_compatibles`, `nivel_dificultad`, `minutos_estimados`, `requiere_tecnico`, `conteo_util`, `conteo_no_util`, `conteo_visitas`, `id_autor`, `fecha_actualizacion`, `texto_busqueda` | |

> **Nota para Fernando:** `mapearArticuloConocimiento` hoy ignora `dto.pasos`, `dto.sintoma`, `dto.causaRaiz`, `dto.solucionTemporal`, `dto.precauciones`… y deriva los pasos partiendo `contenidoHtml` por saltos de línea. Debe leer esos campos cuando vengan (`dto.pasos ?? derivados`). Los `categoriaId` 1–5 quedan **confirmados** tal como están en `categorias-guia.ts`.

### 4.2 Enumeraciones

```java
package com.hospital.servicedesk.entities;

import lombok.Getter;

import java.util.Arrays;

@Getter
public enum CategoriaGuia {
    SISTEMA_CLINICO(1, "Sistema clínico (HIS)"),
    IMPRESORAS_TERMICAS(2, "Impresoras de etiquetas y térmicas"),
    REDES(3, "Redes y conectividad"),
    HARDWARE(4, "Hardware y periféricos"),
    SOFTWARE_ASISTENCIAL(5, "Software asistencial");

    private final int id;
    private final String etiqueta;

    CategoriaGuia(int id, String etiqueta) { this.id = id; this.etiqueta = etiqueta; }

    public static CategoriaGuia desdeId(Integer id) {
        return Arrays.stream(values()).filter(c -> id != null && c.id == id).findFirst()
                .orElseThrow(() -> new com.hospital.servicedesk.exceptions.ReglaNegocioException(
                        "categoriaId", "Seleccione una categoría válida."));
    }
}
```

```java
public enum AmbitoGuia { PUBLICO_ASISTENCIAL, INTERNO_TECNICO }

public enum NivelDificultad { BASICO, INTERMEDIO, AVANZADO }
```

### 4.3 Entidad ampliada y entidades nuevas

```java
package com.hospital.servicedesk.entities;

import com.hospital.servicedesk.compartido.persistencia.ListaCsvConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Guía del Centro de Soluciones. La tabla conserva su nombre histórico "error_conocido".
 * Se reemplaza @Data por @Getter/@Setter (colecciones lazy).
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "error_conocido")
public class ErrorConocido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_error")
    private Integer idError;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Column(name = "descripcion_problema", nullable = false, columnDefinition = "TEXT")
    private String descripcionProblema;                 // resumen

    @Column(name = "solucion_trabajo", nullable = false, columnDefinition = "TEXT")
    private String solucionTrabajo;                     // solución temporal (texto plano)

    @Builder.Default
    @Column(name = "publicado", nullable = false)
    private Boolean publicado = true;

    // ANTES: insertable = false (dependía del DEFAULT de SQL Server; falla en H2)
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    // ───────── Campos nuevos (V1_4) ─────────
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "categoria", nullable = false, length = 30)
    private CategoriaGuia categoria = CategoriaGuia.SOFTWARE_ASISTENCIAL;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "ambito", nullable = false, length = 30)
    private AmbitoGuia ambito = AmbitoGuia.INTERNO_TECNICO;

    @Column(name = "sintoma", length = 500)
    private String sintoma;

    @Column(name = "causa_raiz", length = 1000)
    private String causaRaiz;

    @Convert(converter = ListaCsvConverter.class)
    @Builder.Default
    @Column(name = "palabras_clave", length = 500)
    private List<String> palabrasClave = new ArrayList<>();

    @Convert(converter = ListaCsvConverter.class)
    @Builder.Default
    @Column(name = "equipos_compatibles", length = 500)
    private List<String> equiposCompatibles = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "guia_paso", joinColumns = @JoinColumn(name = "id_error"))
    @OrderColumn(name = "orden")
    @Column(name = "descripcion", nullable = false, length = 500)
    @BatchSize(size = 50)
    @Builder.Default
    private List<String> pasos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "guia_precaucion", joinColumns = @JoinColumn(name = "id_error"))
    @OrderColumn(name = "orden")
    @Column(name = "texto", nullable = false, length = 500)
    @BatchSize(size = 50)
    @Builder.Default
    private List<String> precauciones = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_dificultad", length = 20)
    private NivelDificultad nivelDificultad;

    @Column(name = "minutos_estimados")
    private Integer minutosEstimados;

    @Builder.Default
    @Column(name = "requiere_tecnico", nullable = false)
    private boolean requiereTecnico = false;

    @Builder.Default
    @Column(name = "conteo_util", nullable = false)
    private int conteoUtil = 0;

    @Builder.Default
    @Column(name = "conteo_no_util", nullable = false)
    private int conteoNoUtil = 0;

    @Builder.Default
    @Column(name = "conteo_visitas", nullable = false)
    private int conteoVisitas = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_autor")
    private Usuario autor;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "texto_busqueda", length = 4000)
    private String textoBusqueda;

    /** Recalcula la columna de búsqueda. El servicio lo llama antes de cada save. */
    public void recalcularTextoBusqueda() {
        this.textoBusqueda = com.hospital.servicedesk.compartido.util.NormalizadorBusqueda.componer(
                titulo, sintoma, descripcionProblema, causaRaiz,
                String.join(" ", palabrasClave), String.join(" ", equiposCompatibles));
    }

    public boolean esPublica() { return ambito == AmbitoGuia.PUBLICO_ASISTENCIAL; }
}
```

> Revisa `ErrorConocidoServiceImpl` y su test: al quitar `@Data` desaparecen `equals/hashCode/toString` generados; si algún test compara entidades con `assertEquals`, compáralo por `idError`.

```java
package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Un voto por persona y guía; puede cambiar de opinión (se actualiza). */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Entity
@Table(name = "guia_voto", uniqueConstraints = @UniqueConstraint(name = "UQ_guia_voto_usuario",
        columnNames = {"id_error", "id_usuario"}))
public class VotoGuia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_voto")
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_error", nullable = false)
    private ErrorConocido guia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario usuario;

    @Column(name = "es_util", nullable = false)
    private boolean esUtil;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;
}
```

**Convertidor CSV** (palabras clave y equipos viajan como lista JSON, se guardan como CSV para que la búsqueda no necesite *joins*):

```java
package com.hospital.servicedesk.compartido.persistencia;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Converter
public class ListaCsvConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> lista) {
        return lista == null || lista.isEmpty() ? null : String.join(",", lista);
    }

    @Override
    public List<String> convertToEntityAttribute(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return new ArrayList<>(Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    }
}
```

**Normalizador de búsqueda** (compartido por los Módulos 1 y 2):

```java
package com.hospital.servicedesk.compartido.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

/** Minúsculas + sin tildes + espacios colapsados. "Admisión  CENTRAL" → "admision central". */
public final class NormalizadorBusqueda {

    private static final Pattern DIACRITICOS = Pattern.compile("\\p{M}+");
    private static final Pattern NO_ALFANUMERICO = Pattern.compile("[^a-z0-9ñ\\- ]");

    private NormalizadorBusqueda() {}

    public static String normalizar(String texto) {
        if (texto == null) return "";
        String sinEnie = texto.replace('ñ', '\u0001').replace('Ñ', '\u0001');        // proteger la ñ
        String sinTildes = DIACRITICOS.matcher(Normalizer.normalize(sinEnie, Normalizer.Form.NFD)).replaceAll("");
        String minusculas = sinTildes.replace('\u0001', 'ñ').toLowerCase(Locale.ROOT);
        return NO_ALFANUMERICO.matcher(minusculas).replaceAll(" ").trim().replaceAll("\\s+", " ");
    }

    public static String componer(String... partes) {
        return normalizar(String.join(" ", Arrays.stream(partes).filter(Objects::nonNull).toList()));
    }

    /** Palabras de 2+ letras, sin repetir. */
    public static List<String> tokens(String consulta) {
        String n = normalizar(consulta);
        return n.isEmpty() ? List.of() : Arrays.stream(n.split(" ")).filter(t -> t.length() >= 2).distinct().toList();
    }
}
```

> Se protege la **ñ** porque en NFD se descompone en `n` + tilde combinada: sin esa protección "año" y "ano" serían iguales. En un hospital no es un detalle menor.

### 4.4 Repositorios y especificaciones

```java
package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ErrorConocidoRepository extends JpaRepository<ErrorConocido, Integer>,
        JpaSpecificationExecutor<ErrorConocido> {

    List<ErrorConocido> findByPublicadoTrue();          // existente — se conserva

    @Modifying
    @Query("update ErrorConocido e set e.conteoVisitas = e.conteoVisitas + 1 where e.idError = :id")
    int incrementarVisitas(@Param("id") Integer id);

    @Query("""
            select e.categoria, count(e) from ErrorConocido e
            where e.publicado = true and (:soloPublicas = false or e.ambito = :publico)
            group by e.categoria
            """)
    List<Object[]> contarPorCategoria(@Param("soloPublicas") boolean soloPublicas,
                                      @Param("publico") AmbitoGuia publico);
}
```

```java
public interface VotoGuiaRepository extends JpaRepository<VotoGuia, Integer> {
    Optional<VotoGuia> findByGuia_IdErrorAndUsuario_IdUsuario(Integer idGuia, Integer idUsuario);
    long countByGuia_IdErrorAndEsUtil(Integer idGuia, boolean esUtil);
}
```

```java
package com.hospital.servicedesk.administrativo.conocimiento.dominio;

import com.hospital.servicedesk.entities.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public final class EspecificacionesGuia {

    private EspecificacionesGuia() {}

    public static Specification<ErrorConocido> vigentes() {
        return (r, q, cb) -> cb.isTrue(r.get("publicado"));
    }

    public static Specification<ErrorConocido> deAmbito(AmbitoGuia ambito) {
        return ambito == null ? null : (r, q, cb) -> cb.equal(r.get("ambito"), ambito);
    }

    public static Specification<ErrorConocido> deCategoria(CategoriaGuia categoria) {
        return categoria == null ? null : (r, q, cb) -> cb.equal(r.get("categoria"), categoria);
    }

    /** AND: cada palabra debe aparecer en el texto normalizado. */
    public static Specification<ErrorConocido> contieneTodas(List<String> tokens) {
        return (r, q, cb) -> cb.and(tokens.stream()
                .map(t -> cb.like(r.get("textoBusqueda"), "%" + t + "%"))
                .toArray(jakarta.persistence.criteria.Predicate[]::new));
    }
}
```

> Los *tokens* ya vienen normalizados (solo `[a-z0-9ñ-]`), así que no pueden contener `%` ni `_`: no hay inyección de comodines en `LIKE`.

### 4.5 Puntuación de relevancia (pura)

Mismo algoritmo que Fernando aplica en el *mock* (§4.6.2 de su guía), para que el resultado sea idéntico con `usarMocks` en `true` o `false`.

```java
package com.hospital.servicedesk.administrativo.conocimiento.dominio;

import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.ErrorConocido;

import java.util.Comparator;
import java.util.List;

/** Título ×5, síntoma ×4, palabras clave ×3, equipos ×2, resumen ×1. */
public final class PuntuadorGuias {

    private PuntuadorGuias() {}

    public static int puntuar(ErrorConocido g, List<String> tokens) {
        String titulo = NormalizadorBusqueda.normalizar(g.getTitulo());
        String sintoma = NormalizadorBusqueda.normalizar(g.getSintoma());
        String claves = NormalizadorBusqueda.normalizar(String.join(" ", g.getPalabrasClave()));
        String equipos = NormalizadorBusqueda.normalizar(String.join(" ", g.getEquiposCompatibles()));
        String resumen = NormalizadorBusqueda.normalizar(g.getDescripcionProblema());
        int puntos = 0;
        for (String t : tokens) {
            if (titulo.contains(t))  puntos += 5;
            if (sintoma.contains(t)) puntos += 4;
            if (claves.contains(t))  puntos += 3;
            if (equipos.contains(t)) puntos += 2;
            if (resumen.contains(t)) puntos += 1;
        }
        return puntos;
    }

    /** Sin texto: por utilidad. Con texto: por puntos desc., luego utilidad desc., luego id asc. */
    public static List<ErrorConocido> ordenar(List<ErrorConocido> guias, List<String> tokens) {
        Comparator<ErrorConocido> porUtilidad = Comparator.comparingInt(ErrorConocido::getConteoUtil).reversed();
        Comparator<ErrorConocido> criterio = tokens.isEmpty() ? porUtilidad
                : Comparator.<ErrorConocido>comparingInt(g -> puntuar(g, tokens)).reversed().thenComparing(porUtilidad);
        return guias.stream().sorted(criterio.thenComparing(ErrorConocido::getIdError)).toList();
    }
}
```

### 4.6 DTOs

```java
package com.hospital.servicedesk.administrativo.conocimiento.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.hospital.servicedesk.entities.*;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;
import java.util.List;

public final class GuiaDTOs {

    private GuiaDTOs() {}

    /**
     * Acepta los nombres que ya envía ConocimientoHttp (descripcionProblema, solucionTrabajo,
     * contenidoHtml, publicado/esPublico, palabras clave como CSV) y los nuevos.
     */
    public record GuiaFormulario(
            @NotBlank(message = "Escriba el título de la guía.")
            @Size(min = 5, max = 150, message = "El título debe tener entre 5 y 150 caracteres.") String titulo,

            @NotBlank(message = "Escriba un resumen breve.")
            @JsonAlias("descripcionProblema")
            @Size(max = 2000) String resumen,

            @Size(max = 500) String sintoma,
            @Size(max = 1000) String causaRaiz,

            @NotBlank(message = "Describa la solución.")
            @JsonAlias({"solucionTrabajo", "contenidoHtml"})
            @Size(max = 8000) String solucionTemporal,

            @NotNull(message = "Seleccione una categoría.") Integer categoriaId,

            AmbitoGuia ambito,
            @JsonAlias("publicado") Boolean esPublico,

            @Size(max = 30, message = "Una guía admite hasta 30 pasos.")
            List<@NotBlank @Size(max = 500) String> pasos,

            @Size(max = 10, message = "Una guía admite hasta 10 precauciones.")
            List<@NotBlank @Size(max = 500) String> precauciones,

            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<@Size(max = 400) String> palabrasClave,

            @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
            List<@Size(max = 400) String> equiposCompatibles,

            NivelDificultad nivelDificultad,
            @Positive @Max(480) Integer minutosEstimados,
            Boolean requiereTecnico) {}

    public record VotoGuiaSolicitud(@NotNull(message = "Indique si la guía le fue útil.") Boolean esUtil) {}

    /** Superconjunto de ArticuloConocimiento + campos legados que lee el mapper actual del frontend. */
    public record GuiaRespuesta(
            Integer id,
            String titulo,
            String resumen,
            String contenidoHtml,
            Integer categoriaId,
            String categoriaNombre,
            List<String> palabrasClave,
            List<String> equiposCompatibles,
            boolean esPublico,
            AmbitoGuia ambito,
            int conteoUtil,
            int conteoVisitas,
            LocalDateTime fechaActualizacion,
            String sintoma,
            String causaRaiz,
            String solucionTemporal,
            List<String> pasos,
            List<String> precauciones,
            NivelDificultad nivelDificultad,
            Integer minutosEstimados,
            boolean requiereTecnico,
            String autorNombre,
            // ── legados (retrocompatibilidad con mapearArticuloConocimiento) ──
            Integer idError,
            String descripcionProblema,
            String solucionTrabajo,
            boolean publicado,
            LocalDateTime fechaCreacion) {}

    public record ConteoCategoriaRespuesta(int id, String clave, String etiqueta, long total) {}
}
```

### 4.7 Servicio

```java
package com.hospital.servicedesk.administrativo.conocimiento.aplicacion;

import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;

import java.util.List;

public interface GuiaSolucionService {
    PaginaRespuesta<GuiaRespuesta> buscar(String texto, Integer categoriaId, AmbitoGuia ambito,
                                          boolean soloPublicas, int pagina, int tamano, ContextoActor ctx);
    List<GuiaRespuesta> destacadas(int limite, ContextoActor ctx);
    GuiaRespuesta obtener(Integer id, ContextoActor ctx);
    List<ConteoCategoriaRespuesta> contarPorCategoria(ContextoActor ctx);
    GuiaRespuesta crear(GuiaFormulario f, ContextoActor ctx);
    GuiaRespuesta actualizar(Integer id, GuiaFormulario f, ContextoActor ctx);
    void archivar(Integer id, ContextoActor ctx);
    GuiaRespuesta votar(Integer id, boolean esUtil, ContextoActor ctx);
    void registrarVisita(Integer id, ContextoActor ctx);
}
```

```java
package com.hospital.servicedesk.administrativo.conocimiento.aplicacion.impl;

import com.hospital.servicedesk.administrativo.conocimiento.aplicacion.GuiaSolucionService;
import com.hospital.servicedesk.administrativo.conocimiento.dominio.EspecificacionesGuia;
import com.hospital.servicedesk.administrativo.conocimiento.dominio.PuntuadorGuias;
import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.administrativo.conocimiento.mapper.GuiaMapper;
import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.RecursoNoEncontradoException;
import com.hospital.servicedesk.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class GuiaSolucionServiceImpl implements GuiaSolucionService {

    /** Tope de candidatos que se puntúan en memoria. Volumen esperado < 500 guías. */
    static final int MAX_CANDIDATOS = 300;
    static final int MAX_TAMANO_PAGINA = 50;
    private static final Pattern ETIQUETAS_HTML = Pattern.compile("<[^>]*>");

    private final ErrorConocidoRepository repository;
    private final VotoGuiaRepository votoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    public PaginaRespuesta<GuiaRespuesta> buscar(String texto, Integer categoriaId, AmbitoGuia ambito,
                                                 boolean soloPublicas, int pagina, int tamano, ContextoActor ctx) {
        List<String> tokens = NormalizadorBusqueda.tokens(texto == null ? null : texto.substring(0, Math.min(texto.length(), 100)));
        AmbitoGuia ambitoEfectivo = ambitoVisible(ambito, soloPublicas, ctx);
        CategoriaGuia categoria = categoriaId == null ? null : CategoriaGuia.desdeId(categoriaId);

        Specification<ErrorConocido> spec = combinar(
                EspecificacionesGuia.vigentes(),
                EspecificacionesGuia.deAmbito(ambitoEfectivo),
                EspecificacionesGuia.deCategoria(categoria),
                tokens.isEmpty() ? null : EspecificacionesGuia.contieneTodas(tokens));

        List<ErrorConocido> candidatos = repository.findAll(spec,
                PageRequest.of(0, MAX_CANDIDATOS, Sort.by(Sort.Direction.DESC, "conteoUtil"))).getContent();
        List<ErrorConocido> ordenados = PuntuadorGuias.ordenar(candidatos, tokens);

        int tam = Math.clamp(tamano, 1, MAX_TAMANO_PAGINA);
        int pag = Math.max(pagina, 0);
        int desde = Math.min(pag * tam, ordenados.size());
        int hasta = Math.min(desde + tam, ordenados.size());
        int totalPaginas = (int) Math.ceil((double) ordenados.size() / tam);

        return new PaginaRespuesta<>(
                ordenados.subList(desde, hasta).stream().map(GuiaMapper::aRespuesta).toList(),
                pag, tam, ordenados.size(), totalPaginas, pag == 0, pag >= totalPaginas - 1);
    }

    @Override
    @Transactional(readOnly = true)
    public List<GuiaRespuesta> destacadas(int limite, ContextoActor ctx) {
        Specification<ErrorConocido> spec = combinar(
                EspecificacionesGuia.vigentes(), EspecificacionesGuia.deAmbito(ambitoVisible(null, false, ctx)));
        return repository.findAll(spec, PageRequest.of(0, Math.clamp(limite, 1, 12),
                        Sort.by(Sort.Direction.DESC, "conteoUtil", "conteoVisitas")))
                .map(GuiaMapper::aRespuesta).getContent();
    }

    @Override
    @Transactional(readOnly = true)
    public GuiaRespuesta obtener(Integer id, ContextoActor ctx) {
        return GuiaMapper.aRespuesta(buscarVisible(id, ctx));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConteoCategoriaRespuesta> contarPorCategoria(ContextoActor ctx) {
        Map<CategoriaGuia, Long> conteo = new EnumMap<>(CategoriaGuia.class);
        for (Object[] fila : repository.contarPorCategoria(!ctx.esPersonalTecnico(), AmbitoGuia.PUBLICO_ASISTENCIAL)) {
            conteo.put((CategoriaGuia) fila[0], (Long) fila[1]);
        }
        return Arrays.stream(CategoriaGuia.values())
                .map(c -> new ConteoCategoriaRespuesta(c.getId(), c.name(), c.getEtiqueta(), conteo.getOrDefault(c, 0L)))
                .toList();
    }

    @Override
    @Transactional
    public GuiaRespuesta crear(GuiaFormulario f, ContextoActor ctx) {
        LocalDateTime ahora = LocalDateTime.now(clock);
        ErrorConocido g = new ErrorConocido();
        g.setPublicado(true);
        g.setFechaCreacion(ahora);
        g.setAutor(usuario(ctx));
        aplicar(g, f, ahora);
        return GuiaMapper.aRespuesta(repository.save(g));
    }

    @Override
    @Transactional
    public GuiaRespuesta actualizar(Integer id, GuiaFormulario f, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Guía", id));
        aplicar(g, f, LocalDateTime.now(clock));
        return GuiaMapper.aRespuesta(g);
    }

    @Override
    @Transactional
    public void archivar(Integer id, ContextoActor ctx) {
        ErrorConocido g = repository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Guía", id));
        g.setPublicado(false);
        g.setFechaActualizacion(LocalDateTime.now(clock));
    }

    @Override
    @Transactional
    public GuiaRespuesta votar(Integer id, boolean esUtil, ContextoActor ctx) {
        ErrorConocido g = buscarVisible(id, ctx);
        Usuario u = usuario(ctx);
        VotoGuia voto = votoRepository.findByGuia_IdErrorAndUsuario_IdUsuario(id, u.getIdUsuario())
                .orElseGet(() -> VotoGuia.builder().guia(g).usuario(u).build());
        voto.setEsUtil(esUtil);
        voto.setFecha(LocalDateTime.now(clock));
        votoRepository.saveAndFlush(voto);
        // Recuento (no incremento): idempotente aunque el usuario vote dos veces lo mismo.
        g.setConteoUtil((int) votoRepository.countByGuia_IdErrorAndEsUtil(id, true));
        g.setConteoNoUtil((int) votoRepository.countByGuia_IdErrorAndEsUtil(id, false));
        return GuiaMapper.aRespuesta(g);
    }

    @Override
    @Transactional
    public void registrarVisita(Integer id, ContextoActor ctx) {
        buscarVisible(id, ctx);
        repository.incrementarVisitas(id);
    }

    // ───────── internos ─────────

    /** AND de las especificaciones no nulas (los filtros opcionales devuelven null). */
    @SafeVarargs
    private static Specification<ErrorConocido> combinar(Specification<ErrorConocido>... partes) {
        return Specification.allOf(Arrays.stream(partes).filter(Objects::nonNull).toList());
    }

    /** USUARIO_FINAL: siempre y solo PUBLICO_ASISTENCIAL, ignore lo que pida. */
    private AmbitoGuia ambitoVisible(AmbitoGuia solicitado, boolean soloPublicas, ContextoActor ctx) {
        if (!ctx.esPersonalTecnico() || soloPublicas) return AmbitoGuia.PUBLICO_ASISTENCIAL;
        return solicitado;
    }

    /** Inexistente, archivada o interna para personal asistencial ⇒ 404 (no se revela su existencia). */
    private ErrorConocido buscarVisible(Integer id, ContextoActor ctx) {
        return repository.findById(id)
                .filter(g -> ctx.esPersonalTecnico() || (g.getPublicado() && g.esPublica()))
                .filter(g -> g.getPublicado() || ctx.esAdministrador())
                .orElseThrow(() -> new RecursoNoEncontradoException("Guía", id));
    }

    private void aplicar(ErrorConocido g, GuiaFormulario f, LocalDateTime ahora) {
        String solucion = textoPlano(f.solucionTemporal());
        g.setTitulo(f.titulo().trim());
        g.setDescripcionProblema(textoPlano(f.resumen()));
        g.setSolucionTrabajo(solucion);
        g.setSintoma(vacioANulo(f.sintoma()));
        g.setCausaRaiz(vacioANulo(f.causaRaiz()));
        g.setCategoria(CategoriaGuia.desdeId(f.categoriaId()));
        g.setAmbito(f.ambito() != null ? f.ambito()
                : Boolean.TRUE.equals(f.esPublico()) ? AmbitoGuia.PUBLICO_ASISTENCIAL : AmbitoGuia.INTERNO_TECNICO);
        g.setNivelDificultad(f.nivelDificultad());
        g.setMinutosEstimados(f.minutosEstimados());
        g.setRequiereTecnico(Boolean.TRUE.equals(f.requiereTecnico()));

        List<String> pasos = limpiar(f.pasos());
        if (pasos.isEmpty()) {                                // compatibilidad: el editor actual no envía pasos
            pasos = Arrays.stream(solucion.split("\\R")).map(String::trim).filter(s -> !s.isEmpty()).limit(30).toList();
        }
        reemplazar(g.getPasos(), pasos);
        reemplazar(g.getPrecauciones(), limpiar(f.precauciones()));
        reemplazar(g.getPalabrasClave(), separarCsv(f.palabrasClave()));
        reemplazar(g.getEquiposCompatibles(), separarCsv(f.equiposCompatibles()));

        g.setFechaActualizacion(ahora);
        g.recalcularTextoBusqueda();
    }

    /** Defensa en profundidad: no se almacena HTML. Angular igual escapa las interpolaciones. */
    private static String textoPlano(String s) {
        return s == null ? null : ETIQUETAS_HTML.matcher(s).replaceAll("").trim();
    }

    /** ["impresora, zebra", "pulsera"] → [impresora, zebra, pulsera] (el frontend envía CSV). */
    private static List<String> separarCsv(List<String> valores) {
        if (valores == null) return List.of();
        return valores.stream().filter(Objects::nonNull)
                .flatMap(v -> Arrays.stream(v.split(",")))
                .map(String::trim).filter(v -> !v.isEmpty()).distinct().limit(20).toList();
    }

    private static List<String> limpiar(List<String> v) {
        return v == null ? List.of() : v.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static <T> void reemplazar(List<T> destino, List<T> origen) { destino.clear(); destino.addAll(origen); }

    private static String vacioANulo(String v) { return v == null || v.isBlank() ? null : v.trim(); }

    private Usuario usuario(ContextoActor ctx) {
        return usuarioRepository.findByCorreoIgnoreCase(ctx.correo())
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario", ctx.correo()));
    }
}
```

> `Math.clamp` es Java 21. `combinar(...)` descarta los filtros `null` antes de `Specification.allOf(Iterable)`, para no depender de cómo trate los nulos cada versión de Spring Data.

**Mapper:**

```java
package com.hospital.servicedesk.administrativo.conocimiento.mapper;

import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.GuiaRespuesta;
import com.hospital.servicedesk.entities.ErrorConocido;

import java.util.List;

public final class GuiaMapper {
    private GuiaMapper() {}

    public static GuiaRespuesta aRespuesta(ErrorConocido g) {
        return new GuiaRespuesta(
                g.getIdError(), g.getTitulo(), g.getDescripcionProblema(), g.getSolucionTrabajo(),
                g.getCategoria().getId(), g.getCategoria().getEtiqueta(),
                List.copyOf(g.getPalabrasClave()), List.copyOf(g.getEquiposCompatibles()),
                g.esPublica(), g.getAmbito(), g.getConteoUtil(), g.getConteoVisitas(),
                g.getFechaActualizacion() != null ? g.getFechaActualizacion() : g.getFechaCreacion(),
                g.getSintoma() != null ? g.getSintoma() : g.getDescripcionProblema(),
                g.getCausaRaiz(), g.getSolucionTrabajo(),
                List.copyOf(g.getPasos()), List.copyOf(g.getPrecauciones()),
                g.getNivelDificultad(), g.getMinutosEstimados(), g.isRequiereTecnico(),
                g.getAutor() == null ? null : g.getAutor().getNombreVisible(),
                g.getIdError(), g.getDescripcionProblema(), g.getSolucionTrabajo(),
                Boolean.TRUE.equals(g.getPublicado()), g.getFechaCreacion());
    }
}
```

### 4.8 Controlador (reemplaza a `ErrorConocidoController`)

Mueve el controlador existente a `administrativo/conocimiento/api/GuiaSolucionController.java` **conservando las dos rutas**. Elimina `ErrorConocidoController`, `ErrorConocidoService(Impl)` y `ErrorConocidoDTOs` cuando el nuevo esté verde; adapta `ErrorConocidoServiceTest` (o reemplázalo por `GuiaSolucionServiceImplTest`). Busca antes otros usos con `grep -rn "ErrorConocidoService" src/`.

```java
package com.hospital.servicedesk.administrativo.conocimiento.api;

import com.hospital.servicedesk.administrativo.conocimiento.aplicacion.GuiaSolucionService;
import com.hospital.servicedesk.administrativo.conocimiento.dto.GuiaDTOs.*;
import com.hospital.servicedesk.compartido.auditoria.ResolutorContextoActor;
import com.hospital.servicedesk.dtos.PaginaRespuesta;
import com.hospital.servicedesk.entities.AmbitoGuia;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping({"/api/conocimiento", "/api/kedb"})
@PreAuthorize("isAuthenticated()")
@RequiredArgsConstructor
public class GuiaSolucionController {

    private final GuiaSolucionService service;
    private final ResolutorContextoActor resolutorActor;

    /** `publicado=true` es el nombre que ya envía ConocimientoHttp para "solo públicas". */
    @GetMapping
    public PaginaRespuesta<GuiaRespuesta> buscar(@RequestParam(required = false) String texto,
                                                 @RequestParam(required = false) Integer categoriaId,
                                                 @RequestParam(required = false) AmbitoGuia ambito,
                                                 @RequestParam(name = "publicado", defaultValue = "false") boolean soloPublicas,
                                                 @RequestParam(defaultValue = "0") int pagina,
                                                 @RequestParam(defaultValue = "20") int tamano,
                                                 Authentication auth, HttpServletRequest req) {
        return service.buscar(texto, categoriaId, ambito, soloPublicas, pagina, tamano, resolutorActor.resolver(auth, req));
    }

    @GetMapping("/destacados")
    public List<GuiaRespuesta> destacados(@RequestParam(defaultValue = "6") int limite,
                                          Authentication auth, HttpServletRequest req) {
        return service.destacadas(limite, resolutorActor.resolver(auth, req));
    }

    @GetMapping("/categorias")
    public List<ConteoCategoriaRespuesta> categorias(Authentication auth, HttpServletRequest req) {
        return service.contarPorCategoria(resolutorActor.resolver(auth, req));
    }

    @GetMapping("/{id}")
    public GuiaRespuesta obtener(@PathVariable Integer id, Authentication auth, HttpServletRequest req) {
        return service.obtener(id, resolutorActor.resolver(auth, req));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO')")
    public ResponseEntity<GuiaRespuesta> crear(@Valid @RequestBody GuiaFormulario f,
                                               Authentication auth, HttpServletRequest req) {
        GuiaRespuesta creada = service.crear(f, resolutorActor.resolver(auth, req));
        return ResponseEntity.created(URI.create("/api/conocimiento/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMINISTRADOR', 'TECNICO')")
    public GuiaRespuesta actualizar(@PathVariable Integer id, @Valid @RequestBody GuiaFormulario f,
                                    Authentication auth, HttpServletRequest req) {
        return service.actualizar(id, f, resolutorActor.resolver(auth, req));
    }

    /** Archiva (publicado = false); no borra: la guía puede estar vinculada a tickets resueltos. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archivar(@PathVariable Integer id, Authentication auth, HttpServletRequest req) {
        service.archivar(id, resolutorActor.resolver(auth, req));
    }

    @PostMapping("/{id}/voto")
    public GuiaRespuesta votar(@PathVariable Integer id, @Valid @RequestBody VotoGuiaSolicitud voto,
                               Authentication auth, HttpServletRequest req) {
        return service.votar(id, voto.esUtil(), resolutorActor.resolver(auth, req));
    }

    @PostMapping("/{id}/visita")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void visita(@PathVariable Integer id, Authentication auth, HttpServletRequest req) {
        service.registrarVisita(id, resolutorActor.resolver(auth, req));
    }
}
```

| Método | Ruta | Roles | Respuesta | Notas |
|---|---|---|---|---|
| GET | `/api/conocimiento?texto&categoriaId&ambito&publicado&pagina&tamano` | todos | 200 `PaginaRespuesta<Guia>` | `USUARIO_FINAL` ⇒ solo públicas, ignore `ambito` |
| GET | `/api/conocimiento/destacados?limite=6` | todos | 200 `Guia[]` | por utilidad y visitas |
| GET 🆕 | `/api/conocimiento/categorias` | todos | 200 `[{id, clave, etiqueta, total}]` | opcional para los chips |
| GET | `/api/conocimiento/{id}` | todos | 200 / 404 | interna o archivada para asistencial ⇒ 404 |
| POST | `/api/conocimiento` | ADM, TEC | 201 + `Location` | 400 validación |
| PUT | `/api/conocimiento/{id}` | ADM, TEC | 200 | |
| DELETE | `/api/conocimiento/{id}` | ADM | 204 | archiva |
| POST | `/api/conocimiento/{id}/voto` | todos | 200 `Guia` | un voto por persona, modificable |
| POST 🆕 | `/api/conocimiento/{id}/visita` | todos | 204 | el detalle de Fernando debe llamarlo al abrir la guía |

**Debounce:** lo hace el frontend (300 ms en `app-barra-filtros`). El backend se protege igual: recorta la consulta a 100 caracteres, ignora palabras de < 2 letras y puntúa como máximo 300 candidatos.

### 4.9 Evolución futura: Full‑Text Search

Cuando haya > 2 000 guías o se quiera búsqueda por raíz ("imprimir" ↔ "impresora"): imagen `mssql/server` con el paquete `mssql-server-fts`, `CREATE FULLTEXT CATALOG` + índice sobre `texto_busqueda` con `LANGUAGE 3082` (español) y `CONTAINSTABLE` en una consulta nativa con perfil `sqlserver`. No forma parte de este PR.

---

## 5. Módulo 3 — Monitor de Compromisos de Atención en segundo plano

**Propósito de negocio:** que nadie descubra a las 11:05 que el ticket P1 de la impresora de pulseras de Emergencia venció a las 11:00. El sistema avisa **antes** (al 70 %) y **cuando vence**, deja constancia en el historial y no hace esperar a nadie mientras manda correos.

### 5.1 Arquitectura

```
@Scheduled (cada 60 s)            POST /api/admin/compromisos-atencion/evaluar (manual / pruebas)
        │                                   │
        └──────────────┬────────────────────┘
                       ▼
     EvaluadorCompromisosAtencion.ejecutarCiclo()      ← ReentrantLock: nunca dos ciclos a la vez
        │  1. ids de tickets activos (keyset, lotes de 200)
        │  2. por cada id → TransactionTemplate (1 transacción por ticket)
        │       a. CalculadoraCompromisoAtencion.evaluar(creación, límite, ahora)   ← pura
        │       b. si empeora: UPDATE condicional (… where estado_sla = :anterior) ← idempotente
        │       c. AuditoriaTicketService.registrar(actor = sistema)
        │       d. publishEvent(CompromisoAtencionCambiadoEvento)
        ▼
  @TransactionalEventListener(AFTER_COMMIT) + @Async("ejecutorNotificaciones")
     NotificadorCompromisosAtencion  → CorreoService.enviarAlerta(...)   (P1 / P2)
```

**Decisiones clave:**

1. **Una transacción por ticket**: si un ticket tiene datos corruptos, los otros 199 se procesan igual.
2. **`UPDATE` condicional** en vez de `save()`: si el técnico resuelve el ticket justo en ese segundo, el `UPDATE ... where estado in (:activos) and estado_sla = :anterior` afecta 0 filas y no se notifica nada. No hace falta añadir `@Version` a `Ticket`.
3. **Solo avanza** (en tiempo → en riesgo → vencido): el monitor nunca "mejora" un estado; eso lo hace `TicketService` si se cambia la prioridad.
4. **`AFTER_COMMIT` + `@Async`**: el correo sale solo si el cambio se confirmó, y en otro hilo.
5. **El evento lleva una "foto"** (asunto, área, correo del técnico) — el hilo asíncrono no toca entidades *lazy*.

### 5.2 Configuración

`application.properties` (principal):

```properties
# ===================================================================
# COMPROMISOS DE ATENCIÓN (monitor en segundo plano)
# ===================================================================
servicedesk.zona-horaria=America/Lima
servicedesk.compromisos.monitor-habilitado=${COMPROMISOS_MONITOR_HABILITADO:true}
servicedesk.compromisos.intervalo-ms=${COMPROMISOS_INTERVALO_MS:60000}
servicedesk.compromisos.retraso-inicial-ms=30000
servicedesk.compromisos.umbral-riesgo=0.70
servicedesk.compromisos.tamano-lote=200
servicedesk.compromisos.correos-supervision=${COMPROMISOS_CORREOS_SUPERVISION:}
```

`src/test/resources/application.properties` (**agregar**, para que el *scheduler* no interfiera con los tests):

```properties
servicedesk.compromisos.monitor-habilitado=false
servicedesk.semillas.personal.habilitado=false
```

```java
package com.hospital.servicedesk.operaciones.compromisos.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties(prefix = "servicedesk.compromisos")
public record PropiedadesCompromisoAtencion(
        @DefaultValue("true") boolean monitorHabilitado,
        @DefaultValue("60000") long intervaloMs,
        @DefaultValue("0.70") double umbralRiesgo,
        @DefaultValue("200") int tamanoLote,
        @DefaultValue List<String> correosSupervision) {

    public PropiedadesCompromisoAtencion {
        if (umbralRiesgo <= 0 || umbralRiesgo >= 1) {
            throw new IllegalArgumentException("servicedesk.compromisos.umbral-riesgo debe estar entre 0 y 1");
        }
        correosSupervision = correosSupervision == null ? List.of()
                : correosSupervision.stream().filter(c -> c != null && !c.isBlank()).map(String::trim).toList();
    }
}
```

Registra la clase en `ApplicationConfig`: `@EnableConfigurationProperties({PropiedadesRed.class, PropiedadesCompromisoAtencion.class})`.

```java
package com.hospital.servicedesk.operaciones.compromisos.config;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Map;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Slf4j
@Configuration
@EnableAsync
@EnableScheduling
public class ConfiguracionTareasSegundoPlano implements AsyncConfigurer {

    public static final String EJECUTOR_NOTIFICACIONES = "ejecutorNotificaciones";

    @Bean(name = EJECUTOR_NOTIFICACIONES)
    public ThreadPoolTaskExecutor ejecutorNotificaciones() {
        ThreadPoolTaskExecutor ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(2);
        ex.setMaxPoolSize(4);
        ex.setQueueCapacity(200);
        ex.setThreadNamePrefix("hsmsi-notif-");
        ex.setTaskDecorator(propagarMdc());
        // Cola llena ⇒ se ejecuta en el hilo que publica: degrada, pero no pierde alertas P1.
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setWaitForTasksToCompleteOnShutdown(true);
        ex.setAwaitTerminationSeconds(20);
        ex.initialize();
        return ex;
    }

    @Override
    public Executor getAsyncExecutor() { return ejecutorNotificaciones(); }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (error, metodo, params) ->
                log.error("Fallo en tarea asíncrona {}: {}", metodo.getName(), error.getMessage(), error);
    }

    /** Copia el correlationId del hilo que publica al hilo que notifica (trazabilidad en logs). */
    private static TaskDecorator propagarMdc() {
        return tarea -> {
            Map<String, String> contexto = MDC.getCopyOfContextMap();
            return () -> {
                if (contexto != null) MDC.setContextMap(contexto);
                try { tarea.run(); } finally { MDC.clear(); }
            };
        };
    }
}
```

### 5.3 Cálculo del plazo al crear el ticket (corrección)

Hoy: `LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8)`. Debe salir de `configuracion_sla` (sembrada en V1_5) con respaldo a los valores por defecto que ya muestra `SlaConfiguracionController` (P1 60 min, P2 120, P3 480, P4 1440).

```java
package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.ConfiguracionSlaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PoliticaCompromisoAtencion {

    static final Map<Prioridad, Integer> MINUTOS_POR_DEFECTO = Map.of(
            Prioridad.CRITICA, 60, Prioridad.ALTA, 120, Prioridad.MEDIA, 480, Prioridad.BAJA, 1440);

    private final ConfiguracionSlaRepository configuracionRepository;

    public LocalDateTime calcularLimite(LocalDateTime creacion, Impacto impacto, Urgencia urgencia, Prioridad prioridad) {
        int minutos = configuracionRepository.findByImpactoAndUrgencia(impacto.name(), urgencia.name())
                .map(ConfiguracionSLA::getMinutosResolucion)
                .filter(m -> m != null && m > 0)
                .orElse(MINUTOS_POR_DEFECTO.get(prioridad));
        return creacion.plusMinutes(minutos);
    }

    public static String etiquetaPrioridad(Prioridad p) {
        return switch (p) {
            case CRITICA -> "P1 · Crítica";
            case ALTA -> "P2 · Alta";
            case MEDIA -> "P3 · Media";
            case BAJA -> "P4 · Baja";
        };
    }
}
```

En `TicketServiceImpl.createTicket` (y en el segundo flujo de creación, ~línea 492):

```java
LocalDateTime ahora = LocalDateTime.now(clock);
// ...
.fechaCreacion(ahora)
.fechaLimiteResolucion(politicaCompromiso.calcularLimite(ahora, req.getImpacto(), req.getUrgencia(), pri))
.estadoSla(EstadoSLA.DENTRO_TIEMPO)
// ... después de save:
if (pri == Prioridad.CRITICA) {
    eventos.publishEvent(TicketCriticoRegistradoEvento.desde(guardado));
}
```

> Adapta los nombres de getters a los reales de `CreateTicketRequest`. Si se cambia la prioridad de un ticket (reasignación/escalamiento), recalcula `fechaLimiteResolucion` y reinicia `estadoSla` a `DENTRO_TIEMPO` **en el mismo `TicketService`**, con su registro de auditoría.

### 5.4 Calculadora pura

```java
package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.EstadoSLA;

import java.time.Duration;
import java.time.LocalDateTime;

public final class CalculadoraCompromisoAtencion {

    private CalculadoraCompromisoAtencion() {}

    public record EvaluacionCompromiso(EstadoSLA estado, double fraccionConsumida, Duration restante) {}

    /**
     * fracción = transcurrido / plazo total.
     *   < umbral        → DENTRO_TIEMPO
     *   [umbral, 1.0)   → POR_VENCER   ("en riesgo")
     *   ≥ 1.0           → VENCIDO
     */
    public static EvaluacionCompromiso evaluar(LocalDateTime inicio, LocalDateTime limite,
                                               LocalDateTime ahora, double umbralRiesgo) {
        long total = Math.max(Duration.between(inicio, limite).toSeconds(), 1);   // plazo mal configurado ⇒ 1 s
        long transcurrido = Math.max(Duration.between(inicio, ahora).toSeconds(), 0);
        double fraccion = (double) transcurrido / total;

        EstadoSLA estado = !ahora.isBefore(limite) ? EstadoSLA.VENCIDO
                : fraccion >= umbralRiesgo ? EstadoSLA.POR_VENCER
                : EstadoSLA.DENTRO_TIEMPO;
        return new EvaluacionCompromiso(estado, fraccion, Duration.between(ahora, limite));
    }

    /** DENTRO_TIEMPO < POR_VENCER < VENCIDO */
    public static boolean esMasGrave(EstadoSLA nuevo, EstadoSLA actual) {
        return nuevo.ordinal() > actual.ordinal();
    }
}
```

> `esMasGrave` depende del **orden de declaración** de `EstadoSLA` (`DENTRO_TIEMPO, POR_VENCER, VENCIDO`). Está cubierto por un test (§7.2) para que nadie lo reordene sin darse cuenta.

### 5.5 Repositorio: consultas del monitor

```java
// repositories/TicketRepository.java — AGREGAR

@Query("""
        select t.idTicket from Ticket t
        where t.estado in :activos
          and t.fechaLimiteResolucion is not null
          and (t.estadoSla is null or t.estadoSla <> :vencido)
          and t.idTicket > :despuesDe
        order by t.idTicket asc
        """)
List<Integer> idsParaMonitoreo(@Param("activos") Collection<EstadoTicket> activos,
                               @Param("vencido") EstadoSLA vencido,
                               @Param("despuesDe") Integer despuesDe,
                               Pageable lote);

@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("""
        update Ticket t set t.estadoSla = :nuevo
        where t.idTicket = :id and t.estadoSla = :anterior and t.estado in :activos
        """)
int avanzarEstadoCompromiso(@Param("id") Integer id,
                            @Param("anterior") EstadoSLA anterior,
                            @Param("nuevo") EstadoSLA nuevo,
                            @Param("activos") Collection<EstadoTicket> activos);

@EntityGraph(attributePaths = {"area", "tecnicoAsignado"})
Optional<Ticket> findConAreaYTecnicoByIdTicket(Integer idTicket);
```

> Paginación por *keyset* (`idTicket > :despuesDe`), no por `OFFSET`: los tickets que no cambian siguen cumpliendo el filtro, y con `OFFSET` los del final nunca se evaluarían si hay más de un lote. V1_5 normaliza los `estado_sla` nulos a `DENTRO_TIEMPO`, por eso el `UPDATE` puede comparar por igualdad.

### 5.6 Evaluador, programador y endpoint administrativo

```java
package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.*;

import java.time.LocalDateTime;

public record CompromisoAtencionCambiadoEvento(
        Integer idTicket, String asunto, Prioridad prioridad, EstadoSLA estadoAnterior, EstadoSLA estadoNuevo,
        LocalDateTime fechaLimite, String areaNombre, String correoTecnico, String nombreTecnico) {

    public static CompromisoAtencionCambiadoEvento desde(Ticket t, EstadoSLA anterior, EstadoSLA nuevo) {
        Usuario tec = t.getTecnicoAsignado();
        return new CompromisoAtencionCambiadoEvento(t.getIdTicket(), t.getAsunto(), t.getPrioridad(), anterior, nuevo,
                t.getFechaLimiteResolucion(), t.getArea().getNombre(),
                tec == null ? null : tec.getCorreo(), tec == null ? null : tec.getNombreVisible());
    }
}
```

```java
package com.hospital.servicedesk.operaciones.compromisos.eventos;

import com.hospital.servicedesk.entities.Ticket;

public record TicketCriticoRegistradoEvento(Integer idTicket, String asunto, String areaNombre, String ipOrigen) {
    public static TicketCriticoRegistradoEvento desde(Ticket t) {
        return new TicketCriticoRegistradoEvento(t.getIdTicket(), t.getAsunto(), t.getArea().getNombre(), t.getIpOrigen());
    }
}
```

```java
package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import java.time.Duration;
import java.time.LocalDateTime;

public record ResumenCicloMonitor(LocalDateTime inicio, Duration duracion, int evaluados,
                                  int pasaronARiesgo, int vencieron, int errores) {}
```

```java
package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.CalculadoraCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.CalculadoraCompromisoAtencion.EvaluacionCompromiso;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.TicketRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class EvaluadorCompromisosAtencion {

    static final Set<EstadoTicket> ACTIVOS = EnumSet.of(EstadoTicket.ABIERTO, EstadoTicket.EN_PROGRESO, EstadoTicket.ESCALADO);

    enum Resultado { SIN_CAMBIO, EN_RIESGO, VENCIDO }

    private final TicketRepository ticketRepository;
    private final AuditoriaTicketService auditoria;
    private final ApplicationEventPublisher eventos;
    private final PropiedadesCompromisoAtencion propiedades;
    private final TransactionTemplate transaccion;
    private final Clock clock;

    private final ReentrantLock enCurso = new ReentrantLock();
    private final AtomicReference<ResumenCicloMonitor> ultimoCiclo = new AtomicReference<>();

    public EvaluadorCompromisosAtencion(TicketRepository ticketRepository, AuditoriaTicketService auditoria,
                                        ApplicationEventPublisher eventos, PropiedadesCompromisoAtencion propiedades,
                                        PlatformTransactionManager txManager, Clock clock) {
        this.ticketRepository = ticketRepository;
        this.auditoria = auditoria;
        this.eventos = eventos;
        this.propiedades = propiedades;
        this.transaccion = new TransactionTemplate(txManager);
        this.clock = clock;
    }

    public ResumenCicloMonitor ejecutarCiclo() {
        if (!enCurso.tryLock()) {
            throw new ConflictoNegocioException("Ya hay una evaluación de compromisos de atención en curso.");
        }
        try {
            LocalDateTime inicio = LocalDateTime.now(clock);
            int evaluados = 0, riesgo = 0, vencidos = 0, errores = 0;
            Integer cursor = 0;
            List<Integer> lote;
            do {
                lote = ticketRepository.idsParaMonitoreo(ACTIVOS, EstadoSLA.VENCIDO, cursor,
                        PageRequest.of(0, propiedades.tamanoLote()));
                for (Integer id : lote) {
                    evaluados++;
                    try {
                        switch (Objects.requireNonNull(transaccion.execute(tx -> procesar(id, inicio)))) {
                            case EN_RIESGO -> riesgo++;
                            case VENCIDO -> vencidos++;
                            case SIN_CAMBIO -> { }
                        }
                    } catch (RuntimeException e) {
                        errores++;
                        log.error("No se pudo evaluar el compromiso del ticket #{}: {}", id, e.getMessage(), e);
                    }
                }
                if (!lote.isEmpty()) cursor = lote.getLast();
            } while (lote.size() == propiedades.tamanoLote());

            ResumenCicloMonitor resumen = new ResumenCicloMonitor(inicio,
                    Duration.between(inicio, LocalDateTime.now(clock)), evaluados, riesgo, vencidos, errores);
            ultimoCiclo.set(resumen);
            if (riesgo + vencidos + errores > 0) {
                log.info("Monitor de compromisos: {} evaluados, {} en riesgo, {} vencidos, {} errores",
                        evaluados, riesgo, vencidos, errores);
            }
            return resumen;
        } finally {
            enCurso.unlock();
        }
    }

    public Optional<ResumenCicloMonitor> ultimoCiclo() {
        return Optional.ofNullable(ultimoCiclo.get());
    }

    /** Se ejecuta dentro de una transacción propia por ticket. */
    Resultado procesar(Integer id, LocalDateTime ahora) {
        Optional<Ticket> encontrado = ticketRepository.findConAreaYTecnicoByIdTicket(id);
        if (encontrado.isEmpty() || !ACTIVOS.contains(encontrado.get().getEstado())) return Resultado.SIN_CAMBIO;
        Ticket t = encontrado.get();

        EstadoSLA actual = t.getEstadoSla() == null ? EstadoSLA.DENTRO_TIEMPO : t.getEstadoSla();
        EvaluacionCompromiso ev = CalculadoraCompromisoAtencion.evaluar(
                t.getFechaCreacion(), t.getFechaLimiteResolucion(), ahora, propiedades.umbralRiesgo());
        if (!CalculadoraCompromisoAtencion.esMasGrave(ev.estado(), actual)) return Resultado.SIN_CAMBIO;

        // Foto ANTES del UPDATE (clearAutomatically desconecta la entidad).
        CompromisoAtencionCambiadoEvento evento = CompromisoAtencionCambiadoEvento.desde(t, actual, ev.estado());
        if (ticketRepository.avanzarEstadoCompromiso(id, actual, ev.estado(), ACTIVOS) == 0) {
            return Resultado.SIN_CAMBIO;                      // otro proceso lo cambió primero
        }

        boolean vencido = ev.estado() == EstadoSLA.VENCIDO;
        auditoria.registrar(RegistroAuditoriaTicket.builder()
                .ticket(ticketRepository.getReferenceById(id))
                .actor(null)
                .accion(vencido ? "COMPROMISO_VENCIDO" : "COMPROMISO_EN_RIESGO")
                .estadoAnterior(actual.name())
                .estadoNuevo(ev.estado().name())
                .motivo(vencido ? "Se superó el tiempo comprometido de atención."
                        : "Se consumió el %d %% del tiempo comprometido de atención."
                                .formatted(Math.round(ev.fraccionConsumida() * 100)))
                .detalle("Registrado automáticamente por el monitor de compromisos de atención.")
                .build());
        eventos.publishEvent(evento);
        return vencido ? Resultado.VENCIDO : Resultado.EN_RIESGO;
    }
}
```

> Un ticket que salta de "en tiempo" a "vencido" directamente (p. ej. la app estuvo apagada) genera **un solo** registro y **una sola** alerta (`VENCIDO`), no dos.

```java
package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Disparador periódico. Desactívalo en réplicas adicionales (despliegue de una sola instancia)
 * y en tests: servicedesk.compromisos.monitor-habilitado=false
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "servicedesk.compromisos", name = "monitor-habilitado",
        havingValue = "true", matchIfMissing = true)
public class ProgramadorMonitorCompromisos {

    private final EvaluadorCompromisosAtencion evaluador;

    @Scheduled(fixedDelayString = "${servicedesk.compromisos.intervalo-ms:60000}",
               initialDelayString = "${servicedesk.compromisos.retraso-inicial-ms:30000}")
    public void ejecutar() {
        try {
            evaluador.ejecutarCiclo();
        } catch (RuntimeException e) {
            // Nunca dejar escapar: una excepción no detiene el @Scheduled, pero ensucia el log con stack traces repetidos.
            log.warn("Ciclo del monitor de compromisos omitido: {}", e.getMessage());
        }
    }
}
```

> `fixedDelay` (no `fixedRate`): el siguiente ciclo empieza 60 s **después de terminar** el anterior, así nunca se solapan aunque un ciclo tarde.

```java
package com.hospital.servicedesk.operaciones.compromisos.api;

import com.hospital.servicedesk.operaciones.compromisos.aplicacion.EvaluadorCompromisosAtencion;
import com.hospital.servicedesk.operaciones.compromisos.aplicacion.ResumenCicloMonitor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/compromisos-atencion")
@PreAuthorize("hasRole('ADMINISTRADOR')")
@RequiredArgsConstructor
public class MonitorCompromisosController {

    private final EvaluadorCompromisosAtencion evaluador;

    @PostMapping("/evaluar")
    public ResumenCicloMonitor evaluarAhora() {
        return evaluador.ejecutarCiclo();
    }

    @GetMapping("/ultimo-ciclo")
    public ResponseEntity<ResumenCicloMonitor> ultimoCiclo() {
        return ResponseEntity.of(evaluador.ultimoCiclo());
    }
}
```

> `Duration` se serializa en ISO‑8601 (`"PT0.183S"`). Es una respuesta técnica para administración; no se muestra tal cual al personal asistencial.

### 5.7 Notificaciones asíncronas

**Matriz de notificación:**

| Prioridad | En riesgo (≥ 70 %) | Vencido (≥ 100 %) | Al registrarse |
|---|---|---|---|
| P1 · Crítica | Correo a técnico asignado + administradores + supervisión | Ídem | Correo a administradores + supervisión |
| P2 · Alta | Solo log | Correo a técnico asignado + supervisión | — |
| P3 / P4 | Solo log | Solo log | — |

Amplía `CorreoService`:

```java
public interface CorreoService {
    void enviarReporteEjecutivo(String destinatario, String nombreDestinatario, byte[] pdfAdjunto, String nombreArchivo);

    /** Correo de texto plano. Si no hay SMTP configurado, se registra en log y no falla. */
    void enviarAlerta(java.util.Collection<String> destinatarios, String asunto, String cuerpo);
}
```

```java
// services/impl/CorreoServiceImpl.java — AGREGAR
@Override
public void enviarAlerta(java.util.Collection<String> destinatarios, String asunto, String cuerpo) {
    if (destinatarios == null || destinatarios.isEmpty()) return;
    if (mailSender == null) {
        log.info("Sin SMTP configurado. Alerta simulada «{}» hacia {}", asunto, destinatarios);
        return;
    }
    try {
        MimeMessage mensaje = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensaje, false, "UTF-8");
        helper.setFrom(remitente);
        helper.setTo(destinatarios.toArray(String[]::new));
        helper.setSubject(asunto);
        helper.setText(cuerpo, false);
        mailSender.send(mensaje);
    } catch (Exception e) {
        // No relanzar: una caída del SMTP no debe afectar a nadie más que al propio correo.
        log.error("No se pudo enviar la alerta «{}»: {}", asunto, e.getMessage());
    }
}
```

`UsuarioRepository` — agregar:

```java
List<Usuario> findByRolAndActivoTrue(String rol);
```

```java
package com.hospital.servicedesk.operaciones.compromisos.notificacion;

import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.Prioridad;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.operaciones.compromisos.config.ConfiguracionTareasSegundoPlano;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.operaciones.compromisos.eventos.TicketCriticoRegistradoEvento;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import com.hospital.servicedesk.services.CorreoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashSet;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificadorCompromisosAtencion {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CorreoService correoService;
    private final UsuarioRepository usuarioRepository;
    private final PropiedadesCompromisoAtencion propiedades;

    @Async(ConfiguracionTareasSegundoPlano.EJECUTOR_NOTIFICACIONES)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void alCambiarCompromiso(CompromisoAtencionCambiadoEvento e) {
        boolean vencido = e.estadoNuevo() == EstadoSLA.VENCIDO;
        boolean notificar = e.prioridad() == Prioridad.CRITICA || (e.prioridad() == Prioridad.ALTA && vencido);
        log.info("Compromiso de atención del ticket #{} ({}): {} → {}", e.idTicket(),
                PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()), e.estadoAnterior(), e.estadoNuevo());
        if (!notificar) return;

        Set<String> destinatarios = new LinkedHashSet<>();
        if (e.correoTecnico() != null) destinatarios.add(e.correoTecnico());
        destinatarios.addAll(propiedades.correosSupervision());
        if (e.prioridad() == Prioridad.CRITICA) destinatarios.addAll(correosAdministradores());

        String asunto = (vencido ? "Compromiso de atención VENCIDO" : "Compromiso de atención en riesgo")
                + " — Ticket #" + e.idTicket() + " · " + e.areaNombre();
        String cuerpo = """
                Mesa de Ayuda — Hospital Santa María del Socorro

                Ticket: #%d — %s
                Área: %s
                Prioridad: %s
                Hora comprometida de solución: %s
                Responsable: %s

                %s

                Este mensaje fue generado automáticamente.
                """.formatted(e.idTicket(), e.asunto(), e.areaNombre(),
                PoliticaCompromisoAtencion.etiquetaPrioridad(e.prioridad()),
                e.fechaLimite().format(HORA),
                e.nombreTecnico() != null ? e.nombreTecnico() : "Sin técnico asignado",
                vencido ? "Se superó el tiempo comprometido. Atienda o escale el caso de inmediato."
                        : "Queda poco tiempo para cumplir con el área. Priorice este caso.");
        correoService.enviarAlerta(destinatarios, asunto, cuerpo);
    }

    @Async(ConfiguracionTareasSegundoPlano.EJECUTOR_NOTIFICACIONES)
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void alRegistrarTicketCritico(TicketCriticoRegistradoEvento e) {
        Set<String> destinatarios = new LinkedHashSet<>(propiedades.correosSupervision());
        destinatarios.addAll(correosAdministradores());
        correoService.enviarAlerta(destinatarios,
                "Nuevo reporte crítico — Ticket #" + e.idTicket() + " · " + e.areaNombre(),
                """
                Mesa de Ayuda — Hospital Santa María del Socorro

                Se registró un reporte de prioridad crítica.
                Ticket: #%d — %s
                Área: %s
                Equipo de origen (IP): %s

                Asigne un técnico lo antes posible.
                """.formatted(e.idTicket(), e.asunto(), e.areaNombre(), e.ipOrigen() == null ? "—" : e.ipOrigen()));
    }

    private Set<String> correosAdministradores() {
        Set<String> correos = new LinkedHashSet<>();
        usuarioRepository.findByRolAndActivoTrue("ADMINISTRADOR").stream().map(Usuario::getCorreo).forEach(correos::add);
        return correos;
    }
}
```

> **Cuidado con la autoinvocación:** `@Async` y `@Transactional` funcionan por proxy. Nunca llames a `alCambiarCompromiso(...)` desde la misma clase; siempre vía `publishEvent`.

### 5.8 Lo que el frontend ya puede mostrar

`TicketResponse.estadoSla` ya viaja al frontend y `IndicadoresService` ya cuenta `POR_VENCER`/`VENCIDO`: con el monitor activo esos contadores **por fin cambian solos**. Textos visibles sugeridos: `DENTRO_TIEMPO` → "En tiempo", `POR_VENCER` → "En riesgo", `VENCIDO` → "Vencido".

### 5.9 Evolución futura

- Calendario laboral para P3/P4 (`laboral = true`), con feriados.
- Pausa del reloj (estado "En espera del área").
- ShedLock (tabla `shedlock`) si algún día hay más de una instancia.
- Notificación en la app (campana) además del correo.

---

## 6. Módulo 4 — Migraciones SQL Server y datos semilla

### 6.1 Orden de ejecución y estrategia

| Script | Contenido | Estado |
|---|---|---|
| `V1_1__gestion_areas_personal_equipos.sql` | áreas, personal, equipos | existente |
| `V1_2__poblar_areas_reales_hsmsi.sql` | áreas reales Piso 1 y Piso 2 | existente (sin commit) — **revisar §6.3** |
| `V1_3__solicitudes_cambio.sql` | tablas del Módulo 1 + correlativo | **nuevo** |
| `V1_4__centro_soluciones_guias.sql` | columnas y tablas del Módulo 2 | **nuevo** |
| `V1_5__auditoria_y_compromisos.sql` | historial ampliado, índices, matriz de compromisos | **nuevo** |
| `V1_6__semillas_equipos_red_y_guias.sql` | equipos, IPs, guías iniciales, áreas faltantes | **nuevo** |
| `SemillaPersonalHsmsi.java` | usuarios asistenciales y técnicos (BCrypt) | **nuevo (Java)** |

**Regla:** los scripts se ejecutan **antes** de levantar la aplicación. Son idempotentes (se pueden correr dos veces). Si la app ya arrancó y Hibernate creó alguna tabla, los `IF OBJECT_ID(...) IS NULL` la respetan; en ese caso compara tipos con `sp_help 'dbo.solicitud_cambio'`.

```bash
# Copiar y ejecutar contra el contenedor (imagen 2022: sqlcmd en mssql-tools18, -C confía en el certificado)
for f in V1_3__solicitudes_cambio V1_4__centro_soluciones_guias V1_5__auditoria_y_compromisos V1_6__semillas_equipos_red_y_guias; do
  docker cp backend/src/main/resources/db/migraciones/$f.sql bd_sqlserver:/tmp/$f.sql
  docker exec -it bd_sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" \
       -d db_servicedesk -C -b -I -i /tmp/$f.sql
done
```

> `-b` detiene en el primer error; `-I` activa `QUOTED_IDENTIFIER` (necesario para índices filtrados). `DB_PASSWORD` sale de tu `.env`; **nunca** la escribas en el script ni en el PR.

### 6.2 `V1_3__solicitudes_cambio.sql`

```sql
-- ============================================================================
-- Migración SQL Server: V1.3 Solicitudes de Cambio Técnico
-- Hospital Santa María del Socorro (HSMSI)
-- Idempotente y seguro para ejecución repetida.
-- ============================================================================
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1. Correlativos por prefijo y año -------------------------------------------
IF OBJECT_ID('dbo.correlativo_documento', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.correlativo_documento (
        clave   VARCHAR(20) NOT NULL CONSTRAINT PK_correlativo_documento PRIMARY KEY,
        ultimo  INT         NOT NULL CONSTRAINT DF_correlativo_ultimo DEFAULT 0
    );
END;

DECLARE @claveAnio VARCHAR(20) = CONCAT('SC-', YEAR(SYSDATETIME()));
IF NOT EXISTS (SELECT 1 FROM dbo.correlativo_documento WHERE clave = @claveAnio)
    INSERT INTO dbo.correlativo_documento (clave, ultimo) VALUES (@claveAnio, 0);

-- 2. Solicitud de cambio -------------------------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.solicitud_cambio (
        id_solicitud_cambio       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_solicitud_cambio PRIMARY KEY,
        codigo                    VARCHAR(20)    NOT NULL,
        titulo                    NVARCHAR(120)  NOT NULL,
        tipo                      VARCHAR(20)    NOT NULL,
        categoria                 VARCHAR(30)    NOT NULL,
        descripcion               NVARCHAR(4000) NOT NULL,
        justificacion             NVARCHAR(4000) NOT NULL,
        impacto                   VARCHAR(20)    NOT NULL,
        riesgo                    VARCHAR(20)    NOT NULL,
        requiere_interrupcion     BIT            NOT NULL CONSTRAINT DF_sc_interrupcion DEFAULT 0,
        minutos_interrupcion      INT            NULL,
        pacientes_afectados       NVARCHAR(500)  NULL,
        descripcion_impacto       NVARCHAR(2000) NOT NULL,
        criterio_reversa          NVARCHAR(500)  NOT NULL,
        minutos_reversa           INT            NOT NULL,
        plan_continuidad          NVARCHAR(1000) NULL,
        responsable_reversa       NVARCHAR(120)  NOT NULL,
        responsable_ejecucion     NVARCHAR(120)  NULL,
        horario_inicio            DATETIME2(0)   NULL,
        horario_fin               DATETIME2(0)   NULL,
        fecha_inicio_real         DATETIME2(0)   NULL,
        fecha_fin_real            DATETIME2(0)   NULL,
        id_ticket_origen          INT            NULL,
        id_solicitante            INT            NOT NULL,
        id_aprobador              INT            NULL,
        fecha_decision            DATETIME2(0)   NULL,
        observacion_decision      NVARCHAR(1000) NULL,
        resultado_implementacion  NVARCHAR(2000) NULL,
        estado                    VARCHAR(20)    NOT NULL CONSTRAINT DF_sc_estado DEFAULT 'BORRADOR',
        texto_busqueda            NVARCHAR(1000) NOT NULL,
        fecha_registro            DATETIME2(0)   NOT NULL,
        fecha_actualizacion       DATETIME2(0)   NOT NULL,
        version                   BIGINT         NOT NULL CONSTRAINT DF_sc_version DEFAULT 0,

        CONSTRAINT UQ_solicitud_cambio_codigo UNIQUE (codigo),
        CONSTRAINT FK_sc_ticket      FOREIGN KEY (id_ticket_origen) REFERENCES dbo.ticket(id_ticket),
        CONSTRAINT FK_sc_solicitante FOREIGN KEY (id_solicitante)   REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT FK_sc_aprobador   FOREIGN KEY (id_aprobador)     REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT CK_sc_tipo      CHECK (tipo IN ('RUTINARIO','PROGRAMADO','URGENTE')),
        CONSTRAINT CK_sc_categoria CHECK (categoria IN ('SISTEMA_CLINICO','RED','SERVIDOR','EQUIPO_USUARIO','SEGURIDAD')),
        CONSTRAINT CK_sc_impacto   CHECK (impacto IN ('BAJO','MEDIO','ALTO','CRITICO')),
        CONSTRAINT CK_sc_riesgo    CHECK (riesgo IN ('BAJO','MEDIO','ALTO')),
        CONSTRAINT CK_sc_estado    CHECK (estado IN ('BORRADOR','EN_EVALUACION','APROBADO','RECHAZADO',
                                                     'EN_EJECUCION','IMPLEMENTADO','CANCELADO')),
        CONSTRAINT CK_sc_horario   CHECK (horario_fin IS NULL OR horario_inicio IS NULL OR horario_fin > horario_inicio),
        CONSTRAINT CK_sc_interrupcion CHECK (requiere_interrupcion = 0 OR minutos_interrupcion > 0)
    );

    CREATE INDEX IX_sc_estado_fecha ON dbo.solicitud_cambio (estado, fecha_registro DESC);
    CREATE INDEX IX_sc_solicitante  ON dbo.solicitud_cambio (id_solicitante);
END;

-- 3. Colecciones ---------------------------------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio_area', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_area (
        id_solicitud_cambio INT NOT NULL,
        id_area             INT NOT NULL,
        CONSTRAINT PK_solicitud_cambio_area PRIMARY KEY (id_solicitud_cambio, id_area),
        CONSTRAINT FK_sca_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_sca_area FOREIGN KEY (id_area) REFERENCES dbo.area(id_area)
    );

IF OBJECT_ID('dbo.solicitud_cambio_servicio', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_servicio (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        nombre_servicio     NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_servicio PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scs_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_equipo', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_equipo (
        id_solicitud_cambio INT         NOT NULL,
        orden               INT         NOT NULL,
        codigo_inventario   VARCHAR(30) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_equipo PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_sce_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_implementacion', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_implementacion (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_impl PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpi_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_reversa', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_reversa (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_rev PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpr_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

-- 4. Historial -----------------------------------------------------------------
IF OBJECT_ID('dbo.historial_solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historial_solicitud_cambio (
        id_historial_cambio INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_historial_solicitud_cambio PRIMARY KEY,
        id_solicitud_cambio INT            NOT NULL,
        id_usuario          INT            NOT NULL,
        accion              VARCHAR(30)    NOT NULL,
        estado_anterior     VARCHAR(20)    NULL,
        estado_nuevo        VARCHAR(20)    NOT NULL,
        observacion         NVARCHAR(1000) NULL,
        ip_origen           VARCHAR(45)    NULL,
        fecha               DATETIME2(0)   NOT NULL,
        CONSTRAINT FK_hsc_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_hsc_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_hsc_solicitud ON dbo.historial_solicitud_cambio (id_solicitud_cambio, fecha);
END;

COMMIT TRANSACTION;
```

> `ON DELETE CASCADE` es una red de seguridad en SQL Server; el servicio igual borra el historial explícitamente para que el comportamiento sea idéntico en H2.

### 6.3 Revisión de `V1_2` (áreas reales)

`V1_2` ya cubre todas las áreas pedidas de **Piso 1** (Caja, Emergencia Admisión, Farmacia Emergencia, Triaje 2, Pediatría, Materno 1, Medicina 1, Fisioterapia, Psicología 1, Psicología 3, Diagnóstico por Imágenes ‑ Piso 1, Estadística e Informática) y **Piso 2** (Triaje Principal, Psiquiatría, Psicología 2, Dental Niños, Dental Adultos, Cardiología, Dermatología, Otorrino, Planificación Familiar, Diagnóstico por Imágenes ‑ Piso 2). Dos observaciones:

1. **Farmacia Central** y **Admisión Central y Triaje** solo se **actualizan** (`UPDATE … WHERE nombre = …`); en una base limpia no existen y quedan fuera. V1_6 las inserta si faltan.
2. Los literales no llevan prefijo `N'…'`. Funciona con la intercalación por defecto (`SQL_Latin1_General_CP1_CI_AS`, página 1252 incluye á/é/í/ó/ú/ñ), pero en los scripts nuevos usa **siempre `N'…'`**.

### 6.4 `V1_4__centro_soluciones_guias.sql`

```sql
-- ============================================================================
-- Migración SQL Server: V1.4 Centro de Soluciones y Guías (extiende error_conocido)
-- Idempotente y retrocompatible: solo agrega columnas con DEFAULT o NULL.
-- ============================================================================
SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF COL_LENGTH('dbo.error_conocido', 'categoria') IS NULL
    ALTER TABLE dbo.error_conocido ADD categoria VARCHAR(30) NOT NULL
        CONSTRAINT DF_ec_categoria DEFAULT 'SOFTWARE_ASISTENCIAL';

IF COL_LENGTH('dbo.error_conocido', 'ambito') IS NULL
    ALTER TABLE dbo.error_conocido ADD ambito VARCHAR(30) NOT NULL
        CONSTRAINT DF_ec_ambito DEFAULT 'INTERNO_TECNICO';

IF COL_LENGTH('dbo.error_conocido', 'sintoma') IS NULL
    ALTER TABLE dbo.error_conocido ADD sintoma NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'causa_raiz') IS NULL
    ALTER TABLE dbo.error_conocido ADD causa_raiz NVARCHAR(1000) NULL;

IF COL_LENGTH('dbo.error_conocido', 'palabras_clave') IS NULL
    ALTER TABLE dbo.error_conocido ADD palabras_clave NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'equipos_compatibles') IS NULL
    ALTER TABLE dbo.error_conocido ADD equipos_compatibles NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'nivel_dificultad') IS NULL
    ALTER TABLE dbo.error_conocido ADD nivel_dificultad VARCHAR(20) NULL;

IF COL_LENGTH('dbo.error_conocido', 'minutos_estimados') IS NULL
    ALTER TABLE dbo.error_conocido ADD minutos_estimados INT NULL;

IF COL_LENGTH('dbo.error_conocido', 'requiere_tecnico') IS NULL
    ALTER TABLE dbo.error_conocido ADD requiere_tecnico BIT NOT NULL CONSTRAINT DF_ec_req_tecnico DEFAULT 0;

IF COL_LENGTH('dbo.error_conocido', 'conteo_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_util INT NOT NULL CONSTRAINT DF_ec_conteo_util DEFAULT 0;

IF COL_LENGTH('dbo.error_conocido', 'conteo_no_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_no_util INT NOT NULL CONSTRAINT DF_ec_conteo_no_util DEFAULT 0;

IF COL_LENGTH('dbo.error_conocido', 'conteo_visitas') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_visitas INT NOT NULL CONSTRAINT DF_ec_conteo_visitas DEFAULT 0;

IF COL_LENGTH('dbo.error_conocido', 'id_autor') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD id_autor INT NULL;
    ALTER TABLE dbo.error_conocido ADD CONSTRAINT FK_ec_autor FOREIGN KEY (id_autor) REFERENCES dbo.usuario(id_usuario);
END;

IF COL_LENGTH('dbo.error_conocido', 'fecha_actualizacion') IS NULL
    ALTER TABLE dbo.error_conocido ADD fecha_actualizacion DATETIME2(0) NULL;

IF COL_LENGTH('dbo.error_conocido', 'texto_busqueda') IS NULL
    ALTER TABLE dbo.error_conocido ADD texto_busqueda NVARCHAR(4000) NULL;

COMMIT TRANSACTION;
GO   -- separar lote: las columnas nuevas deben existir antes de los CHECK y UPDATE

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_ec_categoria')
    ALTER TABLE dbo.error_conocido ADD CONSTRAINT CK_ec_categoria CHECK (categoria IN
        ('SISTEMA_CLINICO','IMPRESORAS_TERMICAS','REDES','HARDWARE','SOFTWARE_ASISTENCIAL'));

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_ec_ambito')
    ALTER TABLE dbo.error_conocido ADD CONSTRAINT CK_ec_ambito CHECK (ambito IN ('PUBLICO_ASISTENCIAL','INTERNO_TECNICO'));

-- Las guías existentes que estaban "publicadas" eran visibles para todos: se conservan como públicas.
UPDATE dbo.error_conocido SET ambito = 'PUBLICO_ASISTENCIAL' WHERE publicado = 1 AND texto_busqueda IS NULL;

-- Texto de búsqueda aproximado para filas antiguas: solo minúsculas, CONSERVA las tildes.
-- El backend lo recalcula sin tildes la próxima vez que se guarde cada guía (ver nota al final).
UPDATE dbo.error_conocido
SET texto_busqueda = LOWER(CONCAT(titulo, N' ', CAST(descripcion_problema AS NVARCHAR(3000)))),
    fecha_actualizacion = COALESCE(fecha_actualizacion, fecha_creacion)
WHERE texto_busqueda IS NULL;

IF OBJECT_ID('dbo.guia_paso', 'U') IS NULL
    CREATE TABLE dbo.guia_paso (
        id_error    INT           NOT NULL,
        orden       INT           NOT NULL,
        descripcion NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_guia_paso PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_guia_paso_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_precaucion', 'U') IS NULL
    CREATE TABLE dbo.guia_precaucion (
        id_error INT           NOT NULL,
        orden    INT           NOT NULL,
        texto    NVARCHAR(500) NOT NULL,
        CONSTRAINT PK_guia_precaucion PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_guia_precaucion_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_voto', 'U') IS NULL
    CREATE TABLE dbo.guia_voto (
        id_voto    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_guia_voto PRIMARY KEY,
        id_error   INT          NOT NULL,
        id_usuario INT          NOT NULL,
        es_util    BIT          NOT NULL,
        fecha      DATETIME2(0) NOT NULL,
        CONSTRAINT UQ_guia_voto_usuario UNIQUE (id_error, id_usuario),
        CONSTRAINT FK_guia_voto_error   FOREIGN KEY (id_error)   REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE,
        CONSTRAINT FK_guia_voto_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ec_vigentes')
    CREATE INDEX IX_ec_vigentes ON dbo.error_conocido (publicado, ambito, categoria) INCLUDE (conteo_util);

COMMIT TRANSACTION;
```

> Tras ejecutar V1_4, entra como administrador y **guarda una vez** cada guía antigua (o corre un `PUT` con los mismos datos): el backend recalculará `texto_busqueda` sin tildes.

### 6.5 `V1_5__auditoria_y_compromisos.sql`

```sql
-- ============================================================================
-- Migración SQL Server: V1.5 Auditoría de tickets y compromisos de atención
-- ============================================================================
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 1. Historial de ticket ampliado ------------------------------------------------
IF COL_LENGTH('dbo.historial_ticket', 'estado_anterior') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_anterior VARCHAR(30) NULL;
IF COL_LENGTH('dbo.historial_ticket', 'estado_nuevo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_nuevo VARCHAR(30) NULL;
IF COL_LENGTH('dbo.historial_ticket', 'motivo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD motivo NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.historial_ticket', 'ip_origen') IS NULL
    ALTER TABLE dbo.historial_ticket ADD ip_origen VARCHAR(45) NULL;

-- 2. Normalizar estados nulos para el UPDATE condicional del monitor ---------------
UPDATE dbo.ticket SET estado_sla = 'DENTRO_TIEMPO' WHERE estado_sla IS NULL;

COMMIT TRANSACTION;
GO

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 3. Índice del monitor: solo tickets activos con plazo (índice filtrado) -----------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ticket_monitor_compromisos')
    CREATE INDEX IX_ticket_monitor_compromisos
        ON dbo.ticket (id_ticket)
        INCLUDE (estado, estado_sla, fecha_creacion, fecha_limite_resolucion, prioridad)
        WHERE estado IN ('ABIERTO', 'EN_PROGRESO', 'ESCALADO') AND fecha_limite_resolucion IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_historial_ticket_ticket_fecha')
    CREATE INDEX IX_historial_ticket_ticket_fecha ON dbo.historial_ticket (id_ticket, fecha_accion);

-- 4. Matriz impacto × urgencia → prioridad y minutos ----------------------------
--    Debe coincidir con TicketServiceImpl.calcPri() y con los valores por defecto
--    de SlaConfiguracionController (P1 15/60, P2 30/120, P3 60/480, P4 120/1440).
MERGE dbo.configuracion_sla AS destino
USING (VALUES
    ('ALTO',  'ALTA',  'P1', 15,  60),
    ('ALTO',  'MEDIA', 'P2', 30,  120),
    ('ALTO',  'BAJA',  'P2', 30,  120),
    ('MEDIO', 'ALTA',  'P2', 30,  120),
    ('MEDIO', 'MEDIA', 'P3', 60,  480),
    ('MEDIO', 'BAJA',  'P3', 60,  480),
    ('BAJO',  'ALTA',  'P2', 30,  120),
    ('BAJO',  'MEDIA', 'P3', 60,  480),
    ('BAJO',  'BAJA',  'P4', 120, 1440)
) AS origen (impacto, urgencia, prioridad_resultante, minutos_respuesta, minutos_resolucion)
ON destino.impacto = origen.impacto AND destino.urgencia = origen.urgencia
WHEN NOT MATCHED BY TARGET THEN
    INSERT (impacto, urgencia, prioridad_resultante, minutos_respuesta, minutos_resolucion)
    VALUES (origen.impacto, origen.urgencia, origen.prioridad_resultante, origen.minutos_respuesta, origen.minutos_resolucion);
-- WHEN MATCHED no actualiza: respeta los ajustes que Administración ya haya hecho.

COMMIT TRANSACTION;
```

> Verifica que `calcPri()` da `ALTA` para (BAJO, ALTA): `imp == ALTO || urg == ALTA` ⇒ sí, P2. Y (ALTO, BAJA) ⇒ `ALTA` ⇒ P2. La matriz coincide.

### 6.6 `V1_6__semillas_equipos_red_y_guias.sql`

Códigos según `CodigoPorTipoYAbreviaturaArea` (`PC-ADM-01`, `IMP-EME-01`…). Segmentos por piso: **10.20.1.0/24 (Piso 1)**, **10.20.2.0/24 (Piso 2)**, **10.20.0.0/24 (servidores)**. Ajusta a la red real si Informática te da otros rangos; deben pasar `ValidadorIp` (privadas, no reservadas).

```sql
-- ============================================================================
-- Migración SQL Server: V1.6 Semillas — equipos, IPs y guías iniciales
-- Requiere V1_2 (áreas) y al menos un usuario ADMINISTRADOR (DataInitializer).
-- ============================================================================
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 0. Áreas que V1_2 solo actualizaba ---------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Farmacia Central')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Farmacia Central', N'Piso 1', N'Pabellón de Consultorios Externos', '105', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Admisión Central y Triaje')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Admisión Central y Triaje', N'Piso 1', N'Hall Central - Módulos de Admisión General', '101', 'P1', 1);

-- 1. Catálogo de equipos ----------------------------------------------------------
DECLARE @equipos TABLE (
    codigo VARCHAR(30), nombre NVARCHAR(100), tipo VARCHAR(30), marca NVARCHAR(100),
    hostname VARCHAR(100), area NVARCHAR(80), ubicacion NVARCHAR(150), ip VARCHAR(15), subred VARCHAR(50));

INSERT INTO @equipos VALUES
-- Piso 1
('PC-ADM-01',  N'PC Admisión módulo 1',            'COMPUTADORA', N'Lenovo ThinkCentre M70q',   'HSMSI-ADM-01',  N'Admisión Central y Triaje', N'Módulo 1',            '10.20.1.11', '10.20.1.0/24'),
('PC-ADM-02',  N'PC Admisión módulo 2',            'COMPUTADORA', N'Lenovo ThinkCentre M70q',   'HSMSI-ADM-02',  N'Admisión Central y Triaje', N'Módulo 2',            '10.20.1.12', '10.20.1.0/24'),
('IMP-ADM-01', N'Impresora de pulseras Admisión',  'IMPRESORA',   N'Zebra ZD510-HC',            'HSMSI-IMP-ADM', N'Admisión Central y Triaje', N'Mostrador central',   '10.20.1.13', '10.20.1.0/24'),
('PC-CAJ-01',  N'PC Caja 1',                       'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-CAJ-01',  N'Caja',                      N'Ventanilla 1',        '10.20.1.21', '10.20.1.0/24'),
('IMP-CAJ-01', N'Impresora térmica de comprobantes','IMPRESORA',  N'Epson TM-T20III',           'HSMSI-IMP-CAJ', N'Caja',                      N'Ventanilla 1',        '10.20.1.22', '10.20.1.0/24'),
('PC-EME-01',  N'PC Emergencia Admisión',          'COMPUTADORA', N'Lenovo ThinkCentre M70q',   'HSMSI-EME-01',  N'Emergencia Admisión',       N'Counter de ambulancias','10.20.1.31','10.20.1.0/24'),
('IMP-EME-01', N'Impresora de pulseras Emergencia','IMPRESORA',   N'Zebra ZD510-HC',            'HSMSI-IMP-EME', N'Emergencia Admisión',       N'Counter de ambulancias','10.20.1.32','10.20.1.0/24'),
('PC-FAE-01',  N'PC Farmacia Emergencia',          'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-FAE-01',  N'Farmacia Emergencia',       N'Despacho 24 h',       '10.20.1.41', '10.20.1.0/24'),
('PC-FAC-01',  N'PC Farmacia Central',             'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-FAC-01',  N'Farmacia Central',          N'Ventanilla de despacho','10.20.1.42','10.20.1.0/24'),
('IMP-FAC-01', N'Impresora de etiquetas Farmacia', 'IMPRESORA',   N'Zebra ZD421',               'HSMSI-IMP-FAC', N'Farmacia Central',          N'Ventanilla de despacho','10.20.1.43','10.20.1.0/24'),
('PC-PED-01',  N'PC Consultorio Pediatría',        'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-PED-01',  N'Pediatría',                 N'Consultorio',         '10.20.1.51', '10.20.1.0/24'),
('PC-MAT-01',  N'PC Materno 1',                    'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-MAT-01',  N'Materno 1',                 N'Consultorio',         '10.20.1.52', '10.20.1.0/24'),
('PC-MED-01',  N'PC Medicina 1',                   'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-MED-01',  N'Medicina 1',                N'Consultorio',         '10.20.1.53', '10.20.1.0/24'),
('PC-FIS-01',  N'PC Fisioterapia',                 'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-FIS-01',  N'Fisioterapia',              N'Recepción',           '10.20.1.54', '10.20.1.0/24'),
('PC-PS1-01',  N'PC Psicología 1',                 'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-PS1-01',  N'Psicología 1',              N'Consultorio N° 1',    '10.20.1.55', '10.20.1.0/24'),
('PC-PS3-01',  N'PC Psicología 3',                 'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-PS3-01',  N'Psicología 3',              N'Consultorio N° 3',    '10.20.1.56', '10.20.1.0/24'),
('RED-P1-01',  N'Switch de acceso Piso 1',         'RED',         N'Cisco Catalyst 9200-48P',   'HSMSI-SW-P1',   N'Estadística e Informática', N'Gabinete de comunicaciones Piso 1','10.20.1.2','10.20.1.0/24'),
-- Piso 2
('PC-TRI-01',  N'PC Triaje Principal',             'COMPUTADORA', N'Lenovo ThinkCentre M70q',   'HSMSI-TRI-01',  N'Triaje Principal',          N'Módulo de evaluación','10.20.2.11', '10.20.2.0/24'),
('IMP-TRI-01', N'Impresora de pulseras Triaje',    'IMPRESORA',   N'Zebra ZD510-HC',            'HSMSI-IMP-TRI', N'Triaje Principal',          N'Módulo de evaluación','10.20.2.12', '10.20.2.0/24'),
('PC-PSQ-01',  N'PC Psiquiatría',                  'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-PSQ-01',  N'Psiquiatría',               N'Consultorio',         '10.20.2.21', '10.20.2.0/24'),
('PC-PS2-01',  N'PC Psicología 2',                 'COMPUTADORA', N'HP ProDesk 400 G7',         'HSMSI-PS2-01',  N'Psicología 2',              N'Consultorio N° 2',    '10.20.2.22', '10.20.2.0/24'),
('PC-DEN-01',  N'PC Dental Niños',                 'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-DEN-01',  N'Dental Niños',              N'Consultorio',         '10.20.2.23', '10.20.2.0/24'),
('PC-DEA-01',  N'PC Dental Adultos',               'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-DEA-01',  N'Dental Adultos',            N'Consultorio',         '10.20.2.24', '10.20.2.0/24'),
('PC-CAR-01',  N'PC Cardiología',                  'COMPUTADORA', N'Lenovo ThinkCentre M70q',   'HSMSI-CAR-01',  N'Cardiología',               N'Sala de electrocardiograma','10.20.2.25','10.20.2.0/24'),
('PC-DER-01',  N'PC Dermatología',                 'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-DER-01',  N'Dermatología',              N'Consultorio',         '10.20.2.26', '10.20.2.0/24'),
('PC-PLF-01',  N'PC Planificación Familiar',       'COMPUTADORA', N'Dell OptiPlex 3000',        'HSMSI-PLF-01',  N'Planificación Familiar',    N'Consejería',          '10.20.2.27', '10.20.2.0/24'),
('RED-P2-01',  N'Switch de acceso Piso 2',         'RED',         N'Cisco Catalyst 9200-48P',   'HSMSI-SW-P2',   N'Tecnología de la Información', N'Gabinete de comunicaciones Piso 2','10.20.2.2','10.20.2.0/24'),
-- Servidores
('SRV-TI-01',  N'Servidor del sistema clínico (HIS)','SERVIDOR',  N'Dell PowerEdge R650',       'HSMSI-SRV-HIS', N'Tecnología de la Información', N'Data center',       '10.20.0.10', '10.20.0.0/24'),
('SRV-TI-02',  N'Servidor de base de datos',       'SERVIDOR',    N'Dell PowerEdge R650',       'HSMSI-SRV-BD',  N'Tecnología de la Información', N'Data center',       '10.20.0.11', '10.20.0.0/24');

-- Equipos cuya área no existe: se informan y se omiten (no rompen el script).
SELECT e.codigo, e.area AS area_inexistente
FROM @equipos e LEFT JOIN dbo.area a ON a.nombre = e.area
WHERE a.id_area IS NULL;

INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, hostname,
                                        id_area, referencia_ubicacion, estado, fecha_registro)
SELECT e.codigo, e.nombre, e.tipo, e.marca, e.hostname, a.id_area, e.ubicacion, 'ACTIVO', SYSDATETIME()
FROM @equipos e
JOIN dbo.area a ON a.nombre = e.area
WHERE NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion c WHERE c.codigo_inventario = e.codigo);

-- 2. Direcciones IP y asignación activa ------------------------------------------
INSERT INTO dbo.direccion_ip (direccion, subred, estado)
SELECT e.ip, e.subred, 'ASIGNADA'
FROM @equipos e
WHERE NOT EXISTS (SELECT 1 FROM dbo.direccion_ip d WHERE d.direccion = e.ip);

DECLARE @idAdmin INT = (SELECT TOP 1 id_usuario FROM dbo.usuario WHERE rol = 'ADMINISTRADOR' ORDER BY id_usuario);

IF @idAdmin IS NOT NULL
    INSERT INTO dbo.historial_asignacion_ip (id_direccion_ip, id_ci, id_usuario_asigno, fecha_asignacion)
    SELECT d.id_direccion_ip, c.id_ci, @idAdmin, SYSDATETIME()
    FROM @equipos e
    JOIN dbo.direccion_ip d ON d.direccion = e.ip
    JOIN dbo.elemento_configuracion c ON c.codigo_inventario = e.codigo
    WHERE NOT EXISTS (SELECT 1 FROM dbo.historial_asignacion_ip h
                      WHERE h.id_direccion_ip = d.id_direccion_ip AND h.fecha_liberacion IS NULL);

-- 3. Guías iniciales del Centro de Soluciones --------------------------------------
DECLARE @guias TABLE (
    titulo NVARCHAR(150), resumen NVARCHAR(2000), solucion NVARCHAR(4000), categoria VARCHAR(30),
    ambito VARCHAR(30), sintoma NVARCHAR(500), causa NVARCHAR(1000), claves NVARCHAR(500),
    equipos NVARCHAR(500), dificultad VARCHAR(20), minutos INT, req_tecnico BIT, busqueda NVARCHAR(4000));

INSERT INTO @guias VALUES
(N'La impresora de pulseras no imprime o sale en blanco',
 N'Pasos para recuperar la impresión de pulseras de identificación de pacientes.',
 N'Verifique que la luz de estado esté en verde. Abra la tapa y confirme que el rollo esté bien colocado. Presione el botón de avance una vez. Reimprima la pulsera desde el sistema clínico.',
 'IMPRESORAS_TERMICAS', 'PUBLICO_ASISTENCIAL',
 N'La pulsera sale en blanco, cortada o la impresora parpadea en rojo.',
 N'Rollo mal colocado o descalibrado.',
 N'pulsera,zebra,etiqueta,impresora', N'IMP-ADM-01,IMP-EME-01,IMP-TRI-01', 'BASICO', 5, 0,
 N'la impresora de pulseras no imprime o sale en blanco la pulsera sale en blanco cortada o la impresora parpadea en rojo pasos para recuperar la impresion de pulseras de identificacion de pacientes rollo mal colocado o descalibrado pulsera zebra etiqueta impresora imp-adm-01 imp-eme-01 imp-tri-01'),
(N'El sistema clínico no abre o muestra "sin conexión"',
 N'Qué revisar antes de llamar a Informática cuando el sistema clínico no carga.',
 N'Confirme que el cable de red esté conectado y la luz del puerto encendida. Cierre por completo el navegador y vuelva a abrirlo. Si otra computadora del área tampoco abre, reporte un problema indicando el área.',
 'SISTEMA_CLINICO', 'PUBLICO_ASISTENCIAL',
 N'Pantalla en blanco, mensaje de sin conexión o la página no termina de cargar.',
 NULL, N'his,sistema clinico,admision,historia clinica,conexion', NULL, 'BASICO', 5, 0,
 N'el sistema clinico no abre o muestra sin conexion pantalla en blanco mensaje de sin conexion o la pagina no termina de cargar que revisar antes de llamar a informatica cuando el sistema clinico no carga his sistema clinico admision historia clinica conexion'),
(N'Reinicio controlado del servicio de impresión en servidor',
 N'Procedimiento interno para reiniciar la cola de impresión sin afectar a Emergencia.',
 N'Confirmar con Emergencia que no hay impresiones en curso. Detener el servicio de cola de impresión. Vaciar la carpeta de trabajos pendientes. Iniciar el servicio. Imprimir página de prueba desde Admisión.',
 'SOFTWARE_ASISTENCIAL', 'INTERNO_TECNICO',
 N'Varias áreas reportan que nada imprime al mismo tiempo.',
 N'Cola de impresión bloqueada por un trabajo dañado.',
 N'cola,spooler,impresion,servidor', N'SRV-TI-01', 'INTERMEDIO', 15, 1,
 N'reinicio controlado del servicio de impresion en servidor varias areas reportan que nada imprime al mismo tiempo procedimiento interno para reiniciar la cola de impresion sin afectar a emergencia cola de impresion bloqueada por un trabajo danado cola spooler impresion servidor srv-ti-01');

INSERT INTO dbo.error_conocido (titulo, descripcion_problema, solucion_trabajo, publicado, fecha_creacion,
        categoria, ambito, sintoma, causa_raiz, palabras_clave, equipos_compatibles, nivel_dificultad,
        minutos_estimados, requiere_tecnico, fecha_actualizacion, texto_busqueda, id_autor)
SELECT g.titulo, g.resumen, g.solucion, 1, SYSDATETIME(), g.categoria, g.ambito, g.sintoma, g.causa, g.claves,
       g.equipos, g.dificultad, g.minutos, g.req_tecnico, SYSDATETIME(), g.busqueda, @idAdmin
FROM @guias g
WHERE NOT EXISTS (SELECT 1 FROM dbo.error_conocido e WHERE e.titulo = g.titulo);

-- Pasos y precauciones de la guía de pulseras
DECLARE @idPulsera INT = (SELECT id_error FROM dbo.error_conocido
                          WHERE titulo = N'La impresora de pulseras no imprime o sale en blanco');
IF @idPulsera IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.guia_paso WHERE id_error = @idPulsera)
BEGIN
    INSERT INTO dbo.guia_paso (id_error, orden, descripcion) VALUES
        (@idPulsera, 0, N'Verifique que la luz de estado de la impresora esté en verde.'),
        (@idPulsera, 1, N'Abra la tapa superior y confirme que el rollo de pulseras esté centrado y con la cara térmica hacia arriba.'),
        (@idPulsera, 2, N'Cierre la tapa y presione una vez el botón de avance: debe salir una pulsera en blanco.'),
        (@idPulsera, 3, N'Reimprima la pulsera del paciente desde el sistema clínico.'),
        (@idPulsera, 4, N'Si sigue fallando, reporte un problema indicando el código de la impresora (etiqueta en la base).');
    INSERT INTO dbo.guia_precaucion (id_error, orden, texto) VALUES
        (@idPulsera, 0, N'Antes de colocar la pulsera, confirme nombre completo y número de historia clínica con el paciente o su acompañante.'),
        (@idPulsera, 1, N'No use pulseras impresas a medias o ilegibles: destrúyalas para evitar errores de identificación.');
END;

COMMIT TRANSACTION;
```

> **Nota sobre `orden`:** `@OrderColumn` de JPA empieza en **0**; la respuesta expone `orden = índice + 1`. Las semillas usan 0..n para coincidir.
> **Nota sobre `texto_busqueda`:** en las semillas se escribe ya normalizado (minúsculas, sin tildes, sin comillas). Si agregas guías por SQL, respeta ese formato o guárdalas luego desde la API.

### 6.7 Semillero Java del personal (BCrypt)

**Por qué en Java y no en SQL:** `Usuario.contrasenaHash` es `byte[]` con el texto BCrypt en UTF‑8 (así lo lee `CustomUserDetailsService`). Escribir hashes fijos en un `.sql` deja en el repositorio un hash con una contraseña conocida, y es frágil. El semillero usa el `PasswordEncoder` real y toma la clave inicial de una **variable de entorno**.

```properties
# application.properties
servicedesk.semillas.personal.habilitado=${SEMILLA_PERSONAL_HABILITADO:false}
servicedesk.semillas.personal.clave-inicial=${SEMILLA_CLAVE_INICIAL:}
```

```bash
# .env local (NO se versiona)
SEMILLA_PERSONAL_HABILITADO=true
SEMILLA_CLAVE_INICIAL=<una-clave-temporal-que-elijas>
```

```java
package com.hospital.servicedesk.config.semillas;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.GradoProfesional;
import com.hospital.servicedesk.entities.Usuario;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Personal ficticio de prueba para las áreas reales de Piso 1 y Piso 2.
 * Idempotente (por nombre_usuario). Todos deben cambiar la contraseña en el primer acceso.
 * Se ejecuta DESPUÉS de DataInitializer (que crea el área de Informática y el admin base).
 */
@Slf4j
@Component
@Order(100)
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "servicedesk.semillas.personal", name = "habilitado", havingValue = "true")
public class SemillaPersonalHsmsi implements ApplicationRunner {

    private record Persona(String usuario, String nombres, String apellidos, GradoProfesional grado,
                           String rol, String nivelSoporte, String area) {}

    private static final String DOMINIO = "@hsmsi.gob.pe";

    private static final List<Persona> PERSONAL = List.of(
            // ── Equipo de Informática ──
            new Persona("jefe.ti",          "Mariela",  "Castillo Vargas",  GradoProfesional.ING, "ADMINISTRADOR", null, "Tecnología de la Información"),
            new Persona("tec.soporte1",     "Jorge",    "Paredes Lima",     GradoProfesional.TEC, "TECNICO",       "N1", "Estadística e Informática"),
            new Persona("tec.soporte2",     "Lucía",    "Rojas Medina",     GradoProfesional.ING, "TECNICO",       "N2", "Tecnología de la Información"),
            new Persona("tec.redes",        "Andrés",   "Salazar Núñez",    GradoProfesional.ING, "TECNICO",       "N2", "Tecnología de la Información"),
            new Persona("prac.soporte",     "Diego",    "Quispe Huamaní",   GradoProfesional.SIN_GRADO, "PRACTICANTE", "N1", "Estadística e Informática"),
            // ── Personal asistencial y administrativo · Piso 1 ──
            new Persona("adm.central",      "Rosa",     "Flores Ccama",     GradoProfesional.TEC, "USUARIO_FINAL", null, "Admisión Central y Triaje"),
            new Persona("caja.ventanilla1", "Pedro",    "Gutiérrez Soto",   GradoProfesional.SIN_GRADO, "USUARIO_FINAL", null, "Caja"),
            new Persona("enf.emergencia",   "Carmen",   "Huamán Torres",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Emergencia Admisión"),
            new Persona("far.emergencia",   "Víctor",   "Mamani Quispe",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Farmacia Emergencia"),
            new Persona("far.central",      "Silvia",   "Ramos Chávez",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Farmacia Central"),
            new Persona("med.pediatria",    "Ricardo",  "Vega Montoya",     GradoProfesional.DR,  "USUARIO_FINAL", null, "Pediatría"),
            new Persona("obs.materno1",     "Patricia", "León Alarcón",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Materno 1"),
            new Persona("med.medicina1",    "Fernanda", "Ortiz Salas",      GradoProfesional.DRA, "USUARIO_FINAL", null, "Medicina 1"),
            new Persona("ter.fisioterapia", "Miguel",   "Cárdenas Ríos",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Fisioterapia"),
            new Persona("psi.psicologia1",  "Ana",      "Delgado Pinto",    GradoProfesional.LIC, "USUARIO_FINAL", null, "Psicología 1"),
            new Persona("psi.psicologia3",  "Elena",    "Navarro Cruz",     GradoProfesional.MG,  "USUARIO_FINAL", null, "Psicología 3"),
            // ── Personal asistencial · Piso 2 ──
            new Persona("enf.triaje",       "Julia",    "Espinoza Arias",   GradoProfesional.LIC, "USUARIO_FINAL", null, "Triaje Principal"),
            new Persona("med.psiquiatria",  "Óscar",    "Benavides Luna",   GradoProfesional.DR,  "USUARIO_FINAL", null, "Psiquiatría"),
            new Persona("psi.psicologia2",  "Gabriela", "Fuentes Ruiz",     GradoProfesional.LIC, "USUARIO_FINAL", null, "Psicología 2"),
            new Persona("odo.ninos",        "Claudia",  "Tapia Herrera",    GradoProfesional.DRA, "USUARIO_FINAL", null, "Dental Niños"),
            new Persona("odo.adultos",      "Raúl",     "Campos Ibáñez",    GradoProfesional.DR,  "USUARIO_FINAL", null, "Dental Adultos"),
            new Persona("med.cardiologia",  "Hugo",     "Zevallos Prado",   GradoProfesional.DR,  "USUARIO_FINAL", null, "Cardiología"),
            new Persona("med.dermatologia", "Verónica", "Aguilar Pérez",    GradoProfesional.DRA, "USUARIO_FINAL", null, "Dermatología"),
            new Persona("obs.planificacion","Liliana",  "Morales Ventura",  GradoProfesional.LIC, "USUARIO_FINAL", null, "Planificación Familiar")
    );

    private final UsuarioRepository usuarioRepository;
    private final AreaRepository areaRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    @Value("${servicedesk.semillas.personal.clave-inicial:}")
    private String claveInicial;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (claveInicial == null || claveInicial.length() < 8) {
            log.warn("Semilla de personal omitida: defina SEMILLA_CLAVE_INICIAL (mínimo 8 caracteres).");
            return;
        }
        byte[] hash = passwordEncoder.encode(claveInicial).getBytes(StandardCharsets.UTF_8);  // mismo formato que DataInitializer
        int creados = 0;
        for (Persona p : PERSONAL) {
            if (usuarioRepository.findByNombreUsuario(p.usuario()).isPresent()) continue;
            Area area = areaRepository.findByNombreIgnoreCase(p.area()).orElse(null);
            if (area == null) {
                log.warn("Semilla de personal: área «{}» inexistente; se omite {}. ¿Ejecutó V1_2 y V1_6?", p.area(), p.usuario());
                continue;
            }
            usuarioRepository.save(Usuario.builder()
                    .nombreUsuario(p.usuario())
                    .nombres(p.nombres())
                    .apellidos(p.apellidos())
                    .gradoProfesional(p.grado())
                    .correo(p.usuario() + DOMINIO)
                    .contrasenaHash(hash)
                    .rol(p.rol())
                    .nivelSoporte(p.nivelSoporte())
                    .area(area)
                    .debeCambiarContrasena(true)
                    .intentosFallidos(0)
                    .activo(true)
                    .fechaCreacion(LocalDateTime.now(clock))
                    .build());
            creados++;
        }
        log.info("Semilla de personal: {} usuarios nuevos ({} definidos).", creados, PERSONAL.size());
    }
}
```

> - Todos los nombres son **ficticios**. No uses nombres, DNI ni correos de personal real.
> - Hay **dos administradores** (`admin` de `DataInitializer` y `jefe.ti`) para poder probar la segregación de funciones: uno registra, el otro aprueba.
> - Sobre `.fechaCreacion(...)`: `Usuario` la marca con `@CreationTimestamp`, que la sobrescribe al insertar; se deja por claridad y coherencia con `DataInitializer`.

---

## 7. Plan de pruebas

### 7.1 Preparación (Spring Boot 4)

Agrega al `pom.xml` (versión gestionada por el *parent*):

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

**Paquetes que cambian en Boot 4** (verificado en `spring-boot-webmvc-test-4.1.1.jar`):

| Anotación | Boot 3 | **Boot 4 (este repo)** |
|---|---|---|
| `@AutoConfigureMockMvc` | `org.springframework.boot.test.autoconfigure.web.servlet` | `org.springframework.boot.webmvc.test.autoconfigure` |
| `@WebMvcTest` | `org.springframework.boot.test.autoconfigure.web.servlet` | `org.springframework.boot.webmvc.test.autoconfigure` |
| `@MockBean` | `org.springframework.boot.test.mock.mockito` | **eliminado** → `@MockitoBean` de `org.springframework.test.context.bean.override.mockito` |
| `ObjectMapper` | `com.fasterxml.jackson.databind` | Jackson 3: `tools.jackson.databind.json.JsonMapper` (en tests preferimos *text blocks*) |

Estructura de tests:

```
src/test/java/com/hospital/servicedesk/
├── administrativo/cambios/dominio/FlujoSolicitudCambioTest.java
├── administrativo/cambios/dominio/ValidadorSolicitudCambioTest.java
├── administrativo/cambios/dominio/EvaluadorRiesgoCambioTest.java
├── administrativo/cambios/aplicacion/impl/SolicitudCambioServiceImplTest.java
├── administrativo/cambios/api/SolicitudCambioControllerIntegracionTest.java
├── administrativo/conocimiento/dominio/PuntuadorGuiasTest.java
├── administrativo/conocimiento/api/GuiaSolucionControllerIntegracionTest.java
├── compartido/util/NormalizadorBusquedaTest.java
├── operaciones/compromisos/dominio/CalculadoraCompromisoAtencionTest.java
└── operaciones/compromisos/aplicacion/EvaluadorCompromisosAtencionTest.java
```

> Los tests de integración terminan en `...IntegracionTest.java` (no `*IT.java`): Surefire solo ejecuta por defecto `**/*Test.java`, `**/*Tests.java` y `**/*TestCase.java`, y así no hay que tocar el `pom` ni agregar Failsafe.

### 7.2 Tests unitarios

#### Máquina de estados

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.*;

class FlujoSolicitudCambioTest {

    @ParameterizedTest(name = "{0} + {1} → {2}")
    @CsvSource({
            "BORRADOR,      ENVIAR_EVALUACION,   EN_EVALUACION",
            "EN_EVALUACION, APROBAR,             APROBADO",
            "EN_EVALUACION, RECHAZAR,            RECHAZADO",
            "EN_EVALUACION, DEVOLVER_BORRADOR,   BORRADOR",
            "APROBADO,      INICIAR_EJECUCION,   EN_EJECUCION",
            "EN_EJECUCION,  MARCAR_IMPLEMENTADO, IMPLEMENTADO",
            "BORRADOR,      CANCELAR,            CANCELADO",
            "EN_EVALUACION, CANCELAR,            CANCELADO",
            "APROBADO,      CANCELAR,            CANCELADO"
    })
    void transicionesValidas(EstadoCambio origen, AccionCambio accion, EstadoCambio destino) {
        assertThat(FlujoSolicitudCambio.aplicar(origen, accion, "Observación de prueba")).isEqualTo(destino);
    }

    @Test
    @DisplayName("Aprobar un borrador es un conflicto con mensaje en lenguaje asistencial")
    void aprobarBorrador() {
        assertThatThrownBy(() -> FlujoSolicitudCambio.aplicar(EstadoCambio.BORRADOR, AccionCambio.APROBAR, null))
                .isInstanceOf(ConflictoNegocioException.class)
                .hasMessage("No se puede aprobar una solicitud que está en estado «Borrador».");
    }

    @Test
    void noSeCancelaLoQueYaSeEstaEjecutando() {
        assertThatThrownBy(() -> FlujoSolicitudCambio.aplicar(EstadoCambio.EN_EJECUCION, AccionCambio.CANCELAR, "x"))
                .isInstanceOf(ConflictoNegocioException.class);
    }

    @ParameterizedTest
    @EnumSource(value = AccionCambio.class, names = {"RECHAZAR", "DEVOLVER_BORRADOR", "MARCAR_IMPLEMENTADO", "CANCELAR"})
    void accionesQueExigenObservacion(AccionCambio accion) {
        EstadoCambio origen = accion.getOrigenes().iterator().next();
        assertThatThrownBy(() -> FlujoSolicitudCambio.aplicar(origen, accion, "   "))
                .isInstanceOf(ReglaNegocioException.class)
                .extracting("campo").isEqualTo("observacion");
    }

    @ParameterizedTest
    @EnumSource(value = EstadoCambio.class, names = {"RECHAZADO", "IMPLEMENTADO", "CANCELADO"})
    void losEstadosTerminalesNoTienenAcciones(EstadoCambio terminal) {
        assertThat(terminal.esTerminal()).isTrue();
        assertThat(FlujoSolicitudCambio.accionesDesde(terminal)).isEmpty();
    }

    @Test
    void soloElBorradorEsEditable() {
        assertThat(FlujoSolicitudCambio.esEditable(EstadoCambio.BORRADOR)).isTrue();
        assertThat(FlujoSolicitudCambio.esEditable(EstadoCambio.EN_EVALUACION)).isFalse();
    }
}
```

#### Validador (Clock fijo)

```java
package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.administrativo.cambios.dto.SolicitudCambioDTOs.*;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.exceptions.ReglaNegocioException;
import org.junit.jupiter.api.Test;

import java.time.*;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class ValidadorSolicitudCambioTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    /** 01/12/2026 10:00 hora de Lima. */
    private final Clock reloj = Clock.fixed(Instant.parse("2026-12-01T15:00:00Z"), LIMA);
    private final ValidadorSolicitudCambio validador = new ValidadorSolicitudCambio(reloj);

    private SolicitudCambioFormulario formulario(TipoCambio tipo, ImpactoAsistencial impacto,
                                                 LocalDateTime inicio, LocalDateTime fin, String continuidad) {
        return new SolicitudCambioFormulario(
                "Actualizar módulo de admisión del HIS", tipo, CategoriaCambio.SISTEMA_CLINICO,
                "Actualización a la versión 4.2", "Corrige el error de duplicidad de historias clínicas",
                List.of("SRV-TI-01"), null, "Lucía Rojas",
                inicio == null ? null : new HorarioProgramado(inicio, fin),
                new EvaluacionImpactoFormulario(impacto, List.of(1), true, 30, List.of("Registro de admisión"),
                        null, "Admisión no podrá registrar durante 30 minutos"),
                List.of(new PasoPlanFormulario("Respaldar base de datos", null, 20)),
                new PlanReversaFormulario("Si a los 15 min no se registran admisiones",
                        List.of(new PasoPlanFormulario("Restaurar respaldo", null, 20)), 30, continuidad, "Lucía Rojas"));
    }

    @Test
    void criticoEnHorarioDiurnoSeRechaza() {
        var f = formulario(TipoCambio.PROGRAMADO, ImpactoAsistencial.CRITICO,
                LocalDateTime.of(2026, 12, 2, 18, 0), LocalDateTime.of(2026, 12, 2, 20, 0), "Formato físico F-ADM-03");
        assertThatThrownBy(() -> validador.validarParaGuardar(f))
                .isInstanceOf(ReglaNegocioException.class)
                .hasMessageContaining("entre las 19:00 y las 07:00");
    }

    @Test
    void criticoNocturnoQueCruzaLaMedianocheSeAcepta() {
        var f = formulario(TipoCambio.PROGRAMADO, ImpactoAsistencial.CRITICO,
                LocalDateTime.of(2026, 12, 2, 23, 0), LocalDateTime.of(2026, 12, 3, 2, 0), "Formato físico F-ADM-03");
        assertThatCode(() -> validador.validarParaGuardar(f)).doesNotThrowAnyException();
    }

    @Test
    void criticoUrgentePuedeSerDeDia() {
        var f = formulario(TipoCambio.URGENTE, ImpactoAsistencial.CRITICO,
                LocalDateTime.of(2026, 12, 1, 11, 0), LocalDateTime.of(2026, 12, 1, 12, 0), "Formato físico");
        assertThatCode(() -> validador.validarParaGuardar(f)).doesNotThrowAnyException();
    }

    @Test
    void programadoEnElPasadoSeRechaza() {
        var f = formulario(TipoCambio.PROGRAMADO, ImpactoAsistencial.BAJO,
                LocalDateTime.of(2026, 12, 1, 9, 0), LocalDateTime.of(2026, 12, 1, 9, 30), null);
        assertThatThrownBy(() -> validador.validarParaGuardar(f)).hasMessage("Programe la intervención en una fecha futura.");
    }

    @Test
    void altoSinPlanDeContinuidadSeRechaza() {
        var f = formulario(TipoCambio.PROGRAMADO, ImpactoAsistencial.ALTO,
                LocalDateTime.of(2026, 12, 2, 22, 0), LocalDateTime.of(2026, 12, 2, 23, 0), "  ");
        assertThatThrownBy(() -> validador.validarParaGuardar(f))
                .isInstanceOf(ReglaNegocioException.class)
                .extracting("campo").isEqualTo("planReversa.planContinuidad");
    }

    @Test
    void enviarSinHorarioSeRechaza() {
        SolicitudCambio s = SolicitudCambio.builder().tipo(TipoCambio.PROGRAMADO).build();
        assertThatThrownBy(() -> validador.validarParaEnviar(s)).hasMessage("Defina el horario programado de intervención.");
    }

    @Test
    void advierteAreaCriticaConImpactoMenor() {
        Area emergencia = Area.builder().idArea(1).nombre("Emergencia Admisión").prioridadDefecto("P1").build();
        SolicitudCambio s = SolicitudCambio.builder().impacto(ImpactoAsistencial.MEDIO).build();
        s.getAreasAfectadas().add(emergencia);
        assertThat(validador.advertencias(s)).containsExactly(
                "Seleccionó un área crítica. Le sugerimos marcar el impacto como crítico.");
    }
}
```

#### Calculadora de compromisos de atención

```java
package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.EstadoSLA;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraCompromisoAtencionTest {

    private static final LocalDateTime CREACION = LocalDateTime.of(2026, 12, 1, 10, 0);
    private static final LocalDateTime LIMITE_P1 = CREACION.plusMinutes(60);

    @ParameterizedTest(name = "a los {0} min → {1}")
    @CsvSource({
            "0,  DENTRO_TIEMPO",
            "41, DENTRO_TIEMPO",   // 68 %
            "42, POR_VENCER",      // 70 % exacto
            "59, POR_VENCER",
            "60, VENCIDO",         // 100 % exacto
            "300, VENCIDO"
    })
    void umbrales(int minutos, EstadoSLA esperado) {
        var ev = CalculadoraCompromisoAtencion.evaluar(CREACION, LIMITE_P1, CREACION.plusMinutes(minutos), 0.70);
        assertThat(ev.estado()).isEqualTo(esperado);
    }

    @Test
    void plazoMalConfiguradoNoDivideEntreCero() {
        var ev = CalculadoraCompromisoAtencion.evaluar(CREACION, CREACION, CREACION, 0.70);
        assertThat(ev.estado()).isEqualTo(EstadoSLA.VENCIDO);
    }

    @Test
    void elOrdenDeGravedadNoDebeCambiar() {
        assertThat(CalculadoraCompromisoAtencion.esMasGrave(EstadoSLA.POR_VENCER, EstadoSLA.DENTRO_TIEMPO)).isTrue();
        assertThat(CalculadoraCompromisoAtencion.esMasGrave(EstadoSLA.VENCIDO, EstadoSLA.POR_VENCER)).isTrue();
        assertThat(CalculadoraCompromisoAtencion.esMasGrave(EstadoSLA.DENTRO_TIEMPO, EstadoSLA.VENCIDO)).isFalse();
    }
}
```

#### Evaluador del monitor (Mockito)

```java
package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.CompromisoAtencionCambiadoEvento;
import com.hospital.servicedesk.repositories.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.*;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluadorCompromisosAtencionTest {

    @Mock TicketRepository ticketRepository;
    @Mock AuditoriaTicketService auditoria;
    @Mock ApplicationEventPublisher eventos;
    @Mock PlatformTransactionManager txManager;

    private EvaluadorCompromisosAtencion evaluador;
    private final LocalDateTime creacion = LocalDateTime.of(2026, 12, 1, 10, 0);

    @BeforeEach
    void preparar() {
        // 10:45 en Lima ⇒ 75 % de un P1 de 60 min
        Clock reloj = Clock.fixed(Instant.parse("2026-12-01T15:45:00Z"), ZoneId.of("America/Lima"));
        lenient().when(txManager.getTransaction(any())).thenReturn(new SimpleTransactionStatus());
        evaluador = new EvaluadorCompromisosAtencion(ticketRepository, auditoria, eventos,
                new PropiedadesCompromisoAtencion(true, 60000, 0.70, 200, List.of()), txManager, reloj);
    }

    private Ticket ticketP1(EstadoSLA estadoSla) {
        return Ticket.builder().idTicket(7).asunto("Impresora de pulseras sin imprimir")
                .prioridad(Prioridad.CRITICA).estado(EstadoTicket.EN_PROGRESO).estadoSla(estadoSla)
                .area(Area.builder().nombre("Emergencia Admisión").build())
                .fechaCreacion(creacion).fechaLimiteResolucion(creacion.plusMinutes(60)).build();
    }

    @Test
    void pasaARiesgoAuditaYPublicaUnaSolaVez() {
        when(ticketRepository.idsParaMonitoreo(any(), eq(EstadoSLA.VENCIDO), eq(0), any())).thenReturn(List.of(7));
        when(ticketRepository.findConAreaYTecnicoByIdTicket(7)).thenReturn(Optional.of(ticketP1(EstadoSLA.DENTRO_TIEMPO)));
        when(ticketRepository.avanzarEstadoCompromiso(eq(7), eq(EstadoSLA.DENTRO_TIEMPO), eq(EstadoSLA.POR_VENCER), any()))
                .thenReturn(1);

        ResumenCicloMonitor resumen = evaluador.ejecutarCiclo();

        assertThat(resumen.pasaronARiesgo()).isEqualTo(1);
        verify(auditoria).registrar(argThat(r -> "COMPROMISO_EN_RIESGO".equals(r.accion()) && r.actor() == null));
        ArgumentCaptor<CompromisoAtencionCambiadoEvento> evento = ArgumentCaptor.forClass(CompromisoAtencionCambiadoEvento.class);
        verify(eventos).publishEvent(evento.capture());
        assertThat(evento.getValue().estadoNuevo()).isEqualTo(EstadoSLA.POR_VENCER);
        assertThat(evento.getValue().areaNombre()).isEqualTo("Emergencia Admisión");
    }

    @Test
    void siYaEstabaEnRiesgoNoRepiteLaAlerta() {
        when(ticketRepository.idsParaMonitoreo(any(), any(), eq(0), any())).thenReturn(List.of(7));
        when(ticketRepository.findConAreaYTecnicoByIdTicket(7)).thenReturn(Optional.of(ticketP1(EstadoSLA.POR_VENCER)));

        evaluador.ejecutarCiclo();

        verify(ticketRepository, never()).avanzarEstadoCompromiso(any(), any(), any(), any());
        verifyNoInteractions(eventos, auditoria);
    }

    @Test
    void siOtroProcesoGanoLaCarreraNoNotifica() {
        when(ticketRepository.idsParaMonitoreo(any(), any(), eq(0), any())).thenReturn(List.of(7));
        when(ticketRepository.findConAreaYTecnicoByIdTicket(7)).thenReturn(Optional.of(ticketP1(EstadoSLA.DENTRO_TIEMPO)));
        when(ticketRepository.avanzarEstadoCompromiso(any(), any(), any(), any())).thenReturn(0);

        assertThat(evaluador.ejecutarCiclo().pasaronARiesgo()).isZero();
        verifyNoInteractions(eventos, auditoria);
    }

    @Test
    void unTicketConErrorNoDetieneAlResto() {
        when(ticketRepository.idsParaMonitoreo(any(), any(), eq(0), any())).thenReturn(List.of(7, 8));
        when(ticketRepository.findConAreaYTecnicoByIdTicket(7)).thenThrow(new IllegalStateException("dato corrupto"));
        when(ticketRepository.findConAreaYTecnicoByIdTicket(8)).thenReturn(Optional.empty());

        ResumenCicloMonitor resumen = evaluador.ejecutarCiclo();

        assertThat(resumen.evaluados()).isEqualTo(2);
        assertThat(resumen.errores()).isEqualTo(1);
    }
}
```

#### Búsqueda

```java
class NormalizadorBusquedaTest {
    @Test void quitaTildesYConservaLaEnie() {
        assertThat(NormalizadorBusqueda.normalizar("  Admisión  CENTRAL ")).isEqualTo("admision central");
        assertThat(NormalizadorBusqueda.normalizar("Año")).isEqualTo("año");
        assertThat(NormalizadorBusqueda.normalizar("Niños")).isEqualTo("niños");
    }
    @Test void eliminaComodinesDeLike() {
        assertThat(NormalizadorBusqueda.tokens("100% _x a")).containsExactly("100");  // "x" y "a" < 2 letras
    }
}
```

```java
class PuntuadorGuiasTest {

    private ErrorConocido guia(int id, String titulo, String sintoma, List<String> claves, int util) {
        ErrorConocido g = ErrorConocido.builder().idError(id).titulo(titulo).sintoma(sintoma)
                .descripcionProblema("").conteoUtil(util).build();
        g.getPalabrasClave().addAll(claves);
        return g;
    }

    @Test void tituloPesaMasQueSintoma() {
        var enTitulo = guia(1, "Impresora de pulseras", null, List.of(), 0);
        var enSintoma = guia(2, "Atasco", "la impresora parpadea", List.of(), 50);
        assertThat(PuntuadorGuias.ordenar(List.of(enSintoma, enTitulo), List.of("impresora")))
                .extracting(ErrorConocido::getIdError).containsExactly(1, 2);
    }

    @Test void sinTextoOrdenaPorUtilidad() {
        var a = guia(1, "A", null, List.of(), 3);
        var b = guia(2, "B", null, List.of(), 9);
        assertThat(PuntuadorGuias.ordenar(List.of(a, b), List.of()))
                .extracting(ErrorConocido::getIdError).containsExactly(2, 1);
    }
}
```

### 7.3 Tests de integración (MockMvc + H2)

```java
package com.hospital.servicedesk.administrativo.cambios.api;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional   // cada test revierte sus datos
class SolicitudCambioControllerIntegracionTest {

    private static final String TECNICO = "tec.it@hsmsi.gob.pe";
    private static final String ADMIN_EVALUADOR = "jefe.it@hsmsi.gob.pe";
    private static final String ASISTENCIAL = "enf.it@hsmsi.gob.pe";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired AreaRepository areas;

    private Integer idEmergencia;

    @BeforeEach
    void sembrar() {
        Area emergencia = areas.save(Area.builder().nombre("Emergencia IT").piso("Piso 1").prioridadDefecto("P1").build());
        idEmergencia = emergencia.getIdArea();
        crearUsuario(TECNICO, "TECNICO", emergencia);
        crearUsuario(ADMIN_EVALUADOR, "ADMINISTRADOR", emergencia);
        crearUsuario(ASISTENCIAL, "USUARIO_FINAL", emergencia);
    }

    private void crearUsuario(String correo, String rol, Area area) {
        usuarios.save(Usuario.builder().correo(correo).nombreUsuario(correo.split("@")[0])
                .nombres("Prueba").apellidos(rol).rol(rol).area(area)
                .contrasenaHash("x".getBytes()).build());
    }

    /** URGENTE: evita depender del reloj real para la ventana de inicio (V5 / V13). */
    private String cuerpo(String titulo) {
        return """
            {
              "titulo": "%s",
              "tipo": "URGENTE",
              "categoria": "SISTEMA_CLINICO",
              "descripcion": "Aplicar parche del módulo de admisión",
              "justificacion": "Emergencia no puede registrar pacientes nuevos desde las 08:00",
              "equiposAfectados": ["srv-ti-01"],
              "idTicketOrigen": null,
              "responsableEjecucion": "Lucía Rojas",
              "horario": { "inicioIso": "2030-01-10T22:00:00", "finIso": "2030-01-10T23:00:00" },
              "evaluacion": {
                "nivel": "CRITICO",
                "idsAreasAfectadas": [%d],
                "requiereInterrupcion": true,
                "minutosInterrupcion": 20,
                "serviciosAfectados": ["Registro de admisión"],
                "pacientesPotencialmenteAfectados": "Pacientes en sala de espera de Emergencia",
                "descripcion": "Admisión de Emergencia sin sistema por 20 minutos"
              },
              "pasosImplementacion": [ { "descripcion": "Respaldar base de datos", "minutosEstimados": 10 } ],
              "planReversa": {
                "criterioActivacion": "Si a los 15 min no se registran admisiones",
                "pasos": [ { "descripcion": "Restaurar respaldo" } ],
                "minutosEstimados": 15,
                "planContinuidad": "Admisión registra en formato físico F-ADM-03",
                "responsableReversa": "Lucía Rojas"
              }
            }
            """.formatted(titulo, idEmergencia);
    }

    private int crear() throws Exception {
        MvcResult r = mvc.perform(post("/api/rfc").with(user(TECNICO).roles("TECNICO"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("Parche urgente del módulo de admisión")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/solicitudes-cambio/")))
                .andExpect(jsonPath("$.codigo", matchesPattern("SC-\\d{4}-\\d{4}")))
                .andExpect(jsonPath("$.estado").value("BORRADOR"))
                .andExpect(jsonPath("$.riesgo").value("ALTO"))
                .andExpect(jsonPath("$.equiposAfectados[0]").value("SRV-TI-01"))
                .andExpect(jsonPath("$.accionesPermitidas", hasItems("ENVIAR_EVALUACION", "CANCELAR")))
                .andReturn();
        return com.jayway.jsonpath.JsonPath.read(r.getResponse().getContentAsString(), "$.id");
    }

    private void transicionar(int id, String correo, String rol, String accion, String obs, int esperado) throws Exception {
        mvc.perform(put("/api/rfc/{id}/decision", id).with(user(correo).roles(rol))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"accion\":\"%s\",\"observacion\":%s}".formatted(accion, obs == null ? "null" : "\"" + obs + "\"")))
                .andExpect(status().is(esperado));
    }

    @Test
    void cicloCompletoConSegregacionDeFunciones() throws Exception {
        int id = crear();
        transicionar(id, TECNICO, "TECNICO", "ENVIAR_EVALUACION", null, 200);
        transicionar(id, TECNICO, "TECNICO", "APROBAR", null, 403);                 // un técnico no decide
        transicionar(id, ADMIN_EVALUADOR, "ADMINISTRADOR", "APROBAR", "Conforme", 200);
        transicionar(id, TECNICO, "TECNICO", "INICIAR_EJECUCION", null, 200);
        transicionar(id, TECNICO, "TECNICO", "MARCAR_IMPLEMENTADO", null, 400);     // resultado obligatorio
        transicionar(id, TECNICO, "TECNICO", "MARCAR_IMPLEMENTADO", "Parche aplicado sin incidencias", 200);

        mvc.perform(get("/api/solicitudes-cambio/{id}", id).with(user(TECNICO).roles("TECNICO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("IMPLEMENTADO"))
                .andExpect(jsonPath("$.historial", hasSize(5)))       // CREAR + 4 transiciones exitosas (los 403/400 no dejan huella)
                .andExpect(jsonPath("$.accionesPermitidas", empty()));
    }

    @Test
    void transicionInvalidaDevuelve409() throws Exception {
        int id = crear();
        mvc.perform(put("/api/rfc/{id}/decision", id).with(user(ADMIN_EVALUADOR).roles("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"accion\":\"APROBAR\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(containsString("«Borrador»")))
                .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void personalAsistencialNoAccedeAlModulo() throws Exception {
        mvc.perform(get("/api/rfc").with(user(ASISTENCIAL).roles("USUARIO_FINAL")))
                .andExpect(status().isForbidden());
    }

    @Test
    void validacionDevuelveErroresPorCampo() throws Exception {
        mvc.perform(post("/api/rfc").with(user(TECNICO).roles("TECNICO"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("Corto")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.titulo").value("Describa el cambio en al menos 10 caracteres."));
    }

    @Test
    void enumInvalidoDevuelve400Limpio() throws Exception {
        mvc.perform(get("/api/rfc").param("estado", "INEXISTENTE").with(user(TECNICO).roles("TECNICO")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(not(containsString("Exception"))));
    }

    @Test
    void soloSeEliminaEnBorrador() throws Exception {
        int id = crear();
        transicionar(id, TECNICO, "TECNICO", "ENVIAR_EVALUACION", null, 200);
        mvc.perform(delete("/api/rfc/{id}", id).with(user(TECNICO).roles("TECNICO")))
                .andExpect(status().isConflict());
    }

    @Test
    void busquedaSinTildes() throws Exception {
        crear();
        mvc.perform(get("/api/rfc").param("texto", "ADMISION").with(user(TECNICO).roles("TECNICO")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }
}
```

> `com.jayway.jsonpath.JsonPath` viene con `spring-boot-starter-test` (transitivo de `*-webmvc-test`).

**Guías — seguridad por ámbito:**

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GuiaSolucionControllerIntegracionTest {

    @Autowired MockMvc mvc;
    @Autowired ErrorConocidoRepository guias;
    @Autowired UsuarioRepository usuarios;
    @Autowired AreaRepository areas;

    private Integer idInterna;

    @BeforeEach
    void sembrar() {
        Area a = areas.save(Area.builder().nombre("Triaje IT").build());
        usuarios.save(Usuario.builder().correo("enf@hsmsi.gob.pe").nombreUsuario("enf").nombres("E").apellidos("F")
                .rol("USUARIO_FINAL").area(a).contrasenaHash("x".getBytes()).build());
        usuarios.save(Usuario.builder().correo("tec@hsmsi.gob.pe").nombreUsuario("tec").nombres("T").apellidos("C")
                .rol("TECNICO").area(a).contrasenaHash("x".getBytes()).build());
        idInterna = guardar("Reinicio de la cola de impresión", AmbitoGuia.INTERNO_TECNICO);
        guardar("La impresora de pulseras no imprime en Admisión", AmbitoGuia.PUBLICO_ASISTENCIAL);
    }

    private Integer guardar(String titulo, AmbitoGuia ambito) {
        ErrorConocido g = ErrorConocido.builder().titulo(titulo).descripcionProblema("Resumen")
                .solucionTrabajo("Paso 1").ambito(ambito).categoria(CategoriaGuia.IMPRESORAS_TERMICAS)
                .fechaCreacion(java.time.LocalDateTime.now()).build();
        g.recalcularTextoBusqueda();
        return guias.save(g).getIdError();
    }

    @Test
    void asistencialSoloVePublicasAunquePidaInternas() throws Exception {
        mvc.perform(get("/api/conocimiento").param("ambito", "INTERNO_TECNICO").with(user("enf@hsmsi.gob.pe").roles("USUARIO_FINAL")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido", hasSize(1)))
                .andExpect(jsonPath("$.contenido[0].esPublico").value(true));
    }

    @Test
    void guiaInternaEsInvisibleParaAsistencial() throws Exception {
        mvc.perform(get("/api/conocimiento/{id}", idInterna).with(user("enf@hsmsi.gob.pe").roles("USUARIO_FINAL")))
                .andExpect(status().isNotFound());
    }

    @Test
    void busquedaSinTildesYConVariasPalabras() throws Exception {
        mvc.perform(get("/api/conocimiento").param("texto", "impresora admision").with(user("tec@hsmsi.gob.pe").roles("TECNICO")))
                .andExpect(jsonPath("$.contenido", hasSize(1)))
                .andExpect(jsonPath("$.contenido[0].titulo").value(containsString("pulseras")));
    }

    @Test
    void asistencialNoPuedeCrearGuias() throws Exception {
        mvc.perform(post("/api/conocimiento").with(user("enf@hsmsi.gob.pe").roles("USUARIO_FINAL"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"titulo":"Guía nueva","resumen":"x","solucionTemporal":"y","categoriaId":1}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    void votarDosVecesNoDuplica() throws Exception {
        Integer idPublica = guias.findAll().stream().filter(ErrorConocido::esPublica).findFirst().orElseThrow().getIdError();
        for (int i = 0; i < 2; i++) {
            mvc.perform(post("/api/conocimiento/{id}/voto", idPublica).with(user("enf@hsmsi.gob.pe").roles("USUARIO_FINAL"))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"esUtil\":true}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.conteoUtil").value(1));
        }
    }
}
```

### 7.4 Colección de pruebas manuales (cURL + JWT)

Requisitos: backend en `localhost:8080`, migraciones V1_3–V1_6 ejecutadas, semilla de personal activa, `jq` instalado.

```bash
API=http://localhost:8080/api
CLAVE="$SEMILLA_CLAVE_INICIAL"   # del .env; nunca la pegues en el PR

login() {  # $1 = correo
  curl -s -X POST "$API/auth/login" -H 'Content-Type: application/json' \
       -d "{\"correo\":\"$1\",\"contrasena\":\"$CLAVE\"}" | jq -r .token
}

T_TEC=$(login tec.soporte2@hsmsi.gob.pe)
T_JEFE=$(login jefe.ti@hsmsi.gob.pe)
T_ENF=$(login enf.emergencia@hsmsi.gob.pe)
# El admin base de DataInitializer usa su propia clave; para el monitor basta con jefe.ti (ADMINISTRADOR).
```

> Si `debeCambiarContrasena = true` bloquea el uso del token en tu flujo de login, cambia la clave primero con el endpoint de `CuentaController` o pon `debe_cambiar_contrasena = 0` **solo en tu BD local**.

**Solicitudes de cambio**

```bash
# 1. Áreas seleccionables (esCritica = prioridad P1)
curl -s "$API/rfc/areas-seleccionables" -H "Authorization: Bearer $T_TEC" | jq '.[] | select(.esCritica)'

ID_EME=$(curl -s "$API/rfc/areas-seleccionables" -H "Authorization: Bearer $T_TEC" \
         | jq '.[] | select(.nombre=="Emergencia Admisión") | .idArea')

# 2. Crear borrador (impacto crítico, horario nocturno de mañana)
MANANA=$(date -d tomorrow +%F)
ID=$(curl -s -X POST "$API/rfc" -H "Authorization: Bearer $T_TEC" -H 'Content-Type: application/json' -d @- <<EOF | jq .id
{
  "titulo": "Actualizar módulo de admisión del sistema clínico",
  "tipo": "PROGRAMADO", "categoria": "SISTEMA_CLINICO",
  "descripcion": "Actualización a la versión 4.2 del módulo de admisión",
  "justificacion": "Corrige la duplicidad de historias clínicas reportada por Admisión",
  "equiposAfectados": ["SRV-TI-01", "PC-EME-01"],
  "horario": { "inicioIso": "${MANANA}T22:00:00", "finIso": "${MANANA}T23:30:00" },
  "evaluacion": { "nivel": "CRITICO", "idsAreasAfectadas": [$ID_EME], "requiereInterrupcion": true,
                  "minutosInterrupcion": 30, "serviciosAfectados": ["Registro de admisión", "Impresión de pulseras"],
                  "descripcion": "Emergencia registrará en papel durante 30 minutos" },
  "pasosImplementacion": [ { "descripcion": "Respaldar base de datos", "minutosEstimados": 20 },
                           { "descripcion": "Desplegar versión 4.2", "minutosEstimados": 30 } ],
  "planReversa": { "criterioActivacion": "Si a los 15 min no se registran admisiones",
                   "pasos": [ { "descripcion": "Restaurar respaldo" } ], "minutosEstimados": 25,
                   "planContinuidad": "Admisión registra en formato físico F-ADM-03",
                   "responsableReversa": "Lucía Rojas" }
}
EOF
); echo "Solicitud creada: $ID"

# 3. Detalle (código SC-AAAA-NNNN, riesgo ALTO, accionesPermitidas, advertencias)
curl -s "$API/solicitudes-cambio/$ID" -H "Authorization: Bearer $T_TEC" | jq '{codigo, estado, riesgo, accionesPermitidas, advertencias}'

# 4. Enviar a evaluación (técnico) → 200
curl -s -X PUT "$API/rfc/$ID/decision" -H "Authorization: Bearer $T_TEC" -H 'Content-Type: application/json' \
     -d '{"accion":"ENVIAR_EVALUACION"}' | jq .estado

# 5. El técnico intenta aprobar → 403
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$API/rfc/$ID/decision" -H "Authorization: Bearer $T_TEC" \
     -H 'Content-Type: application/json' -d '{"accion":"APROBAR"}'

# 6. Rechazar sin motivo → 400 ; aprobar (jefe.ti) → 200
curl -s -X PUT "$API/rfc/$ID/decision" -H "Authorization: Bearer $T_JEFE" -H 'Content-Type: application/json' \
     -d '{"accion":"RECHAZAR"}' | jq '{status, message}'
curl -s -X PUT "$API/rfc/$ID/decision" -H "Authorization: Bearer $T_JEFE" -H 'Content-Type: application/json' \
     -d '{"accion":"APROBAR","observacion":"Conforme. Coordinar con jefatura de Emergencia."}' | jq '{estado, aprobador}'

# 7. Iniciar antes de hora → 409 (V13)
curl -s -X PUT "$API/rfc/$ID/decision" -H "Authorization: Bearer $T_TEC" -H 'Content-Type: application/json' \
     -d '{"accion":"INICIAR_EJECUCION"}' | jq '{status, message}'

# 8. Editar fuera de borrador → 409 ; personal asistencial → 403
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$API/rfc/$ID" -H "Authorization: Bearer $T_TEC"
curl -s -o /dev/null -w '%{http_code}\n' "$API/rfc" -H "Authorization: Bearer $T_ENF"

# 9. Listado con filtros
curl -s "$API/rfc?estado=APROBADO&impacto=CRITICO&texto=admision" -H "Authorization: Bearer $T_TEC" | jq '.[] | {codigo, titulo}'
```

**Centro de Soluciones y Guías**

```bash
# Búsqueda sin tildes, varias palabras (AND)
curl -s "$API/conocimiento?texto=pulsera%20zebra" -H "Authorization: Bearer $T_ENF" | jq '.contenido[] | {id, titulo, esPublico}'

# Asistencial pidiendo internas → solo recibe públicas
curl -s "$API/conocimiento?ambito=INTERNO_TECNICO" -H "Authorization: Bearer $T_ENF" | jq '[.contenido[].esPublico] | unique'

# Guía interna por id para asistencial → 404
ID_INT=$(curl -s "$API/conocimiento?ambito=INTERNO_TECNICO" -H "Authorization: Bearer $T_TEC" | jq '.contenido[0].id')
curl -s -o /dev/null -w '%{http_code}\n' "$API/conocimiento/$ID_INT" -H "Authorization: Bearer $T_ENF"

# Crear guía con pasos y precauciones (técnico)
curl -s -X POST "$API/conocimiento" -H "Authorization: Bearer $T_TEC" -H 'Content-Type: application/json' -d '{
  "titulo": "El lector de código de barras no lee la pulsera",
  "resumen": "Qué hacer si el lector no reconoce la pulsera del paciente.",
  "sintoma": "El lector emite pitido de error o no enciende la luz roja.",
  "solucionTemporal": "Digitar el número de historia clínica manualmente.",
  "categoriaId": 4, "ambito": "PUBLICO_ASISTENCIAL",
  "pasos": ["Verifique que el cable USB esté conectado.", "Limpie la ventana del lector con un paño seco.", "Pruebe con otra pulsera."],
  "precauciones": ["Si digita el número manualmente, confírmelo con el paciente antes de administrar medicación."],
  "palabrasClave": "lector, codigo de barras, pulsera",
  "nivelDificultad": "BASICO", "minutosEstimados": 3
}' | jq '{id, categoriaNombre, pasos, precauciones, palabrasClave}'

# Voto (dos veces = un solo voto) y visita
curl -s -X POST "$API/conocimiento/1/voto" -H "Authorization: Bearer $T_ENF" -H 'Content-Type: application/json' -d '{"esUtil":true}' | jq .conteoUtil
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/conocimiento/1/visita" -H "Authorization: Bearer $T_ENF"

# Conteo por categoría y destacados
curl -s "$API/conocimiento/categorias" -H "Authorization: Bearer $T_ENF" | jq
curl -s "$API/conocimiento/destacados?limite=3" -H "Authorization: Bearer $T_ENF" | jq '.[].titulo'
```

**Monitor de compromisos de atención**

```bash
# 1. Crear un ticket P1 (impacto ALTO + urgencia ALTA) con el endpoint de tickets existente
#    y anotar su id en $TK. Luego, solo en tu BD LOCAL, simular que pasaron 45 minutos:
docker exec -it bd_sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$DB_PASSWORD" -d db_servicedesk -C -Q \
  "UPDATE dbo.ticket SET fecha_creacion = DATEADD(MINUTE,-45,SYSDATETIME()),
          fecha_limite_resolucion = DATEADD(MINUTE,15,SYSDATETIME()) WHERE id_ticket = $TK"

# 2. Forzar un ciclo (no esperar 60 s) → pasaronARiesgo = 1
curl -s -X POST "$API/admin/compromisos-atencion/evaluar" -H "Authorization: Bearer $T_JEFE" | jq

# 3. Repetir el ciclo → pasaronARiesgo = 0 (idempotente, sin correo repetido)
curl -s -X POST "$API/admin/compromisos-atencion/evaluar" -H "Authorization: Bearer $T_JEFE" | jq .pasaronARiesgo

# 4. Ver el historial del ticket (registro COMPROMISO_EN_RIESGO, sin usuario, con motivo "...75 %...")
curl -s "$API/tickets/$TK/historial" -H "Authorization: Bearer $T_TEC" | jq

# 5. En el log del backend debe aparecer, en un hilo "hsmsi-notif-*":
#    "Sin SMTP configurado. Alerta simulada «Compromiso de atención en riesgo — Ticket #..."

# 6. Un técnico no puede disparar el monitor → 403
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$API/admin/compromisos-atencion/evaluar" -H "Authorization: Bearer $T_TEC"
```

> Ajusta la ruta del historial de tickets a la real de `TicketController`.

---

## 8. Checklist de validación y entrega antes del PR

### 8.1 Arquitectura y código

- [ ] Controladores sin lógica de negocio; solo `@Valid`, `ResolutorContextoActor`, delegar y responder.
- [ ] Todos los DTOs nuevos son `record`; ninguna entidad sale por la API.
- [ ] Entidades nuevas sin `@Data`; colecciones modificadas con `clear()` + `addAll()`.
- [ ] Cero `LocalDateTime.now()` sin `clock` en código nuevo: `grep -rn "LocalDateTime.now()" src/main/java/com/hospital/servicedesk/{administrativo/cambios,administrativo/conocimiento,operaciones,compartido}` → vacío.
- [ ] Inyección por constructor (`@RequiredArgsConstructor` o constructor explícito); sin `@Autowired` en campos.
- [ ] `HistorialTicket.fechaAccion` y `ErrorConocido.fechaCreacion` ya no son `insertable = false`.

### 8.2 Seguridad

- [ ] `@PreAuthorize` en los 3 controladores nuevos; `ErrorConocidoController` eliminado o protegido.
- [ ] `USUARIO_FINAL`: 403 en `/api/rfc`, 404 en guía interna, nunca ve internas en búsquedas.
- [ ] Segregación: quien registra una solicitud no puede aprobarla (probado).
- [ ] Ninguna respuesta de error contiene *stack trace*, nombre de clase ni SQL.
- [ ] Cero credenciales en el código, scripts, tests o PR: `git diff main --stat` y revisa que no se suba `.env`.
- [ ] `SemillaPersonalHsmsi` desactivada por defecto (`SEMILLA_PERSONAL_HABILITADO=false`).

### 8.3 Datos y migraciones

- [ ] V1_3–V1_6 ejecutadas **dos veces seguidas** sin error (idempotencia).
- [ ] Literales con `N'…'`; `-b -I` en `sqlcmd`.
- [ ] Matriz `configuracion_sla` coincide con `calcPri()`.
- [ ] Equipos sin área reportados por el `SELECT` de V1_6 = 0 filas.

### 8.4 Funcionalidad

- [ ] Ciclo completo de una solicitud y rechazo recorridos con cURL; historial con usuario e IP.
- [ ] `/api/rfc` y `/api/solicitudes-cambio` responden igual.
- [ ] Búsqueda de guías: "admision" = "admisión"; "zebra pulsera" exige ambas; vacía ordena por utilidad.
- [ ] Monitor: P1 al 75 % ⇒ en riesgo + auditoría + correo simulado en hilo `hsmsi-notif-*`; segundo ciclo no repite.
- [ ] Plazo de un ticket nuevo sale de `configuracion_sla` (P1 = 60 min), no de `plusHours`.

### 8.5 Calidad y vocabulario

- [ ] `./mvnw -q test-compile` sin errores.
- [ ] `./mvnw test` en verde (incluidos los tests existentes: `TicketServiceTest`, `SlaAndAuditServiceTest`, `ApiContractTest`, `ErrorConocidoServiceTest` adaptado).
- [ ] `grep` de vocabulario de §2.7 → cero resultados.
- [ ] `docs/matriz_endpoints.md` actualizado con los endpoints 🆕 de §3.10 y §4.8, y los de `/api/admin/compromisos-atencion`.

### 8.6 Git y PR

- [ ] Rama `feat/backend-cambios-guias-compromisos` desde `main` actualizado.
- [ ] Commits con Conventional Commits según `docs/guia_git_commits.md`, uno por bloque lógico, por ejemplo:
  - `feat(auditoria): ampliar historial de tickets con estados, motivo e ip`
  - `feat(cambios): agregar solicitudes de cambio con maquina de estados y validaciones`
  - `feat(conocimiento): extender guias con pasos, precauciones, ambito y busqueda sin tildes`
  - `feat(compromisos): agregar monitor programado y alertas asincronas`
  - `feat(db): agregar migraciones v1_3 a v1_6 y semilla de personal`
  - `test(cambios): cubrir flujo, validador y endpoints`
- [ ] Descripción del PR con: resumen, cómo probar (comandos de §7.4), capturas de `./mvnw test`, y sección **"Notas para frontend (Fernando)"**:
  1. Nuevo estado `CANCELADO` y acción `CANCELAR`.
  2. Usar `accionesPermitidas` y `advertencias` del detalle.
  3. `GET /api/rfc/areas-seleccionables` con `esCritica` (eliminar lista *hardcodeada*).
  4. Fechas sin zona (`"2026-12-02T21:00:00"`), no `toISOString()`.
  5. `mapearArticuloConocimiento` debe leer `pasos`, `precauciones`, `sintoma`, `causaRaiz`, `solucionTemporal` cuando vengan.
  6. Llamar a `POST /api/conocimiento/{id}/visita` al abrir el detalle.
  7. `categoriaId` 1–5 confirmados.

---

## 9. Anexos

### 9.1 Orden de implementación recomendado

| Etapa | Entregable | Verificación |
|---|---|---|
| 1 | §2.3 manejadores, §2.4 `ContextoActor`, §2.5 auditoría, §2.6 `Clock` | `./mvnw test` sigue verde |
| 2 | V1_3 + Módulo 1 completo + sus tests | tests §7.2/§7.3 de cambios |
| 3 | V1_4 + Módulo 2 + tests | tests de guías, cURL de guías |
| 4 | V1_5 + Módulo 3 + corrección del plazo + tests | cURL del monitor |
| 5 | V1_6 + semillero de personal | `SELECT` de verificación, login de cada rol |
| 6 | Checklist §8, matriz de endpoints, PR | — |

### 9.2 Glosario interno ↔ pantalla

| Código / BD | Pantalla y mensajes |
|---|---|
| `SolicitudCambio`, `/api/rfc` | Solicitud de cambio técnico |
| `EN_EVALUACION` | En evaluación (comité de evaluación técnica) |
| `criterioReversa`, `pasosReversa` | Plan de reversa |
| `planContinuidad` | Plan de continuidad asistencial |
| `EstadoSLA.DENTRO_TIEMPO / POR_VENCER / VENCIDO` | Compromiso de atención: En tiempo / En riesgo / Vencido |
| `configuracion_sla` | Compromisos de atención |
| `ErrorConocido`, `/api/kedb` | Centro de Soluciones y Guías |
| `AmbitoGuia.PUBLICO_ASISTENCIAL` | Para el personal asistencial |
| `AmbitoGuia.INTERNO_TECNICO` | Uso interno del equipo técnico |
| `ElementoConfiguracion` | Equipo (Catálogo de Equipos y Red) |
| `Prioridad.CRITICA` | P1 · Crítica |

### 9.3 Archivos de referencia en el repo

| Necesitas… | Mira… |
|---|---|
| Estilo de módulo por capas | `administrativo/equipos/` (api, aplicacion, dominio, dto, mapper) |
| Reglas puras con estrategia | `administrativo/equipos/dominio/ip/ValidadorIp.java` |
| `@ConfigurationProperties` | `administrativo/equipos/config/PropiedadesRed.java` |
| Envío de correo tolerante a SMTP ausente | `services/impl/CorreoServiceImpl.java` |
| Resolución segura de IP | `security/red/ResolutorIpCliente.java` |
| Respuesta paginada | `dtos/PaginaRespuesta.java` |
| Formato de errores | `exceptions/GlobalExceptionHandler.java`, `dtos/ErrorResponse.java` |
| Contrato del frontend de cambios y guías | `docs/fernando.md` §3.2, §3.4, §4.3, §4.4 |
| Patrón de migraciones | `db/migraciones/V1_1__gestion_areas_personal_equipos.sql` |

---

**¿Dudas?** Antes de inventar una regla, pregunta a Arquitectura: es más barato aclarar un estado de la máquina que migrar datos mal guardados en producción. ¡Éxitos, Fabrizio!
