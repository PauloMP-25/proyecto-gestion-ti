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
| **1. Creación Tickets (Panel Privado + IP)** | Core | ALTA | Alta | Autenticación, leer IP del Request, inferir Área, crear ticket. | Formulario autenticado. Manejo de caso "IP no reconocida". |
| **2. Autenticación (Toda la plataforma)** | Auth | ALTA | Media | JWT, Filtros, UserDetails, Controladores de sesión. | Formulario Login, Interceptor JWT, AuthGuard. |
| **3. Gestión Básica de Tickets** | Core | ALTA | Media | Endpoints GET/PUT para listar, asignar, resolver y cerrar. | Tabla de tickets, vista de detalles, botones de estado. |
| **4. Motor SLA y Alertas** | SLA | ALTA | Alta | Motor de cálculo configurable por BD, triggers para enviar email de incumplimiento. | Semáforos de tiempo, alertas visuales, y un Panel de Configuración de SLA. |
| **5. Manejo Global de Errores** | Arq. | ALTA | Media | `@ControllerAdvice` para excepciones. Respuesta JSON consistente. | `ErrorInterceptor`, notificaciones Toast. |
| **6. Auditoría y Trazabilidad** | Arq. | ALTA | Media | Registrar todo cambio en `HISTORIAL_TICKET` (quién, qué, cuándo). | Vista cronológica (Timeline) del ciclo de vida. |
| **7. Validación Estricta de Datos** | Arq. | ALTA | Baja | Anotaciones `@Valid`, lógica de validación de negocio. | Validaciones en Reactive Forms, feedback visual. |
| **8. Escalamiento y Gestión de Problemas** | Core | MEDIA | Media | Lógica de escalamiento (Practicante -> Administrador). Job automático de agrupación de incidentes similares. | Modal de escalamiento y panel de posibles Problemas subyacentes. |
| **9. Base de Conocimiento (KEDB)** | Doc. | MEDIA | Media | CRUD `ERROR_CONOCIDO` de publicación directa (sin borrador). Módulo Público. | Portal de Autoayuda público, y creación directa para practicantes. |
| **10. Inventario (CMDB) y Préstamos** | Infra. | BAJA | Alta | CRUD CI. Enlace dinámico de ticket a equipo (al resolver) y Préstamos Temporales. | Selección dinámica de equipo, panel de registro de préstamos. |
| **11. Dashboard de Métricas** | Report. | BAJA | Media | Endpoints de agregación de métricas (volumen, demoras, SLA). | Gráficos estadísticos y botón para Exportación a PDF. |

---

## 3. Instrucciones Paso a Paso para Desarrolladores

### Hito A: Base Arquitectónica (Errores, Seguridad y Validaciones)
**Backend:**
1. Configurar `@ControllerAdvice` para devolver JSON estructurado.
2. Aplicar validaciones `@Valid`.
3. Configurar JWT y Spring Security. Proveer el endpoint `/api/auth/login` **para todos los usuarios y técnicos**.

**Frontend:**
1. Crear el `ErrorInterceptor` global para atrapar códigos 400, 401, 500 y mostrar Toasts.
2. Crear `AuthService` y guardar el token.

### Hito B: Flujo "Panel Privado" (Creación de Tickets vía Usuario + IP)
**Backend:**
1. Implementar repositorios básicos `Area`, `DireccionIP`, `ElementoConfiguracion`.
2. Crear el endpoint protegido de creación de tickets.
3. **Lógica Crucial:** Además del ID de usuario del token JWT, leer la IP remota para autocompletar o enlazar el Área (con opción fallback si la IP no existe).

**Frontend:**
1. Diseñar el portal de usuario final, con un formulario de "Reportar Incidente".
2. Incluir el Módulo Público de Autoayuda de la KEDB, para desviar tickets comunes.

### Hito C: Motor de Tickets, SLA, Alertas y Auditoría
**Backend:**
1. Desarrollar el servicio que calcula SLA. Crear el Panel de Configuración de SLA (CRUD para parámetros de impacto/urgencia).
2. Crear el servicio de **Alertas Automáticas** que envíe correos electrónicos si se incumple el SLA.
3. Inserciones obligatorias en `HISTORIAL_TICKET`.

**Frontend:**
1. Dashboard JWT para los técnicos.
2. Pantalla de detalle de ticket (Timeline, relojes de SLA, alertas visuales).

### Hito D: CMDB Dinámica, Escalamientos, Problemas y KEDB
**Backend:**
1. Endpoints de Escalamiento. Tarea en background para agrupar incidentes similares en "Problemas".
2. KEDB con publicación directa y CRUD de `ErrorConocido`.
3. CMDB: Permitir enlace de ticket a activo de forma dinámica y registrar préstamos.

**Frontend:**
1. Botón "Escalar Ticket" y Panel de Préstamos temporales CMDB.
2. Dashboard de métricas general con opción de **Exportación a PDF**.

---

## 4. Diseño del Flujo Especial: Creación de Tickets con Autenticación + Captura de IP

Para cumplir con la solicitud mixta del hospital, la creación de tickets fusiona trazabilidad y automatización.

### ¿Cómo funciona el mapeo?
1. **Login Tradicional:** El usuario (médico, enfermera) inicia sesión con DNI y contraseña en el portal.
2. **Captura Silenciosa:** Al enviar el formulario, el **Backend intercepta la Dirección IP** desde la petición HTTP (`request.getRemoteAddr()`).
3. **Resolución en la CMDB:** El Backend busca la IP en la base de datos para inferir a qué Equipo y Área pertenece.
4. **Asignación Automática:** El ticket queda vinculado automáticamente al **Usuario** (por el login) y al **Área/Equipo** (por la IP).

### Beneficios del Enfoque Mixto
- **Trazabilidad perfecta:** Se sabe exactamente quién hizo la solicitud.
- **Geolocalización interna:** Se sabe exactamente de qué PC física provino el ticket, agilizando el soporte presencial.

### Fallbacks (Plan de Respaldo)
Si la IP no está registrada en la BD, la API devolverá una alerta leve pero creará el ticket asignándolo solo al usuario, solicitando al técnico de soporte que haga el registro dinámico del equipo (Opción 2 CMDB) al momento de atender el caso.
