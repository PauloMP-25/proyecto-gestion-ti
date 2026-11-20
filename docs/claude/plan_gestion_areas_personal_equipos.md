# Plan de Implementación — Módulo de Gestión de Áreas Hospitalarias, Personal y Equipos

> **Proyecto:** Mesa de Ayuda HSMSI (Hospital Santa María del Socorro)
> **Autor:** Arquitecto de Software (Claude)
> **Ejecutor:** Agente Obrero (Antigravity)
> **Validación funcional:** Usuario responsable del proyecto (pruebas de flujos al cierre de cada fase)
> **Versión:** 2.0 — 2026-11-19
> **Rama sugerida:** `feat/gestion-areas-personal-equipos` (crear desde `main` una vez fusionada `refactor/design-system-atomico`)

---

## Registro de cambios

| Versión | Cambio | Secciones afectadas |
|---|---|---|
| 2.0 | **Área simplificada:** se eliminan `codigo` y `pabellon` (el hospital no usa códigos de área ni pabellones rígidos). Se elimina también `segmento_red`: el modelo de Área queda reducido a `nombre`, `piso`, `referenciaUbicacion` (opcional), `anexo`, `idEncargado`, `activo`. La unicidad pasa a ser por `nombre` (sin distinguir mayúsculas ni tildes). | §4.2, §6.1, §8.3, §12 F1/F3/F5 |
| 2.0 | **Código de inventario** ya no depende de un código de área: se sugiere con una estrategia intercambiable (`EstrategiaCodigoInventario`) que deriva una abreviatura del nombre del área en tiempo de ejecución (no se persiste). | §6.3, §3.4 |
| 2.0 | **Enum formal `GradoProfesional`** en backend (Java) y frontend (TypeScript), con valores `LIC`, `TEC`, `DR`, `DRA`, `MG`, `ING`, `SIN_GRADO`, expuesto en `GET /api/catalogos/grados-profesionales` y consumido por el selector del formulario de personal. | §5, §6.5, §8.5 |
| 2.0 | **Nueva sección de arquitectura:** modularidad por dominio, reglas de dependencia verificadas automáticamente, SOLID aplicado, DTO `record` inmutables con Bean Validation, mappers dedicados, patrón Api / Mock / Http + Store con Signals en frontend. | §3 |
| 1.0 | Versión inicial. | — |

---

## 0. Resumen ejecutivo

Este módulo permite que el **administrador registre por sí mismo, desde la interfaz web**, las áreas del hospital, el personal asistencial con su cuenta de acceso y los equipos (computadoras e impresoras) con sus **IPs estáticas**. Con esos datos, al reportar un problema el sistema reconoce automáticamente:

| Pregunta | Fuente de verdad | Ejemplo |
|---|---|---|
| ¿Desde qué máquina? | IP de origen de la conexión TCP (no un encabezado del navegador) → asignación de IP vigente → equipo | `192.168.10.12` → **PC-ADM-02** |
| ¿En qué área está? | Área del equipo detectado | **Admisión** · Primer Piso |
| ¿Qué impresoras hay ahí? | Impresoras activas del mismo área con IP vigente | **IMP-ADM-01**, **IMP-ADM-02** |
| ¿Quién está sentado? | Sesión autenticada (JWT) | **Lic. Patricia Ramos** |

El formulario "Reportar un problema" llega **prellenado** y el usuario solo elige si la falla es en **"esta computadora"** o en **una impresora del área**.

> Nota sobre rotación en Admisión: como el personal rota entre computadoras, **la máquina se determina por la IP y la persona por la sesión, nunca al revés**. No se asocia una PC fija a una persona.

---

## 1. Diagnóstico del estado actual (hallazgos verificados en el código)

### 1.1 Hallazgos de seguridad (se corrigen en F0, antes de cualquier funcionalidad)

| # | Severidad | Ubicación | Problema | Corrección (fase) |
|---|---|---|---|---|
| S1 | **Crítica** | `UsuarioController#getAllUsuarios`, `createUsuario`, `updateUsuario`, `toggleActivo`, `getTecnicosActivos` | Devuelven la entidad `Usuario` serializada directamente → **`contrasenaHash` viaja en el JSON** de `GET /api/usuarios` (y del resto). | DTO `UsuarioRespuesta` sin hash + mapper dedicado. Nunca devolver entidades JPA (§3.6). (F0) |
| S2 | **Crítica** | `TicketController#extractClientIp` | Toma `X-Forwarded-For` **de cualquier cliente** sin verificar que venga de un proxy confiable → cualquiera puede **suplantar la IP** (`curl -H "X-Forwarded-For: 192.168.10.12"`) y reportar como si estuviera en PC-ADM-02. | Resolución de IP basada en `getRemoteAddr()` + `RemoteIpValve` con lista blanca de proxies (§7). (F0) |
| S3 | **Alta** | `SecurityConfig` | `.requestMatchers("/api/auth/login", "/api/tickets").permitAll()` aplica a **todos los métodos** → `GET /api/tickets` (listado completo de tickets) es **público**. Además `POST /api/tickets` es anónimo. | Solo `/api/auth/login` es público. Reportar requiere sesión. (F0) |
| S4 | **Alta** | `SecurityConfig` / controladores | No hay `@EnableMethodSecurity` ni restricciones por rol: **cualquier usuario autenticado puede crear administradores** (`POST /api/usuarios`) o editar áreas/equipos/IPs. | `@EnableMethodSecurity` + `@PreAuthorize("hasRole('ADMINISTRADOR')")` en todo `/api/admin/**`. (F0) |
| S5 | **Alta** | `UsuarioServiceImpl#createUsuario` | Contraseña por defecto **fija** `"Temp2026*"` si no se envía → todas las cuentas nuevas comparten clave conocida. | Contraseña obligatoria con política mínima, o generación aleatoria de un solo uso + `debe_cambiar_contrasena = 1`. (F0/F2) |
| S6 | Media | `UsuarioController#cambiarContrasena` | Si no hay autenticación usa `request.get("correo")` → permitiría cambiar la clave de otro si el endpoint quedara expuesto. Tampoco pide la contraseña actual. | Solo usuario autenticado; exigir `contrasenaActual`. (F0) |
| S7 | Media | `TicketServiceImpl#getContextoCliente` | Si la IP no está registrada, **asigna la primera área de la tabla** (`areaRepo.findAll().stream().findFirst()`) → tickets con área falsa. | Estado explícito `IP_NO_REGISTRADA`; el usuario elige el área manualmente. (F4) |
| S8 | Media | Controladores con `@RequestBody Map<String,Object>` | Sin validación Bean Validation, *mass assignment* (p. ej. enviar `rol: ADMINISTRADOR`). | DTO `record` tipados con `@Valid` (§3.5). (F0–F3) |
| S9 | Baja | Login | Sin limitación de intentos. | Contador de intentos fallidos + bloqueo temporal (15 min tras 5 fallos). (F2) |

### 1.2 Hallazgos de modelo / integración

- `Area` solo tiene `nombre` y `anexo`: faltan **piso, referencia de ubicación, encargado y estado activo**. *(v2: no se agregan código ni pabellón; ver Registro de cambios.)*
- `Usuario` no tiene **grado profesional** ni nombre de usuario; `contrasena_hash` está como `VARBINARY` (se guarda el texto BCrypt como bytes). Funciona, pero se migra a `VARCHAR(100)` (F1).
- `ElementoConfiguracion` no tiene **código de inventario** (`PC-ADM-02`) ni referencia física ("Ventanilla 2").
- El enum backend `Rol` (`USUARIO_FINAL, TECNICO, ADMINISTRADOR`) y el frontend `RolUsuario` (`USUARIO_FINAL, PRACTICANTE, ADMINISTRADOR`) **no coinciden**. Este plan solo usa `ADMINISTRADOR` y `USUARIO_FINAL`; la unificación `TECNICO`/`PRACTICANTE` se registra como deuda (§13). El nuevo `GradoProfesional` se diseña desde el inicio para **no repetir este error** (contrato verificado por test en ambos lados, §5.4).
- El contrato de contexto **no coincide** entre capas: el backend devuelve `ipOrigen`, `nombreEquipo`, `areaNombre`; el frontend (`ContextoCliente` en `compartido/modelos/ticket.dto.ts`) espera `ip`, `hostname`, `area`, `anexo`, `ipRegistrada`. Se reemplaza por un contrato único nuevo (F4).
- Las páginas `administracion/paginas/usuario-lista`, `usuario-formulario`, `roles-permisos` existen pero **no hay ruta `/administracion`** en `app.routes.ts`, y `UsuariosService` está vacío.
- No hay herramienta de migraciones (`ddl-auto=none`, sin Flyway). Se usarán **scripts SQL idempotentes** versionados (§4.4).
- **Arquitectura backend actual:** paquetes por **tipo técnico** (`controllers/`, `services/`, `entities/`, `dtos/`) y DTOs como clases Lombok mutables (`@Data`) agrupadas en archivos `*DTOs.java`. El módulo nuevo adopta paquetes **por dominio** y DTO `record` (§3).
- **Arquitectura frontend actual:** ya existe el patrón `*.api.ts` (clase abstracta) / `*.http.ts` / `*.mock.ts` / `*.providers.ts` con `environment.usarMocks` en `mi-turno` y `portal-asistencial`. El módulo nuevo lo **reutiliza y formaliza** (§3.8); `administracion/servicios/usuarios.service.ts` (vacío) se retira.
- **Versiones reales detectadas:** `pom.xml` declara Spring Boot **4.1.1** y `package.json` Angular **^22**, mientras `CLAUDE.md` indica Spring Boot 3 / Angular 19. El plan usa solo APIs estables en ambas líneas (records, Bean Validation `jakarta.*`, `SecurityFilterChain`, Signals, `input()`/`output()`, `@if`/`@for`). Antigravity **no debe cambiar versiones** dentro de este módulo; la alineación de `CLAUDE.md` queda como deuda (§13).

---

## 2. Principios de diseño del módulo (funcionales y de seguridad)

1. **La IP se obtiene del servidor, nunca del cliente.** Ningún endpoint acepta la IP en el cuerpo, la query o un encabezado controlado por el navegador.
2. **La identidad se obtiene del JWT, nunca del cuerpo.** `id_usuario_reporta` sale de `Authentication`.
3. **El servidor re-resuelve el contexto al crear el ticket.** El formulario prellenado es solo una ayuda visual; al guardar, el backend vuelve a detectar equipo y área y valida que la impresora elegida pertenezca al área detectada.
4. **Minimización de datos:** no se almacenan DNI, teléfonos personales, fecha de nacimiento ni dirección. Solo: grado, nombres, apellidos, correo institucional, usuario, área, rol, estado.
5. **Nunca exponer entidades JPA** por la API: siempre DTO `record` + mapper dedicado (§3.5, §3.6).
6. **Modelo mínimo y fiel a la realidad del hospital:** no se modelan conceptos que el hospital no usa (código de área, pabellón). Cada columna nueva debe tener un uso concreto en pantalla o en una regla.
7. **Vocabulario hospitalario en pantalla** (Regla de Oro): ver glosario §11.
8. **Tokens en 4 niveles:** todo estilo nuevo consume N3/N4 (`--comp-*`); cero hex fuera de `_primitivos.scss`.

---

## 3. Arquitectura de software y principios de ingeniería

### 3.1 Vista de módulos

El módulo se divide en dos **dominios**: *administrativo* (lo gestiona el administrador) y *asistencial* (lo usa el personal al reportar). Ambos dependen de un **núcleo compartido** y de *seguridad*, nunca entre sí por sus implementaciones.

```
                ┌──────────────────────────── administrativo ────────────────────────────┐
                │  areas        personal        equipos        catalogos                 │
                │  (CRUD área)  (cuentas)       (equipos+IP)   (grados profesionales)    │
                └──────┬───────────┬───────────────┬──────────────┬──────────────────────┘
                       │ solo vía interfaces públicas (puertos de consulta)
                ┌──────▼───────────▼───────────────▼──────────────▼──────┐
                │                  asistencial / atencion                 │
                │   ContextoAtencion  ·  ReportarProblema                 │
                └──────┬──────────────────────────────────────────────────┘
                       │
   ┌───────────────────▼────────────────────┐   ┌───────────────────────────────┐
   │ compartido (errores, paginación,       │   │ security (JWT, ResolutorIp,   │
   │ validación, NombreVisible)             │   │ SecurityConfig)               │
   └───────────────────┬────────────────────┘   └───────────────────────────────┘
                       │
   ┌───────────────────▼────────────────────────────────────────────────────────┐
   │ entities + repositories (núcleo de persistencia existente, compartido)      │
   └────────────────────────────────────────────────────────────────────────────┘
```

**Decisión — núcleo de persistencia compartido:** las entidades `Usuario`, `Area`, `ElementoConfiguracion`, `Ticket` y sus repositorios ya son usados por tickets, autenticación, indicadores, préstamos, etc. Moverlas en este módulo generaría un cambio masivo sin valor funcional. Se **mantienen** en `entities/` y `repositories/` como *shared kernel*; el resto del código nuevo (controladores, servicios, DTOs, mappers, reglas) vive en paquetes por dominio. La migración completa a paquetes por dominio para los módulos existentes queda como deuda (§13).

### 3.2 Organización de paquetes — Backend

Raíz: `backend/src/main/java/com/hospital/servicedesk/`

