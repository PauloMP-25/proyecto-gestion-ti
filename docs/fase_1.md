# Fase 1: Plan de Desarrollo (Semanas 1 y 2)

Este documento detalla el paso a paso de las funcionalidades a desarrollar durante las primeras dos semanas. El objetivo es establecer la base arquitectónica y construir los flujos críticos iniciales (Autenticación y Gestión Básica de Tickets), asegurando que tanto el Backend como el Frontend avancen en paralelo.

---

## 1. Estructura de Carpetas Sugerida

### Backend (Spring Boot - Java)
```text
src/main/java/com/hospital/servicedesk/
├── config/         # Configuraciones globales (Seguridad, JWT, CORS, OpenAPI)
├── controllers/    # Controladores REST (endpoints, reciben DTOs, devuelven DTOs)
├── dtos/           # Objetos de Transferencia de Datos (Request/Response)
│   ├── request/    
│   └── response/   
├── entities/       # Entidades JPA (mapeo directo a la BD SQL Server) y ENUMs
├── exceptions/     # Manejo global de errores (@ControllerAdvice) y excepciones personalizadas
├── repositories/   # Interfaces Spring Data JPA
├── security/       # Filtros JWT, UserDetailsService, lógica de autenticación
└── services/       # Lógica de negocio (SLA, prioridades, escalamiento)
    └── impl/       # Implementaciones de las interfaces de servicio
```

### Frontend (Angular)
```text
src/app/
├── core/           # Singleton services, interceptores HTTP (JWT), guards de rutas
│   ├── guards/
│   ├── interceptors/
│   ├── models/     # Interfaces TypeScript (espejo de los DTOs)
│   └── services/   # Llamadas HTTP al Backend
├── shared/         # Componentes reutilizables, directivas, pipes, Angular Material
└── features/       # Módulos por funcionalidad (Lazy Loading)
    ├── auth/       # Vistas: Login, Registro
    ├── dashboard/  # Vista: Panel principal post-login
    └── tickets/    # Vistas: Lista de tickets, Crear ticket, Detalle de ticket
```

---

## 2. Matriz de Funcionalidades (Fase 1)

| Funcionalidad | Área de Trabajo | Prioridad | Dificultad | Backend | Frontend |
|---------------|----------------|-----------|------------|---------|----------|
| **1. Autenticación (Login)** | Seguridad / Auth | ALTA (Bloqueante) | Media | JWT, Filtros, UserDetails, Controlador Auth | Formulario Login, Interceptor JWT, Guardias, Almacenamiento local (Token) |
| **2. Registro de Usuario** | Seguridad / Auth | ALTA | Baja | DTO, Validación, Hashing (Bcrypt), Guardar Usuario | Formulario Registro, Validaciones UX, Consumo de API |
| **3. CRUD Base Tickets** | Core / Tickets | ALTA | Alta | Entidad Ticket, Repositorio, Servicio (Reglas base), Controlador | Tabla/Lista de Tickets, Formulario de Creación, Vista de Detalles |
| **4. Manejo de Errores Global** | Arquitectura | ALTA | Media | `@ControllerAdvice`, Excepciones personalizadas, Respuestas JSON uniformes | Interceptor de errores, Notificaciones (Snackbars/Toasts) al usuario |
| **5. Modelado Inicial BD** | Datos | ALTA | Alta | Entidades JPA para `Usuario`, `Ticket`, `Area`, `Categoria` e inicialización de ENUMs. | (No aplica directamente, se consume mediante modelos en TS) |

---

## 3. Instrucciones Paso a Paso para Desarrolladores

### Hito A: Configuración Base y Seguridad (Login/Registro)
**Objetivo:** Permitir a un usuario registrarse, iniciar sesión y obtener un token JWT.

