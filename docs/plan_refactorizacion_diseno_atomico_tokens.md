# Plan de Refactorización Visual — Design System, Diseño Atómico y Gestalt
## Mesa de Ayuda · Hospital Santa María del Socorro (HSMSI)

> **Destinatarios:** Agente Obrero (Antigravity/Gemini) y equipo Frontend (2 desarrolladores)
> **Autor:** Arquitecto de Software (Claude)
> **Fecha:** 12 de noviembre de 2026
> **Rama base:** `develop` · **Rama de trabajo:** `refactor/design-system-atomico`
> **Precondición:** 302 pruebas unitarias en verde y `ng build` limpio (Ola 0 lo verifica y congela como línea base)
> **Objetivo de negocio:** dejar la capa visual ordenada **antes** de construir el módulo editorial del Centro de Soluciones (Fase 4), sin cambiar comportamiento ni romper pruebas.

---

## 0. Resumen ejecutivo y decisiones de arquitectura

### 0.1 Qué se decide

| # | Decisión | Motivo |
|---|---|---|
| D1 | Los tokens se organizan en **3 capas**: primitivos → semánticos → de componente. Solo los semánticos se usan en componentes. | Permite modo noche y re-tematizar sin tocar componentes. |
| D2 | El vocabulario **canónico** de tokens es el que ya está definido en `src/estilos/_tokens.scss` (`--color-*`, `--espacio-*`, `--radius-*`, `--font-size-*`, `--shadow-*`, `--transition-*`). Todos los demás nombres en uso se convierten en **alias deprecados**. | Hoy conviven 5 familias de nombres y la mayoría **no está definida** (ver §1.1). Se elige la que ya existe para minimizar el cambio. |
| D3 | **Primero se unifican estilos (tokens, mixins, utilidades), después el DOM.** Ningún selector CSS que una prueba consulte se renombra. | Es la forma de mantener las 302 pruebas intactas (§5.4). |
| D4 | Se crea la jerarquía `compartido/ui/{atomos,moleculas,organismos,plantillas}`. Lo que hoy está en `compartido/componentes/` y `nucleo/maquetacion/` se migra con `git mv` + *shim* de re-exportación temporal. | Historial Git preservado y cero roturas de import. |
| D5 | Fondo de lienzo = crema `#FAF6F0`; tarjetas = blanco. Texto tenue sobre crema usa `#475569`, **no** `#64748B` (no alcanza 4.5:1 sobre crema, §2.5). | Figura-Fondo + accesibilidad AA. |
| D6 | **Política de vocabulario:** `ITIL` prohibido en cualquier pantalla y en `<title>`. `SLA`, `CMDB`, `KEDB`, `RFC`, `P1–P4`, `vencido/escalado` prohibidos para `USUARIO_FINAL` (ya lo exige `TERMINOS_PROHIBIDOS_USUARIO_FINAL`). Para personal TI se recomienda migrar a "Compromiso de atención" y "Catálogo de equipos" (§5.6, ola opcional). | Regla de Oro del proyecto. |
| D7 | Fuentes **autoalojadas** (Inter + Material Symbols en `assets/fonts`). | El hospital sufre caídas de Internet (caso KEDB-PROV-001); con CDN caído los íconos se ven como texto ("arrow_back"). |

### 0.2 Qué NO se hace en esta refactorización

- No se cambia lógica de negocio, servicios ni modelos de datos (salvo el *shim* de rutas).
- No se renombran componentes cuyo **selector** o **clase raíz** consulten las pruebas.
- No se adopta Angular Material como librería visual (se mantiene el set propio; solo se usa la fuente de íconos).
- No se toca `environment.usarMocks` ni la integración HTTP.

---

## 1. Diagnóstico del estado actual (evidencia en `develop`)

### 1.1 Cinco familias de tokens y muchas sin definir

`_tokens.scss` define `--color-*`, `--espacio-*`, `--space-*`, `--radius-*`, `--shadow-*`, `--transition-*`. Sin embargo, el código usa además:

| Familia usada | Ejemplos | ¿Definida en `_tokens.scss`? | Dónde se usa |
|---|---|---|---|
| Panel/CMDB/SLA | `--primario-guinda`, `--fondo-tarjeta`, `--fondo-aplicacion`, `--texto-principal`, `--texto-secundario`, `--borde-tarjeta`, `--radio-md/lg/sm/full` | **No** (solo funcionan por el *fallback* hex) | `panel-control`, `cmdb`, `sla`, `boton`, `chip-filtro`, `kpi-tarjeta`, `tabla-tickets`, `login` |
| Portal/Dialogos | `--text-main`, `--text-muted`, `--surface-card`, `--border-subtle`, `--hsmsi-guinda`, `--hsmsi-verde-salud`, `--radius-md` | Parcial (`--radius-md` sí; el resto no) | `portal-asistencial`, `dialogo-*-ticket`, `linea-tiempo-etapas`, `calificacion-estrellas` |
| Mi Turno | `--hsmsi-gris-50…900`, `--hsmsi-espacio-md`, `--hsmsi-radio-md`, `--hsmsi-texto-sm`, `--hsmsi-guinda-principal`, `--hsmsi-verde-suave`, `--hsmsi-borde` | **No** | `mi-turno/*` |
| Canónica | `--color-primary-base`, `--espacio-3`, `--radius-sm`, `--font-size-sm` | **Sí** | `incidentes`, `solicitudes`, layout, `contexto-equipo` |

> **Consecuencia:** el *dark mode* (`:root[data-tema='noche']`) **no funciona** en ~70 % de las pantallas, porque esas pantallas usan valores *fallback* hex y nunca leen los tokens redefinidos.

Además hay **hex hardcodeados** por todas partes (`#701c1c`, `#f1f5f9`, `#0284c7`, `#fef3c7`, …). Hover del guinda con tres valores distintos: `#521414` (tokens), `#8a1f1f` (`--primario-guinda-hover`), `#551515/#581515/#541414` (hardcode).

### 1.2 Duplicación de componentes y lógica visual

| Concepto | Implementaciones paralelas | Acción |
|---|---|---|
| Insignia de prioridad | `app-prioridad-insignia` (`ui/atomos`), `.insignia-prioridad` en `bandeja-turno.page.scss`, `ficha-atencion.page.scss`, `.badge-prioridad` en `_utilidades.scss`, `.tag-prioridad` en `grafico-prioridades`, `sla-configuracion`, `.badge--p1…` en `sla-monitor` y `reloj-ticket-activo` | Unificar en `app-badge-urgencia` (§3.3) |
| Cronómetro / semáforo SLA | `app-sla-insignia`, `app-temporizador-sla` (moléculas), `app-sla-cronometro` (`compartido/componentes`), barras manuales en `sla-monitor`, `reloj-ticket-activo`, `grafico-sla-cumplimiento` | Un átomo `app-semaforo-estado` + organismo `app-sla-cronometro` |
| Diálogo resolver | `compartido/componentes/dialogo-resolver-ticket` (útil) y `incidentes/componentes/dialogo-resolver` (**no referenciado** por `incidente-detalle`) | Eliminar el de `incidentes` tras `grep` |
| Diálogo escalar | `compartido/.../dialogo-escalar-ticket` y `incidentes/.../dialogo-escalar` (no referenciado) | Ídem |
| Estilos de diálogo | `compartido/directivas/dialogo.scss` (usado por `asignar` y `cambiar-estado`), SCSS propio completo en `resolver`/`escalar` (≈ 300 líneas duplicadas) | Parcial `estilos/componentes/_dialogo.scss` |
| Relojes | `RelojServidorService` (`setInterval` siempre activo) y `RelojService` (conteo de referencias, pausa por visibilidad) | Migrar consumidores al segundo; mantener el primero con `@deprecated` |
| KPI tarjeta | `compartido/ui/moleculas/kpi-tarjeta` (real) y `panel-control/componentes/kpi-tarjeta` (esqueleto "works!") | Borrar el esqueleto |
| Esqueletos de carga | `app-esqueleto` + 6 implementaciones CSS ad hoc (`.esqueleto-tarjeta`, `.ficha-esqueleto`, `.articulo-esqueleto`, …) | Consolidar en `app-esqueleto-*` (§4.6) |
| Botones | `app-boton` + ≥ 12 familias `.btn-*` por componente (`.btn-accion-primaria`, `.btn-accion-tabla`, `.btn-nuevo`, `.btn-primario`, …) | Mixin `boton-base` común (§3.4) sin tocar DOM |
| Modelos de ticket | `TicketResumen` (×2: `ticket.model.ts` y `ticket-resumen.model.ts`), `TicketTurno`, `SolicitudResumen`, `PrioridadTicket` vs alias `Prioridad` | Fuera del alcance visual; solo se documenta |

### 1.3 Esqueletos sin implementar ("works!")

Se eliminan o se implementan en Fase 4 (lista en §5.2): `cabecera-pagina`, `dialogo-confirmacion`, `sla-resumen-semaforo`, `sla-tabla-tickets`, `grafico-cumplimiento-sla`, `grafico-por-categoria`, `kpi-tarjeta` (panel), `incidente-crear`, `incidente-formulario`, `solicitud-lista`, `solicitud-detalle`, `base-conocimiento-*`, `roles-permisos`, `usuario-*`, `escalamiento-cola`, `no-encontrado`.

> **A verificar:** `escalamiento.service.ts`, `base-conocimiento.service.ts` y `usuarios.service.ts` importan `Service` desde `@angular/core` (`@Service()`). Confirmar que compila en la versión de Angular del repositorio; si no, reemplazar por `@Injectable({ providedIn: 'root' })`. No bloquea esta refactorización si `ng build` de la Ola 0 está en verde.

### 1.4 Íconos inválidos (bug visible hoy)

`app-icono` renderiza la **ligadura** de *Material Symbols*. Estos nombres **no existen** en esa fuente y se ven como texto literal:

`arrow-left`, `alert-circle`, `check-circle`, `alert-triangle`, `map-pin`, `user`, `tag`, `calendar`, `clock`, `heart`, `x`, `plus-circle`, `chevron-right` (en `resumen-turno`, `ayuda-rapida`), `printer`, `shield`, `monitor`.

Usados en: `solicitud-detalle.page.html`, `ayuda-articulo.page.html`, `ayuda-rapida.page(.html/.ts)`, `tarjeta-confirmacion-solucion.html`, `tarjeta-calificacion.html`, `resumen-turno.html`. Se corrige con un **registro tipado de íconos** (§3.3.1).

### 1.5 Responsividad y accesibilidad (incumplimientos de la propia Regla de Oro)

| Hallazgo | Archivos | Regla |
|---|---|---|
| Corte tabla↔tarjetas en **768 px** en vez de 1024 px | `tabla-tickets.component.scss` | El estándar del proyecto es 1024 px (`ViewportService.esDesktop`) |
| Touch targets < 44 px | `chip-filtro` (36), `app-boton --sm` (36), `.btn-accion-icono` (32), `.btn-pag` (32), `.btn-pag-num` (30), `.dialogo__chip` (32), `.btn-cerrar` de modales (40), `.btn-icono` topbar (40), `.btn-ver` mis-solicitudes (36) | ≥ 44 px (WCAG 2.5.5 + regla del proyecto) |
| Tamaños de fuente < 12 px (`0.68–0.74rem`) | `cmdb-lista`, `kpi`, `sla-monitor`, `grafico-prioridades`, `reloj-ticket-activo` | Mínimo 0.75rem (12 px) |
| Contraste: `#64748B` sobre crema/gris claro | `--texto-secundario` fallback | AA 4.5:1 (§2.5) |
| `<title>` con "ITIL v4" | `src/index.html`, `title:` en rutas ("Service Desk …") | Regla de Oro |
| Clase `.badge-itil` en `sla-configuracion` | solo nombre de clase (texto ya dice "Mesa de Ayuda") | Renombrar a `.badge-contexto` (no hay spec que la consulte) |
| Rol visible "Soporte N2 / Jefatura", "RBAC" en selector de rol | `barra-superior.component.html` | Es herramienta de simulación; envolver en `@if (!environment.production)` |
| Fuentes por CDN de Google | `index.html` | D7 |

---

## 2. Sistema de Design Tokens

### 2.1 Estructura de archivos

```text
src/estilos/
├── _tokens.scss                  # BARRIL (mantiene el @use './estilos/tokens' de styles.scss)
├── tokens/
│   ├── _index.scss               # @forward de todo lo siguiente
│   ├── _primitivos.scss          # capa 1: valores crudos (paletas, escalas)
│   ├── _semanticos.scss          # capa 2: significado (superficie, texto, borde, acción, estado)
│   ├── _componentes.scss         # capa 3: contratos de componentes (boton, tarjeta, dialogo)
│   ├── _tema-noche.scss          # redefine SOLO capa 2
│   ├── _alias-legado.scss        # @deprecated: mapea nombres viejos → canónicos (se borra en Ola 7)
│   ├── _tipografia.scss
│   ├── _espaciado.scss
│   ├── _elevacion.scss
│   └── _movimiento.scss
├── mixins/
│   ├── _responsive.scss          # @mixin desde($bp) / hasta($bp)
│   ├── _a11y.scss                # foco, sr-only, touch-target
│   ├── _boton.scss               # boton-base, boton-variante
│   └── _superficie.scss          # tarjeta, tarjeta-interactiva, campo
├── componentes/
│   └── _dialogo.scss             # (movido de compartido/directivas/dialogo.scss)
├── _tipografia.scss              # (existente: pasa a barril)
└── _utilidades.scss              # (existente: se limpia, §5.2)
```