```
compartido/
├── web/
│   ├── Pagina.java                    # record Pagina<T>(List<T> contenido, int pagina, int tamano, long total)
│   ├── RespuestaConAdvertencias.java  # record <T>(T datos, List<String> advertencias)
│   └── ErrorResponse.java             # (se mueve desde dtos/ manteniendo el contrato JSON)
├── excepciones/
│   ├── RecursoNoEncontradoException.java   # → 404
│   ├── ConflictoNegocioException.java      # (campo, mensaje) → 409
│   └── ReglaNegocioException.java          # (campo, mensaje) → 422
├── validacion/
│   └── PatronesValidacion.java        # constantes IPV4_ESTRICTA, MAC, NOMBRE_USUARIO, ANEXO
└── persona/
    └── NombreVisible.java             # función pura: (grado, nombres, apellidos) → "Lic. Patricia Ramos"

administrativo/
├── catalogos/
│   ├── api/CatalogoController.java                  # GET /api/catalogos/grados-profesionales
│   ├── aplicacion/CatalogoConsultaService.java      # interfaz
│   ├── aplicacion/CatalogoConsultaServiceImpl.java
│   └── dto/OpcionCatalogoRespuesta.java             # record
├── areas/
│   ├── api/AreaAdminController.java
│   ├── aplicacion/AreaConsultaService.java          # interfaz (lectura)
│   ├── aplicacion/AreaGestionService.java           # interfaz (escritura)
│   ├── aplicacion/impl/AreaConsultaServiceImpl.java
│   ├── aplicacion/impl/AreaGestionServiceImpl.java
│   ├── dominio/FormateadorUbicacion.java            # piso + referencia → "Primer Piso"
│   ├── dto/AreaSolicitud.java · AreaResumen.java · AreaDetalle.java · AreaMini.java · CambioEstadoSolicitud.java
│   └── mapper/AreaMapper.java
├── personal/
│   ├── api/UsuarioAdminController.java · CuentaController.java
│   ├── aplicacion/PersonalConsultaService.java · PersonalGestionService.java · CuentaService.java
│   ├── aplicacion/impl/...
│   ├── dominio/GradoProfesional.java                # ENUM (§5.1)
│   ├── dominio/PoliticaContrasena.java              # interfaz + PoliticaContrasenaEstandar
│   ├── dominio/GeneradorContrasenaTemporal.java     # interfaz + GeneradorSecureRandom
│   ├── dto/UsuarioCrearSolicitud.java · UsuarioEditarSolicitud.java · UsuarioResumen.java · UsuarioDetalle.java · PersonaResumen.java · CambioContrasenaSolicitud.java · ContrasenaTemporalRespuesta.java
│   ├── mapper/UsuarioMapper.java
│   └── config/PropiedadesCuentas.java               # @ConfigurationProperties record
├── equipos/
│   ├── api/EquipoAdminController.java · RedAdminController.java
│   ├── aplicacion/EquipoConsultaService.java · EquipoGestionService.java · AsignacionIpService.java
│   ├── aplicacion/impl/...
│   ├── dominio/codigo/EstrategiaCodigoInventario.java       # interfaz (OCP)
│   ├── dominio/codigo/CodigoPorTipoYAbreviaturaArea.java    # implementación por defecto
│   ├── dominio/codigo/AbreviadorNombreArea.java             # "Admisión" → "ADM"
│   ├── dominio/ip/ReglaIp.java                              # interfaz (OCP)
│   ├── dominio/ip/ReglaIpv4Estricta.java · ReglaIpNoReservada.java · ReglaIpPrivada.java
│   ├── dominio/ip/ValidadorIp.java                          # compone List<ReglaIp>
│   ├── dto/EquipoSolicitud.java · EquipoResumen.java · EquipoDetalle.java · AsignarIpSolicitud.java · DisponibilidadIpRespuesta.java · CodigoSugeridoRespuesta.java
│   └── mapper/EquipoMapper.java

asistencial/
└── atencion/
    ├── api/ContextoAtencionController.java
    ├── aplicacion/ContextoAtencionService.java · ReportarProblemaService.java (interfaces + impl)
    ├── dominio/EstadoDeteccion.java · ObjetivoFalla.java
    ├── dominio/objetivo/ResolutorObjetivoFalla.java               # interfaz (OCP, una impl por objetivo)
    ├── dominio/objetivo/ObjetivoEquipoActual.java · ObjetivoImpresoraArea.java · ObjetivoOtro.java
    ├── dto/ContextoAtencionRespuesta.java · ReportarProblemaSolicitud.java
    └── mapper/ContextoAtencionMapper.java

security/
└── red/ResolutorIpCliente.java        # interfaz + ResolutorIpRemoteAddr (§7.3)
```

Convenciones obligatorias:
- **Un `record` por archivo** en `dto/` (no se agrupan en `*DTOs.java`). Los DTO existentes (`TicketDTOs`, `AuthDTOs`) no se tocan salvo que la fase lo indique.
- `api/` contiene **solo** controladores: reciben DTO, delegan en una interfaz de `aplicacion/`, devuelven DTO. Sin lógica, sin repositorios, sin entidades.
- `aplicacion/` orquesta transacciones (`@Transactional` en la impl, `readOnly = true` en consultas), usa repositorios y `dominio/`, y devuelve **DTO** (el mapeo ocurre aquí, nunca en el controlador).
- `dominio/` contiene reglas puras (sin Spring cuando sea posible) → testeables sin contexto.

### 3.3 Reglas de dependencia (verificadas automáticamente)

| # | Regla | Motivo |
|---|---|---|
| D1 | `..api..` solo depende de `..aplicacion..` (interfaces), `..dto..`, `compartido..` y `security..`. | Controlador delgado; bajo acoplamiento. |
| D2 | Ninguna clase de `..api..` ni `..dto..` importa `com.hospital.servicedesk.entities..`. | Garantiza que nunca se serializa una entidad JPA. |
| D3 | `..dto..` no depende de nada salvo `jakarta.validation`, enums de dominio y otros DTO. | DTO puros e inmutables. |
| D4 | `administrativo.X` no depende de `administrativo.Y..impl..` (solo de sus interfaces públicas en `aplicacion/`). | Módulos sustituibles. |
| D5 | `asistencial..` puede consumir interfaces de consulta de `administrativo..aplicacion..`; **`administrativo..` nunca depende de `asistencial..`**. | Dirección única de dependencias. |
| D6 | Solo `security.red..` invoca `HttpServletRequest#getHeader("X-Forwarded-For")` (idealmente nadie). | Anti-suplantación de IP (§7). |
| D7 | Las clases `*Impl` no son públicas fuera de su paquete salvo para Spring (`@Service` package-private cuando sea posible). | Fuerza la inyección por interfaz. |

**Verificación:** agregar `com.tngtech.archunit:archunit-junit5` (scope `test`) y crear `ArquitecturaTest` con una regla por fila (D1–D7). El test corre en `mvn verify`; una violación rompe el build.

### 3.4 Principios SOLID aplicados (con ejemplos concretos del módulo)

| Principio | Aplicación concreta |
|---|---|
| **S — Responsabilidad única** | Lectura y escritura separadas: `AreaConsultaService` / `AreaGestionService`, `EquipoConsultaService` / `EquipoGestionService`. La asignación/liberación de IP vive en `AsignacionIpService` (no en el servicio de equipos). La política de contraseñas (`PoliticaContrasena`), la generación de temporales (`GeneradorContrasenaTemporal`), el formato del nombre (`NombreVisible`), la ubicación legible (`FormateadorUbicacion`) y el mapeo (`*Mapper`) son clases independientes con una sola razón de cambio. |
| **O — Abierto/cerrado** | (1) `EstrategiaCodigoInventario`: si mañana el hospital adopta otra codificación, se agrega una implementación y se cambia el bean activo (`@ConditionalOnProperty("hsmsi.equipos.estrategia-codigo")`), sin tocar `EquipoGestionServiceImpl`. (2) `ValidadorIp` recibe `List<ReglaIp>` inyectada: una regla nueva (p. ej. "no usar el rango de impresoras para PCs") es una clase nueva. (3) `ResolutorObjetivoFalla`: cada `ObjetivoFalla` tiene su implementación; `ReportarProblemaServiceImpl` las recibe como `Map<ObjetivoFalla, ResolutorObjetivoFalla>` construido en el constructor (falla al arrancar si falta una). (4) `GradoProfesional`: agregar un grado es agregar una constante; ninguna lógica usa `switch` sobre grados (el prefijo es atributo del enum). |
| **L — Sustitución de Liskov** | Toda implementación de `ReglaIp` devuelve `Optional<String> violacion(String ip)` sin lanzar excepciones; toda `EstrategiaCodigoInventario` devuelve un código que cumple `^[A-Z0-9-]{1,20}$` (test de contrato parametrizado que corre contra **todas** las implementaciones). En frontend, `*Mock` y `*Http` cumplen el mismo contrato abstracto y se validan con la misma suite de contrato (§3.8.4). |
| **I — Segregación de interfaces** | El dominio asistencial solo ve `AreaConsultaService` / `EquipoConsultaService` (lectura); nunca recibe interfaces de escritura. `CuentaService` (propia cuenta) está separado de `PersonalGestionService` (administración de terceros). |
| **D — Inversión de dependencias** | Controladores y servicios dependen de **interfaces**, inyectadas por **constructor** (campos `private final`, `@RequiredArgsConstructor`; prohibido `@Autowired` en campo). La configuración se inyecta como **`record` inmutable** con `@ConfigurationProperties` (`PropiedadesCuentas`, `PropiedadesRed`), no con `@Value` disperso. `ResolutorIpCliente` es interfaz: los tests inyectan un doble que fija la IP. El reloj se inyecta como `java.time.Clock` (bean) para probar bloqueos de 15 min sin esperar. |

Ejemplo de configuración como `record`:

```java
@ConfigurationProperties(prefix = "hsmsi.cuentas")
@Validated
public record PropiedadesCuentas(
    @Min(10) @Max(14) int costeBcrypt,          // 12
    @Min(3) @Max(10)  int maxIntentosFallidos,  // 5
    @NotNull Duration duracionBloqueo,          // PT15M
    String dominioCorreo                        // "hsmsi.gob.pe"; vacío = no valida (desarrollo)
) {}
```

### 3.5 Patrón DTO inmutable (Java 21 `record` + Bean Validation)

Reglas:
1. **Solicitudes** (`*Solicitud`): `record` con anotaciones `jakarta.validation` y **mensajes en español** (`message = "El nombre del área es obligatorio"`). Los controladores usan `@Valid @RequestBody`.
2. **Respuestas** (`*Resumen`, `*Detalle`, `*Respuesta`): `record` sin anotaciones de validación; colecciones expuestas como `List.copyOf(...)` en el constructor compacto (inmutabilidad real, no solo de referencia).
3. **Normalización en el constructor compacto** (recortar espacios, colapsar espacios múltiples, correo en minúsculas) → el servicio recibe siempre datos canónicos.
4. Campos desconocidos en el JSON → **rechazados** con 400 en las solicitudes de `/api/admin/**` (anotar cada `*Solicitud` del dominio administrativo con `@JsonIgnoreProperties(ignoreUnknown = false)`; la configuración global de Jackson no se cambia para no romper los módulos existentes). Así se cierra el *mass assignment* (enviar `rol`, `id`, `contrasenaHash` de más). En `POST /api/tickets` se **ignoran** (compatibilidad con el frontend actual), y el record simplemente no los declara (§6.5).
5. Prohibido Lombok en DTO nuevos (los `record` ya generan constructor, accesores, `equals/hashCode/toString`).
6. `toString()` de DTO con contraseñas se **sobrescribe** para enmascarar (`contrasenaInicial=***`).

```java
public record AreaSolicitud(
    @NotBlank(message = "El nombre del área es obligatorio")
    @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
    String nombre,

    @Min(value = 0, message = "El piso no puede ser menor que 0")
    @Max(value = 20, message = "El piso no puede ser mayor que 20")
    Integer piso,                                   // null = no especificado

    @Size(max = 150, message = "La referencia no puede superar 150 caracteres")
    String referenciaUbicacion,                     // opcional

    @Size(max = 20) @Pattern(regexp = PatronesValidacion.ANEXO, message = "El anexo solo admite dígitos")
    String anexo,

    @Positive Integer idEncargado                   // opcional
) {
    public AreaSolicitud {
        nombre = Texto.normalizar(nombre);                       // trim + colapsar espacios
        referenciaUbicacion = Texto.vacioANulo(Texto.normalizar(referenciaUbicacion));
        anexo = Texto.vacioANulo(anexo);
    }
}
```

### 3.6 Mappers dedicados

- Un mapper por agregado: `AreaMapper`, `UsuarioMapper`, `EquipoMapper`, `ContextoAtencionMapper`.
- Implementación **manual**, `@Component final class`, métodos **puros** (sin acceso a repositorios, sin efectos laterales, sin `@Transactional`). Decisión: no se introduce MapStruct para no sumar un segundo procesador de anotaciones junto a Lombok y para mantener el mapeo explícito y revisable.
- Direcciones permitidas:
  - `Entidad → DTO de respuesta` (`aResumen`, `aDetalle`).
  - `DTO de solicitud → Entidad nueva` (`aNuevaEntidad`) y `aplicar(solicitud, entidadExistente)` para actualizaciones (nunca copia `id`, `activo`, `contrasenaHash`, `rol` del propio admin, etc.).
- Los datos derivados que requieren consultas (conteos `totalPersonal`, `totalComputadoras`) se calculan en el servicio con **consultas agregadas** y se pasan al mapper como parámetros (`aDetalle(area, conteos)`), para no disparar *lazy loading* desde el mapper.
- Ningún mapper accede a `Usuario#getContrasenaHash()` (verificable con ArchUnit: regla adicional D8).
- Cada mapper tiene test unitario puro (sin Spring) que cubre nulos en campos opcionales.

```java
@Component
final class AreaMapper {
    private final FormateadorUbicacion ubicacion;
    private final UsuarioMapper usuarioMapper;

    AreaDetalle aDetalle(Area a, ConteosArea c) {
        return new AreaDetalle(
            a.getIdArea(), a.getNombre(), a.getPiso(),
            ubicacion.legible(a.getPiso()), a.getReferenciaUbicacion(), a.getAnexo(),
            a.getEncargado() == null ? null : usuarioMapper.aPersonaResumen(a.getEncargado()),
            a.isActivo(), c.personal(), c.computadoras(), c.impresoras());
    }
}
```

### 3.7 Manejo de errores

| Excepción de dominio | HTTP | Cuerpo (`ErrorResponse`) |
|---|---|---|
| `MethodArgumentNotValidException` (Bean Validation) | 400 | `errores: [{ campo, mensaje }]` |
| `RecursoNoEncontradoException` | 404 | `mensaje` |
| `ConflictoNegocioException(campo, mensaje)` | 409 | `campo`, `mensaje` (p. ej. `nombre`, "Ya existe un área llamada «Admisión»") |
| `ReglaNegocioException(campo, mensaje)` | 422 | `campo`, `mensaje` |
| `DataIntegrityViolationException` (índices únicos) | 409 | Traducida por un `TraductorRestriccionesBd` que mapea el nombre del índice (`UX_area_nombre`, `UX_hist_ip_vigente_por_ip`, …) a `campo` + mensaje legible. |
| `AccessDeniedException` | 403 | mensaje genérico |

Los mensajes nunca incluyen trazas, SQL ni nombres de tablas. `GlobalExceptionHandler` existente se amplía; no se crea otro.

### 3.8 Frontend — Arquitectura Api / Mock / Http + Store (Signals + DI)

#### 3.8.1 Capas y flujo de dependencias

```
 Página (contenedor, OnPush)  ──usa──►  Store (@Injectable, signals de estado)
        │                                         │
        │ input()/output()                        │ inject(XApi)   ← token = clase abstracta
        ▼                                         ▼
 Componentes de presentación            XApi (abstract class, contrato en modelos de dominio)
 (sin inyección de servicios)                 ▲                    ▲
                                              │ extends            │ extends
                                         XHttp (HttpClient +   XMock (datos en memoria,
                                         XMapper DTO→modelo)   latencia simulada)
                                              ▲
                              x.providers.ts elige según environment.usarMocks
```

Reglas:
1. **Página** = contenedor: inyecta solo su *Store*; no inyecta `HttpClient` ni `XApi` directamente.
2. **Store** = estado de la funcionalidad con `signal()` privados expuestos vía `asReadonly()` y `computed()`; contiene la orquestación (cargar, crear, refrescar, mapear errores a campos). Se provee **a nivel de ruta** (`providers` en `administracion.routes.ts`), por lo que su ciclo de vida es el del módulo.
3. **XApi** = `abstract class` (sirve de token DI y de contrato tipado). Trabaja con **modelos de dominio del frontend**, nunca con DTO del backend.
4. **XHttp** = única clase que conoce URLs (`API_ENDPOINTS`) y DTO; transforma con un **mapper puro** (`areas.mapper.ts`).
5. **XMock** = implementación en memoria con `conLatencia()` / `paginar()` existentes en `compartido/utilidades/mock-util`; reproduce las **mismas reglas de negocio visibles** (409 por nombre duplicado, 409 por IP en uso) para que la interfaz se pueda probar sin backend.
6. **Componentes de presentación** (`dialogo-area`, `tabla-equipos-area`, …): `input()` / `output()`, sin servicios inyectados salvo utilidades de UI.
7. `standalone`, `ChangeDetectionStrategy.OnPush`, control de flujo `@if` / `@for (…; track item.id)`.

#### 3.8.2 Estructura de carpetas

