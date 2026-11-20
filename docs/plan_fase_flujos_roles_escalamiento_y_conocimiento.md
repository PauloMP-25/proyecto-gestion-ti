# Plano de Ejecución: Flujos por Rol, Escalamiento N1 a N2 y Base de Conocimientos

**Proyecto:** Mesa de Ayuda HSMSI (Hospital Santa María del Socorro)  
**Rama activa de trabajo:** `refactor/arquitectura-modular-frontend`  
**Fecha de actualización:** 20 de Noviembre de 2026  
**Estado de compilación:** Frontend (`ng build`) y Backend (`mvn test-compile`) pasando con 0 errores y 0 advertencias.

---

## 1. Estado Actual del Proyecto y Avance

Se completó al 100% la refactorización arquitectónica modular DRY del Frontend (Fases 1 a 3 del plano previo). Todos los componentes de la aplicación cumplen estrictamente la terna de 3 archivos (`.ts`, `.html`, `.scss`), `ChangeDetectionStrategy.OnPush`, inputs reactivos con signals y cero términos técnicos prohibidos (cero siglas ITIL/CMDB/SLA visibles al usuario).

### Últimos commits clave confirmados:
1. `68e6da2` - `feat(api): alinear endpoints de ciclo de vida escalamiento y resumen de turno` (Backend Spring Boot: soporte dual PUT/POST, endpoint `/turno/resumen`, `/mis-solicitudes/por-confirmar/conteo`, desasignación y auditoría al escalar a N2).
2. `2cdd7ec` - `feat(panel-control): conectar modales accesibles de resolucion y escalamiento` (Frontend: integración de `DialogoEscalarTicketComponent` y `DialogoResolverTicketComponent` en el reloj de atención del Panel de Control).

---

## 2. Hoja de Ruta de Trabajo Inmediato

### FASE 1: Finalización del Flujo de Escalamiento N1 ➔ N2 y Diferenciación por Rol

#### Tarea 1.1: Bandeja de Tickets Derivados a Nivel 2 (Jefatura y Operaciones N2)
- **Ruta:** `/incidentes/escalados` (Protegida por `rolGuard` para rol `ADMINISTRADOR`).
- **Navegación:** En `menu-por-rol.config.ts`, agregar ítem `'Tickets derivados (N2)'` con ícono `trending_up` en la sección *Jefatura y Operaciones N2*.
- **Comportamiento en `IncidenteListaComponent`:**
  - Detectar `modo === 'escalados'` desde la ruta.
  - Título dinámico: `"Tickets Derivados a Soporte Nivel 2"`.
  - Filtro por defecto: `estado: EstadoTicket.ESCALADO`.
  - Listado ordenado por urgencia y tiempo restante de compromiso.
- **Acciones del Administrador en el Detalle (`IncidenteDetalleComponent`):**
  - Ya configurado para tickets en estado `ESCALADO`: Asignar especialista N2 (`asignar`), Asumir atención directa N2 (`tomar`) o Resolver ticket (`resolver`).
- **Commit:** `feat(roles): habilitar bandeja de tickets derivados para jefatura y operaciones N2`

#### Tarea 1.2: Blindaje de Rutas y Menús por Rol Hospitalario
- **Rutas a blindar en `sla.routes.ts` y `app.routes.ts`:**
  - `/sla/metricas` accesible por `[RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR]`.
  - `/sla/configuracion` y `/administracion/*` restringido estrictamente a `[RolUsuario.ADMINISTRADOR]`.
  - `/portal/*` restringido estrictamente a `[RolUsuario.USUARIO_FINAL]`.
  - `/mi-turno/*` restringido estrictamente a `[RolUsuario.PRACTICANTE]`.
- **Commit:** `refactor(seguridad): blindar rutas por rol y garantizar experiencia asistencial aislada`

---

### FASE 2: Diseño e Implementación del Módulo de Base de Conocimientos (Guías de Autoatención y Soluciones Técnicas)

