# Roadmap Maestro — Service Desk ITIL v4
## Hospital Santa María del Socorro (Ica, Perú)

**Proyecto:** Etapa 2 - Proyecto Final Integrador, curso "Gestión del Servicio TI"
**Arquitecto de Software:** Claude
**Obrero Automático:** Antigravity / Gemini
**Equipo Humano:** 4 estudiantes universitarios

---

## FASE 0 — Definición Tecnológica (Stack)

### Análisis de requisitos técnicos clave
- Lógica de SLA en **tiempo real** (contador de tiempo, cambio de estado automático A tiempo → Alerta → Incumplido) → necesita **scheduler/cron** y buena gestión de fechas/zonas horarias.
- Roles y permisos (Usuario Final, Practicante, Administrador) → necesita sistema de autenticación robusto, idealmente ya resuelto por el framework.
- Modelo relacional fuerte (Incidentes ↔ SLA ↔ Equipos/Préstamos ↔ Usuarios ↔ KEDB) → pide integridad referencial → **base de datos relacional (SQL Server)**.
- Equipo de 4 estudiantes (Frontend: 2 estudiantes, Backend: 2 estudiantes), tiempo limitado (proyecto académico) → prioridad a **velocidad de desarrollo**, documentación en español clara, modularidad y separación por ramas vía `develop`.

### Stack recomendado

| Capa | Tecnología | Por qué |
|---|---|---|
| **Backend** | **Java (Spring Boot)** | Altamente escalable, mantenible a largo plazo, tipado estricto, seguridad robusta (Spring Security) y ecosistema maduro. Opción 1A elegida por el equipo. |
| **Base de datos** | **SQL Server** | Requerimiento específico del equipo. Base de datos relacional robusta. |
| **Frontend** | **Angular (TypeScript) + Angular Material** | Framework robusto para aplicaciones empresariales, nomenclatura de carpetas en español (`nucleo`, `compartido`, `funcionalidades`), diseño 100% responsivo. |
| **Gráficos Dashboard** | **Chart.js** | Ligero, simple de integrar con Angular, suficiente para KPIs hospitalarios. |
| **Alertas SLA** | **Spring Boot Scheduling (@Scheduled)** | Alertas visuales y envío de correos cuando un SLA entra en alerta o se vence. |
| **Autenticación** | **Spring Security + JWT** | Seguridad estándar para APIs REST con 3 roles (`USUARIO_FINAL`, `PRACTICANTE`, `ADMINISTRADOR`). |
| **Control de versiones** | **Git + GitHub** | Ramas `main`, `develop` e integración independiente de Frontend y Backend sobre `develop`. |

> **Stack Confirmado:** El equipo ha seleccionado la Opción 1A (Java Spring Boot + Angular + SQL Server).

---

## FASE 1 — Estructura de Software y Arquitectura Base [COMPLETADA ✅]

### Logros
- **Frontend (Angular 19):**
  - Implementada estructura modular en español (`src/app/nucleo`, `src/app/compartido`, `src/app/funcionalidades`).
  - Layout principal (Navbar con logo oficial `assets/logo.ico`, subtítulo `"Mesa de Ayuda"` + Sidebar responsivo con Gestalt y transiciones fluidas).
  - Vistas de autenticación (Login) con identidad corporativa del Hospital Santa María del Socorro.
  - Regla estricta aplicada: Cero menciones de "ITIL" en la interfaz de usuario.
- **Backend (Spring Boot 3 en rama `origin/BACKEND`):**
  - Estructura base de paquetes (`controllers`, `services`, `repositories`, `entities`, `security`, `dtos`).
  - Configuración de Spring Security, JWT y filtro de excepciones global (`@ControllerAdvice`).

---

## FASE 2 — Modelo de Datos Central y Analítica Base [COMPLETADA ✅]