```
funcionalidades/administracion/
├── administracion.routes.ts            # providers: ADMINISTRACION_PROVIDERS + Stores
├── administracion.providers.ts         # AreasApi, PersonalApi, EquiposApi → Mock | Http
├── areas/
│   ├── modelos/area.model.ts           # Area, AreaResumen, AreaFormulario, FiltroAreas
│   ├── modelos/area.dto.ts             # AreaDetalleDto, AreaSolicitudDto (forma JSON del backend)
│   ├── servicios/areas.api.ts
│   ├── servicios/areas.http.ts
│   ├── servicios/areas.mock.ts
│   ├── servicios/areas.mapper.ts       # funciones puras dto↔modelo (+ spec)
│   ├── estado/areas.store.ts
│   ├── paginas/areas-lista/ · paginas/area-detalle/
│   └── componentes/dialogo-area/ · tabla-personal-area/ · tabla-equipos-area/
├── personal/
│   ├── modelos/ · servicios/(personal.api|http|mock|mapper).ts · estado/personal.store.ts
│   ├── paginas/personal-lista/
│   └── componentes/dialogo-personal/ · dialogo-contrasena-temporal/
├── equipos/
│   ├── modelos/ · servicios/(equipos.api|http|mock|mapper).ts · estado/equipos.store.ts
│   ├── paginas/equipos-lista/
│   └── componentes/dialogo-equipo/
└── validacion/
    └── validadores-asincronos.ts       # fábricas que reciben la XApi (no HttpClient)

compartido/catalogos/                   # usado por administración y, en el futuro, otros módulos
├── grado-profesional.enum.ts           # §5.2
├── catalogos.api.ts · catalogos.http.ts · catalogos.mock.ts
├── catalogos.providers.ts              # registrado en app.config.ts (catálogo global)
└── catalogos.store.ts                  # providedIn: 'root', caché en signal

funcionalidades/portal-asistencial/servicios/
└── contexto-atencion.api.ts · .http.ts · .mock.ts   # reemplaza nucleo/servicios/contexto-cliente.service.ts (F7)
```

Las páginas antiguas `administracion/paginas/usuario-lista`, `usuario-formulario` y `administracion/servicios/usuarios.service.ts` se eliminan en F6 (se revisa antes que no tengan importadores). `roles-permisos` se conserva fuera de este alcance.

#### 3.8.3 Ejemplo de referencia (Antigravity debe seguir esta forma)

```ts
// areas.api.ts
export abstract class AreasApi {
  abstract listar(f: FiltroAreas): Observable<AreaResumen[]>;
  abstract obtener(id: number): Observable<Area>;
  abstract crear(f: AreaFormulario): Observable<Area>;
  abstract actualizar(id: number, f: AreaFormulario): Observable<Area>;
  abstract cambiarEstado(id: number, activo: boolean): Observable<Area>;
}

// areas.http.ts
@Injectable()
export class AreasHttp extends AreasApi {
  private readonly http = inject(HttpClient);
  listar(f: FiltroAreas) {
    return this.http.get<AreaResumenDto[]>(API_ENDPOINTS.admin.areas, { params: aParams(f) })
      .pipe(map(lista => lista.map(aAreaResumen)));
  }
  // ...
}

// administracion.providers.ts
export const ADMINISTRACION_PROVIDERS: Provider[] = [
  { provide: AreasApi,    useClass: environment.usarMocks ? AreasMock    : AreasHttp },
  { provide: PersonalApi, useClass: environment.usarMocks ? PersonalMock : PersonalHttp },
  { provide: EquiposApi,  useClass: environment.usarMocks ? EquiposMock  : EquiposHttp },
  AreasStore, PersonalStore, EquiposStore,
];

// areas.store.ts
@Injectable()
export class AreasStore {
  private readonly api = inject(AreasApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _areas = signal<AreaResumen[]>([]);
  private readonly _cargando = signal(false);
  private readonly _filtro = signal<FiltroAreas>({ buscar: '', incluirInactivas: false });

  readonly areas = this._areas.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly activas = computed(() => this._areas().filter(a => a.activo));
  readonly vacio = computed(() => !this._cargando() && this._areas().length === 0);

  cargar(f: Partial<FiltroAreas> = {}): void {
    this._filtro.update(actual => ({ ...actual, ...f }));
    this._cargando.set(true);
    this.api.listar(this._filtro())
      .pipe(finalize(() => this._cargando.set(false)))
      .subscribe({ next: l => this._areas.set(l), error: e => this.notificacion.error(mensajeDe(e)) });
  }

  /** Devuelve el Observable para que el diálogo mapee 409/422 a su campo. */
  crear(f: AreaFormulario): Observable<Area> {
    return this.api.crear(f).pipe(tap(() => this.cargar()));
  }
}
```

#### 3.8.4 Verificación automática en frontend

- **Suite de contrato compartida:** `areas.api.contract.ts` exporta `function contratoAreasApi(crear: () => AreasApi)` con los casos comunes (crear y listar, nombre duplicado → error 409 con `campo = 'nombre'`, desactivar). Se ejecuta en `areas.mock.spec.ts` y en `areas.http.spec.ts` (este último con `HttpTestingController`). Garantiza que Mock y Http son sustituibles (Liskov).
- **Mappers:** specs puros con casos de campos nulos/opcionales.
- **Regla de capas** (`scripts/verificar-capas.mjs`, agregado al script `npm run verificar` junto a `verificar-vocabulario.mjs`): falla si
  - un archivo `*.page.ts` o de `componentes/` importa `HttpClient`, `*.http` o `*.mock`;
  - un archivo fuera de `*.providers.ts` o de specs importa `*.http` o `*.mock`;
  - un archivo fuera de `*.http.ts` / `*.mapper.ts` importa `*.dto`.

---

## 4. Modelo de datos (SQL Server 2022)

### 4.1 Diagrama lógico

```
                 ┌───────────────────────────┐
                 │ area                      │
                 │ id_area PK                │
                 │ nombre UQ (CI_AI)         │
                 │ piso (NULL)               │
                 │ referencia_ubicacion NULL │
                 │ anexo                     │
                 │ id_encargado FK ──────────┼──┐
                 │ activo                    │  │
                 └──────────┬────────────────┘  │
           1 ┌──────────────┴──────────────┐ 1  │
             │                             │    │
           N ▼                           N ▼    │
 ┌─────────────────────────┐   ┌──────────────────────────┐
 │ usuario                 │◄──┘ elemento_configuracion   │
 │ id_usuario PK           │   │ id_ci PK                 │
 │ grado_profesional (enum)│   │ codigo_inventario UQ     │
 │ nombres, apellidos      │   │ nombre, tipo_ci          │
 │ correo UQ (institucional)│  │ hostname, mac            │
 │ nombre_usuario UQ       │   │ referencia_ubicacion     │
 │ contrasena_hash (BCrypt)│   │ marca_modelo             │
 │ rol, id_area FK, activo │   │ id_area FK, estado       │
 │ debe_cambiar_contrasena │   └────────────┬─────────────┘
 │ intentos_fallidos       │                │ 1
 │ bloqueado_hasta         │                │
 │ ultimo_acceso           │              N ▼
 └─────────────────────────┘   ┌──────────────────────────┐      ┌──────────────────┐
                               │ historial_asignacion_ip  │ N  1 │ direccion_ip     │
                               │ id_ci FK, id_direccion_ip├─────►│ direccion UQ     │
                               │ fecha_asignacion         │      │ subred, estado   │
                               │ fecha_liberacion (NULL = │      └──────────────────┘
                               │   asignación vigente)    │
                               └──────────────────────────┘
```

> **Decisión:** se **reutiliza** `direccion_ip` + `historial_asignacion_ip` (ya existentes) como registro de IPs estáticas. La "IP vigente" de un equipo es la fila con `fecha_liberacion IS NULL`. No se crea una columna `ip` en el equipo, para conservar la trazabilidad de reasignaciones.

### 4.2 Cambios por tabla

#### `area` (ALTER) — modelo definitivo

| Columna | Tipo | Restricción | Notas |
|---|---|---|---|
| `id_area` | `INT IDENTITY` | PK, existente | |
| `nombre` | `NVARCHAR(80)` | `NOT NULL`, existente; se cambia la intercalación a `Modern_Spanish_CI_AI` + `UNIQUE` (`UX_area_nombre`) | "Admisión" y "admision" se consideran el mismo nombre. Es el identificador natural del área (no hay código). |
| `piso` | `TINYINT` | `NULL`, `CHECK (piso BETWEEN 0 AND 20)` | 0 = Sótano, 1 = Primer Piso, … |
| `referencia_ubicacion` | `NVARCHAR(150)` | `NULL` | Opcional. "Frente a la Oficina de la Jefatura de Estadística". |
| `anexo` | `VARCHAR(20)` | existente, `CHECK (anexo NOT LIKE '%[^0-9]%')` | Anexo telefónico **institucional** (no es dato personal). |
| `id_encargado` | `INT` | `NULL`, `FK_area_encargado → usuario(id_usuario)` | El grado se toma del propio usuario. |
| `activo` | `BIT` | `NOT NULL DEFAULT 1` | Baja lógica. |

**Columnas que NO existen (decisión v2):** `codigo`, `pabellon`, `segmento_red`. Ningún DTO, pantalla, mock ni prueba debe referirlas.

Consideraciones de migración:
- Antes de crear `UX_area_nombre`, el script **detecta duplicados** con `SELECT nombre COLLATE Modern_Spanish_CI_AI, COUNT(*) … HAVING COUNT(*) > 1`; si hay, aborta con `THROW` y lista los nombres para que el usuario los corrija.
- Cambiar la intercalación exige eliminar y recrear índices/restricciones que usen `nombre`; el script lo hace dentro de la transacción.
- El servicio valida también la unicidad (`existsByNombreNormalizado`) para devolver 409 con `campo = "nombre"` antes de llegar a la BD; el índice es la garantía final ante concurrencia.

#### `usuario` (ALTER)

| Columna | Tipo | Restricción | Notas |
|---|---|---|---|
| `grado_profesional` | `VARCHAR(10)` | `NOT NULL DEFAULT 'SIN_GRADO'`, `CK_usuario_grado CHECK (grado_profesional IN ('LIC','TEC','DR','DRA','MG','ING','SIN_GRADO'))` | Se persiste el **nombre de la constante** del enum (`@Enumerated(EnumType.STRING)`), nunca la etiqueta. Ver §5. |
| `nombre_usuario` | `VARCHAR(40)` | `UNIQUE` (índice filtrado `WHERE nombre_usuario IS NOT NULL`), `CHECK` patrón `[a-z0-9._]` | p. ej. `pramos`. El login acepta correo **o** usuario. |
| `correo` | `VARCHAR(100)` | existente `UNIQUE` | Validar dominio institucional configurable (`hsmsi.cuentas.dominio-correo`). |
| `contrasena_hash` | `VARCHAR(100)` | `NOT NULL` | **Migración** desde `VARBINARY`: `CAST(contrasena_hash AS VARCHAR(100))`. BCrypt = 60 caracteres. |
| `debe_cambiar_contrasena` | `BIT` | `NOT NULL DEFAULT 1` | Cuenta nueva o clave reiniciada → obliga a cambiarla en el primer ingreso. Las cuentas existentes se migran con `0`. |
| `intentos_fallidos` | `TINYINT` | `NOT NULL DEFAULT 0` | |
| `bloqueado_hasta` | `DATETIME2` | `NULL` | |
| `ultimo_acceso` | `DATETIME2` | `NULL` | |

**Columnas explícitamente prohibidas:** DNI, teléfono personal, celular, dirección domiciliaria, fecha de nacimiento, correo personal.

#### `elemento_configuracion` (ALTER)

| Columna | Tipo | Restricción | Notas |
|---|---|---|---|
| `codigo_inventario` | `VARCHAR(20)` | `NOT NULL`, `UNIQUE`, `CHECK (codigo_inventario NOT LIKE '%[^A-Z0-9-]%')` | Formato sugerido `{TIPO}-{ABREV_AREA}-{NN}` (§6.3). Es **independiente** del área una vez guardado: si el equipo se traslada, el código no cambia. |
| `referencia_ubicacion` | `NVARCHAR(100)` | `NULL` | "Ventanilla 2", "Módulo de admisión de Emergencia". |
| `marca_modelo` | `NVARCHAR(80)` | `NULL` | |

#### `historial_asignacion_ip` (índices nuevos)

```sql
-- Una IP solo puede estar vigente en un equipo a la vez
CREATE UNIQUE INDEX UX_hist_ip_vigente_por_ip
  ON historial_asignacion_ip(id_direccion_ip) WHERE fecha_liberacion IS NULL;

-- Un equipo solo tiene una IP estática vigente (PC e impresora de red)
CREATE UNIQUE INDEX UX_hist_ip_vigente_por_equipo
  ON historial_asignacion_ip(id_ci) WHERE fecha_liberacion IS NULL;
```

#### `ticket` (ALTER)

| Columna | Tipo | Notas |
|---|---|---|
| `id_ci_origen` | `INT NULL FK → elemento_configuracion` | La PC **desde la que** se reportó (detectada por IP). |
| `id_ci` | existente | El equipo **afectado** (la misma PC o una impresora del área). |
| `deteccion_estado` | `VARCHAR(20) NULL`, `CHECK IN ('DETECTADO','IP_NO_REGISTRADA','IP_SIN_EQUIPO')` | Auditoría. |

### 4.3 Entidades JPA (cambios)

```java
// Area.java (entities/) — se elimina @Data: equals/hashCode por id, sin toString recursivo
@Entity @Table(name = "area")
@Getter @Setter @NoArgsConstructor
public class Area {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) @Column(name = "id_area") private Integer idArea;
    @Column(name = "nombre", nullable = false, length = 80) private String nombre;
    @Column(name = "piso") private Integer piso;
    @Column(name = "referencia_ubicacion", length = 150) private String referenciaUbicacion;
    @Column(name = "anexo", length = 20) private String anexo;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "id_encargado") private Usuario encargado;
    @Column(name = "activo", nullable = false) private boolean activo = true;
}
```

- `Usuario`: `@Enumerated(EnumType.STRING) @Column(name = "grado_profesional", nullable = false, length = 10) private GradoProfesional grado = GradoProfesional.SIN_GRADO;` + `nombreUsuario`, `contrasenaHash` como `String` con `@JsonIgnore` (defensa en profundidad), campos de bloqueo. **No** se agrega `getNombreVisible()` a la entidad: el cálculo vive en `compartido.persona.NombreVisible` (SRP) y lo invoca el mapper.
- En entidades nuevas o modificadas **se reemplaza `@Data` por `@Getter/@Setter`** para evitar `hashCode`/`toString` que recorran relaciones *lazy* (riesgo de `LazyInitializationException` y de recursión `Area ↔ Usuario`).

### 4.4 Scripts de migración

Ubicación: `backend/src/main/resources/db/scripts/`

| Archivo | Contenido |
|---|---|
| `2026_11_F1_00_verificaciones.sql` | Solo lectura: nombres de área duplicados (CI_AI), asignaciones de IP vigentes duplicadas. Si devuelve filas → detener y reportar al usuario. |
| `2026_11_F1_01_area.sql` | Intercalación + `UX_area_nombre`, columnas `piso`, `referencia_ubicacion`, `id_encargado` (+ FK), `activo`, `CHECK` de anexo |
| `2026_11_F1_02_usuario.sql` | Columnas nuevas, `CK_usuario_grado`, migración `contrasena_hash` a `VARCHAR(100)` |
| `2026_11_F1_03_equipo.sql` | ALTER `elemento_configuracion` + backfill `codigo_inventario` (`'EQ-' + CAST(id_ci AS VARCHAR)`) |
| `2026_11_F1_04_ip_indices.sql` | Índices únicos filtrados |
| `2026_11_F1_05_ticket.sql` | ALTER `ticket` |
| `2026_11_F1_99_rollback.sql` | Reversión (DROP de columnas/índices/restricciones nuevas; restaura intercalación original) |