`src/estilos/_tokens.scss` queda así (no se toca `styles.scss`):

```scss
@forward './tokens/index';
```

### 2.2 Capa 1 — Primitivos (`tokens/_primitivos.scss`)

> Los primitivos **nunca** se usan en componentes. Solo los lee `_semanticos.scss`.

```scss
:root {
  /* ── Guinda institucional ─────────────────────────────── */
  --prim-guinda-50:  #fdf2f2;
  --prim-guinda-500: #9b2c2c;   /* modo noche */
  --prim-guinda-700: #701c1c;   /* BASE (logo HSMSI) */
  --prim-guinda-800: #521414;   /* hover */
  --prim-guinda-900: #380e0e;   /* active */

  /* ── Verde salud ──────────────────────────────────────── */
  --prim-verde-50:   #e8f5e9;
  --prim-verde-700:  #1b5e20;   /* BASE */
  --prim-verde-800:  #113e14;   /* hover */
  --prim-verde-900:  #0a260c;   /* active */

  /* ── Crema de fachada (lienzo anti-fatiga) ────────────── */
  --prim-crema-50:   #faf6f0;
  --prim-crema-100:  #f3ece1;

  /* ── Slate (neutros) ──────────────────────────────────── */
  --prim-blanco:     #ffffff;
  --prim-slate-50:   #f8fafc;
  --prim-slate-100:  #f1f5f9;
  --prim-slate-200:  #e2e8f0;
  --prim-slate-300:  #cbd5e1;
  --prim-slate-500:  #64748b;
  --prim-slate-600:  #475569;
  --prim-slate-700:  #334155;
  --prim-slate-900:  #0f172a;

  /* ── Severidad clínica (P1…P4) ────────────────────────── */
  --prim-rojo-100: #fee2e2;  --prim-rojo-600: #dc2626;  --prim-rojo-900: #7f1d1d;
  --prim-naranja-100: #ffedd5; --prim-naranja-600: #ea580c; --prim-naranja-900: #7c2d12;
  --prim-ambar-100: #fef3c7; --prim-ambar-600: #d97706; --prim-ambar-900: #78350f;
  --prim-azul-100: #dbeafe;  --prim-azul-600: #2563eb;  --prim-azul-900: #1e3a8a;

  /* ── Estrella de calificación ─────────────────────────── */
  --prim-dorado-500: #f59e0b;
}
```

### 2.3 Capa 2 — Semánticos (`tokens/_semanticos.scss`)

> Es el **vocabulario canónico**. Los nombres que ya existían se conservan; se agregan los marcados con ★.

```scss
:root {
  /* ── Marca / acción ───────────────────────────────────── */
  --color-primary-base:     var(--prim-guinda-700);
  --color-primary-hover:    var(--prim-guinda-800);
  --color-primary-active:   var(--prim-guinda-900);
  --color-primary-light:    var(--prim-guinda-50);
  --color-primary-focus-ring: rgb(112 28 28 / 0.25);
  --color-secondary-base:   var(--prim-verde-700);
  --color-secondary-hover:  var(--prim-verde-800);
  --color-secondary-active: var(--prim-verde-900);
  --color-secondary-light:  var(--prim-verde-50);

  /* ── Superficies (Figura–Fondo) ───────────────────────── */
  --color-bg-app:           var(--prim-crema-50);   /* ★ cambia de #f8fafc a crema (D5) */
  --color-bg-warm:          var(--prim-crema-50);
  --color-surface-card:     var(--prim-blanco);
  --color-surface-sunken:   var(--prim-slate-50);   /* ★ relleno sutil dentro de tarjetas */
  --color-surface-hover:    var(--prim-slate-100);
  --color-surface-overlay:  rgb(15 23 42 / 0.55);   /* ★ backdrop modal */

  /* ── Bordes ───────────────────────────────────────────── */
  --color-border-subtle:    var(--prim-slate-200);
  --color-border-strong:    var(--prim-slate-300);

  /* ── Texto (todos ≥ 4.5:1 sobre blanco Y sobre crema) ── */
  --color-text-main:        var(--prim-slate-900);
  --color-text-secondary:   var(--prim-slate-700);  /* ★ cuerpo secundario */
  --color-text-muted:       var(--prim-slate-600);  /* ★ ahora #475569 (antes #475569; 'texto-secundario' legado era #64748b) */
  --color-text-disabled:    var(--prim-slate-500);  /* ★ solo deshabilitado: exento de contraste */
  --color-text-inverse:     var(--prim-blanco);
  --color-text-on-primary:  var(--prim-blanco);     /* ★ */

  /* ── Estado de atención (semáforo de compromisos) ─────── */
  --sla-ok-bg:  var(--prim-verde-50);  --sla-ok-text:  var(--prim-verde-800);  --sla-ok-border:  var(--prim-verde-700);
  --sla-alerta-bg: var(--prim-ambar-100); --sla-alerta-text: var(--prim-ambar-900); --sla-alerta-border: var(--prim-ambar-600);
  --sla-venc-bg: var(--prim-rojo-100); --sla-venc-text: var(--prim-rojo-900); --sla-venc-border: var(--prim-rojo-600);

  /* ── Urgencia P1…P4 (doble codificación: color + ícono + texto) ── */
  --color-p1-bg: var(--prim-rojo-100);    --color-p1-text: var(--prim-rojo-900);    --color-p1-base: var(--prim-rojo-600);    --color-p1-border: #fca5a5;
  --color-p2-bg: var(--prim-naranja-100); --color-p2-text: var(--prim-naranja-900); --color-p2-base: var(--prim-naranja-600); --color-p2-border: #fdba74;
  --color-p3-bg: var(--prim-ambar-100);   --color-p3-text: var(--prim-ambar-900);   --color-p3-base: var(--prim-ambar-600);   --color-p3-border: #fcd34d;
  --color-p4-bg: var(--prim-azul-100);    --color-p4-text: var(--prim-azul-900);    --color-p4-base: var(--prim-azul-600);    --color-p4-border: #93c5fd;

  /* ── Feedback genérico ★ ──────────────────────────────── */
  --color-exito-bg: var(--prim-verde-50);  --color-exito-text: var(--prim-verde-800); --color-exito-border: var(--prim-verde-700);
  --color-error-bg: var(--prim-rojo-100);  --color-error-text: var(--prim-rojo-900);  --color-error-border: var(--prim-rojo-600);
  --color-aviso-bg: var(--prim-ambar-100); --color-aviso-text: var(--prim-ambar-900); --color-aviso-border: var(--prim-ambar-600);
  --color-info-bg:  var(--prim-azul-100);  --color-info-text:  var(--prim-azul-900);  --color-info-border:  var(--prim-azul-600);

  /* ── Foco accesible ★ ─────────────────────────────────── */
  --foco-anillo: 3px solid var(--color-secondary-base);
  --foco-offset: 2px;

  /* ── Interacción ★ ────────────────────────────────────── */
  --touch-min: 44px;
}
```

**Regla de uso de color por rol semántico**

| Color | Significado | Uso permitido | Uso prohibido |
|---|---|---|---|
| Guinda | Identidad + acción primaria de la plataforma | Botón primario, enlaces, foco de marca, cabecera de código | Estados de error |
| Verde | Éxito / resuelto / operativo | "Marcar como resuelto", "Operativo", `A tiempo` | Acciones primarias genéricas |
| Rojo | Emergencia / vencido / destructivo | P1, `Vencido`, descartar | Decoración |
| Ámbar | Precaución / por vencer | P3, `Por vencer` | Éxito |
| Azul | Información / mantenimiento | P4, "En atención" | Alertas |
| Crema | Lienzo | `body`, `.area-contenido` | Fondo de tarjetas |

### 2.4 Capa 3 — Tokens de componente (`tokens/_componentes.scss`)

```scss
:root {
  /* Botón */
  --boton-altura: var(--touch-min);
  --boton-altura-compacto: var(--touch-min);   /* "sm" mantiene 44 px de área táctil */
  --boton-radio: var(--radius-md);
  --boton-padding-x: var(--espacio-4);
  /* Tarjeta */
  --tarjeta-radio: var(--radius-lg);
  --tarjeta-padding: var(--espacio-4);
  --tarjeta-borde: 1px solid var(--color-border-subtle);
  --tarjeta-sombra: var(--shadow-card);
  --tarjeta-sombra-hover: var(--shadow-md);
  /* Campo de formulario */
  --campo-altura: var(--touch-min);
  --campo-radio: var(--radius-md);
  --campo-borde: 1px solid var(--color-border-strong);
  /* Diálogo */
  --dialogo-radio: var(--radius-lg);
  --dialogo-ancho-md: 540px;
  --dialogo-z: 1000;
}
```

### 2.5 Contraste (WCAG 2.1 AA — mínimo del proyecto; AAA donde el diseño lo permite)

Valores calculados con la fórmula WCAG (aprox.; **validar con el script de §5.5**):

| Texto | Fondo | Ratio aprox. | AA texto (4.5) | AAA (7) | Uso |
|---|---|---|:-:|:-:|---|
| `#0F172A` | `#FFFFFF` / `#FAF6F0` | ≈ 17 / ≈ 16 | ✅ | ✅ | Cuerpo |
| `#334155` | `#FAF6F0` | ≈ 9 | ✅ | ✅ | Secundario |
| `#475569` | `#FFFFFF` / `#FAF6F0` | ≈ 7.6 / ≈ 7.0 | ✅ | ✅ | **Metadato canónico** |
| `#64748B` | `#FFFFFF` | ≈ 4.75 | ✅ (justo) | ❌ | Solo sobre blanco, y no para información crítica |
| `#64748B` | `#FAF6F0` | **≈ 4.4** | ❌ | ❌ | **Prohibido** (era el caso de `--texto-secundario`) |
| `#701C1C` | `#FFFFFF` | ≈ 11 | ✅ | ✅ | Guinda sobre blanco |
| `#FFFFFF` | `#701C1C` | ≈ 11 | ✅ | ✅ | Botón primario |
| `#FFFFFF` | `#1B5E20` | ≈ 7.9 | ✅ | ✅ | Botón éxito |
| `#7F1D1D` | `#FEE2E2` | ≈ 8 | ✅ | ✅ | Badge P1 |
| `#78350F` | `#FEF3C7` | ≈ 8 | ✅ | ✅ | Badge P3 / por vencer |
| `#D97706` | `#FFFFFF` | ≈ 3.2 | ❌ texto | — | **Solo** borde/ícono (≥ 3:1 componentes gráficos) |

**Reglas:** (1) texto < 18 px ≥ 4.5:1; (2) bordes/íconos interactivos ≥ 3:1; (3) estados **nunca** solo por color (§2.7); (4) `--color-text-disabled` exento pero nunca para información necesaria.

### 2.6 Tipografía (`tokens/_tipografia.scss`)

**Familia:** `Inter` (autoalojada, variable 400–700) con *fallback* `system-ui`. Cifras tabulares (`font-variant-numeric: tabular-nums`) en códigos, cronómetros e IP.

```scss
:root {
  --font-family-base: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', ui-monospace, Consolas, monospace;   /* IP, hostname, códigos */

  /* Escala modular (ratio ≈ 1.125–1.2). Nunca < 0.75rem. */
  --text-display-size: 2rem;      --text-display-lh: 1.2;   --text-display-weight: 700;  /* Login, vacíos grandes */
  --text-h1-size: 1.5rem;         --text-h1-lh: 1.3;        --text-h1-weight: 700;       /* Título de página */
  --text-h2-size: 1.25rem;        --text-h2-lh: 1.35;       --text-h2-weight: 600;       /* Sección / título de ticket */
  --text-h3-size: 1.125rem;       --text-h3-lh: 1.4;        --text-h3-weight: 600;       /* Tarjeta / subsección */
  --text-body-lg-size: 1.125rem;  --text-body-lg-lh: 1.55;  --text-body-lg-weight: 400;  /* Texto de ayuda/artículos */
  --text-body-size: 1rem;         --text-body-lh: 1.5;      --text-body-weight: 400;     /* Cuerpo, inputs */
  --text-body-sm-size: 0.875rem;  --text-body-sm-lh: 1.5;   --text-body-sm-weight: 500;  /* Labels, tablas */
  --text-caption-size: 0.75rem;   --text-caption-lh: 1.4;   --text-caption-weight: 500;  /* Badges, timestamps (MÍNIMO) */

  /* Compatibilidad con los nombres existentes */
  --font-size-xs: var(--text-caption-size);
  --font-size-sm: var(--text-body-sm-size);
  --font-size-base: var(--text-body-size);
  --font-size-lg: var(--text-h3-size);
  --font-size-xl: var(--text-h2-size);
  --font-size-2xl: var(--text-h1-size);
  --font-size-3xl: var(--text-display-size);
  --font-weight-regular: 400; --font-weight-medium: 500; --font-weight-semibold: 600; --font-weight-bold: 700;
  --line-height-tight: 1.25; --line-height-normal: 1.5; --line-height-relaxed: 1.625;
}
```

Utilidades de texto en `_utilidades.scss` (para evitar `font-size: 0.82rem` sueltos):