**Backend:**
1. **Entidades:** Crear la entidad `Usuario` con JPA y mapearla a la tabla correspondiente.
2. **Seguridad:** Implementar Spring Security. Configurar contraseñas con `BCryptPasswordEncoder`.
3. **JWT:** Crear utilidad para generar y validar JWT (`JwtUtil`). Implementar un filtro (`JwtRequestFilter`) para validar el token en cada petición.
4. **DTOs:** Crear `LoginRequestDTO`, `RegisterRequestDTO`, y `AuthResponseDTO` (para devolver el token y datos básicos del usuario y su Rol).
5. **Controlador:** Crear `AuthController` con los endpoints `/api/auth/login` y `/api/auth/register`.

**Frontend:**
1. **Core:** Crear `AuthService` para consumir `/login` y `/register`.
2. **Interceptor:** Crear un `AuthInterceptor` que inyecte el token JWT en la cabecera `Authorization: Bearer <token>` de todas las peticiones salientes.
3. **Vistas:** Desarrollar los componentes de Login y Registro utilizando Angular Material. Aplicar validaciones de formulario reactivo.
4. **Rutas:** Configurar el enrutamiento. Proteger las rutas de la aplicación usando un `AuthGuard` que verifique la existencia del token.

### Hito B: Manejo Global de Errores
**Objetivo:** Asegurar que el frontend nunca reciba un stacktrace y el usuario final vea mensajes claros.

**Backend:**
1. Crear una clase `GlobalExceptionHandler` anotada con `@ControllerAdvice`.
2. Interceptar excepciones de validación, excepciones de credenciales inválidas, y errores genéricos 500.
3. Formatear la salida usando una estructura JSON uniforme (ej. `{ "status": 400, "message": "Email ya registrado", "timestamp": "..." }`).

**Frontend:**
1. Crear un `ErrorInterceptor` que capture respuestas 401, 403, 400 y 500.
2. Integrar un servicio de notificaciones (por ejemplo, `MatSnackBar`) para mostrar el mensaje de error de manera amigable al usuario.

### Hito C: Gestión Inicial de Tickets
**Objetivo:** Un usuario puede crear un ticket y ver la lista de sus tickets.

**Backend:**
1. **Entidades:** Crear las entidades `Ticket`, `Categoria` y los `ENUM` necesarios (`EstadoTicket`, `Prioridad`, `NivelImpacto`, `NivelUrgencia`).
2. **DTOs:** Crear `TicketCreateDTO` y `TicketResponseDTO`.
3. **Servicio:** En `TicketService`, implementar el método `crearTicket(TicketCreateDTO dtos)`. *Importante:* Aquí es donde reside la lógica de negocio. Validar que el usuario existe, asignar el estado inicial (`NUEVO`), e insertar las validaciones pertinentes antes de guardar en base de datos.
4. **Controlador:** Crear `TicketController` con endpoints `/api/tickets` (GET para listar y POST para crear). Proteger la ruta asegurando que extraiga el ID del usuario del token JWT.

**Frontend:**
1. **Modelos:** Crear las interfaces TypeScript `Ticket`, `TicketCreate`.
2. **Servicio:** Crear `TicketService` para consumir los endpoints REST.
3. **Vistas:** 
   - **Listado:** Usar `MatTable` para mostrar los tickets del usuario logueado.
   - **Creación:** Formulario que permita elegir Categoría, Impacto y Urgencia, con un título y descripción.
4. **Integración:** Asegurar que las peticiones vayan con el token (manejado por el interceptor) y mostrar retroalimentación cuando el ticket se cree correctamente.

---

## 4. Recordatorios Tecnológicos y de Diseño

- **Base de Datos:** Revisar el documento `diseno_base_datos.md`. Recuerda que **no** hay tablas de catálogo (Estado, Rol, Impacto). Estos valores son definidos por `ENUM`s en el Backend (Java) y se guardan como `VARCHAR` en la BD.
- **Seguridad:** El Backend no confía en el Frontend. Aunque Angular bloquee un botón o valide un correo, el Controlador/Servicio en Spring Boot debe re-validar todo.
- **Control de Versiones:** Recuerda apegarte al documento `guia_git_commits.md`. Trabaja en ramas separadas (ej. `feat/auth-login`) antes de hacer *merge* a la rama principal de desarrollo.