Reglas: **idempotentes** (`IF COL_LENGTH('area','piso') IS NULL …`, `IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_area_nombre') …`), dentro de `SET XACT_ABORT ON; BEGIN TRAN … COMMIT`, y con `docs/diseno_base_datos.md` actualizado en la misma fase.

---

## 5. Catálogo de grados profesionales (`GradoProfesional`)

### 5.1 Backend — enum Java

Ubicación: `administrativo/personal/dominio/GradoProfesional.java`

```java
public enum GradoProfesional {
    LIC("Lic.", "Lic."),
    TEC("Téc.", "Téc."),
    DR("Dr.", "Dr."),
    DRA("Dra.", "Dra."),
    MG("Mg.", "Mg."),
    ING("Ing.", "Ing."),
    SIN_GRADO("Sin grado", null);

    private final String etiqueta;   // lo que muestra el selector
    private final String prefijo;    // lo que antecede al nombre; null = sin prefijo

    GradoProfesional(String etiqueta, String prefijo) {
        this.etiqueta = etiqueta;
        this.prefijo = prefijo;
    }

    public String etiqueta() { return etiqueta; }
    public Optional<String> prefijo() { return Optional.ofNullable(prefijo); }
}
```

Reglas:
- Se separa **etiqueta** (selector: "Sin grado") de **prefijo** (nombre visible: nada) para que `SIN_GRADO` no genere "Sin grado Patricia Ramos". Ninguna lógica usa `switch` sobre el enum (OCP).
- Se persiste y se transmite por la API el **código** (`"LIC"`), nunca la etiqueta: las etiquetas pueden cambiar de ortografía sin migrar datos ni romper el contrato.
- Deserialización: un valor desconocido (`"QF"`) produce 400 con `campo = "grado"` y mensaje "Grado profesional no válido".

`NombreVisible` (función pura, `compartido/persona/`):

```java
public final class NombreVisible {
    private NombreVisible() {}
    /** "Lic." + "Patricia Elena" + "Ramos Quispe" → "Lic. Patricia Ramos" */
    public static String de(GradoProfesional grado, String nombres, String apellidos) {
        String base = primeraPalabra(nombres) + " " + primeraPalabra(apellidos);
        return grado.prefijo().map(p -> p + " " + base).orElse(base);
    }
}
```

### 5.2 Frontend — enum TypeScript

Ubicación: `compartido/catalogos/grado-profesional.enum.ts`

```ts
/** Códigos idénticos a GradoProfesional.java. El valor viaja por la API. */
export enum GradoProfesional {
  LIC = 'LIC',
  TEC = 'TEC',
  DR = 'DR',
  DRA = 'DRA',
  MG = 'MG',
  ING = 'ING',
  SIN_GRADO = 'SIN_GRADO',
}

export interface OpcionGrado {
  readonly codigo: GradoProfesional;
  readonly etiqueta: string;          // 'Lic.' | … | 'Sin grado'
  readonly prefijo: string | null;    // null para SIN_GRADO
  readonly orden: number;
}

/** Respaldo local: lo usa el Mock y la vista previa si el catálogo aún no cargó. */
export const GRADOS_PROFESIONALES: readonly OpcionGrado[] = [
  { codigo: GradoProfesional.LIC,       etiqueta: 'Lic.',      prefijo: 'Lic.', orden: 1 },
  { codigo: GradoProfesional.TEC,       etiqueta: 'Téc.',      prefijo: 'Téc.', orden: 2 },
  { codigo: GradoProfesional.DR,        etiqueta: 'Dr.',       prefijo: 'Dr.',  orden: 3 },
  { codigo: GradoProfesional.DRA,       etiqueta: 'Dra.',      prefijo: 'Dra.', orden: 4 },
  { codigo: GradoProfesional.MG,        etiqueta: 'Mg.',       prefijo: 'Mg.',  orden: 5 },
  { codigo: GradoProfesional.ING,       etiqueta: 'Ing.',      prefijo: 'Ing.', orden: 6 },
  { codigo: GradoProfesional.SIN_GRADO, etiqueta: 'Sin grado', prefijo: null,   orden: 7 },
];
```

Decisión: el valor del enum TS es el **código** (no la etiqueta) porque es lo que viaja por la API; la etiqueta llega del catálogo. Así el contrato frontend ↔ backend es una cadena estable.

### 5.3 Endpoint de catálogo y consumo en el selector

```
GET /api/catalogos/grados-profesionales        (requiere sesión, cualquier rol)
Cache-Control: max-age=3600, private
```

```json
[
  { "codigo": "LIC", "etiqueta": "Lic.", "prefijo": "Lic.", "orden": 1 },
  { "codigo": "TEC", "etiqueta": "Téc.", "prefijo": "Téc.", "orden": 2 },
  { "codigo": "DR",  "etiqueta": "Dr.",  "prefijo": "Dr.",  "orden": 3 },
  { "codigo": "DRA", "etiqueta": "Dra.", "prefijo": "Dra.", "orden": 4 },
  { "codigo": "MG",  "etiqueta": "Mg.",  "prefijo": "Mg.",  "orden": 5 },
  { "codigo": "ING", "etiqueta": "Ing.", "prefijo": "Ing.", "orden": 6 },
  { "codigo": "SIN_GRADO", "etiqueta": "Sin grado", "prefijo": null, "orden": 7 }
]
```

- Backend: `CatalogoConsultaServiceImpl` construye la lista desde `GradoProfesional.values()` (`orden = ordinal() + 1`) → `OpcionCatalogoRespuesta` record. **No** hay tabla de grados: el enum es la fuente de verdad (y el `CHECK` en BD su espejo).
- Frontend: `CatalogosApi.gradosProfesionales(): Observable<OpcionGrado[]>`; `CatalogosHttp` consume el endpoint; `CatalogosMock` devuelve `GRADOS_PROFESIONALES`. `CatalogosStore` (`providedIn: 'root'`) expone `readonly grados = signal<readonly OpcionGrado[]>(GRADOS_PROFESIONALES)` y lo reemplaza con la respuesta del servidor **una sola vez por sesión** (`cargarSiHaceFalta()`).
- `dialogo-personal` usa `@for (g of catalogos.grados(); track g.codigo) { <mat-option [value]="g.codigo">{{ g.etiqueta }}</mat-option> }`; valor por defecto `GradoProfesional.SIN_GRADO` solo si el admin no elige (el campo es obligatorio, "Sin grado" es una opción explícita).
- La vista previa "Se mostrará como: **Lic. Patricia Ramos**" usa una función pura TS `nombreVisible(opcion, nombres, apellidos)` equivalente a la de Java (con spec de paridad usando los mismos casos).
- El átomo `insignia-grado` recibe `input<GradoProfesional>()` y resuelve la etiqueta desde `CatalogosStore`.

### 5.4 Garantía de paridad backend ↔ frontend

- `GradoProfesionalContratoTest` (Java): afirma que `Arrays.stream(values()).map(Enum::name)` es exactamente `["LIC","TEC","DR","DRA","MG","ING","SIN_GRADO"]` y que las etiquetas coinciden con la tabla de §5.3.
- `grado-profesional.enum.spec.ts`: afirma `Object.values(GradoProfesional)` y `GRADOS_PROFESIONALES` con la **misma lista**.
- Agregar un grado exige, en el mismo PR: constante Java + script SQL que actualice `CK_usuario_grado` + valor TS + ambos tests. Este procedimiento se documenta en `docs/contratos_api_y_modelos.md`.

---

## 6. Contratos de API (backend)

Convenciones: prefijo `/api/admin/**` exige `ROLE_ADMINISTRADOR`; errores con `ErrorResponse` (§3.7); paginación `?pagina=0&tamano=20&buscar=`; DTO `record` con Bean Validation (§3.5).

### 6.1 Áreas — `AreaAdminController` (`/api/admin/areas`)

| Método | Ruta | Cuerpo / Query | Respuesta | Reglas |
|---|---|---|---|---|
| GET | `/api/admin/areas` | `buscar`, `incluirInactivas` | `AreaResumen[]` | Búsqueda por nombre (CI_AI). Incluye conteos: `totalPersonal`, `totalComputadoras`, `totalImpresoras` (una consulta agregada, sin N+1). Orden: nombre. |
| GET | `/api/admin/areas/{id}` | — | `AreaDetalle` | Incluye encargado (`id`, `nombreVisible`). |
| POST | `/api/admin/areas` | `AreaSolicitud` | `201 AreaDetalle` + `Location` | `nombre` único sin distinguir mayúsculas/tildes → 409 `campo = "nombre"`. Si coincide con un área **inactiva**, el mensaje lo indica: "Ya existe un área «Admisión» desactivada; puede reactivarla." |
| PUT | `/api/admin/areas/{id}` | `AreaSolicitud` | `RespuestaConAdvertencias<AreaDetalle>` | El encargado debe ser un usuario **activo** (422 si no). Si no está adscrito a la misma área → advertencia, no bloqueo. |
| PATCH | `/api/admin/areas/{id}/estado` | `CambioEstadoSolicitud { activo }` | `AreaDetalle` | No se puede desactivar si tiene equipos activos con IP vigente o personal activo → 409 con mensaje que indica cuántos. |
| GET | `/api/admin/areas/{id}/personal` | `incluirInactivos` | `UsuarioResumen[]` | |
| POST | `/api/admin/areas/{id}/personal` | `{ "idUsuario": 12 }` | `UsuarioResumen` | Reasigna (mueve) a un usuario existente a esta área. |
| GET | `/api/admin/areas/{id}/equipos` | `tipo=COMPUTADORA\|IMPRESORA` | `EquipoResumen[]` | Cada equipo con su IP vigente. |

```java
// AreaSolicitud: ver §3.5

public record AreaResumen(
    Integer id, String nombre, Integer piso, String ubicacionLegible, String anexo,
    PersonaResumen encargado, boolean activo,
    long totalPersonal, long totalComputadoras, long totalImpresoras) {}

public record AreaDetalle(
    Integer id, String nombre, Integer piso,
    String ubicacionLegible,            // "Primer Piso" | "Sótano" | null si piso es null
    String referenciaUbicacion,         // opcional
    String anexo,
    PersonaResumen encargado,           // null si no tiene
    boolean activo,
    long totalPersonal, long totalComputadoras, long totalImpresoras) {}

public record AreaMini(Integer id, String nombre) {}
public record CambioEstadoSolicitud(@NotNull Boolean activo) {}
```

`FormateadorUbicacion.legible(piso)`: `0 → "Sótano"`, `1 → "Primer Piso"`, `2 → "Segundo Piso"`, … `10 → "Décimo Piso"`, `11–20 → "Piso N"`, `null → null`. El frontend **no** recalcula: muestra `ubicacionLegible`.

### 6.2 Personal y cuentas — `UsuarioAdminController` (`/api/admin/usuarios`)

| Método | Ruta | Cuerpo / Query | Respuesta | Reglas |
|---|---|---|---|---|
| GET | `/api/admin/usuarios` | `buscar`, `idArea`, `rol`, `grado`, `activo`, paginación | `Pagina<UsuarioResumen>` | **Nunca** incluye hash. |
| GET | `/api/admin/usuarios/{id}` | — | `UsuarioDetalle` | |
| POST | `/api/admin/usuarios` | `UsuarioCrearSolicitud` | `201 UsuarioCreadoRespuesta` | Contraseña inicial: §6.2.1. `debe_cambiar_contrasena = 1`. |
| PUT | `/api/admin/usuarios/{id}` | `UsuarioEditarSolicitud` | `UsuarioDetalle` | No permite cambiar contraseña por aquí. Un admin no puede quitarse a sí mismo el rol `ADMINISTRADOR` ni desactivarse (422). |
| PATCH | `/api/admin/usuarios/{id}/estado` | `CambioEstadoSolicitud` | `RespuestaConAdvertencias<UsuarioDetalle>` | Si es encargado de un área → advertencia. |
| POST | `/api/admin/usuarios/{id}/restablecer-contrasena` | `{ "contrasenaTemporal"?: string }` | `ContrasenaTemporalRespuesta` (solo si fue generada) | Se muestra **una sola vez** en un modal; no se registra en logs. Reinicia intentos y bloqueo. |
| GET | `/api/admin/usuarios/disponibilidad` | `correo` o `nombreUsuario` | `{ disponible: boolean }` | Validador asíncrono del formulario. |

Endpoints de la propia cuenta — `CuentaController` (cualquier usuario autenticado):

| Método | Ruta | Cuerpo | Reglas |
|---|---|---|---|
| GET | `/api/cuenta/yo` | — | `UsuarioDetalle` del JWT (incluye `debeCambiarContrasena`). |
| PUT | `/api/cuenta/contrasena` | `CambioContrasenaSolicitud { contrasenaActual, contrasenaNueva }` | Verifica la actual con BCrypt; la nueva cumple la política; pone `debe_cambiar_contrasena = 0`. |

```java
public record UsuarioCrearSolicitud(
    @NotNull(message = "Seleccione el grado profesional") GradoProfesional grado,
    @NotBlank @Size(max = 80) String nombres,
    @NotBlank @Size(max = 80) String apellidos,
    @NotBlank @Email @Size(max = 100) String correo,               // dominio institucional validado en servicio
    @Pattern(regexp = PatronesValidacion.NOMBRE_USUARIO) String nombreUsuario,   // ^[a-z0-9._]{3,40}$
    @NotNull Rol rol,
    @NotNull @Positive Integer idArea,
    @Size(min = 10, max = 72) String contrasenaInicial) {          // opcional: si viene vacía se genera
    public UsuarioCrearSolicitud {
        nombres = Texto.normalizar(nombres);
        apellidos = Texto.normalizar(apellidos);
        correo = correo == null ? null : correo.trim().toLowerCase(Locale.ROOT);
        nombreUsuario = Texto.vacioANulo(nombreUsuario);
    }
    @Override public String toString() { return "UsuarioCrearSolicitud[correo=" + correo + ", contrasenaInicial=***]"; }
}

public record UsuarioResumen(Integer id, String nombreVisible, GradoProfesional grado,
    String correo, String nombreUsuario, Rol rol, AreaMini area, boolean activo,
    LocalDateTime ultimoAcceso) {}

public record PersonaResumen(Integer id, String nombreVisible) {}
public record UsuarioCreadoRespuesta(UsuarioDetalle usuario, String contrasenaTemporal /* null si la definió el admin */) {}
```

#### 6.2.1 Política de contraseñas

- Hash: `BCryptPasswordEncoder(propiedades.costeBcrypt())` con coste 12 (el bean actual usa 10; los hashes antiguos siguen siendo válidos).
- Longitud mínima 10, máxima 72 (límite de BCrypt), al menos una letra y un número; rechazar si contiene el `nombreUsuario` o la parte local del correo. Implementada en `PoliticaContrasenaEstandar implements PoliticaContrasena` → `List<String> incumplimientos(String clave, Usuario contexto)`.
- Contraseña temporal: `GeneradorSecureRandom implements GeneradorContrasenaTemporal` (14 caracteres, alfabeto sin ambiguos `0/O/l/1`), que **siempre** cumple la política (test de propiedad con 1 000 generaciones).
- Eliminar la constante `"Temp2026*"`.
- La contraseña **nunca** se loguea, ni se devuelve salvo la temporal recién generada.
- Login: `maxIntentosFallidos` (5) → `bloqueado_hasta = ahora(Clock) + duracionBloqueo` (15 min). Mensaje genérico "Usuario o contraseña incorrectos" (no revelar si la cuenta existe ni si está bloqueada).
- Tras login con `debeCambiarContrasena = true`, el frontend redirige a `/cuenta/cambiar-contrasena` y el `authGuard` no deja pasar a otras rutas.