```scss
.t-display { font: var(--text-display-weight) var(--text-display-size)/var(--text-display-lh) var(--font-family-base); }
.t-h1      { font: var(--text-h1-weight) var(--text-h1-size)/var(--text-h1-lh) var(--font-family-base); }
.t-h2      { font: var(--text-h2-weight) var(--text-h2-size)/var(--text-h2-lh) var(--font-family-base); }
.t-h3      { font: var(--text-h3-weight) var(--text-h3-size)/var(--text-h3-lh) var(--font-family-base); }
.t-body-lg { font: var(--text-body-lg-weight) var(--text-body-lg-size)/var(--text-body-lg-lh) var(--font-family-base); }
.t-body    { font: var(--text-body-weight) var(--text-body-size)/var(--text-body-lh) var(--font-family-base); }
.t-body-sm { font: var(--text-body-sm-weight) var(--text-body-sm-size)/var(--text-body-sm-lh) var(--font-family-base); }
.t-caption { font: var(--text-caption-weight) var(--text-caption-size)/var(--text-caption-lh) var(--font-family-base); color: var(--color-text-muted); }
.t-mono    { font-family: var(--font-family-mono); font-variant-numeric: tabular-nums; }
```

**Autoalojamiento (D7)** — en `styles.scss` antes de los `@use`:

```scss
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 400 700; font-display: swap;
  src: url('/assets/fonts/inter-var-latin.woff2') format('woff2'); }
@font-face { font-family: 'Material Symbols Outlined'; font-style: normal; font-weight: 100 700; font-display: block;
  src: url('/assets/fonts/material-symbols-outlined.woff2') format('woff2'); }
```
Y quitar los `<link>` de Google Fonts de `index.html`. Obtener los `.woff2` con `npm i @fontsource-variable/inter material-symbols` y copiarlos a `src/assets/fonts/`. Cambiar el `<title>` a `Mesa de Ayuda · Hospital Santa María del Socorro`.

### 2.7 Semáforo de compromisos con doble codificación obligatoria

Ninguna insignia de urgencia o de estado puede renderizar **solo color**. Contrato:

| Nivel | Técnico (`variante="tecnica"`) | Asistencial (`variante="asistencial"`, `USUARIO_FINAL`) | Ícono (Material) | Tokens |
|---|---|---|---|---|
| P1 | `P1 · Crítico` | `Atención inmediata` | `emergency` | `--color-p1-*` |
| P2 | `P2 · Alto` | `Urgente` | `warning` | `--color-p2-*` |
| P3 | `P3 · Medio` | `Normal` | `schedule` | `--color-p3-*` |
| P4 | `P4 · Bajo` | `Programada` | `info` | `--color-p4-*` |

| Estado de compromiso | Texto técnico | Ícono | Tokens |
|---|---|---|---|
| A tiempo | `A tiempo` | `check_circle` | `--sla-ok-*` |
| Alerta | `Por vencer` | `hourglass_empty` | `--sla-alerta-*` |
| Incumplido | `Vencido` | `warning` | `--sla-venc-*` |

> Para `USUARIO_FINAL` el estado del compromiso **no se muestra jamás** (usa `textoTiempoEstimado()`; nunca "vencido").

### 2.8 Espaciado, radios, elevación y movimiento

```scss
/* tokens/_espaciado.scss — módulo 4/8 px */
:root {
  --espacio-2xs: 4px;   /* alias existente: --espacio-1 */
  --espacio-xs:  8px;   /* --espacio-2 */
  --espacio-sm:  12px;  /* --espacio-3 */
  --espacio-md:  16px;  /* --espacio-4 */
  --espacio-lg:  24px;  /* --espacio-6 */
  --espacio-xl:  32px;  /* --espacio-8 */
  --espacio-2xl: 48px;
  /* Compatibilidad (ya usados): */
  --espacio-1: var(--espacio-2xs); --espacio-2: var(--espacio-xs); --espacio-3: var(--espacio-sm);
  --espacio-4: var(--espacio-md);  --espacio-5: 20px; --espacio-6: var(--espacio-lg); --espacio-8: var(--espacio-xl);
  --space-1: var(--espacio-1); --space-2: var(--espacio-2); --space-3: var(--espacio-3);
  --space-4: var(--espacio-4); --space-5: var(--espacio-5); --space-6: var(--espacio-6); --space-8: var(--espacio-8);
}

/* tokens/_elevacion.scss */
:root {
  --radius-sm: 6px;          /* ★ antes 4px: unifica con la spec (sm 6) */
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pildora: 9999px;
  --radius-full: var(--radius-pildora);

  --shadow-sm:   0 1px 2px 0 rgb(15 23 42 / 0.05);                                  /* superficie estática (ni se nota) */
  --shadow-card: 0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06);  /* tarjeta en reposo */
  --shadow-md:   0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.05); /* tarjeta interactiva :hover */
  --shadow-lg:   0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04); /* dropdowns */
  --shadow-modal: 0 20px 25px -5px rgb(15 23 42 / 0.2), 0 8px 10px -6px rgb(15 23 42 / 0.2); /* ★ modales */

  --z-sticky: 100; --z-dropdown: 150; --z-drawer: 1000; --z-modal: 1000; --z-toast: 1100;   /* ★ unifica los z-index sueltos */
}

/* tokens/_movimiento.scss */
:root {
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root { --transition-fast: 0ms; --transition-normal: 0ms; --transition-slow: 0ms; }
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
}
```

> **Regla elevación:** tarjeta **estática** = `--shadow-card`; tarjeta **interactiva** (clic/enlace) = `--shadow-card` en reposo + `--shadow-md` y `translateY(-2px)` en `:hover` (y *no* hacer lo mismo en tarjetas que no se pueden clicar).

### 2.9 Modo noche (`tokens/_tema-noche.scss`) — solo redefine la capa 2

```scss
:root[data-tema='noche'] {
  --color-bg-app:         #0b1320;
  --color-surface-card:   #152238;
  --color-surface-sunken: #111d2e;
  --color-surface-hover:  #1e2f4a;
  --color-border-subtle:  #233754;
  --color-border-strong:  #334e73;
  --color-text-main:      #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-muted:     #94a3b8;
  --color-primary-base:   var(--prim-guinda-500);
  --color-primary-hover:  #b13a3a;
  --sla-ok-bg: #064e3b;  --sla-ok-text: #a7f3d0;  --sla-ok-border: #059669;
  --sla-alerta-bg: #78350f; --sla-alerta-text: #fde68a; --sla-alerta-border: #d97706;
  --sla-venc-bg: #7f1d1d;  --sla-venc-text: #fecaca;  --sla-venc-border: #dc2626;
  --color-p1-bg: #7f1d1d; --color-p1-text: #fecaca;
  --color-p2-bg: #7c2d12; --color-p2-text: #fed7aa;
  --color-p3-bg: #78350f; --color-p3-text: #fde68a;
  --color-p4-bg: #1e3a8a; --color-p4-text: #bfdbfe;
  --color-surface-overlay: rgb(2 6 23 / 0.7);
}
```
**Criterio de aceptación:** al alternar `data-tema='noche'` **ninguna** pantalla conserva fondos blancos (se verifica con la regla de lint "sin hex", §5.5).

### 2.10 Alias de compatibilidad (`tokens/_alias-legado.scss`) — **temporal**

> Cada alias toma el **mismo valor que su *fallback* actual**, de modo que la Ola 1 no cambia ninguna pantalla. Se eliminan en la Ola 7 cuando el *grep* dé 0 usos.

```scss
/* @deprecated — eliminar en Ola 7 */
:root {
  /* familia "panel" */
  --primario-guinda: var(--color-primary-base);
  --primario-guinda-hover: var(--color-primary-hover);          /* ⚠ cambio visual intencional: #8a1f1f → #521414 */
  --fondo-tarjeta: var(--color-surface-card);
  --fondo-aplicacion: var(--color-surface-sunken);
  --texto-principal: var(--color-text-main);
  --texto-secundario: var(--color-text-muted);                  /* ⚠ #64748b → #475569 (corrige contraste) */
  --borde-tarjeta: var(--color-border-subtle);
  --radio-sm: var(--radius-sm); --radio-md: var(--radius-md); --radio-lg: var(--radius-lg); --radio-full: var(--radius-pildora);
  --fuente-principal: var(--font-family-base);
  /* familia "portal" */
  --text-main: var(--color-text-main);   --text-muted: var(--color-text-muted);
  --surface-card: var(--color-surface-card); --surface-hover: var(--color-surface-hover); --surface-input: var(--color-surface-card);
  --border-subtle: var(--color-border-subtle);
  --hsmsi-guinda: var(--color-primary-base); --hsmsi-verde-salud: var(--color-secondary-base);
  --hsmsi-guinda-principal: var(--color-primary-base);
  --hsmsi-verde-suave: var(--color-secondary-light); --hsmsi-guinda-suave: var(--color-primary-light);
  --hsmsi-crema-fachada: var(--color-bg-warm);
  /* familia "mi-turno" */
  --hsmsi-borde: var(--color-border-subtle);
  --hsmsi-gris-50: var(--prim-slate-50);  --hsmsi-gris-100: var(--prim-slate-100); --hsmsi-gris-200: var(--prim-slate-200);
  --hsmsi-gris-400: #94a3b8; --hsmsi-gris-500: var(--prim-slate-500); --hsmsi-gris-600: var(--prim-slate-600);
  --hsmsi-gris-700: var(--prim-slate-700); --hsmsi-gris-800: #1e293b; --hsmsi-gris-900: var(--prim-slate-900);
  --hsmsi-espacio-sm: 0.75rem; --hsmsi-espacio-md: 1rem;
  --hsmsi-radio-sm: var(--radius-sm); --hsmsi-radio-md: var(--radius-md);
  --hsmsi-texto-xs: var(--font-size-xs); --hsmsi-texto-sm: var(--font-size-sm);
  /* p1-p4 de mi-turno (usaban --p1-bg, etc.) */
  --p1-bg: var(--color-p1-bg); --p1-text: var(--color-p1-text); --p1-border: var(--color-p1-base);
  --p2-bg: var(--color-p2-bg); --p2-text: var(--color-p2-text); --p2-border: var(--color-p2-base);
  --p3-bg: var(--color-p3-bg); --p3-text: var(--color-p3-text); --p3-border: var(--color-p3-base);
  --p4-bg: var(--color-p4-bg); --p4-text: var(--color-p4-text); --p4-border: var(--color-p4-base);
  --secondary-light: var(--color-secondary-light);
  --text-main-legacy: var(--color-text-main);
}
```

### 2.11 Breakpoints y mixins (`mixins/_responsive.scss`)

Escala **única** (hoy hay 600, 640, 768, 900, 960, 1024, 1200, 1280 mezclados):

| Token | px | Uso |
|---|---|---|
| `sm` | 600 | Móvil → móvil grande (modales a pantalla completa < 600) |
| `md` | 768 | Tablet |
| `lg` | **1024** | **Corte tabla ↔ tarjetas** (igual que `ViewportService.esDesktop`) |
| `xl` | 1280 | Escritorio ancho |

```scss
$bp: (sm: 600px, md: 768px, lg: 1024px, xl: 1280px);

@mixin desde($nombre) { @media (min-width: map-get($bp, $nombre)) { @content; } }
@mixin hasta($nombre) { @media (max-width: calc(#{map-get($bp, $nombre)} - 0.02px)) { @content; } }
```

### 2.12 Mixins de accesibilidad y botón

```scss
/* mixins/_a11y.scss */
@mixin foco-visible { &:focus-visible { outline: var(--foco-anillo); outline-offset: var(--foco-offset); border-radius: var(--radius-sm); } }
@mixin touch-target  { min-height: var(--touch-min); min-width: var(--touch-min); }
@mixin sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
```

```scss
/* mixins/_boton.scss — se aplica a las clases .btn-* existentes SIN cambiar el DOM */
@use './a11y' as a11y;

@mixin boton-base {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--espacio-2);
  @include a11y.touch-target;
  padding: 0 var(--boton-padding-x);
  font: 600 var(--font-size-sm)/1 var(--font-family-base);
  border: 1px solid transparent; border-radius: var(--boton-radio);
  cursor: pointer; white-space: nowrap; text-decoration: none;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), box-shadow var(--transition-fast);
  @include a11y.foco-visible;
  &:disabled, &[aria-disabled='true'] { opacity: .55; cursor: not-allowed; }
}
@mixin boton-primario  { @include boton-base; background: var(--color-primary-base);   color: var(--color-text-on-primary); &:hover:not(:disabled){ background: var(--color-primary-hover); } &:active:not(:disabled){ background: var(--color-primary-active);} }
@mixin boton-exito     { @include boton-base; background: var(--color-secondary-base); color: var(--color-text-on-primary); &:hover:not(:disabled){ background: var(--color-secondary-hover);} }
@mixin boton-secundario{ @include boton-base; background: var(--color-surface-card); color: var(--color-text-main); border-color: var(--color-border-strong); &:hover:not(:disabled){ background: var(--color-surface-hover);} }
@mixin boton-peligro   { @include boton-base; background: var(--color-error-border); color: var(--color-text-on-primary); &:hover:not(:disabled){ filter: brightness(.9);} }
@mixin boton-fantasma  { @include boton-base; background: transparent; color: var(--color-text-main); &:hover:not(:disabled){ background: var(--color-surface-hover);} }
```

Uso en un componente (la clase y el DOM **no cambian**, por eso la prueba sigue pasando):

```scss
@use 'estilos/mixins/boton' as b;
.btn-accion--primaria { @include b.boton-primario; flex: 2; }
.btn-accion--secundaria { @include b.boton-secundario; flex: 1; }
```
> Configurar `angular.json → stylePreprocessorOptions.includePaths: ["src"]` para que `@use 'estilos/...'` funcione desde cualquier componente.

---

## 3. Jerarquía de Diseño Atómico en Angular 19

