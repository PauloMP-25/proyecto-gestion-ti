# Fase 1: Plan de Desarrollo y Arquitectura

Este documento detalla el paso a paso de las funcionalidades a desarrollar. El objetivo es establecer la base arquitectónica y construir todos los flujos requeridos (Autenticación, Gestión de Tickets, SLAs, KEDB, y CMDB), asegurando que tanto el Backend como el Frontend avancen en paralelo.

---

## 1. Estructura de Carpetas Sugerida

### Backend (Spring Boot - Java)
```text
src/main/java/com/hospital/servicedesk/
├── config/         # Configuraciones globales (Seguridad, JWT, CORS, OpenAPI)
├── controllers/    # Controladores REST (endpoints, reciben DTOs, devuelven DTOs)
├── dtos/           # Objetos de Transferencia de Datos (Request/Response)
├── entities/       # Entidades JPA (mapeo directo a la BD SQL Server) y ENUMs
├── exceptions/     # Manejo global de errores (@ControllerAdvice)
├── repositories/   # Interfaces Spring Data JPA
├── security/       # Filtros JWT, lógica de autenticación
└── services/       # Lógica de negocio (SLA, prioridades, escalamiento, auditoría)
    └── impl/       # Implementaciones de las interfaces de servicio
```

### Frontend (Angular)
```text
src/app/
├── core/           # Interceptores HTTP (JWT, Errores), guards, modelos TypeScript
├── shared/         # Componentes reutilizables, Angular Material modules
└── features/       # Módulos por funcionalidad
    ├── public/     # Vistas públicas: Crear Ticket (sin login)
    ├── auth/       # Vistas: Login para Técnicos/Administradores
    ├── tickets/    # Vistas: Lista, Detalle, Resolución (Técnicos)
    ├── kedb/       # Vistas: Base de conocimiento
    └── cmdb/       # Vistas: Gestión de activos e IPs
```

---

## 2. Matriz de Funcionalidades (Requerimientos Completos)

Esta matriz mapea los requerimientos funcionales y no funcionales para que los desarrolladores puedan avanzar paso a paso.

| Funcionalidad / Requerimiento | Área | Prioridad | Dificultad | Backend | Frontend |
|-------------------------------|------|-----------|------------|---------|----------|
| **1. Creación Tickets (Anónimo por IP)** | Core | ALTA | Alta | Leer IP del Request (`HttpServletRequest`), inferir Área/Equipo desde BD, crear ticket. | Formulario público intuitivo. Manejo de caso "IP no reconocida". |
| **2. Autenticación (Técnicos)** | Auth | ALTA | Media | JWT, Filtros, UserDetails, Controladores de sesión. | Formulario Login, Interceptor JWT, AuthGuard. |
| **3. Gestión Básica de Tickets** | Core | ALTA | Media | Endpoints GET/PUT para listar, asignar a técnico, resolver y cerrar. | Tabla de tickets, vista de detalles, cambios de estado (botones). |
| **4. Asignación y Cálculo de SLA** | SLA | ALTA | Alta | Motor de cálculo basado en Matriz Impacto x Urgencia. Cronómetros y estados de SLA. | Indicadores visuales (semáforo) de tiempo restante y alertas. |
| **5. Manejo Global de Errores** | Arq. | ALTA | Media | `@ControllerAdvice` para excepciones. Respuesta JSON consistente. | `ErrorInterceptor`, notificaciones tipo Toast/SnackBar. |
| **6. Auditoría y Trazabilidad** | Arq. | ALTA | Media | Registrar todo cambio en `HISTORIAL_TICKET` (quién, qué, cuándo). | Vista cronológica (Timeline) del ciclo de vida del ticket. |
| **7. Validación Estricta de Datos** | Arq. | ALTA | Baja | Anotaciones `@Valid`, lógica de validación de negocio en servicios. | Validaciones en Reactive Forms, feedback visual. |
| **8. Escalamiento de Tickets** | Core | MEDIA | Media | Lógica de cambio de nivel (N1 -> N2), registro en tabla `ESCALAMIENTO`. | Modal de escalamiento con motivo y selección de nivel. |
| **9. Base de Conocimiento (KEDB)** | Doc. | MEDIA | Media | CRUD `ERROR_CONOCIDO`, endpoint para vincular Ticket con Error. | Buscador de errores, vista de redacción, sección de consulta rápida. |
| **10. Inventario e IPs (CMDB)** | Infra. | BAJA | Alta | CRUD `ELEMENTO_CONFIGURACION` y `DIRECCION_IP`, control de `HISTORIAL_ASIGNACION_IP`. | Paneles de administración de equipos informáticos y subredes. |