### 6.3 Equipos e IPs estáticas — `EquipoAdminController` (`/api/admin/equipos`)

| Método | Ruta | Cuerpo / Query | Respuesta | Reglas |
|---|---|---|---|---|
| GET | `/api/admin/equipos` | `idArea`, `tipo`, `estado`, `sinIp`, `buscar` | `Pagina<EquipoResumen>` | Con IP vigente. |
| GET | `/api/admin/equipos/{id}` | — | `EquipoDetalle` | Incluye historial de IPs. |
| GET | `/api/admin/equipos/sugerir-codigo` | `tipo`, `idArea` | `CodigoSugeridoRespuesta { codigo }` | Delegado en `EstrategiaCodigoInventario`. |
| POST | `/api/admin/equipos` | `EquipoSolicitud` | `201 EquipoDetalle` | Si trae `ipEstatica`, `AsignacionIpService` crea/usa la `direccion_ip` y la asigna en la **misma transacción**. |
| PUT | `/api/admin/equipos/{id}` | `EquipoSolicitud` | `EquipoDetalle` | Cambiar la IP = liberar la vigente + asignar la nueva (queda historial). |
| PATCH | `/api/admin/equipos/{id}/estado` | `{ estado }` | `EquipoDetalle` | Dar de baja libera la IP vigente. |
| POST | `/api/admin/equipos/{id}/ip` | `AsignarIpSolicitud { ipEstatica }` | `EquipoDetalle` | Asignación explícita. |
| DELETE | `/api/admin/equipos/{id}/ip` | — | `EquipoDetalle` | Libera la IP. |
| GET | `/api/admin/red/ip-disponibilidad` | `ip`, `idEquipo?` | `DisponibilidadIpRespuesta { disponible, equipoActual?, motivo? }` | Validador asíncrono. `idEquipo` permite que el equipo en edición "reconozca" su propia IP como disponible. |

```java
public record EquipoSolicitud(
    @NotNull TipoCI tipo,                                    // COMPUTADORA | IMPRESORA (otros tipos permitidos)
    @NotBlank @Size(max = 20) @Pattern(regexp = "^[A-Z0-9-]+$") String codigoInventario,
    @NotBlank @Size(max = 100) String nombre,
    @Size(max = 100) String hostname,
    @Pattern(regexp = PatronesValidacion.MAC) String mac,
    @Size(max = 100) String referenciaUbicacion,
    @Size(max = 80) String marcaModelo,
    @NotNull @Positive Integer idArea,
    @Pattern(regexp = PatronesValidacion.IPV4_ESTRICTA) String ipEstatica) {
    public EquipoSolicitud {
        codigoInventario = codigoInventario == null ? null : codigoInventario.trim().toUpperCase(Locale.ROOT);
        mac = mac == null ? null : mac.trim().toUpperCase(Locale.ROOT).replace('-', ':');
        ipEstatica = Texto.vacioANulo(ipEstatica);
    }
}
```

#### 6.3.1 Sugerencia de código de inventario (sin código de área)

`EstrategiaCodigoInventario` (interfaz):

```java
public interface EstrategiaCodigoInventario {
    /** Devuelve un código libre (no existente en BD) para el tipo y área dados. */
    String sugerir(TipoCI tipo, Area area);
}
```

Implementación por defecto `CodigoPorTipoYAbreviaturaArea`:
1. **Prefijo de tipo:** `COMPUTADORA → PC`, `IMPRESORA → IMP`, otros → `EQ` (mapa inmutable en la clase; un tipo nuevo se agrega al mapa).
2. **Abreviatura del área** (`AbreviadorNombreArea`, derivada en tiempo de ejecución, **no persistida**):
   - Quitar tildes (`Normalizer.Form.NFD`), pasar a mayúsculas, descartar palabras vacías (`DE, DEL, LA, LAS, LOS, EL, Y, E`).
   - Una palabra → primeras 3 letras: "Admisión" → `ADM`, "Emergencia" → `EME`, "Farmacia" → `FAR`.
   - Varias palabras → iniciales (máx. 4): "Consulta Externa" → `CE`, "Unidad de Cuidados Intensivos" → `UCI`.
3. **Correlativo:** `max(NN) + 1` entre los códigos existentes con prefijo `{TIPO}-{ABREV}-`, con 2 dígitos mínimo (`01`…`99`, luego `100`).
4. El resultado es **solo una sugerencia**: el admin puede editarlo. La unicidad la garantiza `UNIQUE(codigo_inventario)`; si dos áreas producen la misma abreviatura, el correlativo es compartido y sigue siendo único.

#### 6.3.2 Reglas de IP estática (`ValidadorIp` = composición de `ReglaIp`)

| Regla | Clase | Resultado |
|---|---|---|
| IPv4 literal estricta, sin ceros a la izquierda (`192.168.010.012` → rechazar; no se "corrige" silenciosamente) | `ReglaIpv4Estricta` | Error 400 |
| No reservada: `0.0.0.0`, `255.255.255.255`, `x.x.x.0`, `x.x.x.255`, multicast `224.0.0.0/4`. `127.0.0.1` solo si el perfil activo es `dev` | `ReglaIpNoReservada` | Error 422 |
| Dentro de los rangos privados de red interna (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`); configurable con `hsmsi.red.exigir-ip-privada` (por defecto `true`) | `ReglaIpPrivada` | Error 422 |
| Única entre asignaciones vigentes | `AsignacionIpService` (consulta + índice único) | 409 *"La IP 192.168.10.12 ya está asignada a PC-ADM-02"* |

> v2: se elimina la advertencia "fuera del segmento del área" porque el área ya no tiene `segmento_red`. Si el hospital la necesitara, se agrega una `ReglaIp` nueva sin tocar el resto (OCP).

`DireccionIpController` existente se mantiene para la vista "Direcciones de red", pero sus endpoints de escritura pasan a requerir `ADMINISTRADOR` y delegan en `AsignacionIpService`.

### 6.4 Contexto de atención — `ContextoAtencionController` (`/api/contexto-atencion`)

Requiere sesión (cualquier rol). **No recibe parámetros.**

```
GET /api/contexto-atencion
```

```json
{
  "estadoDeteccion": "DETECTADO",
  "ipOrigen": "192.168.10.12",
  "equipo": {
    "id": 7, "codigoInventario": "PC-ADM-02", "nombre": "Computadora Admisión 2",
    "tipo": "COMPUTADORA", "referenciaUbicacion": "Ventanilla 2"
  },
  "area": {
    "id": 1, "nombre": "Admisión",
    "ubicacionLegible": "Primer Piso",
    "referenciaUbicacion": "Frente a la Oficina de la Jefatura de Estadística",
    "anexo": "105",
    "encargado": { "id": 3, "nombreVisible": "Lic. …" }
  },
  "impresorasArea": [
    { "id": 11, "codigoInventario": "IMP-ADM-01", "nombre": "Impresora Admisión 1", "referenciaUbicacion": "Junto a ventanilla 1", "ipEstatica": "192.168.10.21" },
    { "id": 12, "codigoInventario": "IMP-ADM-02", "nombre": "Impresora Admisión 2", "referenciaUbicacion": "Junto a ventanilla 4", "ipEstatica": "192.168.10.22" }
  ],
  "persona": {
    "id": 21, "nombreVisible": "Lic. Patricia Ramos", "grado": "LIC",
    "areaAdscrita": { "id": 1, "nombre": "Admisión" }
  },
  "personaEnOtraArea": false
}
```

Valores de `estadoDeteccion` (enum `EstadoDeteccion`):

| Estado | Cuándo | Comportamiento del formulario |
|---|---|---|
| `DETECTADO` | IP con asignación vigente a un equipo activo de un área activa | Prellenado completo. |
| `IP_SIN_EQUIPO` | La IP existe en `direccion_ip` pero no está asignada | Muestra la IP; el usuario elige área (por defecto, su área adscrita) y describe el equipo. |
| `IP_NO_REGISTRADA` | La IP no existe en el registro | Igual que el anterior + aviso discreto "Esta computadora aún no está registrada; el equipo de soporte la identificará". |

`personaEnOtraArea = true` cuando el área del equipo ≠ área adscrita del usuario (caso de cobertura de turno). **No bloquea**: el ticket se registra en el **área del equipo** (donde está la falla) y se informa en el historial.

#### Algoritmo de impresoras del área

```
impresorasArea = equipos WHERE id_area = equipo.id_area
                           AND tipo_ci = 'IMPRESORA'
                           AND estado = 'ACTIVO'
                           AND tiene asignación IP vigente
                 ORDER BY codigo_inventario
```

Se resuelve por **área** (fuente de verdad administrativa), con una sola consulta `JOIN FETCH` (sin N+1).

### 6.5 Reportar un problema — cambios en `POST /api/tickets`

Requiere sesión. Nuevo cuerpo:

```java
public record ReportarProblemaSolicitud(
    @NotNull TipoTicket tipo,
    @NotBlank @Size(max = 150) String asunto,
    @NotBlank @Size(max = 2000) String descripcion,
    @NotNull Impacto impacto,
    @NotNull Urgencia urgencia,
    @NotNull ObjetivoFalla objetivo,      // EQUIPO_ACTUAL | IMPRESORA_AREA | OTRO
    @Positive Integer idImpresora,        // obligatorio si objetivo = IMPRESORA_AREA
    @Positive Integer idAreaManual) {}    // solo se acepta si estadoDeteccion != DETECTADO
```

Lógica de `ReportarProblemaServiceImpl#reportar(solicitud, autenticacion, ip)`:

1. `ip` llega del controlador, obtenida con `ResolutorIpCliente` (§7).
2. `usuario` se obtiene de `autenticacion.getName()` → `id_usuario_reporta`. **Se ignora cualquier id de usuario enviado.**
3. `ctx = contextoAtencionService.resolver(ip, usuario)` (misma lógica que §6.4).
4. `destino = resolutores.get(solicitud.objetivo()).resolver(solicitud, ctx)` (OCP, §3.4):
   - `ObjetivoEquipoActual`: `id_ci = ctx.equipo.id`; si no hay equipo detectado → 422 "No se detectó la computadora; elija «Otro equipo»".
   - `ObjetivoImpresoraArea`: `idImpresora` debe estar en `ctx.impresorasArea` → si no, **422** (evita reportar contra impresoras arbitrarias).
   - `ObjetivoOtro`: `id_ci = null`.
5. `id_area = ctx.area.id` si `DETECTADO`; si no, `idAreaManual` (debe ser un área activa) o el área adscrita del usuario.
6. Guardar `ip_origen`, `id_ci_origen = ctx.equipo?.id`, `deteccion_estado`.
7. `HistorialTicket.detalle` = "Reportado por Lic. Patricia Ramos desde PC-ADM-02 (Admisión)". **No** concatenar texto libre del usuario.

Se elimina el endpoint antiguo `GET /api/tickets/contexto-cliente` al final de F7 (durante F4–F7 queda como alias `@Deprecated` que delega en `ContextoAtencionService`).

---

## 7. Detección segura de IP de origen (anti-spoofing)

### 7.1 Problema

`X-Forwarded-For` es un encabezado **que escribe el cliente**. Si el backend lo lee sin verificar quién lo envió, cualquier usuario de la red puede hacerse pasar por otra máquina.

### 7.2 Diseño

```
 [PC-ADM-02 192.168.10.12] ──TCP──► (opcional) [Proxy/Nginx 192.168.1.5] ──TCP──► [Spring Boot]
```

- **Despliegue directo (sin proxy):** la IP real es `request.getRemoteAddr()`. Se **ignora** por completo `X-Forwarded-For`.
- **Detrás de un proxy inverso:** se usa el `RemoteIpValve` de Tomcat, que **solo** reemplaza `remoteAddr` con el valor de `X-Forwarded-For` cuando la conexión TCP viene de una IP listada en `internal-proxies`, y toma el **último salto no confiable** (de derecha a izquierda), no el primero.

`application.properties`:

```properties
# Por defecto: NO confiar en encabezados de reenvío
server.forward-headers-strategy=NONE

# Perfil "proxy" (application-proxy.properties), solo si hay Nginx delante:
# server.forward-headers-strategy=NATIVE
# server.tomcat.remoteip.internal-proxies=192\\.168\\.1\\.5
# server.tomcat.remoteip.remote-ip-header=X-Forwarded-For
# server.tomcat.remoteip.protocol-header=X-Forwarded-Proto
```

> El proxy, a su vez, debe **sobrescribir** (no anexar) el encabezado: `proxy_set_header X-Forwarded-For $remote_addr;`.

### 7.3 Componente `ResolutorIpCliente` (`security/red/`)

```java
/** Única fuente de IP de cliente para toda la aplicación (DIP: los tests inyectan un doble). */
public interface ResolutorIpCliente {
    Optional<String> resolver(HttpServletRequest request);
}

@Component
class ResolutorIpRemoteAddr implements ResolutorIpCliente {
    private static final Pattern IPV4 = Pattern.compile(PatronesValidacion.IPV4_ESTRICTA);

    @Override
    public Optional<String> resolver(HttpServletRequest request) {
        return normalizar(request.getRemoteAddr());   // ya corregida por RemoteIpValve si aplica
    }

    Optional<String> normalizar(String ip) {
        if (ip == null) return Optional.empty();
        if (ip.equals("::1") || ip.equals("0:0:0:0:0:0:0:1")) return Optional.of("127.0.0.1");
        if (ip.startsWith("::ffff:")) ip = ip.substring(7);   // IPv4 mapeada en IPv6
        return IPV4.matcher(ip).matches() ? Optional.of(ip) : Optional.empty();
    }
}
```

Reglas:
- `TicketController#extractClientIp` **se elimina**. Todo controlador que necesite IP inyecta `ResolutorIpCliente` (los servicios reciben la IP ya resuelta como `String`, no el `HttpServletRequest`: la capa de aplicación no depende de la web).
- Regla ArchUnit D6 (§3.3): ninguna clase llama a `getHeader("X-Forwarded-For")`.
- `127.0.0.1` solo resuelve a un equipo si existe registrado (desarrollo con "PC-DEV-01"); en producción no se registra.

### 7.4 Limitaciones conocidas (documentar en la ayuda del admin, no al usuario final)

- La IP identifica la **máquina**, no a la persona. La persona la da la sesión. Por eso el login es obligatorio para reportar.
- Si alguien cambia manualmente la IP de su PC por la de otra, el sistema lo atribuirá a la otra. Mitigación fuera de alcance de software: reserva por MAC en el switch / DHCP snooping. El campo `mac` del equipo queda listo para auditorías.
- Si la PC está detrás de un NAT (no es el caso en la red interna descrita), todas compartirían IP.

---

## 8. Diseño de pantallas (frontend)

### 8.1 Rutas

Nuevo archivo `funcionalidades/administracion/administracion.routes.ts`, registrado en `app.routes.ts`:

```ts
{
  path: 'administracion',
  canActivate: [rolGuard],
  data: { roles: [RolUsuario.ADMINISTRADOR] },
  loadChildren: () => import('./funcionalidades/administracion/administracion.routes')
    .then(m => m.ADMINISTRACION_ROUTES),
},
{
  path: 'cuenta/cambiar-contrasena',
  loadComponent: () => import('./funcionalidades/auth/paginas/cambiar-contrasena/cambiar-contrasena.page')
    .then(m => m.CambiarContrasenaPage),
  title: 'Cambiar contraseña - Mesa de Ayuda HSMSI',
}
```

```ts
// administracion.routes.ts
export const ADMINISTRACION_ROUTES: Routes = [{
  path: '',
  providers: ADMINISTRACION_PROVIDERS,          // Api (Mock|Http) + Stores, §3.8.3
  children: [
    { path: 'areas',      loadComponent: () => import('./areas/paginas/areas-lista/areas-lista.page').then(m => m.AreasListaPage),   title: 'Áreas del hospital - Mesa de Ayuda HSMSI' },
    { path: 'areas/:id',  loadComponent: () => import('./areas/paginas/area-detalle/area-detalle.page').then(m => m.AreaDetallePage) },
    { path: 'personal',   loadComponent: () => import('./personal/paginas/personal-lista/personal-lista.page').then(m => m.PersonalListaPage), title: 'Personal y cuentas - Mesa de Ayuda HSMSI' },
    { path: 'equipos',    loadComponent: () => import('./equipos/paginas/equipos-lista/equipos-lista.page').then(m => m.EquiposListaPage),   title: 'Equipos e impresoras - Mesa de Ayuda HSMSI' },
    { path: '', pathMatch: 'full', redirectTo: 'areas' },
  ],
}];
```

| Ruta | Página | Título visible |
|---|---|---|
| `/administracion/areas` | `AreasListaPage` | Áreas del hospital |
| `/administracion/areas/:id` | `AreaDetallePage` (pestañas) | Admisión · Primer Piso |
| `/administracion/personal` | `PersonalListaPage` (reemplaza `usuario-lista`) | Personal y cuentas de acceso |
| `/administracion/equipos` | `EquiposListaPage` | Equipos e impresoras |

Menú lateral (sección "Administración", solo admin): **Áreas del hospital**, **Personal y cuentas**, **Equipos e impresoras**.

### 8.2 Componentes reutilizables nuevos en `compartido/ui/`

| Nivel | Componente | Uso |
|---|---|---|
| Átomo | `insignia-grado` | Muestra "Lic.", "Dr." con estilo discreto; `input<GradoProfesional>()`; no se muestra para `SIN_GRADO`. |
| Átomo | `etiqueta-ip` | IP en tipografía monoespaciada + botón copiar accesible. |
| Molécula | `campo-formulario` | Label + control + ayuda + error (`aria-describedby`). Si ya hay equivalente Material, envolverlo. |
| Molécula | `tarjeta-equipo` | Código, nombre, ubicación, IP, estado. Usada en admin y en el formulario de reporte. |
| Molécula | `selector-objetivo-falla` | Grupo de radios grandes "Esta computadora" / "Impresora X" / "Otro equipo". |
| Organismo | `tabla-administracion` | Tabla genérica con búsqueda, filtros, paginación, estado vacío y esqueleto. Recibe definición de columnas por `input()`; no conoce el dominio. |
| Organismo | `dialogo-formulario` | Plantilla de modal con cabecera, cuerpo con scroll, pie con acciones. |

La molécula existente `contexto-equipo` se **actualiza** al nuevo contrato (§6.4) en lugar de crear otra. Todos los componentes de `compartido/ui/` son **de presentación**: no inyectan Api ni Store.

### 8.3 Pantalla "Áreas del hospital" (`/administracion/areas`)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Áreas del hospital                                   [ + Nueva área ]    │
│ Registre las áreas, su ubicación, anexo y encargado.                     │
├──────────────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar por nombre ]   [☐ Mostrar inactivas]                          │
├────────────────┬──────────────┬───────┬────────────────────┬────────────┤
│ Área           │ Piso         │ Anexo │ Encargado(a)       │ Equipos    │
├────────────────┼──────────────┼───────┼────────────────────┼────────────┤
│ Admisión       │ Primer Piso  │ 105   │ Lic. …             │ 4 · 2      │
│ Emergencia     │ Primer Piso  │ 210   │ Lic. …             │ 1 · 1      │
└────────────────┴──────────────┴───────┴────────────────────┴────────────┘
  "4 · 2" = 4 computadoras · 2 impresoras (con texto accesible completo)