### 3.1 Árbol de carpetas objetivo

```text
src/app/
├── nucleo/                              # singletons, seguridad, shell técnico (sin UI reutilizable)
│   ├── auth/ guardias/ interceptores/ servicios/ modelos/ config/
│   └── maquetacion/ → (se promueve a compartido/ui/plantillas, ver D4)
├── compartido/
│   ├── ui/
│   │   ├── atomos/            icono · boton · chip · badge-urgencia · semaforo-estado · badge-nivel
│   │   │                      badge-visibilidad(F4) · input-texto · textarea · spinner · esqueleto · tarjeta
│   │   ├── moleculas/         campo-formulario · buscador-debounce · buscador-filtros · contexto-equipo
│   │   │                      tarjeta-activo-mini · estado-vacio · kpi-tarjeta · temporizador-sla
│   │   │                      selector-audiencia(F4) · aviso-banner · paginador
│   │   ├── organismos/        dialogo-base · dialogo-resolver-ticket · dialogo-escalar-ticket
│   │   │                      dialogo-asignar · dialogo-cambiar-estado · sla-cronometro · resumen-turno
│   │   │                      barra-acciones-ticket · linea-tiempo-etapas · linea-tiempo-auditoria
│   │   │                      tabla-responsiva · tabla-tickets · kpi-panel · notificacion-toast
│   │   │                      calificacion-estrellas · editor-pasos(F4)
│   │   └── plantillas/        maquetacion-principal · barra-superior · menu-lateral · pagina-estandar(nuevo)
│   ├── directivas/            dialogo-accesible.directive.ts
│   ├── modelos/ servicios/ tuberias/ utilidades/
└── funcionalidades/<dominio>/{paginas,componentes,servicios,modelos}
       └── componentes/ = organismos/moléculas **específicos del dominio** (p. ej. portal: tarjeta-solicitud)
```

### 3.2 Reglas de pureza y dependencias (se verifican en CI)

| Nivel | Puede importar | NO puede | Estado / servicios | Entradas |
|---|---|---|---|---|
| **Átomo** | otros átomos (solo `icono`) | moléculas, organismos, servicios de negocio, `HttpClient`, `Router` | Ninguno (puro) | `input()` / `output()` |
| **Molécula** | átomos | organismos, páginas, servicios de dominio | Estado **local** de UI (signals) | `input()` |
| **Organismo** | átomos + moléculas | páginas, `funcionalidades/*` | Puede inyectar servicios de **infraestructura** (`RelojService`, `ViewportService`) pero **no** de dominio (`TurnoApi`) | `input()`; datos por `input`, acciones por `output` |
| **Plantilla** | átomos, moléculas, organismos, `nucleo/auth` (rol, sesión) | páginas | Layout, rol | — |
| **Página** | todo lo anterior + servicios `*Api` del dominio | otras páginas de otros dominios | Orquesta datos (única capa que habla con `*Api`) | Ruta, `ActivatedRoute` |

**Regla anti-ciclo:** `funcionalidades/A` nunca importa de `funcionalidades/B` (ya exigido). Verificar con `eslint-plugin-boundaries` o, como mínimo, el script de §5.5:

```bash
# falla si un átomo/molécula importa de funcionalidades o de nucleo/servicios
grep -rE "from '.*(funcionalidades|nucleo/servicios)" src/app/compartido/ui/atomos src/app/compartido/ui/moleculas && exit 1 || true
```

Todos los componentes de `compartido/ui/**`: `standalone: true`, `ChangeDetectionStrategy.OnPush`, `input()`/`output()` (signals API), prefijo `app-`, **sin** `console.log`, **sin** colores hex.

### 3.3 Átomos — contratos

#### 3.3.1 `app-icono` + registro tipado (corrige §1.4)

`compartido/ui/atomos/icono/iconos.ts`

```ts
/** Nombres Material Symbols permitidos. Agregar aquí antes de usar uno nuevo. */
export const ICONOS = [
  'add','add_circle','alarm','arrow_back','arrow_forward','arrow_upward','assignment','assignment_turned_in',
  'badge','calendar_today','call','cancel','check','check_circle','chevron_left','chevron_right','clinical_notes',
  'close','cloud_off','computer','content_copy','dashboard','description','devices','dns','domain','edit',
  'emergency','error','error_outline','expand_less','expand_more','favorite','fiber_manual_record','format_list_numbered',
  'help_outline','history','hourglass_empty','hub','inbox','info','lan','lightbulb','local_hospital','location_on','lock',
  'menu','menu_book','monitor','monitor_heart','notification_important','person','phone','print','psychology','refresh',
  'report_problem','router','save','schedule','search','search_off','send','settings','star','star_border','swap_horiz',
  'sync','sync_alt','task','task_alt','timer','timer_off','touch_app','trending_up','verified','visibility','visibility_off',
  'warning','wifi','wifi_off','build','archive','person_add','pan_tool','restart_alt','play_arrow','pause','desktop_windows',
  'fingerprint','live_help','receipt_long','home','manage_accounts','grid_on','change_circle','inventory_2','fact_check',
  'track_changes','gavel','account_tree','shield','edit_note','login','logout','admin_panel_settings','support_agent','headset_mic',
  'filter_alt_off','person_off','escalator_warning','ecg_heart','lightbulb','visibility','publish','unpublished','groups','engineering',
  'drag_indicator','keyboard_arrow_up','keyboard_arrow_down','delete','preview','add_task','link','policy','lock_person'
] as const;
export type NombreIcono = typeof ICONOS[number];

/** Migración de nombres inválidos detectados (estilo Lucide/Feather) → Material Symbols */
export const ICONO_LEGADO: Record<string, NombreIcono> = {
  'arrow-left': 'arrow_back', 'alert-circle': 'error', 'check-circle': 'check_circle', 'alert-triangle': 'warning',
  'map-pin': 'location_on', 'user': 'person', 'tag': 'description', 'calendar': 'calendar_today', 'clock': 'schedule',
  'heart': 'favorite', 'x': 'close', 'plus-circle': 'add_circle', 'chevron-right': 'chevron_right',
  'printer': 'print', 'shield': 'shield', 'monitor': 'monitor',
};
```

`icono.component.ts` — **mantener `nombre` como `string` en la API** (hay specs que pasan literales) pero normalizar y advertir en desarrollo:

```ts
readonly nombre = input.required<string>();
protected readonly glifo = computed(() => {
  const n = this.nombre();
  const norm = ICONO_LEGADO[n] ?? n;
  if (isDevMode() && !(ICONOS as readonly string[]).includes(norm)) {
    console.warn(`[app-icono] Ícono no registrado: "${n}"`);
  }
  return norm;
});
```
En la plantilla: `{{ glifo() }}` en lugar de `{{ nombre() }}`.
> Esto arregla **sin tocar las 7 pantallas** y mantiene los specs (ninguno consulta el texto del glifo). En la Ola 6 se reemplazan los literales viejos por los correctos.

#### 3.3.2 `app-boton` (existente: ajustar)

- `tamano="sm"` pasa de `min-height: 36px` a `44px` (área táctil); el tamaño visual compacto se logra con `padding`/`font-size`, no con altura.
- Añadir `variante="exito"` ya existe; añadir input `bloque = input(false)` (ancho 100 % en móvil).
- Estilos vía `@include boton-*` (§2.12). **No cambiar** `alHacerClick` ni el selector.

#### 3.3.3 `app-chip` (renombre lógico de `chip-filtro`; **conservar selector `app-chip-filtro`** como alias en F0)

`min-height: var(--touch-min)`. Estado activo = fondo guinda + `aria-pressed`. Contador con `font-variant-numeric: tabular-nums`.

#### 3.3.4 `app-badge-urgencia` (unifica §1.2) — **nuevo**

`compartido/ui/atomos/badge-urgencia/badge-urgencia.component.ts`

```ts
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconoComponent } from '../icono/icono.component';
import { nivelPrioridad } from '../../../utilidades/vocabulario-asistencial';

export type VarianteUrgencia = 'tecnica' | 'asistencial';

const CFG = {
  1: { icono: 'emergency', tecnico: 'P1 · Crítico', asistencial: 'Atención inmediata' },
  2: { icono: 'warning',   tecnico: 'P2 · Alto',    asistencial: 'Urgente' },
  3: { icono: 'schedule',  tecnico: 'P3 · Medio',   asistencial: 'Normal' },
  4: { icono: 'info',      tecnico: 'P4 · Bajo',    asistencial: 'Programada' },
} as const;

@Component({
  selector: 'app-badge-urgencia',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge badge--p' + nivel()" [class.badge--compacto]="compacto()">
      <app-icono [nombre]="cfg().icono" tamano="xs" aria-hidden="true" />
      <span>{{ texto() }}</span>
    </span>`,
  styleUrl: './badge-urgencia.component.scss',
})
export class BadgeUrgenciaComponent {
  readonly prioridad = input.required<string>();          // acepta 'P1' | 'P1_CRITICA' | 'CRITICA'
  readonly variante  = input<VarianteUrgencia>('tecnica');
  readonly compacto  = input(false);                      // solo "P1" (tablas densas)

