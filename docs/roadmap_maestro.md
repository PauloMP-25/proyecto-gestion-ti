# Roadmap Maestro — Mesa de Ayuda (Service Desk)
## Hospital Santa María del Socorro (Ica, Perú)

> **Hoja de Ruta del Proyecto Integrador:** Seguimiento sincronizado entre Frontend y Backend.  
> **Motor de Persistencia:** SQL Server 2022 (`db_servicedesk`).  

---

## FASE 0 — Definición de Arquitectura y Stack [COMPLETADA ✅]
* Backend: Java 21 LTS con Spring Boot 3 y Spring Data JPA.
* Frontend: Angular 19 (Standalone Components, Signals, SCSS Tokens y Chart.js).
* Base de datos: Microsoft SQL Server 2022 (Docker, contenedor `bd_sqlserver`, puerto 1433).
* Control de versiones: Git Flow con ramas `main`, `develop` y `feature/*`.

---

## FASE 1 — Estructura Base, Autenticación y Esquema [COMPLETADA ✅]
* **Frontend:** Vistas de autenticación (Login) con identidad corporativa, shell responsivo (Sidebar Gestalt + Topbar con isologo y subtítulo `"Mesa de Ayuda"`).
* **Backend:** Spring Security 6 con JWT Stateless, `@RestControllerAdvice`, entidades JPA nucleares y pruebas unitarias con BUILD SUCCESS.
* **Base de Datos:** Base de datos `db_servicedesk` creada y 8 tablas núcleo generadas automáticamente por Hibernate.

---

## FASE 2 — Consolidación de Analítica y API de Tickets [EN EJECUCIÓN 🟡]
* **Frontend [COMPLETADO]:**
  * Dashboard `/panel-control` con 4 KPIs hospitalarios, gráficos de Chart.js (dona por servicio clínico, barras de fallas CMDB con selector dinámico Top 5/8/10 y monitor de SLA).
  * Pantalla `/solicitudes/nuevo` maquetada con molécula `contexto-equipo` (detección de IP/PC), cálculo reactivo de prioridad y SLA, y confirmación.
* **Backend [EN DESARROLLO]:**
  * Endpoint `GET /api/tickets/contexto-cliente` (detección de IP remota y resolución en la CMDB).
  * Endpoint `POST /api/tickets` (enfoque mixto: usuario del JWT + IP de origen + cálculo de SLA y prioridad hospitalaria).
  * Endpoints de listado `GET /api/tickets` (con paginación y filtros para técnicos) y `GET /api/tickets/mis-tickets` (para el usuario asistencial).
  * Auditoría inicial obligatoria en `HistorialTicket`.

---

## FASE 3 — Notificaciones por Correo, Escalamiento y Préstamos CMDB [PRÓXIMA ⚪]
* Notificaciones asíncronas de SLA por correo electrónico (`spring-boot-starter-mail`) ante advertencias (80%) y vencimiento.
* Flujo de escalamiento formal: `POST /api/tickets/{id}/escalar` de Practicante a Administrador con justificación técnica.
* Módulo de gestión y trazabilidad de Préstamos Temporales de equipos CMDB (laptops, impresoras térmicas, lectores DNIe).
* Base de Conocimiento (KEDB): Publicación directa de artículos técnicos y vinculación con tickets resueltos.
* Generador de reportes analíticos formales exportables a PDF para la jefatura de TI.

---

## FASE 4 — Pruebas de Integración, UAT y Cierre [FUTURA ⚪]
* Pruebas de aceptación con usuarios reales del hospital (médicos, enfermeras y técnicos).
* Manual de Instalación y Despliegue en Servidor Local del Hospital.
* Manual de Usuario para personal asistencial y técnico.