```

- Clic en la fila (o Enter) → detalle. Acciones por fila: Editar, Desactivar/Reactivar (con `dialogo-confirmacion`).
- Estado vacío: "Aún no hay áreas registradas. Empiece por Admisión y Emergencia." + botón.
- La referencia de ubicación se muestra como texto secundario bajo el nombre (si existe), no como columna.

**Modal "Nueva área / Editar área"** (`dialogo-area`):

| Campo | Control | Validación |
|---|---|---|
| Nombre del área | texto | Obligatorio, ≤ 80; único (409 del servidor mapeado al campo: "Ya existe un área con ese nombre") |
| Piso | select (Sótano, Primer Piso … Décimo Piso, Piso 11 … 20, "No especificar") | Opcional |
| Referencia de ubicación | textarea 2 líneas, con ayuda "Ejemplo: Frente a la Oficina de la Jefatura de Estadística" | Opcional, ≤ 150 |
| Anexo | texto numérico | Solo dígitos, ≤ 20 |
| Encargado(a) | autocompletar de personal activo (muestra nombre con grado) | Opcional (se habilita en F6) |

### 8.4 Detalle de área (`/administracion/areas/:id`)

Cabecera: **Admisión** · Primer Piso · Frente a la Oficina de la Jefatura de Estadística · Anexo 105 · Encargado(a): Lic. … · [Editar]

Pestañas (`mat-tab-group` o pestañas propias con `role="tablist"`):

1. **Personal (N)** — tabla: Nombre (con grado), Usuario/correo, Rol, Estado, Último acceso. Acciones: `[+ Registrar persona]` (abre `dialogo-personal` con el área preseleccionada), `[Traer persona de otra área]` (autocompletar → `POST /areas/{id}/personal`), Editar, Restablecer contraseña, Desactivar.
2. **Computadoras (N)** — tarjetas/tabla: PC-ADM-01…04, ubicación, IP estática, estado. `[+ Registrar computadora]` abre `dialogo-equipo` con tipo y área preseleccionados y código sugerido.
3. **Impresoras de red (N)** — igual, tipo IMPRESORA.

Indicador de salud del área (solo informativo): "2 computadoras sin IP asignada" en estilo de advertencia si aplica.

### 8.5 Pantalla "Personal y cuentas" (`/administracion/personal`)

Filtros: buscar (nombre/correo/usuario), área, grado, rol, estado. Columnas: Nombre con grado, Área, Usuario, Correo institucional, Rol, Estado, Acciones.

**Modal "Registrar persona"** (`dialogo-personal`), dos secciones:

*Datos del personal*

| Campo | Control | Validación |
|---|---|---|
| Grado profesional | **select alimentado por `CatalogosStore.grados()`** (§5.3): Lic., Téc., Dr., Dra., Mg., Ing., Sin grado | Obligatorio; valor enviado = código (`LIC`) |
| Nombres | texto | Obligatorio |
| Apellidos | texto | Obligatorio |
| Área | select de áreas activas | Obligatorio |
| Vista previa | texto en vivo (`computed` sobre el formulario) | "Se mostrará como: **Lic. Patricia Ramos**" (`aria-live="polite"`) |

*Cuenta de acceso*

| Campo | Control | Validación |
|---|---|---|
| Correo institucional | email | Obligatorio, dominio institucional, único (async) |
| Usuario | texto, sugerido desde nombre (`pramos`) | Opcional, único (async) |
| Perfil | radio: "Personal asistencial" (`USUARIO_FINAL`) / "Administrador de la Mesa de Ayuda" (`ADMINISTRADOR`) | Obligatorio |
| Contraseña inicial | radio: "Generar automáticamente" (por defecto) / "Definir ahora" + campo con medidor de fortaleza y botón mostrar/ocultar | Política §6.2.1 |

Aviso fijo: "No registre DNI, teléfonos personales ni otros datos privados." Tras crear con contraseña generada → `dialogo-contrasena-temporal`: muestra la clave con botón copiar, texto "Entréguela en persona. Se pedirá cambiarla en el primer ingreso. No se volverá a mostrar."

Formulario tipado: `FormGroup<{ grado: FormControl<GradoProfesional | null>; … }>` con `nonNullable` donde aplique; nunca `any`.

### 8.6 Pantalla "Equipos e impresoras" (`/administracion/equipos`)

Filtros: área, tipo (Computadora / Impresora / Otro), estado, "sin IP asignada". Columnas: Código, Nombre, Tipo, Área, Ubicación, IP estática, Estado.

**Modal "Registrar equipo"** (`dialogo-equipo`):

| Campo | Control | Validación |
|---|---|---|
| Tipo | radio con ícono: Computadora / Impresora de red / Otro | Obligatorio |
| Área | select | Obligatorio; al cambiar tipo o área se pide `sugerir-codigo` |
| Código de inventario | texto (prellenado con sugerencia, editable, mayúsculas automáticas) | Obligatorio, único |
| Nombre descriptivo | texto | Obligatorio ("Computadora Admisión 2") |
| Referencia de ubicación | texto | "Ventanilla 2" |
| IP estática | texto | IPv4 estricta; async: "Disponible ✓" / "En uso por PC-ADM-01 ✗" / motivo de la regla incumplida |
| Nombre de red (hostname) | texto | Opcional |
| Dirección física (MAC) | texto | Opcional, formato `AA:BB:CC:DD:EE:FF` |
| Marca y modelo | texto | Opcional |

Si el admin ya editó el código a mano, cambiar tipo/área **no** sobrescribe su valor (bandera `codigoEditadoManualmente`).

### 8.7 Formulario "Reportar un problema" (portal asistencial y `solicitudes/nuevo`)

```
┌───────────────────────────────────────────────────────────────┐
│ Reportar un problema                                          │
├───────────────────────────────────────────────────────────────┤
│ ┌ Detectamos dónde está ──────────────────────────────────┐   │
│ │ 👤 Lic. Patricia Ramos                                  │   │
│ │ 🖥  PC-ADM-02 · Ventanilla 2                            │   │
│ │ 📍 Admisión · Primer Piso · Anexo 105                   │   │
│ │ [ ¿No es correcto? ]                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ¿Dónde está la falla?                                         │
│  ◉ En esta computadora (PC-ADM-02)                            │
│  ○ Impresora IMP-ADM-01 · Junto a ventanilla 1                │
│  ○ Impresora IMP-ADM-02 · Junto a ventanilla 4                │
│  ○ Otro equipo o no estoy seguro(a)                           │
│                                                               │
│ Asunto · Descripción · ¿A cuántos pacientes afecta? · ¿Qué tan│
│ urgente es?  (campos existentes)                              │
│                                    [ Cancelar ] [ Enviar ]    │
└───────────────────────────────────────────────────────────────┘
```

- Mientras carga: esqueleto (átomo `esqueleto`) en la tarjeta de contexto.
- `IP_NO_REGISTRADA` / `IP_SIN_EQUIPO`: la tarjeta dice "No reconocimos esta computadora" + select de área (preseleccionada el área adscrita) y solo opciones "Impresora del área" (si el área elegida tiene) / "Otro equipo".
- `personaEnOtraArea`: nota informativa "Está reportando desde Emergencia; su área habitual es Admisión." (no bloquea).
- "¿No es correcto?" abre un texto de ayuda y permite elegir "Otro equipo"; **no** permite editar la IP.
- El ticket enviado solo incluye `objetivo`, `idImpresora`, `idAreaManual` y los campos descriptivos.
- Datos vía `ContextoAtencionApi` (Mock/Http) + `ReporteProblemaStore` en `portal-asistencial`, siguiendo §3.8.

### 8.8 Accesibilidad (WCAG 2.2 AA) — obligatorio en todas las pantallas

- Modales: foco atrapado, foco inicial en el primer campo, `Esc` cierra, foco regresa al botón que lo abrió, `aria-labelledby` al título.
- Errores: mensaje bajo el campo vinculado con `aria-describedby`; resumen de errores al enviar con foco en el primero; no depender solo del color (ícono + texto).
- Validadores asíncronos anuncian el resultado con `aria-live="polite"`.
- Radios de "¿Dónde está la falla?" con área táctil ≥ `--touch-min` y navegación con flechas.
- Tablas con `<caption>` (puede ser visualmente oculta), `scope="col"`, acciones por fila con `aria-label` completo ("Editar área Admisión").
- Contraste verificado en ambos temas (ampliar `estilos/contraste.spec.ts` con los nuevos pares N4).
- Responsive: tablas → tarjetas apiladas bajo `bp-md` (usar mixin `_responsive.scss`).

### 8.9 Manejo de errores en formularios

- El Store devuelve el `Observable` de escritura; el diálogo se suscribe y usa una utilidad pura `aplicarErroresServidor(form, error)` que, ante 400/409/422 con `campo`, hace `form.get(campo)?.setErrors({ servidor: mensaje })`; sin `campo`, muestra el mensaje en el resumen del diálogo.
- `HttpErrorResponse` nunca llega a las plantillas: los mappers de error viven en `compartido/utilidades/errores-http.ts`.
- Los validadores asíncronos (`validadores-asincronos.ts`) reciben la **Api abstracta** (no `HttpClient`), usan `timer(400)` + `switchMap` (cancelación) y devuelven `null` ante error de red (no bloquean el formulario por un fallo de conectividad; el servidor valida igual al guardar).

---

## 9. Tokens de diseño (4 niveles)

Ningún archivo nuevo de componente contiene hex, `rgb()` ni `px` sueltos. Se agregan **solo** tokens N3/N4 en `estilos/tokens/_componentes.scss` (y su override en `_tema-noche.scss` únicamente si el N2 no basta):

```scss
/* ═══════════════ NIVEL 3 · FAMILIAS (nuevas) ═══════════════ */
/* Tabla de administración */
--comp-tabla-bg:              var(--color-surface-card);
--comp-tabla-cabecera-bg:     var(--color-surface-sunken);
--comp-tabla-fila-hover-bg:   var(--color-surface-hover);
--comp-tabla-borde:           1px solid var(--color-border-subtle);
--comp-tabla-padding-celda:   var(--espacio-3);

/* Diálogo de formulario */
--comp-dialogo-bg:            var(--color-surface-card);
--comp-dialogo-radio:         var(--radius-lg);
--comp-dialogo-padding:       var(--espacio-6);
--comp-dialogo-ancho-md:      40rem;
--comp-dialogo-overlay:       var(--color-surface-overlay);

/* Campo de formulario */
--comp-campo-error-color:     var(--color-danger-text);      /* usar el nombre N2 real existente */
--comp-campo-ayuda-color:     var(--color-text-muted);