  protected readonly nivel = computed(() => nivelPrioridad(this.prioridad()));
  protected readonly cfg   = computed(() => CFG[this.nivel()]);
  protected readonly texto = computed(() =>
    this.compacto() ? `P${this.nivel()}` :
    this.variante() === 'asistencial' ? this.cfg().asistencial : this.cfg().tecnico);
}
```

```scss
/* badge-urgencia.component.scss */
@use 'estilos/mixins/a11y' as a11y;
:host { display: inline-flex; }
.badge {
  display: inline-flex; align-items: center; gap: var(--espacio-1);
  padding: 3px var(--espacio-2); border: 1px solid transparent; border-radius: var(--radius-sm);
  font: 700 var(--font-size-xs)/1 var(--font-family-base); letter-spacing: .02em; white-space: nowrap;
  &--compacto { padding: 2px var(--espacio-1); }
}
@each $n in 1, 2, 3, 4 {
  .badge--p#{$n} { background: var(--color-p#{$n}-bg); color: var(--color-p#{$n}-text); border-color: var(--color-p#{$n}-base); }
}
```
> `app-prioridad-insignia` **se conserva** como *wrapper* de 1 línea que delega en `app-badge-urgencia` hasta la Ola 7 (no hay spec propio, pero se usa en `incidente-lista`, `tabla-tickets`, `solicitud-formulario`).
> Las clases `.insignia-prioridad--P1` de `bandeja-turno` y `ficha-atencion` **no se tocan** en esta ola (sus specs no las consultan, pero el HTML sí las usa): se migran en Ola 6 reemplazando el `<span>` por `<app-badge-urgencia>`.

#### 3.3.5 `app-semaforo-estado` — **nuevo** (reemplaza `sla-insignia` + clases `.sla--*` sueltas)

```ts
export type EstadoSemaforo = 'A_TIEMPO' | 'ALERTA' | 'INCUMPLIDO';
// inputs: estado (required), texto (opcional), compacto
// ícono por estado: check_circle | hourglass_empty | warning
// estilos: --sla-ok-* / --sla-alerta-* / --sla-venc-*
```
`app-sla-insignia` queda como *wrapper* que añade el cálculo con `tiempoRestante` y delega el aspecto.

#### 3.3.6 `app-tarjeta` — **nuevo** (soporta Ley de Región Común, §4.2)

```ts
@Component({
  selector: 'app-tarjeta', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="tarjeta" [class]="'tarjeta tarjeta--' + variante()"
                  [class.tarjeta--interactiva]="interactiva()" [style.--tarjeta-acento]="acento()">
                <ng-content />
             </div>`,
  styleUrl: './tarjeta.component.scss',
})
export class TarjetaComponent {
  readonly variante   = input<'plana' | 'elevada' | 'resaltada'>('plana');
  readonly interactiva = input(false);
  readonly acento = input<string | null>(null);   // p.ej. 'var(--color-p1-base)' → borde izquierdo 4 px (semáforo)
}
```
```scss
.tarjeta {
  background: var(--color-surface-card); border: var(--tarjeta-borde); border-radius: var(--tarjeta-radio);
  padding: var(--tarjeta-padding); box-shadow: var(--tarjeta-sombra);
  border-inline-start: 4px solid var(--tarjeta-acento, var(--color-border-subtle));
  &--resaltada { border-color: var(--color-primary-base); background: var(--color-primary-light); }
  &--interactiva { cursor: pointer; transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    &:hover { transform: translateY(-2px); box-shadow: var(--tarjeta-sombra-hover); }
    &:focus-within { outline: var(--foco-anillo); outline-offset: var(--foco-offset); } }
}
```

#### 3.3.7 Otros átomos

| Átomo | Contrato mínimo |
|---|---|
| `app-input-texto` | `ControlValueAccessor`; inputs `etiqueta?`, `placeholder`, `tipo`, `maxlength`, `invalido`; altura `--campo-altura`; borde 1 px `--campo-borde`; `aria-invalid` |
| `app-textarea` | Igual + `filas`, contador `x/max` (`textoUtil`) |
| `app-spinner` | `tamano: 'sm'\|'md'`; `role="status"` + `aria-label`; reemplaza los 4 spinners CSS (`.spinner`, `.dialogo__spinner`, `.ayuda-articulo__spinner`, `.solicitud-detalle__spinner`) |
| `app-esqueleto` | **Existente.** Se amplía con presets (§4.6) |
| `app-badge-nivel` | Renombre lógico de `nivel-insignia` (`N1`/`N2`) |
| `app-badge-visibilidad` (F4) | `PUBLICO_ASISTENCIAL` → ícono `groups` "Público asistencial"; `SOLO_TECNICO` → `engineering` "Solo técnico" |

### 3.4 Moléculas — contratos

| Molécula | Compone | API |
|---|---|---|
| `app-campo-formulario` | etiqueta + control proyectado + ayuda + error + contador | `etiqueta`, `ayuda`, `error`, `requerido`, `[for]`. Genera `id`/`aria-describedby` correctos (hoy cada formulario los escribe a mano) |
| `app-buscador-debounce` | `app-icono` + input `type=search` + botón limpiar (44 px) | `placeholder`, `debounceMs=300`, `output<string>` `alBuscar`. Reemplaza el patrón repetido en `bandeja-turno`, `consulta-rapida`, `mis-solicitudes`, `ayuda-rapida` |
| `app-buscador-filtros` | buscador + `app-chip` | **Existente**; internamente usa `app-buscador-debounce` |
| `app-contexto-equipo` | iconos + `dl` de IP/host/área/anexo | **Existente** (ya compartido) |
| `app-tarjeta-activo-mini` | `app-tarjeta` + `badge` fallas/préstamo | Promoción de `mi-turno/componentes/tarjeta-activo` (spec: `.badge-prestamo`, `.badge-fallas` **se conservan**) |
| `app-estado-vacio` | ícono grande + título + texto + CTA proyectado | Existente; añadir slot `ng-content` para CTA (hoy `.mis-solicitudes__vacio`, `.bandeja-vacia`, `.consulta-vacia` lo reimplementan) |
| `app-aviso-banner` | ícono + mensaje + cerrar | `tipo: 'exito'\|'error'\|'aviso'\|'info'`; `role` automático (`alert` si error, `status` si no). Reemplaza `.mensaje-banner*` y `.alerta-exito` |
| `app-paginador` | botones prev/next 44 px + "Página x de y" | Reemplaza `.paginacion`, `.mis-solicitudes__paginador`, `.tabla-paginacion` |
| `app-selector-audiencia` (F4) | `radiogroup` con 2 opciones con ícono, texto explicativo | ver §6.4 |

### 3.5 Organismos — contratos

| Organismo | Origen | Nota |
|---|---|---|
| `app-dialogo-base` | **nuevo** | Cáscara con `appDialogoAccesible`, overlay (Figura-Fondo), cabecera, cuerpo con scroll, pie fijo, pantalla completa `<600px`, *safe-area*. Slots: `[dialogo-titulo]`, `[dialogo-cuerpo]`, `[dialogo-pie]`. |
| `app-dialogo-resolver-ticket` / `-escalar-ticket` | `compartido/componentes` | Se migran **sin cambiar** API (`form`, `intentarCerrar`, `confirmarDescarte`, outputs). Pasan a usar el parcial `_dialogo.scss` (Ola 3) y luego `app-dialogo-base` (Ola 6, opcional) |
| `app-dialogo-asignar` / `-cambiar-estado` | `incidentes/componentes` | Se promueven a `compartido/ui/organismos` (los consume `incidente-detalle` y a futuro la bandeja del Administrador) |
| `app-sla-cronometro` | `compartido/componentes` | Usa `app-semaforo-estado`; mantiene `.sla-cronometro` y `.barra` (spec) |
| `app-resumen-turno`, `app-barra-acciones-ticket` | `mi-turno/componentes` | Se conservan en la carpeta del dominio hasta que otro rol los necesite; **no** promover prematuramente |
| `app-linea-tiempo-etapas` | `compartido/componentes` | Conservar `ol.linea-tiempo li.paso`, `.actual`, `aria-current` |
| `app-linea-tiempo-auditoria` | **nuevo (Fase 4)** | Variante técnica (usuario, estado anterior → nuevo, comentario). Reemplaza `incidente-linea-tiempo` y la `linea-tiempo-interna` de `ficha-atencion` |
| `app-tabla-responsiva` | **nuevo** | Un único componente que recibe `columnas` + `filas` y una `ng-template` de tarjeta; usa `ViewportService.esDesktop()` para renderizar **tabla ≥ 1024 / tarjetas < 1024** (un solo DOM, regla ya validada por la prueba de `mis-solicitudes`). Absorbe `tabla-tickets`, `tabla-turno`, `tabla-activos` |
| `app-calificacion-estrellas` | `compartido/componentes` | Conservar `.boton-estrella`, `.calificacion-estrellas`, `role=radiogroup` |
| `app-notificacion-toast`, `app-kpi-panel` | existentes | Sin cambios funcionales |

### 3.6 Plantillas / Layouts

| Plantilla | Cambios |
|---|---|
| `maquetacion-principal` | Fondo `--color-bg-app` (crema); `.area-contenido` con `scroll-padding-top`; `lienzo-vista` usa `--espacio-*` |
| `barra-superior` | Botones a 44 px; selector de rol bajo `@if (!production)`; logo `assets/logo.ico` ya cumple |
| `menu-lateral` | Alto de ítem 44 px; etiquetas del Administrador "Solicitudes de Cambio (RFC)" y "Activos y Red (CMDB)": ver D6/§5.6 |
| `pagina-estandar` (**nueva**) | `<app-pagina-estandar titulo subtitulo>` con slots `[acciones]` y contenido; `max-width`, padding y `h1` estandarizados. Sustituye los 12 `.xxx-contenedor` con padding/max-width diferentes (1200, 1280, 1400, 900, 860, 800, 960…) |

```html
<!-- pagina-estandar.component.html -->
<section class="pagina">
  <header class="pagina__cabecera">
    <div>
      <h1 class="t-h1">{{ titulo() }}</h1>
      @if (subtitulo()) { <p class="t-body-sm pagina__sub">{{ subtitulo() }}</p> }
    </div>
    <div class="pagina__acciones"><ng-content select="[acciones]" /></div>
  </header>
  <ng-content />
</section>
```
```scss
.pagina { display: flex; flex-direction: column; gap: var(--espacio-lg); max-inline-size: 1280px; margin-inline: auto; inline-size: 100%; }
.pagina__cabecera { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--espacio-md); }
.pagina__sub { color: var(--color-text-muted); margin: var(--espacio-2xs) 0 0; }
.pagina__acciones { display: flex; flex-wrap: wrap; gap: var(--espacio-xs); }
@include desde(sm) { /* nada */ } 
@media (max-width: 599.98px) { .pagina__acciones { inline-size: 100%; > * { flex: 1; } } }
```

### 3.7 Páginas

Orquestadores únicos de datos; **no** contienen CSS de componente (solo layout de página). Lista: `portal-inicio`, `mis-solicitudes`, `solicitud-detalle`, `ayuda-rapida`, `ayuda-articulo`, `bandeja-turno`, `ficha-atencion`, `consulta-rapida`, `consulta-articulo`, `panel-control`, `incidente-lista`, `incidentes-criticos`, `incidente-detalle`, `solicitud-crear`, `sla-monitor`, `sla-configuracion`, `cmdb-lista`, `login`, `acceso-denegado` y (F4) `mantenimiento-conocimiento`, `editor-articulo`.

---

## 4. Leyes de Gestalt — aplicación con código

### 4.1 Proximidad — campos relacionados juntos, bloques separados

Regla numérica: **dentro** de un grupo `--espacio-sm` (12 px); **entre** grupos `--espacio-lg` (24 px); **entre** secciones `--espacio-xl` (32 px).

```html
<form class="formulario">
  <fieldset class="grupo">
    <legend class="t-h3">Datos del solicitante</legend>   <!-- Proximidad + Región común -->
    <app-campo-formulario etiqueta="Área"><input … /></app-campo-formulario>
    <app-campo-formulario etiqueta="Anexo"><input … /></app-campo-formulario>
  </fieldset>

  <fieldset class="grupo">
    <legend class="t-h3">Detalle del problema</legend>
    <app-campo-formulario etiqueta="Título"><input … /></app-campo-formulario>
    <app-campo-formulario etiqueta="Descripción"><textarea …/></app-campo-formulario>
  </fieldset>
</form>
```
```scss
.formulario { display: flex; flex-direction: column; gap: var(--espacio-lg); }
.grupo { display: flex; flex-direction: column; gap: var(--espacio-sm); border: 0; padding: 0; margin: 0; }
```
**Aplicar a:** `solicitud-formulario` (ya agrupa por `seccion-form`), modales de resolver/escalar/activo, y el editor del Centro de Soluciones (§6).

### 4.2 Región común — una entidad = una tarjeta blanca

Cada **ticket, equipo, guía y solicitud** vive en `<app-tarjeta>`. No se mezclan dos entidades en la misma tarjeta ni se dejan datos "flotando" sobre el lienzo crema.

```html
<app-tarjeta [interactiva]="true" [acento]="'var(--color-p1-base)'">
  <article class="ticket">…</article>
</app-tarjeta>
```
**Excepción documentada:** tablas densas en escritorio (una única tarjeta contiene la tabla completa; las filas se separan con `--color-border-subtle`).

### 4.3 Semejanza — misma función, mismo aspecto

| Función | Variante | Ejemplos actuales que deben verse idénticos |
|---|---|---|
| **Primaria** (1 por vista/ diálogo) | `boton-primario` (guinda) | "Reportar un problema", "Nuevo Incidente", "Tomar ticket", "Guardar", "Escalar a Nivel 2" |
| **Éxito / resolución** | `boton-exito` (verde) | "Marcar como resuelto", "Sí, quedó solucionado", "Publicar artículo" |
| **Secundaria** | `boton-secundario` | "Cancelar", "Volver", "Ver ficha", "Seguir editando" |
| **Destructiva** | `boton-peligro` | "Descartar cambios", "Archivar artículo" (con confirmación defensiva) |
| **Terciaria / enlace** | `boton-fantasma` | "Ver todas", "Limpiar" |

> Hoy "Tomar ticket" es guinda, "Iniciar atención" azul `#0284c7` y "Escalar" borde rosa `#9d174d`. Se unifican: **Iniciar** = primaria guinda; **Escalar** = secundaria con ícono `trending_up`; el color extra solo se admite para **estado**, no para acción. *(Cambio visual intencional, listado en §5.7.)*

### 4.4 Continuidad / flujo visual Z y F

**Tarjeta de ticket (flujo Z, lectura de izquierda→derecha, arriba→abajo):**

```text
┌───────────────────────────────────────────────────────────┐
│ [P1 ícono+texto]  INC-2026-00301        📍 Emergencia ←── 1ª línea: ¿qué tan grave? ¿cuál? ¿dónde?
│ Caída de conexión GalenHos en Emergencia   ←── 2ª línea: ¿qué pasa? (h3)
│ 💻 HSP-EMG-SRV01 · 10.20.30.10             ←── contexto técnico (mono, caption)
│ [⏱ Por vencer · 09:59 ▓▓▓▓░░]              ←── cuánto tiempo queda (cronómetro)
│                         [ Tomar y comenzar ] ←── 4º: acción primaria, abajo-derecha
└───────────────────────────────────────────────────────────┘
```
**Listas largas / tablas (patrón F):** columnas en orden de importancia: Prioridad → Código → Problema → Área/Equipo → Compromiso → Estado → Acción. La acción primaria queda al final de la fila (ya implementado en `tabla-turno`).

**Flujo del ciclo de vida:** `Registrado → En atención → Resuelto → Cerrado` siempre horizontal en ≥ 1024 px, vertical en móvil (ya en `linea-tiempo-etapas`).

### 4.5 Figura–Fondo

| Capa | Token | Propósito |
|---|---|---|
| Lienzo | `--color-bg-app` (crema) | Fondo calmado, anti-fatiga |
| Figura (contenido) | `--color-surface-card` (blanco) + `--shadow-card` | Lo que se lee y se opera |
| Rebajado dentro de figura | `--color-surface-sunken` | Metadatos agrupados (equipo, contexto) |
| Modal | `--color-surface-overlay` + `backdrop-filter: blur(4px)` | Atención total al diálogo |

```scss
.dialogo-fondo { position: fixed; inset: 0; z-index: var(--z-modal);
  background: var(--color-surface-overlay); backdrop-filter: blur(4px); display: grid; place-items: center; padding: var(--espacio-md); }
.dialogo { background: var(--color-surface-card); border-radius: var(--dialogo-radio); box-shadow: var(--shadow-modal);
  inline-size: 100%; max-inline-size: var(--dialogo-ancho-md); max-block-size: 90dvh; display: flex; flex-direction: column; overflow: hidden; }
@include hasta(sm) { .dialogo-fondo { padding: 0; } .dialogo { max-inline-size: 100vw; block-size: 100dvh; max-block-size: 100dvh; border-radius: 0; } }
```
> En un hospital, el **rojo emergencia solo se usa para P1 y vencido**; nunca como decoración → mantiene la "figura" crítica visible.

### 4.6 Cierre — *skeletons* con la silueta real

Presets de `app-esqueleto` (un componente, N formas), cada uno replica **exactamente** la estructura de la tarjeta final para evitar saltos de maquetación (CLS):

```ts
// esqueleto.component.ts — añadir
readonly preset = input<'linea' | 'tarjeta-ticket' | 'tarjeta-solicitud' | 'fila-tabla' | 'articulo' | 'kpi'>('linea');
```
```html
@switch (preset()) {
  @case ('tarjeta-ticket') {
    <div class="sk-tarjeta" aria-hidden="true">
      <div class="sk sk--badge"></div><div class="sk sk--codigo"></div>   <!-- fila 1 -->
      <div class="sk sk--titulo"></div>                                   <!-- fila 2 -->
      <div class="sk sk--meta"></div>                                     <!-- fila 3 -->
      <div class="sk sk--cronometro"></div>                               <!-- fila 4 -->
      <div class="sk sk--boton"></div>                                    <!-- acción -->
    </div>
  }
  …
}
```
Contenedor con `aria-busy="true"` y `aria-label="Cargando …"`. `@media (prefers-reduced-motion)` desactiva el *shimmer* (ya cubierto por §2.8). **Reemplazar** los 6 esqueletos CSS por `<app-esqueleto preset="…">` en la Ola 6.

---

## 5. Inventario, matriz de migración y plan paso a paso

### 5.1 Matriz de componentes existentes → nivel atómico destino

| Componente actual (ruta actual) | Nivel | Destino | Acción |
|---|---|---|---|
| `compartido/ui/atomos/icono` | Átomo | igual | Registro tipado (§3.3.1) |
| `…/atomos/boton` | Átomo | igual | Mixins + 44 px |
| `…/atomos/chip-filtro` | Átomo | `atomos/chip` (alias selector) | 44 px |
| `…/atomos/esqueleto` | Átomo | igual | Presets |
| `…/atomos/estado-etiqueta` | Átomo | `atomos/badge-estado` (conservar selector `app-estado-etiqueta`) | Tokens |
| `…/atomos/nivel-insignia` | Átomo | `atomos/badge-nivel` | Tokens (hoy hex) |
| `…/atomos/prioridad-insignia` | Átomo | wrapper de `badge-urgencia` | Delegar |
| `…/atomos/sla-insignia` | Átomo | wrapper de `semaforo-estado` | Delegar |
| `…/moleculas/buscador-filtros` | Molécula | igual | Usa `buscador-debounce` |
| `…/moleculas/contexto-equipo` | Molécula | igual | Tokens |
| `…/moleculas/estado-vacio` | Molécula | igual | Slot CTA |
| `…/moleculas/kpi-tarjeta` | Molécula | igual | Tokens; mantener *flip* |
| `…/moleculas/temporizador-sla` | Molécula | igual | Usa `semaforo-estado` + `RelojService` |
| `…/moleculas/cabecera-pagina` (esqueleto) | — | **eliminar** (lo cubre `pagina-estandar`) | Borrar |
| `…/organismos/kpi-panel`, `tabla-tickets`, `notificacion-toast` | Organismo | igual | `tabla-tickets` → `tabla-responsiva` (Ola 6) |
| `…/organismos/dialogo-confirmacion` (esqueleto) | Organismo | **implementar** como `dialogo-confirmacion-defensiva` en Fase 4 (Patrón UX 4: escribir `CONFIRMAR`) | Reescribir |
| `compartido/componentes/dialogo-resolver-ticket` | Organismo | `ui/organismos/` | `git mv` + shim |
| `compartido/componentes/dialogo-escalar-ticket` | Organismo | `ui/organismos/` | ídem |
| `compartido/componentes/sla-cronometro` | Organismo | `ui/organismos/` | ídem |
| `compartido/componentes/linea-tiempo-etapas` | Organismo | `ui/organismos/` | ídem |
| `compartido/componentes/calificacion-estrellas` | Organismo | `ui/organismos/` | ídem |
| `incidentes/componentes/dialogo-asignar`, `dialogo-cambiar-estado` | Organismo | `ui/organismos/` | `git mv` + shim |
| `incidentes/componentes/dialogo-resolver`, `dialogo-escalar` | — | **eliminar** (duplicados sin uso) | `grep` previo |
| `incidentes/componentes/incidente-linea-tiempo` | Organismo | `linea-tiempo-auditoria` (F4) | Reemplazo |
| `incidentes/componentes/incidente-filtros` | Molécula (dominio) | queda | Tokens |
| `mi-turno/componentes/resumen-turno`, `barra-acciones-ticket` | Organismo (dominio) | quedan | Mixins de botón |
| `mi-turno/componentes/tarjeta-activo` | Molécula | `ui/moleculas/tarjeta-activo-mini` | `git mv` + shim |
| `portal-asistencial/componentes/*` (`tarjeta-solicitud`, `banner-confirmacion`, `accesos-ayuda`, `tarjeta-calificacion`, `tarjeta-confirmacion-solucion`) | Moléculas/Organismos (dominio) | quedan | Tokens + `app-tarjeta` |
| `panel-control/componentes/*` (gráficos Chart.js, `reloj-ticket-activo`) | Organismos (dominio) | quedan | `reloj-ticket-activo` → `RelojService`; colores Chart.js desde tokens leídos con `getComputedStyle` |
| `nucleo/maquetacion/*` | Plantilla | `compartido/ui/plantillas/` | `git mv` + shim |
| `compartido/directivas/dialogo.scss` | Estilo | `estilos/componentes/_dialogo.scss` | Mover |
| Esqueletos "works!" | — | **eliminar** (§5.2) | Borrar |

### 5.2 Limpieza de esqueletos y estilos muertos

Borrar (con `git rm`) **solo después de** `grep -r "<selector>" src` = 0 resultados:

`cabecera-pagina`, `sla-resumen-semaforo`, `sla-tabla-tickets`, `grafico-cumplimiento-sla`, `grafico-por-categoria`, `panel-control/componentes/kpi-tarjeta`, `incidente-crear`, `incidente-formulario`, `solicitud-lista`, `solicitud-detalle`, `no-encontrado` (**conservar** y completar: es la ruta 404), `escalamiento-cola` / `roles-permisos` / `usuario-*` (conservar solo si hay ticket de Fase 4 que los implemente; si no, borrar).
En `_utilidades.scss` eliminar `.badge-prioridad`, `.badge-sla` y `.card-hospital` **si** el *grep* no los encuentra (hoy no se usan en HTML).

### 5.3 Estrategia de promoción de duplicados a `compartido/ui/`

Procedimiento **por componente** (repetible por el Agente Obrero):

1. `git mv` de la carpeta completa (ts, html, scss, spec) al nuevo destino. **No** editar contenido en el mismo commit.
2. Crear *shim* en la ruta antigua, un archivo por símbolo exportado:
   ```ts
   // compartido/componentes/sla-cronometro/sla-cronometro.component.ts  (SHIM TEMPORAL)
   /** @deprecated importar desde compartido/ui/organismos/sla-cronometro */
   export * from '../../ui/organismos/sla-cronometro/sla-cronometro.component';
   ```
3. Ejecutar `ng test` → debe seguir en **302/302**.
4. Codemod de imports (script §5.5) reemplaza rutas antiguas por nuevas en todo `src/`; `ng test` otra vez.
5. Borrar el shim cuando `grep` de la ruta antigua = 0.
6. Commit: `refactor(ui): mover sla-cronometro a organismos`.

> El **selector** (`app-sla-cronometro`) y el **nombre de clase TypeScript** nunca cambian en un `git mv`.

### 5.4 Cómo no romper las 302 pruebas

**Qué consultan hoy las pruebas** (contrato de selectores — **PROHIBIDO renombrar/eliminar** hasta que el spec se actualice en el mismo commit y con revisión):

| Área | Selectores / textos que los specs usan |
|---|---|
| Mi Turno | `.btn-accion--primaria`, `.btn-accion--secundaria`, `.insignia-estado-lectura`, `.alerta-p1`, `.alerta-p1__boton`, `.tarjeta-contador__valor`, `.mensaje-banner--offline`, `.sr-only` (≥ 2), `.ficha-error`, `.badge-prestamo`, `.badge-fallas`, `.btn-usar-ticket`, `button[type="submit"]` en diálogos |
| Portal | `.tarjeta-calificacion__btn--enviar/--posponer`, `.tarjeta-calificacion__exito`, `.tarjeta-confirmacion__btn--si/--no/--enviar`, `.mis-solicitudes__tabla`, `app-tarjeta-solicitud`, `a.tarjeta-solicitud__enlace` (href `/portal/mis-solicitudes/1`), `.banner-confirmacion`, `.ayuda-articulo__btn--si/--no`, `.ayuda-articulo__exito`, `.ayuda-articulo__vacio`, `.ayuda-rapida__sin-resultados`, `.solicitud-detalle__vacio`, `app-tarjeta-confirmacion-solucion`, `app-tarjeta-calificacion`, `#cta-reportar`, `.banner-confirmacion` |
| Compartido | `.boton-estrella`, `.calificacion-estrellas`, `ol.linea-tiempo li.paso`, `li.paso.actual` (+ `aria-current="step"`), `.sla-cronometro`, `.barra` |
| Panel | `.btn-control--escalar` |
| Textos | "Tomar ticket", "Tomar y comenzar", "Iniciar atención", "Escalar a Nivel 2", "Resolver ticket", "Ticket resuelto", "Derivado a Nivel 2", "Ver todas las guías", "¡Gracias por ayudarnos a mejorar!", "¡Nos alegra haberle ayudado!", "Estamos priorizando su caso", "A tiempo", "Por vencer" |
| Vocabulario | `textContent` **sin** ITIL/SLA/CMDB/KEDB/RFC/P1–P4/vencido/escalado en pantallas de `USUARIO_FINAL` |
| Estructura | un solo DOM por viewport (tabla **o** tarjetas), 4 `.tarjeta-contador__valor`, 5 `.boton-estrella` |

**Reglas de oro durante la refactorización**

1. **Estilos antes que DOM.** Si algo se puede lograr cambiando SCSS/tokens/mixins, no se toca el HTML.
2. Si hay que tocar HTML: se **añaden** clases/atributos; **no** se quitan las existentes que están en el contrato.
3. Un PR = una ola o sub-ola, con `ng test` y `ng build` en verde **antes y después**.
4. Prohibido en el mismo commit: mover archivos **y** cambiar contenido.
5. Specs sin selectores (los que solo hacen `should be created`) son "red de seguridad débil": para esos componentes añadir **antes** de refactorizar una prueba de humo (`render + sin términos prohibidos`). Candidatos: `auth.guard`, `rol.guard`, interceptores, `notificacion.service`.
6. Pruebas con `vi.useFakeTimers` (`reloj`, `sondeo`) **no se tocan**.
7. Si una prueba falla por una **clase renombrada**: revertir; no "arreglar" el spec.
8. Las pruebas de `vocabulario` son la **red de seguridad de Regla de Oro**: se extienden con los textos nuevos (§5.5).

### 5.5 Herramientas guardianas (crear en Ola 0)

**a) Línea base**
```bash
git switch develop && git pull && git switch -c refactor/design-system-atomico
npm ci && npx ng test --watch=false        # debe dar 302/302
npx ng build                               # sin errores ni warnings de presupuesto
```
Registrar en `docs/refactor/linea-base.md`: nº de tests, tamaños de bundle y capturas (Desktop 1440, Tablet 820, Móvil 360) de: login, `/portal`, `/mi-turno`, ficha, `/panel-control`, `/cmdb/activos`.

**b) Stylelint — impedir regresiones** (`.stylelintrc.json`)
```json
{
  "extends": ["stylelint-config-standard-scss"],
  "rules": {
    "color-no-hex": [true, { "severity": "warning" }],
    "declaration-property-value-disallowed-list": {
      "font-size": ["/^0?\\.[0-6]\\d*rem$/", "/^1[01]px$/"],
      "min-height": ["/^(2\\d|3\\d|4[0-3])px$/"]
    },
    "selector-class-pattern": null
  },
  "overrides": [{ "files": ["src/estilos/tokens/_primitivos.scss", "src/estilos/tokens/_tema-noche.scss"], "rules": { "color-no-hex": null } }]
}
```
Se activa como **warning** en Olas 1–5 y como **error** desde Ola 6 (el *baseline* de warnings se reduce por carpeta).