### Logros
- **Base de Datos y Entidades:**
  - Base de datos `db_servicedesk` creada en SQL Server 2022 (Docker `bd_sqlserver`, puerto 1433).
  - 12 entidades JPA mapeadas en Spring Boot (`Ticket`, `Usuario`, `Area`, `DireccionIP`, `ElementoConfiguracion`, etc.).
  - Modelo simplificado a 3 roles hospitalarios: `USUARIO_FINAL`, `PRACTICANTE`, `ADMINISTRADOR`.
- **Dashboard Frontend (`/panel-control`):**
  - 4 métricas KPI hospitalarias interactivas.
  - Gráficos profesionales en **Chart.js**: gráfico de dona (tendencia por servicio clínico), gráfico de barras con selector interactivo Top 5/8/10 (fallas por activo CMDB) y monitor de cumplimiento de SLA.
  - Matriz de prioridad hospitalaria interactiva con botón de navegación a configuración.

---

## FASE 3 — Vistas Especializadas por Rol y Enlace de SLA [COMPLETADA ✅]

### Logros Entregados
- **Frontend (Angular 19 Standalone + Signals):**
  - **Épica 0:** Cimientos compartidos (`RolGuard`, `AuthGuard`, motor `calcularSla`, cronómetro visual, átomo `<app-icono>`, modales accesibles `DialogoResolverTicketComponent` y `DialogoEscalarTicketComponent`).
  - **Épica A (Portal Asistencial):** `/portal`, `/portal/mis-solicitudes` (híbrido tarjeta/tabla), `/portal/solicitud/:id` (cronómetro, confirmación, calificación 1-5 estrellas, reapertura), `/portal/ayuda` y `/solicitudes/nuevo`. 56 pruebas unitarias aprobadas.
  - **Épica B (Mi Turno):** `/mi-turno` (resumen KPIs, pestañas por tomar/atención/historial, ordenación estricta SLA), `/mi-turno/ticket/:id` (ficha técnica, tomar, iniciar, resolver, derivar N2), `/mi-turno/consulta` (activos y artículos técnicos), alertas `aria-live` y modo sin conexión. 60 pruebas unitarias aprobadas.
  - **Calidad:** 116 pruebas unitarias en verde (100%), `ng build` limpio y arquitectura desacoplada con el patrón `servicio-api-mock-http`.

---

## FASE 4 — Ciclo de Vida Completo, Administración y Reportes [ESPECIFICADA 📋]
*Documento rector:* [`fase_4_especificacion_tecnica.md`](file:///home/paulo/Documentos/Cursos/Ciclo08/Gestion%20de%20Servicio%20TI/codigo_fuente/docs/fase_4_especificacion_tecnica.md)

### Tareas Planificadas
- **Épica C (Backend):** 8 endpoints del ciclo de vida (BE-01 a BE-08 con conflicto 409), motor SLA en background (`@Scheduled`), auditoría inmutable (`HistorialTicket`), préstamos de equipos y servicio de reportes en PDF.
- **Épica D (Frontend):** Conmutación gradual a HTTP real (`usarMocks = false`), bandeja de escalamientos N2, reasignación y carga del equipo, catálogos (áreas, equipos CMDB, SLA) y editor del Centro de Soluciones.
- **Épica E (Reportes y Calidad E2E):** Visualizador de reportes PDF para jefaturas y suite de pruebas E2E con Playwright.

---

## FASE 5 — Base de Conocimiento (KEDB) y Portal de Autoservicio

### Tareas
- Módulo público / autoservicio para que los usuarios finales consulten el estado de sus tickets y guías de solución rápidas.
- Editor y repositorio de soluciones para que Practicantes y Administradores alimenten la base de conocimiento.

---

## FASE 6 — Dashboard, KPIs y Reportes PDF

### Tareas
- Dashboard de métricas con indicadores clave (Tickets por estado, % cumplimiento SLA, incidentes por área, equipos en préstamo).
- Panel de configuración y generador de reportes exportables a PDF formal para jefaturas.

---

## FASE 7 (FINAL) — Pruebas, Documentación y Cierre
- Validación UAT con usuarios del hospital.
- Manual Técnico de Instalación y Manual de Usuario.