/* ═══════════════ NIVEL 4 · ESPECÍFICOS (nuevos) ═══════════════ */
--comp-contexto-atencion-bg:        var(--color-primary-light);
--comp-contexto-atencion-borde:     var(--color-primary-base);
--comp-objetivo-falla-seleccion-bg: var(--color-secondary-light);
--comp-objetivo-falla-seleccion-borde: var(--color-secondary-base);
--comp-etiqueta-ip-fuente:          var(--font-family-mono);
--comp-insignia-grado-bg:           var(--color-surface-sunken);
--comp-insignia-grado-texto:        var(--color-text-secondary);
--comp-ip-disponible-color:         var(--color-success-text);
--comp-ip-ocupada-color:            var(--color-danger-text);
--comp-ip-advertencia-color:        var(--color-warning-text);
```

> Antigravity debe **verificar los nombres N2 reales** en `_semanticos.scss` antes de usarlos (los anteriores son indicativos) y, si falta alguno (p. ej. `--font-family-mono`), crearlo en N2 apuntando a un N1 existente; si falta el N1, agregarlo en `_primitivos.scss` (único lugar con valores literales).

Verificación automática: `npm run verificar` (incluye `stylelint`) con la línea base existente (`docs/refactor/stylelint-baseline.txt`), que no debe crecer; `grep -rEn '#[0-9a-fA-F]{3,8}\b' src/app` debe devolver 0 coincidencias en archivos nuevos.

---

## 10. Seguridad — configuración consolidada

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
  // ...
  .authorizeHttpRequests(auth -> auth
      .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
      .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.POST, "/api/areas/**", "/api/equipos/**", "/api/direcciones-ip/**",
                       "/api/usuarios/**").hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.PUT,   "/api/areas/**", "/api/equipos/**", "/api/usuarios/**").hasRole("ADMINISTRADOR")
      .requestMatchers(HttpMethod.PATCH, "/api/equipos/**", "/api/usuarios/**").hasRole("ADMINISTRADOR")
      .anyRequest().authenticated())
}
```

- Además de la regla por URL, cada controlador de `administrativo..api..` lleva `@PreAuthorize("hasRole('ADMINISTRADOR')")` a nivel de clase (defensa en profundidad; regla ArchUnit adicional D9).
- Verificar en `CustomUserDetailsService` que la autoridad se emita como `ROLE_ADMINISTRADOR` (prefijo `ROLE_`).
- `@JsonIgnore` en `Usuario.contrasenaHash` como **defensa en profundidad** (además de los DTO).
- Logs: no registrar cuerpos de `/api/auth/**`, `/api/cuenta/contrasena`, `/api/admin/usuarios/*/restablecer-contrasena`.
- Auditoría mínima (log estructurado `INFO`): quién creó/editó/desactivó área, usuario, equipo o IP, y desde qué IP.

---

## 11. Glosario de pantalla (Regla de Oro — cero vocabulario ITIL)

| ❌ Nunca en pantalla | ✅ Usar |
|---|---|
| CMDB, CI, Elemento de configuración | Catálogo de Equipos y Red · Equipo · Computadora · Impresora |
| SLA | Compromisos de Atención |
| KEDB | Centro de Soluciones de Errores Conocidos |
| Incidente / Ticket / Requerimiento | Reportar un problema · Solicitud · Mi reporte |
| Impacto / Urgencia | ¿A cuántos pacientes o áreas afecta? · ¿Qué tan urgente es? |
| Usuario final | Personal asistencial |
| Rol `USUARIO_FINAL` / `ADMINISTRADOR` | Personal asistencial / Administrador de la Mesa de Ayuda |
| `SIN_GRADO` | Sin grado |
| Asignación de IP / DHCP | IP estática del equipo |
| Hostname / MAC | Nombre de red / Dirección física (MAC) — solo en pantallas de administración |
| Estado de detección `IP_NO_REGISTRADA` | "No reconocimos esta computadora" |
| Código de área / Pabellón | *(no existen; no mostrar)* |

Los términos técnicos (`ElementoConfiguracion`, `id_ci`, `cmdb/`) **sí** pueden permanecer en código, nombres de clases, rutas internas y BD. Verificación: `npm run verificar` (`verificar-vocabulario.mjs`) y `grep -rniE '\b(ITIL|CMDB|KEDB|SLA|RFC)\b' src/app --include=*.html` sobre los archivos nuevos/modificados → 0 resultados (los textos visibles en `.ts`, p. ej. `title:` de rutas o mensajes de notificación, también se revisan).

---

## 12. Fases de implementación (F0 → F7)

> Cada fase termina con: build verde (`mvn verify` y `ng build` + `ng test` + `npm run verificar`), commit(s) con Conventional Commits según `docs/guia_git_commits.md`, y **prueba manual del usuario** con los pasos listados en "Prueba del usuario". No se inicia la siguiente fase sin la aprobación de la anterior.

### F0 — Blindaje de seguridad y andamiaje arquitectónico (prerrequisito)

**Objetivo:** cerrar S1–S6 y S8, y dejar listas las piezas transversales de §3 para que las fases siguientes solo agreguen módulos.

Tareas backend:
1. Crear `compartido/` (`excepciones/`, `web/Pagina`, `web/RespuestaConAdvertencias`, `validacion/PatronesValidacion`, `Texto`) y ampliar `GlobalExceptionHandler` según §3.7 (incluido `TraductorRestriccionesBd`).
2. Agregar `archunit-junit5` (test) y `ArquitecturaTest` con D1–D3 y D6 activas (D4, D5, D7–D9 se activan cuando existan los paquetes, a más tardar en F4).
3. `administrativo/personal/dto/` con `UsuarioResumen`, `UsuarioDetalle`, `PersonaResumen` (`record`) + `UsuarioMapper`. Todos los métodos de `UsuarioController` devuelven DTO.
4. `@JsonIgnore` en `Usuario.contrasenaHash`.
5. `security/red/ResolutorIpCliente` + `ResolutorIpRemoteAddr` (§7.3); eliminar `TicketController#extractClientIp`; usar el resolutor en `createTicket` y `getContextoCliente`.
6. `server.forward-headers-strategy=NONE` en `application.properties`; crear `application-proxy.properties` comentado como plantilla.
7. `SecurityConfig`: `@EnableMethodSecurity`, solo `/api/auth/login` público, reglas de rol (§10). `POST /api/tickets` pasa a autenticado.
8. `cambiarContrasena`: solo autenticado, exige `contrasenaActual`; mover a `PUT /api/cuenta/contrasena` (mantener la ruta anterior delegando, marcada `@Deprecated`, hasta F6).
9. Eliminar `"Temp2026*"`; si no llega contraseña → generar temporal segura.
10. Bean `Clock` (`Clock.systemDefaultZone()`).

Tareas frontend:
11. Ajustar el frontend que llame a los endpoints afectados (login, cambiar contraseña, listado de técnicos) para que siga funcionando.
12. Crear `scripts/verificar-capas.mjs` (§3.8.4) e incorporarlo a `npm run verificar`.

Pruebas automatizadas:
- `UsuarioControllerTest` (`@WebMvcTest`): la respuesta de `GET /api/usuarios` **no contiene** las claves `contrasenaHash` ni `contrasena` (`jsonPath("$[0].contrasenaHash").doesNotExist()`).
- `ResolutorIpRemoteAddrTest`: con `remoteAddr=192.168.10.12` y encabezado `X-Forwarded-For: 10.0.0.99` → `192.168.10.12`. `::1` → `127.0.0.1`. `::ffff:192.168.10.12` → `192.168.10.12`. `"abc"` → vacío.
- `SecurityConfigTest`: `GET /api/tickets` sin token → 401; `POST /api/usuarios` con token `USUARIO_FINAL` → 403; con `ADMINISTRADOR` → 201.
- `ArquitecturaTest` en verde.

**Criterios de aceptación:**
- [ ] Ningún endpoint devuelve el hash de contraseña (verificado con test y con la pestaña Red del navegador).
- [ ] Enviar `X-Forwarded-For` falso no cambia la IP detectada.
- [ ] `GET /api/tickets` sin sesión responde 401.
- [ ] Un usuario no administrador recibe 403 al crear/editar usuarios, áreas, equipos o IPs.
- [ ] No existe ninguna contraseña por defecto en el código (`grep -rn "Temp2026" backend/` vacío).
- [ ] `ArquitecturaTest` y `npm run verificar` forman parte del build y pasan.
- [ ] El login y el flujo actual de reportar siguen funcionando para un usuario autenticado.

**Prueba del usuario:** iniciar sesión como admin y como personal asistencial; abrir DevTools → Red → revisar `GET /api/usuarios` (sin hash); desde terminal `curl -H "X-Forwarded-For: 1.2.3.4" .../api/tickets/contexto-cliente` con token y confirmar que la IP devuelta es la real.

---

### F1 — Modelo de datos, migraciones y enum `GradoProfesional`

**Objetivo:** dejar la BD, las entidades JPA y el enum de grados listos (§4, §5.1).

Tareas:
1. Scripts SQL de §4.4 (verificaciones previas, idempotentes + rollback).
2. Entidades: `Area` (solo `nombre`, `piso`, `referenciaUbicacion`, `anexo`, `encargado`, `activo`; **sin** `codigo`/`pabellon`/`segmentoRed`), `Usuario` (`GradoProfesional` con `@Enumerated(STRING)`, `nombreUsuario`, `contrasenaHash` como `String`, campos de bloqueo), `ElementoConfiguracion` (`codigoInventario`, `referenciaUbicacion`, `marcaModelo`), `Ticket` (`elementoOrigen`, `deteccionEstado`). Reemplazar `@Data` por `@Getter/@Setter` en las entidades tocadas.
3. `administrativo/personal/dominio/GradoProfesional` (§5.1) + `compartido/persona/NombreVisible` + tests (`GradoProfesionalContratoTest`, `NombreVisibleTest`: con y sin grado, nombres compuestos, espacios extra).
4. Ajustar `CustomUserDetailsService` y `UsuarioServiceImpl` al nuevo tipo `String` del hash (quitar conversiones `byte[]`).
5. Repositorios: `AreaRepository.existsByNombreNormalizado` (consulta con `COLLATE Modern_Spanish_CI_AI` o comparación sobre la columna ya CI_AI), `UsuarioRepository.findByCorreoIgnoreCaseOrNombreUsuario`, `ElementoConfiguracionRepository.findByAreaAndTipoCiAndEstado`, `HistorialAsignacionIpRepository.findVigenteByEquipo`, `findVigenteByIp` (con `JOIN FETCH` de equipo y área), consulta agregada de conteos por área (proyección `ConteosArea` record).
6. Actualizar `docs/diseno_base_datos.md`.

**Criterios de aceptación:**
- [ ] Los scripts se ejecutan dos veces seguidas sin error (idempotencia) y el rollback deja la BD como antes.
- [ ] La tabla `area` **no** tiene columnas `codigo`, `pabellon` ni `segmento_red`.
- [ ] Insertar "Admisión" y luego "admision" en SQL falla por `UX_area_nombre`.
- [ ] Insertar un `grado_profesional = 'QF'` en SQL falla por `CK_usuario_grado`.
- [ ] Las cuentas existentes **siguen pudiendo iniciar sesión** tras migrar `contrasena_hash` a `VARCHAR`, y quedan con `grado_profesional = 'SIN_GRADO'`.
- [ ] Intentar insertar en SQL dos asignaciones vigentes para la misma IP falla por el índice único.
- [ ] `mvn verify` en verde; test de arranque con `spring.jpa.hibernate.ddl-auto=validate` sin errores de mapeo.

**Prueba del usuario:** ejecutar los scripts en la BD local, iniciar sesión con una cuenta existente.

---

### F2 — Backend: Personal, cuentas de acceso y catálogo de grados

**Objetivo:** API completa de §6.2 + política §6.2.1 + catálogo §5.3.

Tareas:
1. `administrativo/catalogos/`: `CatalogoController` (`GET /api/catalogos/grados-profesionales`), `CatalogoConsultaService` + impl, `OpcionCatalogoRespuesta`.
2. `administrativo/personal/`: `UsuarioAdminController`, `CuentaController`, `PersonalConsultaService` / `PersonalGestionService` / `CuentaService` (interfaces + impl), DTO `record` con `@Valid`, `UsuarioMapper` ampliado.
3. `PropiedadesCuentas` (`@ConfigurationProperties` record) con `costeBcrypt`, `maxIntentosFallidos`, `duracionBloqueo`, `dominioCorreo` (vacío = no valida, para desarrollo).
4. `PoliticaContrasena` + `PoliticaContrasenaEstandar`, `GeneradorContrasenaTemporal` + `GeneradorSecureRandom`.
5. `BCryptPasswordEncoder(propiedades.costeBcrypt())`.
6. Bloqueo por intentos fallidos en el flujo de login (`AuthController` / listener `AuthenticationFailureBadCredentialsEvent`), usando `Clock`; actualizar `ultimo_acceso` en éxito.
7. `GET /api/cuenta/yo` y `PUT /api/cuenta/contrasena`; el JWT o `/cuenta/yo` expone `debeCambiarContrasena`.
8. Reglas: el admin no puede desactivarse ni quitarse el rol; correo/usuario únicos sin distinguir mayúsculas.

Pruebas: unitarias de servicios con dobles de las interfaces (creación, duplicados 409, política de contraseña, generación temporal, bloqueo con `Clock` fijo), `@WebMvcTest` de seguridad por rol, test del catálogo (7 elementos, orden, `SIN_GRADO` con `prefijo = null`), test de deserialización de grado inválido → 400.

**Criterios de aceptación:**
- [ ] `GET /api/catalogos/grados-profesionales` devuelve los 7 grados en el orden de §5.3.
- [ ] Crear "Patricia Ramos" con grado `LIC` devuelve `nombreVisible = "Lic. Patricia Ramos"`; con `SIN_GRADO` devuelve `"Patricia Ramos"`.
- [ ] Enviar `"grado": "QF"` → 400 con `campo = "grado"`.
- [ ] La contraseña se guarda como BCrypt (`$2a$12$...` / `$2b$12$...`), nunca en texto plano.
- [ ] La contraseña temporal solo aparece en la respuesta de creación/restablecimiento.
- [ ] Correo duplicado → 409 con mensaje en español y `campo = "correo"`.
- [ ] 5 contraseñas erradas bloquean 15 minutos; el mensaje no revela si la cuenta existe.
- [ ] Los DTO no tienen campos de DNI ni teléfono.

---

### F3 — Backend: Áreas, equipos e IPs estáticas

**Objetivo:** API de §6.1 y §6.3.

Tareas:
1. `administrativo/areas/`: `AreaAdminController`, `AreaConsultaService` / `AreaGestionService` (+ impl), `FormateadorUbicacion`, `AreaMapper`, DTO de §6.1. Unicidad por nombre (servicio + índice), mensaje especial si el homónimo está inactivo. Conteos con consulta agregada.
2. `administrativo/equipos/`: `EquipoAdminController`, `RedAdminController`, `EquipoConsultaService` / `EquipoGestionService` / `AsignacionIpService` (+ impl), `EquipoMapper`. Alta + IP en una sola transacción (`@Transactional`), cambio de IP (libera + asigna), baja (libera).
3. `EstrategiaCodigoInventario` + `CodigoPorTipoYAbreviaturaArea` + `AbreviadorNombreArea` (§6.3.1).
4. `ReglaIp` + `ReglaIpv4Estricta`, `ReglaIpNoReservada`, `ReglaIpPrivada` + `ValidadorIp` (§6.3.2), con `PropiedadesRed` record.
5. `TraductorRestriccionesBd`: `UX_area_nombre` → 409 `nombre`; `UX_hist_ip_vigente_por_ip` → 409 `ipEstatica`; `UQ codigo_inventario` → 409 `codigoInventario`.
6. Proteger escritura en controladores antiguos (`AreaController`, `EquipoController`, `DireccionIpController`) o hacerlos delegar en los nuevos servicios.
7. Activar reglas ArchUnit D4, D7, D8, D9.

Pruebas: `AbreviadorNombreAreaTest` (Admisión → ADM, Emergencia → EME, Consulta Externa → CE, Unidad de Cuidados Intensivos → UCI, tildes y espacios), test de contrato parametrizado para toda `EstrategiaCodigoInventario` y toda `ReglaIp`, misma IP a dos equipos (la segunda → 409), cambio de IP genera historial, baja libera IP, sugerencia `PC-ADM-03` cuando existen 01 y 02, área "admision" duplicada → 409, desactivar área con equipos activos → 409.