**c) Guardián de vocabulario (script, correr en CI)** `scripts/verificar-vocabulario.mjs`
```js
import { readFileSync } from 'node:fs'; import { globSync } from 'node:fs';
const PROHIBIDO_GLOBAL = [/\bITIL(\s?v?4)?\b/i];
const archivos = globSync('src/**/*.{html,ts}', { exclude: (f) => /\.spec\.ts$|vocabulario-asistencial\.ts$/.test(f) });
let errores = 0;
for (const f of archivos) {
  const txt = readFileSync(f, 'utf8');
  // Ignora comentarios y nombres de clase CSS; busca en literales visibles (aprox.)
  for (const r of PROHIBIDO_GLOBAL) if (r.test(txt.replace(/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) { console.error(`✖ ${f}: término prohibido ${r}`); errores++; }
}
process.exit(errores ? 1 : 0);
```
Complementar: `src/index.html` (`<title>`), todos los `title:` de rutas.

**d) Guardián de íconos** `scripts/verificar-iconos.mjs`: extrae `nombre="…"` y `[nombre]="'…'"` de los `.html`, y los compara con `ICONOS`/`ICONO_LEGADO`; falla con los desconocidos.

**e) Guardián de capas atómicas**: el `grep` de §3.2 + `eslint-plugin-boundaries` (opcional).

**f) Spec de contraste** `src/estilos/contraste.spec.ts` (Vitest): calcula luminancia de los pares de §2.5 y exige ≥ 4.5 (texto) / ≥ 3 (gráfico). Evita que un cambio de token degrade accesibilidad sin que nadie lo note.

**g) Codemod de imports** `scripts/mover-imports.mjs <rutaVieja> <rutaNueva>`: reemplaza especificadores relativos recalculando la profundidad. Alternativa manual: `ng-morph` / VS Code "Move TypeScript symbol".