---

## 3. Instrucciones Paso a Paso para Desarrolladores

### Hito A: Base Arquitectónica (Errores, Seguridad y Validaciones)
**Backend:**
1. Configurar `@ControllerAdvice` para devolver siempre un JSON estructurado de errores, sin stacktraces.
2. Aplicar validaciones `@Valid` en todos los DTOs.
3. Configurar JWT y Spring Security. Proveer el endpoint `/api/auth/login` **solo para técnicos**.

**Frontend:**
1. Crear el `ErrorInterceptor` global para atrapar códigos 400, 401, 500 y mostrar Toasts.
2. Crear `AuthService` y guardar el token. Crear `AuthInterceptor` para inyectarlo en peticiones a rutas protegidas.

### Hito B: CMDB Base y Flujo "Sin Login" (Creación de Tickets vía IP)
**Backend:**
1. Implementar los repositorios básicos de `Area`, `DireccionIP` y `ElementoConfiguracion`.
2. Crear el endpoint `/api/tickets/public` (sin seguridad JWT).
3. **Lógica Crucial:** Leer la IP remota, buscarla en la base de datos para deducir el `IdArea` y `IdCI`, y autocompletar esos datos al guardar el `Ticket`.

**Frontend:**
1. Diseñar la pantalla principal pública para los usuarios del hospital. Solo un formulario de "Reportar Incidente" (Título, Descripción, Tipo).
2. Si el Backend devuelve error de "IP no reconocida", permitir al usuario seleccionar su Área manualmente como fallback.

### Hito C: Motor de Tickets, SLA y Auditoría
**Backend:**
1. Desarrollar el servicio que cruza `Impacto` y `Urgencia` para calcular `Prioridad`.
2. Calcular la `FechaLimiteRespuesta` y `FechaLimiteResolucion` basados en la Prioridad y guardarlos en el Ticket.
3. En cada cambio de estado (ej. `NUEVO` a `ASIGNADO`), insertar obligatoriamente un registro en `HISTORIAL_TICKET`.

**Frontend:**
1. Dashboard protegido por JWT para los técnicos.
2. Pantalla de detalle de ticket mostrando un "Timeline" leyendo del historial, y relojes de SLA.

### Hito D: Escalamientos y Conocimiento (KEDB)
**Backend:**
1. Endpoints para registrar un `Escalamiento` y cambiar el `NivelSoporteActual`.
2. CRUD de `ErrorConocido` y tabla asociativa `TICKET_ERROR_CONOCIDO`.

**Frontend:**
1. Botón "Escalar Ticket" que exija justificación.
2. Módulo KEDB para consultar soluciones previas antes de resolver un ticket nuevo.

---

## 4. Diseño del Flujo Especial: Creación de Tickets desde el Hospital (Anónimo por IP)

Para el caso específico de los usuarios del Hospital, la creación de tickets se diseñó para tener la **mínima fricción posible**, basándose en la topología de red.

### ¿Cómo funciona el mapeo?
1. **Sin Credenciales:** El usuario (médico, enfermera) accede a la URL interna del Service Desk. No hay pantalla de Login. Ven directamente un botón "Reportar Incidente".
2. **Extracción de IP:** Al enviar el formulario, el **Backend intercepta la Dirección IP** desde la petición HTTP (`request.getRemoteAddr()`).
3. **Resolución en la CMDB:**
   - El Backend busca la IP en la tabla `DIRECCION_IP`.
   - Consulta la tabla `HISTORIAL_ASIGNACION_IP` para saber a qué Equipo (`ELEMENTO_CONFIGURACION`) está asignada esa IP en este instante.
   - A través del Equipo, el sistema obtiene el Área (`AREA`) física exacta del hospital (ej. Admisión, UCI).
4. **Asignación Automática:** El ticket se guarda vinculado automáticamente al Equipo y al Área. 

### Beneficios del Enfoque
- **Cero bloqueos:** Los médicos no pierden tiempo recordando contraseñas o recuperando cuentas.
- **Geolocalización interna:** Los técnicos de soporte N1/N2 saben exactamente a qué computadora ir y en qué pasillo, gracias a que la red actuó como autenticador del origen.

### Fallbacks (Plan de Respaldo)
Si la IP no está registrada en la BD (ej. el usuario está en una tablet nueva o por WiFi de invitados), la API devolverá un estado especial. El Frontend interceptará esto y mostrará un campo adicional pidiendo: *"No pudimos detectar tu ubicación. Por favor, selecciona tu Área de la lista."*