**Criterios de aceptación:**
- [ ] Se pueden registrar por API las áreas **Admisión** (Primer Piso, referencia "Frente a la Oficina de la Jefatura de Estadística", anexo) y **Emergencia** (Primer Piso, anexo) sin código ni pabellón.
- [ ] Se registran PC-ADM-01…04, IMP-ADM-01…02, PC-EME-01 (admisión de emergencia) e IMP-EME-01, cada uno con IP estática única.
- [ ] `GET /api/admin/areas/{id Admisión}` devuelve `totalComputadoras = 4`, `totalImpresoras = 2`, `ubicacionLegible = "Primer Piso"`.
- [ ] Una IP no puede quedar vigente en dos equipos (probado también con dos peticiones concurrentes).
- [ ] `GET /api/admin/equipos/sugerir-codigo?tipo=IMPRESORA&idArea={Emergencia}` → `IMP-EME-02` si ya existe `IMP-EME-01`.

---

### F4 — Backend: Autodetección de contexto y reporte con objetivo

**Objetivo:** §6.4 y §6.5.

Tareas:
1. `asistencial/atencion/`: `ContextoAtencionService#resolver(ip, usuario)` con los tres estados, consumiendo **solo** `AreaConsultaService` / `EquipoConsultaService` (regla D5); **eliminar** el fallback "primera área".
2. `ContextoAtencionController` `GET /api/contexto-atencion` + `ContextoAtencionMapper`.
3. `ReportarProblemaService` con `ResolutorObjetivoFalla` por objetivo (§6.5); `TicketController#createTicket` delega en él (usuario desde JWT, re-resolución, validación de impresora del área, `id_ci_origen`, `deteccion_estado`).
4. Enums `ObjetivoFalla`, `EstadoDeteccion`.
5. Deprecar `GET /api/tickets/contexto-cliente` (delegar al nuevo servicio hasta F7).
6. Activar regla ArchUnit D5.
7. Actualizar `docs/contratos_api_y_modelos.md` (incluido el procedimiento para agregar grados, §5.4) y `docs/matriz_endpoints.md`.

Pruebas (`@SpringBootTest` + MockMvc con `RequestPostProcessor` que fija `remoteAddr`):
- IP `192.168.10.12` + sesión de Patricia → `DETECTADO`, equipo PC-ADM-02, área Admisión, 2 impresoras, persona "Lic. Patricia Ramos".
- Misma sesión desde IP de Emergencia → área Emergencia, `personaEnOtraArea = true`.
- IP desconocida → `IP_NO_REGISTRADA`, `area = null`.
- Reportar `IMPRESORA_AREA` con `idImpresora` de Emergencia desde PC de Admisión → 422.
- Enviar `X-Forwarded-For` con IP de otra PC → se sigue detectando la IP real.
- Enviar `idUsuarioReporta` u otro campo extra en el cuerpo → ignorado.
- Test de arranque: falla si falta un `ResolutorObjetivoFalla` para algún `ObjetivoFalla`.

**Criterios de aceptación:**
- [ ] El contexto se resuelve exclusivamente con IP del servidor + JWT.
- [ ] El ticket guarda reportante, equipo de origen, equipo afectado, área e IP correctos en los escenarios anteriores.
- [ ] Rotación en Admisión: dos personas distintas en PC-ADM-02 generan tickets con el mismo equipo y distinto reportante.
- [ ] No queda ningún ticket con área asignada "por defecto".
- [ ] `ArquitecturaTest` con D1–D9 activas en verde.

---

### F5 — Frontend: Administración de Áreas + catálogos (`/administracion/areas`)

**Objetivo:** §3.8, §5.2, §5.3 (lado frontend), §8.1–§8.4 + componentes compartidos base.

Tareas:
1. `compartido/catalogos/`: `grado-profesional.enum.ts`, `catalogos.api|http|mock.ts`, `catalogos.providers.ts` (registrado en `app.config.ts`), `CatalogosStore`, función `nombreVisible()` + specs de paridad (§5.4).
2. `administracion.routes.ts`, `administracion.providers.ts`, registro en `app.routes.ts` con `rolGuard` (ADMINISTRADOR), entradas en el menú lateral; `API_ENDPOINTS.admin.*` y `API_ENDPOINTS.catalogos.*` en `nucleo/config/api-endpoints.ts`.
3. Componentes compartidos: `tabla-administracion`, `dialogo-formulario`, `campo-formulario`, `insignia-grado`, `etiqueta-ip`, `tarjeta-equipo`.
4. `areas/`: modelos + DTO, `AreasApi` / `AreasHttp` / `AreasMock` / `areas.mapper.ts`, `AreasStore`, `AreasListaPage`, `dialogo-area` (sin código ni pabellón), `AreaDetallePage` con las 3 pestañas en **modo lectura** (las acciones de crear persona/equipo se conectan en F6).
5. Utilidad `aplicarErroresServidor` (§8.9).
6. Tokens N3/N4 de §9.
7. Pruebas: suite de contrato `contratoAreasApi` ejecutada sobre Mock y Http; specs del mapper; specs de `dialogo-area` (validaciones, mapeo de 409 al campo `nombre`); render del estado vacío.

**Criterios de aceptación:**
- [ ] El admin crea, edita, desactiva y reactiva áreas desde la interfaz sin tocar la BD, tanto con `usarMocks: true` como contra el backend real.
- [ ] El formulario de área tiene exactamente: Nombre, Piso, Referencia de ubicación, Anexo, Encargado(a). No aparece "Código" ni "Pabellón" en ninguna pantalla.
- [ ] Registrar "admision" cuando ya existe "Admisión" muestra el error bajo el campo Nombre.
- [ ] El detalle muestra personal, computadoras e impresoras con su IP.
- [ ] Un usuario no admin que navega a `/administracion/areas` es enviado a `/403`.
- [ ] `npm run verificar` pasa (capas, vocabulario, íconos, stylelint): ninguna página importa `HttpClient`, `*.http` ni `*.mock`.
- [ ] Navegable solo con teclado; modal con foco atrapado y `Esc`; lector de pantalla anuncia errores.
- [ ] Modo claro y modo noche correctos; 0 hex en archivos nuevos; 0 términos ITIL en pantalla.

**Prueba del usuario:** registrar "Admisión" (Primer Piso, referencia "Frente a la Oficina de la Jefatura de Estadística", anexo) y "Emergencia" (Primer Piso, anexo). Dejar el encargado vacío por ahora. Intentar registrar "admision" de nuevo y ver el error.

---

### F6 — Frontend: Personal, cuentas y Equipos con IP estática

**Objetivo:** §8.5, §8.6 y la conexión de acciones en el detalle de área.

Tareas:
1. `personal/`: `PersonalApi` / `PersonalHttp` / `PersonalMock` / mapper, `PersonalStore`, `PersonalListaPage` (reemplaza `usuario-lista` / `usuario-formulario`; eliminar las páginas antiguas y `usuarios.service.ts` tras confirmar que no tienen importadores), `dialogo-personal` con **selector de grado alimentado por `CatalogosStore`**, vista previa con `nombreVisible()`, `dialogo-contrasena-temporal`, acción "Restablecer contraseña".
2. `equipos/`: `EquiposApi` / `EquiposHttp` / `EquiposMock` / mapper, `EquiposStore`, `EquiposListaPage`, `dialogo-equipo` con sugerencia de código (respetando edición manual) y validación asíncrona de IP.
3. `validacion/validadores-asincronos.ts` (reciben la Api abstracta; `timer(400)` + `switchMap`).
4. Conectar en `AreaDetallePage`: registrar persona, traer persona de otra área, registrar computadora/impresora con área preseleccionada.
5. Selector de encargado en `dialogo-area` (autocompletar de personal activo).
6. Página `cuenta/cambiar-contrasena` + ajuste de `authGuard` para forzarla si `debeCambiarContrasena`.
7. Retirar la ruta deprecada de cambio de contraseña del backend (F0 punto 8).
8. Suites de contrato `contratoPersonalApi` y `contratoEquiposApi` sobre Mock y Http.

**Criterios de aceptación:**
- [ ] El selector de grado muestra exactamente: Lic., Téc., Dr., Dra., Mg., Ing., Sin grado (desde el catálogo del servidor cuando `usarMocks: false`).
- [ ] El admin registra al personal con grado; la vista previa muestra "Lic. Patricia Ramos"; con "Sin grado" muestra "Patricia Ramos".
- [ ] La contraseña temporal se muestra una sola vez; al primer ingreso la persona está obligada a cambiarla.
- [ ] El formulario de personal no tiene campos de DNI ni teléfono y muestra el aviso de privacidad.
- [ ] El admin registra las 4 PCs + 2 impresoras de Admisión y la PC + impresora de Emergencia con IPs estáticas; la IP repetida se marca en vivo como "En uso por …".
- [ ] El encargado de Emergencia (un Licenciado) se asigna desde el modal del área y aparece como "Lic. …".
- [ ] Accesibilidad, temas, tokens, capas y vocabulario igual que F5.

**Prueba del usuario:** completar la carga real de la "Guía de carga" (F7) desde la interfaz.

---

### F7 — Frontend: Reporte con contexto prellenado + pruebas integrales

**Objetivo:** §8.7 y validación de punta a punta.

Tareas:
1. `portal-asistencial/servicios/contexto-atencion.api|http|mock.ts` + `ReporteProblemaStore`; retirar `nucleo/servicios/contexto-cliente.service.ts` y el modelo `ContextoCliente` antiguo; actualizar la molécula `contexto-equipo` al contrato de §6.4.
2. Nueva molécula `selector-objetivo-falla`; integrarla en `solicitud-formulario` y en el flujo del portal asistencial.
3. Manejo de estados `IP_NO_REGISTRADA` / `IP_SIN_EQUIPO` / `personaEnOtraArea`.
4. Actualizar mocks (`portal-*.mock.ts`) para el nuevo contrato.
5. Eliminar el endpoint deprecado `GET /api/tickets/contexto-cliente` en backend.
6. Pruebas e2e manuales guiadas (y automatizadas si el proyecto ya tiene runner e2e).

**Guía de carga y prueba (usuario):**

| Paso | Acción | Resultado esperado |
|---|---|---|
| 1 | Admin registra el personal de Admisión y Emergencia (incluida "Lic. Patricia Ramos" en Admisión y el Licenciado encargado de Emergencia), eligiendo el grado en el selector | Cuentas creadas, claves temporales entregadas |
| 2 | Admin asigna encargados a ambas áreas | Detalle de área muestra "Lic. …" |
| 3 | Admin registra PC-ADM-01…04 e IMP-ADM-01…02 con sus IPs reales; PC-EME-01 e IMP-EME-01 con las suyas | Conteos 4 · 2 y 1 · 1 |
| 4 | Patricia inicia sesión en PC-ADM-02 → "Reportar un problema" | Tarjeta: Lic. Patricia Ramos · PC-ADM-02 · Admisión · Primer Piso; opciones: esta PC, IMP-ADM-01, IMP-ADM-02, otro |
| 5 | Elige IMP-ADM-01 y envía | El técnico ve el reporte con equipo afectado IMP-ADM-01, origen PC-ADM-02, reportante Patricia |
| 6 | Otra persona inicia sesión en la misma PC-ADM-02 y reporta | Mismo equipo, distinto reportante (rotación) |
| 7 | Patricia inicia sesión en PC-EME-01 | Contexto Emergencia, aviso "su área habitual es Admisión", impresora IMP-EME-01 |
| 8 | Desde una PC no registrada | "No reconocimos esta computadora", selector de área |
| 9 | (Prueba de seguridad) `curl` con `X-Forwarded-For` de PC-ADM-02 desde otra máquina | Se detecta la IP real, no la falsificada |

> **Datos de ejemplo:** las IPs `192.168.10.x` de este documento son ilustrativas. Usar el plan de direccionamiento real del área de TI del hospital. Para desarrollo local se puede registrar un equipo "PC-DEV-01" con IP `127.0.0.1` (perfil `dev`).

**Criterios de aceptación (cierre del módulo):**
- [ ] Los 9 pasos de la guía se cumplen.
- [ ] Todo el flujo se carga desde la interfaz (sin scripts de datos).
- [ ] `ng build --configuration production`, `ng test`, `npm run verificar` y `mvn verify` (incluido `ArquitecturaTest`) en verde.
- [ ] Auditoría final: `grep` de hex (0), `grep` de ITIL/CMDB/SLA/KEDB/RFC en textos visibles (0), `grep` de `X-Forwarded-For` fuera de la configuración (0), `grep` de `contrasenaHash` en respuestas JSON (0), `grep -rniE '\b(pabellon|codigoArea|segmentoRed)\b' backend/src frontend/src` (0).
- [ ] `docs/roadmap-maestro-servicedesk.md`, `docs/matriz_endpoints.md`, `docs/contratos_api_y_modelos.md` y `docs/diseno_base_datos.md` actualizados.

---

## 13. Fuera de alcance / deuda registrada

1. Unificar el rol `TECNICO` (backend) con `PRACTICANTE` (frontend) — requiere decisión funcional; abrir plan propio. Aplicar la misma garantía de paridad que `GradoProfesional` (§5.4).
2. Migrar los módulos existentes (tickets, préstamos, indicadores, errores conocidos) a paquetes por dominio y DTO `record`, siguiendo §3.2.
3. Migración a Flyway para versionado automático de BD.
4. Vinculación IP↔MAC en switches (802.1X / DHCP snooping) para impedir que alguien configure manualmente la IP de otra PC.
5. Importación masiva de personal/equipos desde Excel.
6. Soporte IPv6 en la red interna.
7. Asociación explícita PC → impresora predeterminada (hoy se infiere por área; el contrato ya lo soportaría).
8. Advertencia de IP fuera del rango esperado de un área (requeriría reintroducir un dato de red por área; se implementaría como una `ReglaIp` nueva).
9. Alinear `CLAUDE.md` con las versiones reales del repositorio (Spring Boot 4.1.1, Angular 22).

---

## 14. Matriz de trazabilidad requisito → fase

| Requisito | Secciones | Fases |
|---|---|---|
| R1. Registro de datos por el usuario desde la web | §8 | F5, F6 |
| R2. Personal con cuenta propia, grado (enum formal), BCrypt, sin datos sensibles | §4.2, §5, §6.2, §8.5 | F1, F2, F5, F6 |
| R3. IPs estáticas + autodetección de máquina, área, impresoras y persona | §4.1, §6.3, §6.4, §6.5, §7, §8.7 | F0, F3, F4, F7 |
| R4. Áreas críticas Admisión y Emergencia | §12 F3, F7 (guía de carga) | F3, F5–F7 |
| R5. Módulo `/administracion/areas` con personal y equipos | §6.1, §8.3, §8.4 | F3, F5, F6 |
| R6. Fases, tokens 4 niveles, cero ITIL, correcciones de seguridad | §1.1, §9, §10, §11, §12 | F0–F7 |
| R7. Área sin código ni pabellón (nombre, piso, referencia opcional, anexo, encargado, activo) | §4.2, §6.1, §8.3 | F1, F3, F5 |
| R8. Grados profesionales tipados en backend y frontend, expuestos por catálogo | §5, §8.5 | F1, F2, F5, F6 |
| R9. Modularidad, SOLID, DTO `record`, mappers dedicados, Api/Mock/Http con Signals | §3 | F0 (andamiaje), F1–F7 (aplicación), verificado por `ArquitecturaTest` y `verificar-capas.mjs` |