**h) `npm scripts`**
```json
"verificar": "node scripts/verificar-vocabulario.mjs && node scripts/verificar-iconos.mjs && stylelint \"src/**/*.scss\"",
"test:ci": "ng test --watch=false && npm run verificar"
```

### 5.6 Plan paso a paso (olas)

> **Un PR por ola/sub-ola.** Commits en español, imperativo (Conventional Commits). Cada ola termina con `npm run test:ci` en verde y revisión visual en 3 viewports.

#### Ola 0 — Línea base y guardianes · `chore(refactor): …`
- **Tarea 0.1** [Obrero] Ejecutar §5.5-a y guardar `linea-base.md`.
- **Tarea 0.2** [Obrero] Crear scripts §5.5-c/d/e/f/g/h y `.stylelintrc.json`. Instalar `stylelint`, `stylelint-config-standard-scss`.
- **Tarea 0.3** [Humano] Capturas de referencia (3 viewports × 6 pantallas × 3 roles) en `docs/refactor/capturas-antes/`.
- **Aceptación:** `npm run test:ci` verde (con stylelint en *warning*); lista de *warnings* exportada como baseline.

#### Ola 1 — Capa de tokens + alias · `feat(estilos): agregar tokens en tres capas y alias de compatibilidad`
- **Tarea 1.1** [Obrero] Crear `src/estilos/tokens/*` (§2.2–2.10) y convertir `_tokens.scss` en barril. Mover `--font-*` a `tokens/_tipografia.scss`.
- **Tarea 1.2** [Obrero] Crear `_alias-legado.scss` (§2.10). Importarlo **al final** del `index`.
- **Tarea 1.3** [Obrero] Autoalojar fuentes (D7), corregir `<title>`, quitar `<link>` de Google Fonts.
- **Tarea 1.4** [Humano] Revisión visual contra capturas.
- **Aceptación:** diferencia visual solo en los 3 puntos marcados ⚠ (§5.7); `ng test` 302/302; modo noche ya afecta panel/portal/mi-turno.

#### Ola 2 — Reemplazo de hex y fallbacks por tokens (mecánico) · `refactor(estilos): reemplazar colores fijos por tokens`
- **Tarea 2.1** [Obrero] Por **carpeta** (un commit cada una): `nucleo/maquetacion`, `compartido/ui`, `compartido/componentes`, `portal-asistencial`, `mi-turno`, `panel-control`, `incidentes`, `solicitudes`, `sla`, `cmdb`, `auth`.
  Tabla de sustitución:

  | Hex / patrón | Token |
  |---|---|
  | `#701c1c` | `var(--color-primary-base)` |
  | `#521414` / `#551515` / `#581515` / `#541414` / `#551313` / `#8a1f1f` (hover) | `var(--color-primary-hover)` |
  | `#1b5e20` | `var(--color-secondary-base)` |
  | `#144919` / `#144718` / `#134517` / `#113e14` (hover verde) | `var(--color-secondary-hover)` |
  | `#ffffff` (fondo) | `var(--color-surface-card)` |
  | `#f8fafc` | `var(--color-surface-sunken)` |
  | `#f1f5f9` | `var(--color-surface-hover)` |
  | `#e2e8f0` | `var(--color-border-subtle)` |
  | `#cbd5e1` | `var(--color-border-strong)` |
  | `#0f172a` | `var(--color-text-main)` |
  | `#334155` / `#475569` | `var(--color-text-secondary)` / `var(--color-text-muted)` |
  | `#64748b` / `#94a3b8` (texto) | `var(--color-text-muted)` |
  | `#fee2e2/#7f1d1d/#dc2626` | `--color-p1-bg / -text / -base` (o `--sla-venc-*` si es estado) |
  | `#fef3c7/#78350f/#d97706` | `--color-p3-*` (o `--sla-alerta-*`) |
  | `#0284c7`, `#0369a1`, `#e0f2fe` (azules ad hoc) | `--color-info-border / -text / -bg` |
  | `#dcfce7/#166534/#16a34a` | `--color-exito-*` |
  | `font-size: 0.68–0.74rem` | `var(--text-caption-size)` |
  | `Chart.js` (`#701c1c`, `#2563eb`, …) | Leer con `getComputedStyle(document.documentElement).getPropertyValue('--color-…')` en `ngAfterViewInit` (y re-leer al cambiar `data-tema`) |

- **Tarea 2.2** [Humano] Revisión visual por carpeta tras cada commit.
- **Aceptación:** `stylelint color-no-hex` baja ≥ 90 % por carpeta; **modo noche** sin fondos blancos; 302/302.

#### Ola 3 — Mixins, utilidades y estilos compartidos · `refactor(estilos): unificar botones, foco y diálogos`
- **Tarea 3.1** [Obrero] Crear `mixins/*` (§2.11–2.12) y registrar `includePaths`.
- **Tarea 3.2** [Obrero] Aplicar `@include boton-*` a las familias `.btn-*` por componente (sin tocar HTML): `bandeja-turno`, `barra-acciones-ticket`, `ficha-atencion`, `portal-*`, `solicitud-*`, `cmdb`, `dialogo-*`.
- **Tarea 3.3** [Obrero] Mover `compartido/directivas/dialogo.scss` → `estilos/componentes/_dialogo.scss`; hacer que `dialogo-resolver-ticket` y `dialogo-escalar-ticket` usen el parcial para cabecera/pie/overlay (eliminar ≈ 250 líneas duplicadas). Mantener todas las clases `.dialogo__*` (BEM actual).
- **Tarea 3.4** [Obrero] Breakpoints: reemplazar `@media (max-width: 768px)` por `@include hasta(lg)` en `tabla-tickets` (corte a 1024); unificar el resto a `sm/md/lg/xl`.
- **Tarea 3.5** [Obrero] Touch targets: aplicar `@include touch-target` a la lista de §1.5.
- **Aceptación:** ningún interactivo < 44 px (inspección con DevTools + regla stylelint); 302/302.

#### Ola 4 — Átomos nuevos y ajustes · `feat(ui): agregar tarjeta, badge-urgencia, semaforo-estado, spinner e input`
- **Tarea 4.1** [Obrero] Implementar §3.3.1 (registro de íconos), 3.3.4, 3.3.5, 3.3.6, 3.3.7 con **spec propio** cada uno (render, accesibilidad, ausencia de términos prohibidos).
- **Tarea 4.2** [Obrero] `app-prioridad-insignia` y `app-sla-insignia` delegan en los nuevos átomos (mismos inputs).
- **Tarea 4.3** [Obrero] `app-esqueleto` con presets (§4.6).
- **Aceptación:** specs nuevos en verde; `npm run verificar` sin íconos desconocidos (tras el normalizador, 0 *warnings* en consola durante `ng test`).

#### Ola 5 — Mover componentes a la jerarquía atómica · `refactor(ui): mover <x> a <nivel>`
- **Tarea 5.1** [Obrero] Seguir §5.3 para **un componente por commit**, en este orden (de menor a mayor riesgo): `linea-tiempo-etapas` → `calificacion-estrellas` → `sla-cronometro` → `dialogo-escalar-ticket` → `dialogo-resolver-ticket` → `tarjeta-activo` → `dialogo-asignar` → `dialogo-cambiar-estado` → `nucleo/maquetacion/*`.
- **Tarea 5.2** [Obrero] Eliminar duplicados sin uso (`incidentes/.../dialogo-resolver`, `dialogo-escalar`) tras `grep`.
- **Tarea 5.3** [Humano] Revisar que `git log --follow` conserve historial.
- **Aceptación:** 302/302 tras **cada** `git mv`; `grep` de rutas antiguas = 0 al final; shims eliminados.

#### Ola 6 — Páginas: plantilla estándar, esqueletos, banners y íconos · `refactor(paginas): …`
- **Tarea 6.1** [Obrero] Crear `pagina-estandar`, `aviso-banner`, `paginador`, `buscador-debounce`, `campo-formulario`, `tabla-responsiva`.
- **Tarea 6.2** [Obrero] Sustituir por página, **una página por commit** y verificando su spec: `mis-solicitudes`, `portal-inicio`, `ayuda-rapida`, `solicitud-detalle`, `bandeja-turno`, `ficha-atencion`, `consulta-rapida`, `cmdb-lista`, `sla-monitor`.
  *Para cada página:* (a) envolver con `pagina-estandar`; (b) reemplazar banners por `app-aviso-banner` **conservando** las clases del contrato (se añaden vía `class=` si el spec las consulta, p. ej. `.mensaje-banner--offline`); (c) `app-esqueleto preset=…`; (d) corregir nombres de íconos; (e) `app-badge-urgencia` donde aplique.
- **Tarea 6.3** [Obrero] Stylelint pasa a **error**.
- **Aceptación:** 302/302; `npm run verificar` limpio; capturas "después" ≈ "antes" salvo §5.7.

#### Ola 7 — Retiro de legado · `chore(estilos): eliminar alias y shims`
- **Tarea 7.1** [Obrero] `grep` de cada alias de `_alias-legado.scss`; borrar los que dan 0 usos (cuando todos: borrar el archivo).
- **Tarea 7.2** [Obrero] Eliminar esqueletos "works!" (§5.2), `RelojServidorService` (migrar `sla-insignia`/`temporizador-sla`/`incidentes.service` a `RelojService`), selectores alias (`app-chip-filtro`).
- **Tarea 7.3** [Humano] Actualizar `estructura_frontend_angular.md` y `AGENTS.md` (§10 estilos) con la nueva jerarquía y tokens.
- **Aceptación:** 302/302; 0 alias; 0 shims; `ng build` sin cambios de tamaño > +5 %.

#### (Opcional, requiere decisión del equipo) Ola 6b — Vocabulario del personal TI
Aplicación estricta de D6 a pantallas de `PRACTICANTE`/`ADMINISTRADOR`:

| Hoy | Propuesta |
|---|---|
| "Compromiso de Atención (SLA)" | "Compromiso de atención" |
| "Monitoreo y Control de Acuerdos de Nivel de Servicio (SLA)" | "Compromisos de atención" |
| "Activos y Red (CMDB)" / "Gestión de Activos y Conectividad (CMDB)" | "Catálogo de equipos y red" |
| "Solicitudes de Cambio (RFC)" | "Cambios planificados" |
| `Fallas por Activo de Infraestructura CMDB` | "Fallas por equipo" |
| `Matriz de Prioridad` | "Nivel de prioridad de soporte" |

Implica actualizar los `title:` de rutas y specs que verifiquen esos textos; por eso es **opcional y separada**.

### 5.7 Cambios visuales **intencionales** (únicos permitidos)

1. Lienzo de la app: `#F8FAFC` → crema `#FAF6F0` (D5).
2. Texto tenue: `#64748B` → `#475569` (contraste AA sobre crema).
3. Hover del guinda: unificado en `#521414` (antes 5 valores).
4. Botones "Iniciar atención" (azul) y "Escalar" (rosa) pasan a la jerarquía primaria/secundaria (§4.3).
5. Áreas táctiles de 30–40 px suben a 44 px.
6. Radio `sm`: 4 px → 6 px.
7. Íconos inválidos pasan a mostrar el glifo correcto.

Todo lo demás debe ser **pixel-equivalente** (tolerancia: sin diferencias perceptibles en las capturas).

### 5.8 Definición de Hecho (DoD) de toda la refactorización

- [ ] 302/302 pruebas (más las nuevas de átomos) en verde.
- [ ] `ng build` sin errores; presupuesto de estilos sin nuevos *warnings*.
- [ ] 0 `#hex` en SCSS fuera de `_primitivos` y `_tema-noche`.
- [ ] 0 interactivos < 44 px; 0 `font-size` < 0.75rem.
- [ ] 0 menciones a "ITIL" (HTML/TS/title); 0 términos prohibidos en pantallas de `USUARIO_FINAL`.
- [ ] 0 íconos desconocidos; fuentes autoalojadas.
- [ ] Sin desbordamiento horizontal en 360 px (Chrome DevTools: Mobile S) en todas las rutas.
- [ ] Modo noche usable en todas las pantallas.
- [ ] Documentación actualizada.

### 5.9 Checklist de validación manual (equipo humano, antes de cada PR)

| # | Verificación | Desktop 1440 | Tablet 820 | Móvil 360 |
|---|---|:-:|:-:|:-:|
| 1 | Sin scroll horizontal en la página | ☐ | ☐ | ☐ |
| 2 | Tabla en ≥ 1024, tarjetas en < 1024 (nunca ambas) | ☐ | ☐ | ☐ |
| 3 | Todo botón/enlace/chip ≥ 44 px (Inspector) | ☐ | ☐ | ☐ |
| 4 | Foco visible con Tab en todos los controles | ☐ | ☐ | — |
| 5 | Modales: foco atrapado, Esc cierra, pantalla completa < 600 px | ☐ | ☐ | ☐ |
| 6 | Estados de carga con silueta (sin "salto" de layout) | ☐ | ☐ | ☐ |
| 7 | Prioridad/estado siempre con ícono + texto | ☐ | ☐ | ☐ |
| 8 | Alternar `data-tema="noche"` en consola: sin fondos blancos | ☐ | — | — |
| 9 | Red desconectada (DevTools Offline): íconos se ven (fuente local) | ☐ | — | — |
| 10 | Rol USUARIO_FINAL: ningún "SLA/P1/vencido/escalado/CMDB/KEDB" visible | ☐ | ☐ | ☐ |
| 11 | `prefers-reduced-motion`: sin animaciones | ☐ | — | — |
| 12 | Zoom 200 %: nada se corta | ☐ | — | — |