#### Tarea 2.1: Modelo y Mappers de Conocimiento
- Artículos con: `id`, `titulo`, `resumen`, `contenidoHtml`, `categoriaId`, `categoriaNombre`, `palabrasClave`, `equiposCompatibles`, `esPublico` (asistencial vs técnico N1/N2), `conteoUtil`, `fechaActualizacion`.
- Contrato abstracto `ConocimientoApi`, servicio HTTP y mock con datos reales de soporte hospitalario (impresoras térmicas de triaje, red cableada de consultorios, software SIS, bloqueo de cuentas).

#### Tarea 2.2: Vista Asistencial (Portal de Autoatención)
- Ubicación: `/portal/ayuda` y `/portal/ayuda/:articuloId`.
- Lenguaje simple, pasos ilustrados paso a paso, retroalimentación de "¿Le fue útil esta guía?" (`Sí` / `No`).

#### Tarea 2.3: Vista Técnica y Editor para Administrador / Practicante
- Ubicación: `/administracion/conocimiento` (gestión completa y creación) y acceso rápido desde `/mi-turno/consulta` (consulta contextual durante la atención de un ticket).
- Posibilidad de vincular una guía de conocimiento directamente a la resolución de un ticket (`articuloConocimientoId`).
- **Commit:** `feat(conocimiento): implementar centro de soluciones guias asistenciales y articulos tecnicos`

---

### FASE 3: Diferenciación de Experiencia y Refinamiento Contextual

#### Tarea 3.1: Formulario Asistencial vs Formulario Técnico
- **Usuario Final (`/solicitudes/nuevo`):** Autodetección de equipo por IP, lenguaje asistencial sin jerga, selector guiado por síntomas comunes hospitalarios.
- **Técnico / Practicante (`Registrar para un tercero`):** Posibilidad de elegir solicitante, equipo de red/CMDB, impacto y urgencia asistencial explícita.
- **Commit:** `feat(solicitudes): diferenciar registro guiado para usuario asistencial y registro tecnico`

---

## 3. Reglas de Calidad Obligatorias para el Agente Obrero

1. **Un commit por subtarea terminada:** Commits atómicos con formato Conventional Commits en español (`feat(...)`, `refactor(...)`, `fix(...)`).
2. **Estructura estricta de 3 archivos:** Todo componente Angular debe constar de `.ts`, `.html` y `.scss`.
3. **Cero `.spec.ts` residuales:** Una vez verificada la funcionalidad, no dejar archivos `.spec.ts` de UI.
4. **Cero términos técnicos ITIL en pantalla (Regla 9):**
   - Prohibido: `ITIL`, `CMDB`, `SLA`, `KEDB`, `RFC`, `Vencido` (en vistas asistenciales).
   - Permitido: `Mesa de Ayuda HSMSI`, `Catálogo de Equipos y Red`, `Compromisos de Atención`, `Centro de Soluciones y Guías`, `Por vencer`, `Tiempo excedido`.
5. **Responsividad Total (Regla 8):** Desktop (1440px), Tablet (768px-1024px) y Mobile (<480px) sin overflow horizontal ni elementos desbordados.
6. **Angular 19 OnPush & Signals:** Siempre `ChangeDetectionStrategy.OnPush`, `input()`, `output()`, signals y sintaxis de flujo de control moderna (`@if`, `@for`).

---

## 4. Prompt para Iniciar la Próxima Sesión

Copia y pega el siguiente texto en tu nuevo chat:

```markdown
Hola Agente. Lee atentamente el documento de planificación en docs/plan_fase_flujos_roles_escalamiento_y_conocimiento.md.

Estamos en la rama `refactor/arquitectura-modular-frontend`.
El paso A.1 (alineación de endpoints del backend) y la conexión de los modales en el Panel de Control ya están completados y commiteados.

Vamos a continuar con la FASE 1:
Procede a ejecutar la Tarea 1.1: Habilitar la Bandeja de Tickets Derivados a Nivel 2 (/incidentes/escalados) en el menú del Administrador y configurar IncidenteListaComponent para el modo 'escalados'.

Recuerda:
- Realizar un commit por cada subpunto terminado.
- Respetar la terna estricta (.ts, .html, .scss), OnPush y cero términos ITIL en pantalla.
- Eliminar cualquier .spec.ts tras verificar que compila con `npm run build`.
Procede con la Tarea 1.1.
```