---

## 6. Preparación de la Fase 4 — Centro de Soluciones con visibilidad por rol

> Nombre en UI: **Centro de Soluciones** (nunca "KEDB" ni "Base de conocimiento técnica" para el usuario final). Código: `funcionalidades/conocimiento`.

### 6.1 Modelo (frontend) — extensión **retrocompatible**

`compartido/modelos/articulo-conocimiento.model.ts`

```ts
export type VisibilidadArticulo = 'PUBLICO_ASISTENCIAL' | 'SOLO_TECNICO';
export type EstadoPublicacion   = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO';

export interface ArticuloResumen {            // campos nuevos OPCIONALES → los mocks y specs actuales compilan igual
  id: number; titulo: string; categoriaId: number; categoriaNombre: string; sintoma: string;
  visibilidad?: VisibilidadArticulo;
  estadoPublicacion?: EstadoPublicacion;
  actualizadoIso?: string;
}
export interface ArticuloDetalle extends ArticuloResumen {
  causaRaiz: string | null; solucionTemporal: string; pasos: string[];
  autorNombre?: string; version?: number; ticketsVinculados?: number;
  notasTecnicas?: string | null;               // SOLO_TECNICO: nunca viaja al portal asistencial
}
export interface ArticuloEdicion {            // payload del editor
  titulo: string; categoriaId: number; sintoma: string; causaRaiz: string | null;
  solucionTemporal: string; pasos: string[]; notasTecnicas?: string | null;
  visibilidad: VisibilidadArticulo; estadoPublicacion: EstadoPublicacion;
}
```

### 6.2 Reglas de negocio de visibilidad

| Rol | Ve | Edita | Publica |
|---|---|---|---|
| `USUARIO_FINAL` | **Solo** `PUBLICO_ASISTENCIAL` + `PUBLICADO` (`/portal/ayuda`) | No | No |
| `PRACTICANTE` | `PUBLICO_ASISTENCIAL` y `SOLO_TECNICO` publicados + sus propios borradores | Crear/editar borradores | Propone (queda `BORRADOR` con marca "Pendiente de revisión") |
| `ADMINISTRADOR` | Todo | Todo | Publica / archiva / cambia visibilidad |

> **Autoridad = backend.** El frontend solo oculta; `GET /api/articulos*` filtra por rol en servidor y **nunca** devuelve `notasTecnicas` ni artículos `SOLO_TECNICO` a `USUARIO_FINAL`. *(Decisión pendiente para el equipo: ¿el Practicante publica directo o necesita aprobación? Se asume aprobación del Administrador.)*

**Base de datos** (a coordinar con Backend; la tabla `ERROR_CONOCIDO` hoy solo tiene `Activo BIT`):
```sql
ALTER TABLE ERROR_CONOCIDO ADD Visibilidad VARCHAR(25) NOT NULL CONSTRAINT DF_EC_Vis DEFAULT 'SOLO_TECNICO'
  CONSTRAINT CK_EC_Vis CHECK (Visibilidad IN ('PUBLICO_ASISTENCIAL','SOLO_TECNICO'));
ALTER TABLE ERROR_CONOCIDO ADD EstadoPublicacion VARCHAR(15) NOT NULL CONSTRAINT DF_EC_Est DEFAULT 'BORRADOR'
  CONSTRAINT CK_EC_Est CHECK (EstadoPublicacion IN ('BORRADOR','PUBLICADO','ARCHIVADO'));
ALTER TABLE ERROR_CONOCIDO ADD Version INT NOT NULL DEFAULT 1, FechaActualizacion DATETIME2(0) NULL;
```
Default `SOLO_TECNICO`: lo existente **no** se expone al público por accidente.

### 6.3 Servicios (patrón `servicio-api-mock-http`, igual que el resto)

```text
funcionalidades/conocimiento/
├── conocimiento.routes.ts
├── modelos/ (dtos.ts, mapeadores)
├── servicios/
│   ├── conocimiento.api.ts       # abstract class ConocimientoApi
│   ├── conocimiento.mock.ts      # incluye artículos de ambas visibilidades
│   ├── conocimiento.http.ts
│   └── conocimiento.providers.ts # usarMocks ? Mock : Http
├── paginas/
│   ├── mantenimiento-conocimiento/   # lista + filtros (visibilidad, estado, categoría)
│   └── editor-articulo/              # crear/editar + vista previa por audiencia
└── componentes/
    ├── fila-articulo/ …
    └── vista-previa-articulo/
```
```ts
export abstract class ConocimientoApi {
  abstract listar(c: ConsultaConocimiento): Observable<Pagina<ArticuloResumen>>;   // filtros: texto, categoriaId, visibilidad?, estado?
  abstract obtener(id: number): Observable<ArticuloDetalle>;
  abstract crear(p: ArticuloEdicion): Observable<ArticuloDetalle>;
  abstract actualizar(id: number, p: ArticuloEdicion): Observable<ArticuloDetalle>;
  abstract cambiarEstado(id: number, estado: EstadoPublicacion): Observable<ArticuloDetalle>;   // solo ADMINISTRADOR
}
```
`PortalAyudaApi` y `ConsultaRapidaApi` **no se tocan**; el backend decide qué devuelven por rol. (A futuro se pueden converger sobre `ConocimientoApi`.)

### 6.4 Componentes UI nuevos (gracias a la estructura atómica)

| Componente | Nivel | Reutiliza | Notas |
|---|---|---|---|
| `app-badge-visibilidad` | Átomo | `icono` | `groups` "Público asistencial" / `engineering` "Solo técnico"; doble codificación |
| `app-selector-audiencia` | Molécula | `campo-formulario`, `icono` | `role="radiogroup"`; dos tarjetas-radio de 44+ px con explicación: *"Lo verá todo el personal del hospital"* vs *"Solo lo verá Mesa de Ayuda"*. Valor por defecto: `SOLO_TECNICO` (principio de mínimo privilegio) |
| `app-editor-pasos` | Organismo | `input-texto`, `boton` | Lista de pasos con **botones subir/bajar** (`keyboard_arrow_up/down`) — no solo arrastrar — para teclado y táctil |
| `app-vista-previa-articulo` | Organismo | `tarjeta`, `linea de pasos` | Conmutador "Ver como: Personal asistencial / Técnico". En modo asistencial **oculta** `causaRaiz` y `notasTecnicas` y aplica lenguaje asistencial |
| `app-dialogo-confirmacion-defensiva` | Organismo | `dialogo-base` | Para **archivar** o **cambiar a público** (Patrón UX 4): escribir `CONFIRMAR` |
| `pagina-estandar`, `app-tabla-responsiva`, `app-paginador`, `app-buscador-debounce`, `app-aviso-banner`, `app-esqueleto` | — | de las olas 4 y 6 | El módulo se construye **solo** ensamblando piezas existentes |

**Validador anti-fuga de jerga (Regla de Oro aplicada al editor):**
```ts
// compartido/utilidades/validadores-vocabulario.ts
import { TERMINOS_PROHIBIDOS_GLOBAL, TERMINOS_PROHIBIDOS_USUARIO_FINAL } from './vocabulario-asistencial';
export function sinJergaParaPublico(visibilidad: () => VisibilidadArticulo): ValidatorFn {
  return (c) => {
    if (visibilidad() !== 'PUBLICO_ASISTENCIAL') return null;
    const t = String(c.value ?? '');
    const hit = [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL].find(r => r.test(t));
    return hit ? { jergaTecnica: { termino: t.match(hit)![0] } } : null;
  };
}
```
Se aplica a `titulo`, `sintoma`, `solucionTemporal` y cada paso cuando la visibilidad es `PUBLICO_ASISTENCIAL`; el error se muestra con `app-campo-formulario`: *"Este texto lo verá personal asistencial: evite el término «SLA»."*

### 6.5 Rutas, guardas y menú

```ts
// app.routes.ts (dentro del shell autenticado)
{ path: 'conocimiento', canActivate: [rolGuard],
  data: { roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR] },
  loadChildren: () => import('./funcionalidades/conocimiento/conocimiento.routes').then(m => m.CONOCIMIENTO_ROUTES) },
// conocimiento.routes.ts
[{ path: '', providers: CONOCIMIENTO_PROVIDERS, children: [
  { path: '', title: 'Mesa de Ayuda · Centro de Soluciones', loadComponent: () => import('./paginas/mantenimiento-conocimiento/…') },
  { path: 'nuevo', … editor-articulo }, { path: ':id', … editor-articulo } ]}]
```
`menu-lateral`: añadir **"Centro de Soluciones"** (ícono `menu_book`) a `PRACTICANTE` y `ADMINISTRADOR`; el `USUARIO_FINAL` conserva "Ayuda rápida" (`/portal/ayuda`). Actualizar la prueba de `menu-lateral` (esperan rutas exactas) **en el mismo commit**.

### 6.6 Backlog sugerido de Fase 4 (editorial) — tras completar las Olas 0–6

| # | Tarea | Quién | Aceptación (resumen) |
|---|---|---|---|
| 4.1 | Extender modelos y mappers (§6.1) + mock con 8 artículos (4 públicos, 4 técnicos, 2 borradores) | Obrero | Specs de mapper; compilación sin tocar mocks existentes |
| 4.2 | `ConocimientoApi` Mock/Http/Providers | Obrero | Spec del mock (filtro por visibilidad/estado; 404) |
| 4.3 | `app-badge-visibilidad`, `app-selector-audiencia`, `app-editor-pasos` | Obrero | A11y (teclado, `aria-*`), 44 px, specs |
| 4.4 | Página `mantenimiento-conocimiento` (`app-tabla-responsiva`) | Obrero | Un DOM por viewport; filtros; esqueleto con silueta |
| 4.5 | Página `editor-articulo` + vista previa por audiencia + validador de jerga | Obrero + Humano | Guardado de borrador local (`borrador-local`) cada 5 s; `sinJergaParaPublico` |
| 4.6 | Diálogo de confirmación defensiva (archivar/publicar) | Obrero | Escribir `CONFIRMAR`; Esc; foco |
| 4.7 | Menú y rutas por rol; prueba de `rolGuard` | Obrero | `USUARIO_FINAL` → `/403` en `/conocimiento` |
| 4.8 | Coordinación Backend: columnas, filtrado por rol, endpoints, `notasTecnicas` solo técnico | Humano (Backend) | Contrato OpenAPI; prueba de integración "público no ve técnico" |
| 4.9 | Enlazar "Usar esta solución en el ticket" a artículos publicados | Obrero | Ya existe el flujo `?solucionId=`; verificar compatibilidad |

---

## 7. Convenciones de commits y ramas (según `GUIA_GIT_Y_COMMITS.md`)

Rama: `refactor/design-system-atomico` (sub-ramas opcionales `refactor/ola-N-…`). PR hacia `develop` con revisión de un compañero. Ejemplos:

```
chore(refactor): registrar linea base de pruebas y capturas
feat(estilos): agregar tokens en tres capas y alias de compatibilidad
refactor(estilos): reemplazar colores fijos por tokens en portal asistencial
refactor(estilos): unificar botones con mixins sin cambiar el DOM
feat(ui): agregar atomo badge-urgencia con doble codificacion
refactor(ui): mover sla-cronometro a organismos
refactor(paginas): usar pagina-estandar en mis-solicitudes
chore(estilos): eliminar alias legados y shims de importacion
docs(ui): documentar jerarquia atomica y tokens
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|:-:|:-:|---|
| Un spec depende de una clase que se renombra | Media | Alto | Tabla de contrato (§5.4), regla "estilos antes que DOM", tests tras cada commit |
| Alias cambian valores y alteran pantallas | Baja | Medio | Alias = valor del *fallback*; 3 excepciones documentadas (§5.7) |
| Modo noche expone bajo contraste en gráficos Chart.js | Media | Medio | Leer tokens en runtime; spec de contraste; revisión manual #8 |
| `git mv` + shim deja imports rotos en IDE del equipo | Baja | Bajo | Codemod + `ng build` por commit |
| Fuentes locales aumentan el bundle | Baja | Bajo | Subconjunto Latin `woff2` (~50 KB Inter var; Material Symbols subset con solo los glifos de `ICONOS`) |
| Alcance inflado (refactor eterno) | Media | Alto | Olas con DoD por ola; Ola 6b y `tabla-responsiva` pueden diferirse sin bloquear Fase 4 |
| Terminología SLA/CMDB para TI aún visible | Alta | Bajo | Decisión del equipo sobre Ola 6b (D6) |

---

## 9. Resumen de entregables por ola (para el tablero del Sprint)

| Ola | Entregable verificable | Riesgo |
|---|---|:-:|
| 0 | `linea-base.md`, scripts guardianes, capturas | Bajo |
| 1 | Tokens 3 capas + alias + fuentes locales + `<title>` | Bajo |
| 2 | 0 hex en SCSS (excepto primitivos/noche) | Medio |
| 3 | Mixins, botones unificados, 44 px, breakpoints | Medio |
| 4 | Átomos nuevos con specs; íconos corregidos | Bajo |
| 5 | Jerarquía `compartido/ui/*` completa; duplicados eliminados | Medio |
| 6 | Páginas con `pagina-estandar`, esqueletos, banners; stylelint en error | Medio |
| 7 | Sin alias ni shims; docs actualizadas | Bajo |
| **F4** | Centro de Soluciones (editorial + visibilidad por rol) construido solo con piezas existentes | — |
