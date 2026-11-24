# Guía de Implementación Frontend para Fernando — Módulos de Cambios y Centro de Soluciones

> **Autor:** Arquitectura de Software — Mesa de Ayuda HSMSI
> **Destinatario:** Fernando (Frontend)
> **Fecha:** 23/11/2026
> **Rama base sugerida:** `main` → crear `feat/cambios-y-centro-soluciones`
> **Estado:** Aprobado para implementación

---

## Índice

1. [Introducción y alcance del trabajo](#1-introducción-y-alcance-del-trabajo)
2. [Reglas no negociables de la arquitectura](#2-reglas-no-negociables-de-la-arquitectura)
3. [Módulo 1 — Solicitudes de Cambio Técnico](#3-módulo-1--solicitudes-de-cambio-técnico)
4. [Módulo 2 — Centro de Soluciones y Guías](#4-módulo-2--centro-de-soluciones-y-guías)
5. [Paso a paso de ejecución (Etapas 1 a 4)](#5-paso-a-paso-de-ejecución-etapas-1-a-4)
6. [Checklist de validación y entrega antes del PR](#6-checklist-de-validación-y-entrega-antes-del-pr)
7. [Anexos: mapa de tokens, íconos y glosario](#7-anexos)

---

## 1. Introducción y alcance del trabajo

### 1.1 Contexto

La Mesa de Ayuda del Hospital Santa María del Socorro (HSMSI) ya tiene funcionando las secciones de administración **Áreas**, **Personal** y **Equipos**. Dentro de esa misma sección (`/administracion`, solo rol `ADMINISTRADOR`) hay dos pantallas que hoy son **maquetas provisionales** y que tú vas a convertir en módulos completos:

| Ruta | Archivo actual | Estado actual |
|---|---|---|
| `/administracion/cambios` | `frontend/src/app/funcionalidades/administracion/cambios/paginas/cambios-lista/` | Tabla estática con 3 filas fijas, banner "Módulo en Desarrollo", colores hexadecimales en el SCSS. **Se reemplaza por completo.** |
| `/administracion/conocimiento` | `frontend/src/app/funcionalidades/administracion/conocimiento/paginas/conocimiento-lista/` | Funcional a medias: lista, búsqueda sin debounce y filtro por ámbito. Tiene 2 defectos (ver §4.1). **Se refactoriza y amplía.** |

Las rutas, los títulos de pestaña y las entradas del menú lateral **ya existen** (`administracion.routes.ts` y `menu-por-rol.config.ts`). No tienes que tocar el menú.

### 1.2 Qué SÍ entra en tu alcance

- Modelos TypeScript, contratos de servicio (`*Api`), servicios Mock en memoria, servicios Http y su registro por `environment.usarMocks`.
- Stores con Signals para cada módulo.
- Todas las páginas, organismos y componentes específicos de ambos módulos.
- Tests unitarios (Vitest, `ng test`) del contrato de servicio, del store y de las reglas de negocio puras.
- Responsividad (escritorio, tablet, móvil) y modo noche.

### 1.3 Qué NO entra en tu alcance

- **Backend Java / SQL Server.** No modificas nada fuera de `frontend/`. Si necesitas un campo o endpoint nuevo, lo anotas en la sección "Notas para backend" de tu PR.
- **Átomos y moléculas compartidas** (`compartido/ui/`). Puedes **usarlos**, pero no cambiar su API. Si un átomo no te alcanza, conversa primero con Arquitectura (ver §2.4).
- El portal asistencial (`/portal/ayuda`) y "Mi turno". Consumen el mismo servicio de conocimiento que tú vas a extender, así que **no puedes romperlos** (ver §4.3).

### 1.4 Resultado esperado

Al finalizar, con `usarMocks: true` el administrador debe poder:

1. **Cambios:** listar, filtrar por estado/impacto/texto, registrar una nueva solicitud con evaluación de impacto asistencial y plan de reversa, ver su detalle y moverla por su ciclo de vida (Borrador → En evaluación → Aprobado/Rechazado → En ejecución → Implementado).
2. **Centro de Soluciones:** buscar guías con debounce, filtrar por categoría con chips, ver la guía en detalle con pasos numerados y precauciones, y crear/editar/eliminar guías.

Con `usarMocks: false` las mismas pantallas deben funcionar contra el backend sin cambiar una sola línea de los componentes.

---

## 2. Reglas no negociables de la arquitectura

> Si una de estas reglas no se cumple, el PR se devuelve. Sin excepciones.

### 2.1 Angular moderno (Standalone + Signals)

El proyecto se escribe con las APIs modernas de Angular (base Angular 19; el repositorio corre con la versión de `frontend/package.json`, que es compatible con todo lo de abajo).

| Regla | ✅ Correcto | ❌ Prohibido |
|---|---|---|
| Componentes standalone | `@Component({ standalone: true, imports: [...] })` | `NgModule` |
| Detección de cambios | `changeDetection: ChangeDetectionStrategy.OnPush` en **todos** los componentes | Default |
| Inyección | `private readonly api = inject(CambiosApi);` | Inyección por constructor |
| Entradas / salidas | `input()`, `input.required()`, `output()`, `model()` | `@Input()`, `@Output()`, `EventEmitter` |
| Estado | `signal()`, `computed()`, `.asReadonly()` | `BehaviorSubject` como estado de pantalla |
| Control de flujo | `@if`, `@else`, `@for (x of lista(); track x.id)`, `@switch` | `*ngIf`, `*ngFor`, `ngSwitch` |
| Imports | Importa solo lo que usas: `DatePipe`, `ReactiveFormsModule`… | `CommonModule` completo |
| Formularios | Reactive Forms tipados (`FormBuilder.nonNullable`) | Template-driven con `ngModel` en formularios grandes |
| Suscripciones | `takeUntilDestroyed()` o `finalize()` en el store | `subscribe` sin cierre en componentes de larga vida |

Convenciones de nombres del repo (respétalas):

- Páginas: `*.page.ts` y clase `XxxPage` (ej. `CambiosListaPage`).
- Componentes: `*.component.ts` y clase `XxxComponent`.
- Selectores con prefijo `app-`.
- Todo en **español** (nombres de archivos, clases, variables, métodos): `cargar()`, `filtrarPorEstado()`, `abrirDetalle()`.

### 2.2 SCSS con tokens corporativos (4 niveles)

Los tokens viven en `frontend/src/estilos/tokens/`:

| Nivel | Archivo | Qué contiene | ¿Lo usas en tus componentes? |
|---|---|---|---|
| N1 Primitivos | `_primitivos.scss` | Hexadecimales crudos (`--prim-guinda-700: #701c1c`) | **Nunca directamente** |
| N2 Semánticos | `_semanticos.scss` + `_tema-noche.scss` | Intención: `--color-primary-base`, `--color-exito-bg`… | **Sí — principal fuente** |
| N3 Componentes genéricos | `_componentes.scss` | `--comp-tarjeta-*`, `--comp-tabla-*`, `--comp-dialogo-*`… | **Sí** |
| N4 Componentes específicos | `:host { --cambio-... }` dentro de tu SCSS | Alias locales de tu componente | **Sí, apuntando a N2/N3** |

**Mapa de colores corporativos → token real a usar** (los nombres `--hsmsi-*` que circulan en conversaciones y en algunos SCSS antiguos **no están definidos** en los tokens; no los uses):

| Concepto corporativo | Valor | Token real que debes usar |
|---|---|---|
| Primario guinda HSMSI | `#701C1C` | `var(--color-primary-base)` (hover: `--color-primary-hover`) |
| Éxito / verde salud | `#1B5E20` | `var(--color-secondary-base)` · fondos: `--color-exito-bg`, texto: `--color-exito-text` |
| Fondo crema anti-fatiga | `#FAF6F0` | `var(--color-bg-app)` / `var(--color-bg-warm)` |
| Superficie de tarjeta | blanco | `var(--color-surface-card)` o `var(--comp-tarjeta-bg)` |
| Texto principal / secundario / tenue | — | `--color-text-main`, `--color-text-secondary`, `--color-text-muted` |
| Bordes | — | `--color-border-subtle`, `--color-border-strong` |
| Aviso / peligro / info | — | `--color-aviso-bg/text/border`, `--color-error-bg/text/border`, `--color-info-bg/text/border` |
| Categorías (chips de guías) | — | `--color-categoria-1` … `--color-categoria-10` |
| Espaciado | — | `--espacio-2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl` |
| Radios / sombras / z-index | — | `--radius-sm/md/lg/xl/pildora`, `--shadow-sm/card/md/lg/modal`, `--z-modal` |
| Transiciones | — | `--transition-fast/normal/slow` |

Reglas duras de estilos:

1. **Cero hexadecimales, `rgb()` ni `rgba()`** en tus `.scss`. Si necesitas una transparencia, usa `color-mix(in srgb, var(--color-primary-base) 15%, transparent)`.
2. **Cero valores de respaldo** tipo `var(--color-text-muted, #64748b)`: esconden errores de tokens.
3. **Modo noche gratis:** si solo usas tokens N2/N3, el tema `[data-tema='noche']` funciona solo. Pruébalo siempre con el alternador de la barra superior.
4. Mixins disponibles (`@use 'estilos/mixins/responsive' as r;`, `a11y`, `boton`, `superficie`).

Ejemplo de N4 bien hecho:

```scss
@use 'estilos/mixins/responsive' as r;
@use 'estilos/mixins/a11y' as a11y;

:host {
  // N4 — tokens específicos del componente, siempre apuntando a N2/N3
  --tarjeta-cambio-acento: var(--color-primary-base);
  --tarjeta-cambio-padding: var(--comp-tarjeta-padding);
  display: block;
}

.tarjeta-cambio {
  padding: var(--tarjeta-cambio-padding);
  border-left: 4px solid var(--tarjeta-cambio-acento);

  &[data-impacto='CRITICO'] { --tarjeta-cambio-acento: var(--color-error-border); }
  &[data-impacto='ALTO']    { --tarjeta-cambio-acento: var(--color-aviso-border); }
}
```

### 2.3 Responsividad total

Puntos de corte oficiales (`estilos/mixins/_responsive.scss`): `sm 600px`, `md 768px`, `lg 1024px`, `xl 1280px`. Diseña **mobile-first**: estilos base para móvil y `@include r.desde(md) { ... }` para ampliar.

| Dispositivo | Ancho | Comportamiento esperado |
|---|---|---|
| Móvil | < 768px | Una columna. Listas como **tarjetas**. Filtros colapsados (`app-barra-filtros` ya trae el botón "Filtros" en móvil). Diálogos a pantalla completa. Botones de acción a ancho completo. |
| Tablet | 768 – 1023px | Grid de 2 columnas para tarjetas. Panel de detalle lateral ocupa ~80% del ancho. |
| Escritorio | ≥ 1024px | **Tabla** para cambios; grid de 3 columnas (≥1280px) para guías. Panel lateral de ancho `lg`. |

Obligatorio: objetivos táctiles de **mínimo 44×44px** (`var(--touch-min)`), sin scroll horizontal de página en 360px de ancho, y foco visible (`@include a11y.foco-visible`).

### 2.4 Diseño atómico y Leyes de Gestalt

**Antes de crear cualquier elemento visual, busca si ya existe en `compartido/ui/`.** Catálogo que vas a usar (API real verificada):

| Componente | Selector | API principal |
|---|---|---|
| Botón | `app-boton` | `variante: 'primario'\|'secundario'\|'exito'\|'peligro'\|'outline'\|'fantasma'`, `tamano`, `icono`, `iconoDerecha`, `cargando`, `deshabilitado`, `bloque`, `tipo`, `(alHacerClick)` |
| Botón de ícono | `app-boton-icono` | `icono` (req.), `etiqueta` (req., va a `aria-label`), `variante: 'fantasma'\|'suave'\|'peligro'`, `(alHacerClick)` |
| Ícono | `app-icono` | `nombre` (req.), `tamano: 'xs'..'xl'`, `etiqueta`, `relleno` |
| Insignia | `app-insignia` | `texto` (req.), `tono: 'neutro'\|'exito'\|'aviso'\|'peligro'\|'info'\|'marca'`, `forma`, `icono` |
| Chip de filtro | `app-chip-filtro` | `etiqueta` (req.), `activo`, `conteo`, `icono`, `(alHacerClick)` |
| Tarjeta | `app-tarjeta` | `interactiva`, `acento`, contenido proyectado |
| Esqueleto de carga | `app-esqueleto` | `preset: 'linea'\|'tarjeta-solicitud'\|'fila-tabla'\|'articulo'\|...` |
| Cabecera de página | `app-cabecera-pagina` | `titulo` (req.), `subtitulo`, `icono`; slots `[meta]` y `[acciones]` |
| Barra de filtros | `app-barra-filtros` | `[(busqueda)]` **con debounce incorporado** (`retardoMs`, 300ms), `placeholder`, `filtrosActivos`, `(alLimpiar)`; slots `[filtros]` y `[acciones]` |
| Campo de filtro | `app-campo-filtro` | `etiqueta` (req.), `tipo: 'seleccion'\|'casilla'`, `opciones`, `textoTodos`, `[(valor)]` |
| Campo de formulario | `app-campo-formulario` | `etiqueta`, `paraId`, `requerido`, `ayuda`, `error`; proyecta el `<input>` |
| Dato etiquetado | `app-dato-etiquetado` | `etiqueta` (req.), `valor`, `monoespaciado`, `orientacion` |
| Alerta en línea | `app-alerta-en-linea` | `tono`, `icono`, `descartable`, `(alDescartar)` |
| Estado vacío | `app-estado-vacio` | `mensaje`, `icono` |
| Pestañas | `app-barra-pestanas` | `pestanas` (req.), `[(activa)]` (req.), `etiquetaAccesible` (req.) |
| Diálogo de formulario | `app-dialogo-formulario` | `titulo` (req.), `subtitulo`, `idTitulo`, `(cancelar)`; slots `[cuerpo]` y `[acciones]` |
| Diálogo de confirmación | `app-dialogo-confirmacion` | `titulo`, `mensaje` (req.), `textoConfirmar`, `textoCancelar`, `esPeligroso`, `(confirmar)`, `(cancelar)` |
| Panel de detalle | `app-panel-detalle` | `[(abierto)]`, `titulo` (req.), `subtitulo`, `icono`, `modo: 'lateral'\|'en-linea'`, `ancho: 'sm'\|'md'\|'lg'`, `(alCerrar)`; slot `[acciones]` |
| Línea de tiempo | `app-linea-tiempo-auditoria` | `eventos: ItemAuditoria[]` (req.), `ariaLabel`, `modoTecnico` |
| Plantilla de página | `app-plantilla-pagina` | `anchoMaximo: 'sm'\|'md'\|'lg'\|'completo'`, `conPadding` |

Servicios de núcleo útiles: `NotificacionService` (`exito()`, `error()`) para toasts y `ViewportService` (`esMovil()`, `esDesktop()` como signals).

**Leyes de Gestalt aplicadas (cómo se traducen en tu pantalla):**

| Ley | Aplicación concreta |
|---|---|
| **Proximidad** | Los datos de la ventana programada (inicio, fin, duración) van juntos en un bloque; separados del bloque de impacto con `--espacio-lg`. |
| **Similitud** | Un mismo estado tiene **siempre** el mismo tono e ícono en tabla, tarjeta, detalle y chips (lo garantiza un único archivo `etiquetas-cambio.ts`). |
| **Región común** | Cada sección del formulario (Datos generales, Impacto asistencial, Plan de reversa) dentro de un `fieldset` con fondo `--color-surface-sunken`. |
| **Continuidad** | Pasos de solución numerados en una línea vertical continua; ciclo de vida del cambio como línea de etapas. |
| **Figura-fondo** | Precauciones en `app-alerta-en-linea tono="aviso"`, destacadas sobre el fondo crema. |
| **Cierre / Prägnanz** | Tarjetas con borde y radio consistentes (`--comp-tarjeta-*`), máximo 3 insignias por tarjeta. |

**Si un átomo no existe:** créalo **dentro de tu módulo** (`componentes/`). Solo cuando se demuestre que lo necesitan 2+ módulos se promueve a `compartido/ui/` (con aprobación de Arquitectura).

### 2.5 REGLA DE ORO — Cero vocabulario técnico de marcos de referencia en pantalla

**Nunca** debe aparecer en textos visibles (plantillas, `title`, `aria-label`, `placeholder`, toasts, mensajes de error, títulos de pestaña del navegador): `ITIL`, `ITIL v4`, `KEDB`, `CMDB`, `RFC`, `SLA`, `CAB`, `Change Request`, `Known Error`, `Workaround`, `Rollback`, `Backout`.

| ❌ No escribir | ✅ Escribir |
|---|---|
| RFC / Change Request | **Solicitud de cambio técnico** |
| CAB / Comité de cambios | **Comité de evaluación técnica** |
| Rollback / Backout plan | **Plan de reversa** |
| Plan de contingencia | **Plan de continuidad asistencial** |
| Ventana de cambio | **Horario programado de intervención** |
| Cambio de emergencia | **Cambio urgente** |
| Cambio estándar | **Cambio rutinario** |
| KEDB / Known Error | **Centro de Soluciones** / **Error conocido** |
| Workaround | **Solución temporal** |
| Root cause | **Causa identificada** |
| SLA | **Compromisos de Atención** |
| CMDB | **Catálogo de Equipos y Red** |
| Downtime | **Interrupción del servicio** |

Los nombres internos de código (variables, rutas de API, enums) **sí** pueden ser técnicos, porque el usuario no los ve. Ejemplo: el endpoint `/api/rfc` es aceptable; el texto "RFC-2026-001" en pantalla **no**. Por eso el código visible de un cambio será **`SC-2026-0001`** (Solicitud de Cambio).

Verificación automática antes del PR (debe devolver **cero** resultados):

```bash
cd frontend/src/app/funcionalidades/administracion
grep -rniE "\bITIL\b|\bKEDB\b|\bCMDB\b|\bRFC\b|\bSLA\b|\bCAB\b|rollback|workaround|backout" \
  --include=*.html cambios conocimiento
grep -rniE "'[^']*\b(ITIL|KEDB|CMDB|RFC|SLA|CAB)\b[^']*'" --include=*.ts cambios conocimiento
```

### 2.6 Patrón de servicios desacoplados

Es el mismo patrón que ya usan `prestamos` y `conocimiento`. Cuatro piezas por módulo:

```
servicios/
├── cambios.api.ts            ← 1. Contrato abstracto (abstract class). Los componentes SOLO conocen esto.
├── cambios.mock.ts           ← 2. Implementación en memoria con datos hospitalarios realistas + delay().
├── cambios.http.ts           ← 3. Implementación real con HttpClient + mapper DTO→modelo.
├── cambios.api.contract.ts   ← 4. Batería de tests compartida que deben pasar Mock y Http.
└── cambios.dto.ts / cambios.mapper.ts   (solo si el DTO del backend difiere del modelo)
```

**Registro (la "factory" por entorno):**

```ts
// administracion.providers.ts — añadir junto a Áreas, Personal y Equipos
import { environment } from '../../../environments/environment';
import { CambiosApi } from './cambios/servicios/cambios.api';
import { CambiosMock } from './cambios/servicios/cambios.mock';
import { CambiosHttp } from './cambios/servicios/cambios.http';
import { CambiosStore } from './cambios/estado/cambios.store';
import { GuiasStore } from './conocimiento/estado/guias.store';

export const ADMINISTRACION_PROVIDERS: Provider[] = [
  // ...existentes
  { provide: CambiosApi, useClass: environment.usarMocks ? CambiosMock : CambiosHttp },
  CambiosStore,
  GuiasStore, // ConocimientoApi ya está registrado globalmente en app.config.ts
];
```

Reglas del patrón:

1. **Ningún componente** importa `CambiosMock` ni `CambiosHttp`. Solo `CambiosApi` (o mejor, el store).
2. Los componentes **no llaman a la API**: llaman al **store**. El store llama a la API, maneja `cargando`, errores y notificaciones.
3. El Mock **simula latencia** (`delay(400)`) y **errores reales** (`throwError(() => ({ status: 409, error: { mensaje, campo } }))`) para probar los estados de error de la UI.
4. El Mock **muta su arreglo en memoria** (crear/actualizar/eliminar persisten mientras dure la sesión). Usa `structuredClone` al devolver para no filtrar referencias.
5. Las URLs van en `nucleo/config/api-endpoints.ts`, nunca escritas a mano en el servicio Http.
6. Para desarrollar, cambia **localmente** `usarMocks: true` en `environment.development.ts`. **No subas ese cambio en el PR** salvo que Arquitectura lo pida.

---

## 3. Módulo 1 — Solicitudes de Cambio Técnico

**Propósito de negocio:** que ninguna intervención sobre la infraestructura tecnológica (actualizar el sistema clínico, reiniciar un switch, cambiar un servidor) afecte la atención de pacientes sin haber sido **evaluada, aprobada, programada en horario de menor demanda y con un plan para volver atrás**.

### 3.1 Estructura de carpetas

```
funcionalidades/administracion/cambios/
├── modelos/
│   └── cambios.model.ts                      ← tipos, interfaces, enums
├── utilidades/
│   ├── etiquetas-cambio.ts                   ← textos, tonos e íconos por estado/tipo/impacto (Similitud)
│   ├── flujo-cambio.ts                       ← máquina de estados: transiciones permitidas
│   ├── flujo-cambio.spec.ts
│   ├── validadores-cambio.ts                 ← validadores de formulario (ventana, reversa obligatoria)
│   └── validadores-cambio.spec.ts
├── servicios/
│   ├── cambios.api.ts
│   ├── cambios.mock.ts
│   ├── cambios.mock.spec.ts                  ← ejecuta el contrato contra el Mock
│   ├── cambios.http.ts
│   ├── cambios.dto.ts
│   ├── cambios.mapper.ts
│   └── cambios.api.contract.ts
├── estado/
│   ├── cambios.store.ts
│   └── cambios.store.spec.ts
├── componentes/
│   ├── cambios-resumen/                      ← fila de contadores por estado (chips con conteo)
│   ├── cambios-filtros/                      ← selects de estado, impacto y tipo dentro de app-barra-filtros
│   ├── cambios-tabla/                        ← escritorio (≥1024px)
│   ├── tarjeta-cambio/                       ← móvil/tablet (<1024px)
│   ├── panel-detalle-cambio/                 ← detalle lateral con acciones según estado
│   │   └── secciones/
│   │       ├── seccion-ciclo-cambio/         ← línea de etapas del ciclo de vida
│   │       ├── seccion-impacto-resumen/
│   │       └── seccion-reversa-resumen/
│   ├── dialogo-solicitud-cambio/             ← formulario nuevo/editar (3 secciones)
│   │   └── secciones/
│   │       ├── seccion-datos-generales/
│   │       ├── seccion-impacto-asistencial/
│   │       └── seccion-plan-reversa/
│   └── dialogo-decision-cambio/              ← aprobar / rechazar / cerrar con observación
└── paginas/
    └── cambios-lista/
        ├── cambios-lista.page.ts
        ├── cambios-lista.page.html
        └── cambios-lista.page.scss
```

> Este árbol sigue el mismo criterio que `equipos/` y `personal/` (diálogo con `secciones/`). Mira `equipos/componentes/dialogo-equipo/` como referencia viva.

### 3.2 Modelos TypeScript

Archivo: `cambios/modelos/cambios.model.ts`

```ts
// ─── Enumeraciones (valores internos en MAYÚSCULAS, como en el backend) ───

/** Ciclo de vida de una solicitud de cambio técnico. */
export type EstadoCambio =
  | 'BORRADOR'
  | 'EN_EVALUACION'
  | 'APROBADO'
  | 'EN_EJECUCION'
  | 'IMPLEMENTADO'
  | 'RECHAZADO';

export const ESTADOS_CAMBIO: readonly EstadoCambio[] = [
  'BORRADOR', 'EN_EVALUACION', 'APROBADO', 'EN_EJECUCION', 'IMPLEMENTADO', 'RECHAZADO',
];

/** Naturaleza del cambio. */
export type TipoCambio =
  | 'RUTINARIO'    // Bajo riesgo, procedimiento conocido (ej. cambio de tóner de red, alta de usuario masiva)
  | 'PROGRAMADO'   // Requiere evaluación y horario programado
  | 'URGENTE';     // Corrige una falla que ya afecta la atención; evaluación acelerada

/** Impacto sobre la atención de pacientes. */
export type ImpactoAsistencial = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';

/** Categoría técnica de lo que se interviene. */
export type CategoriaCambio =
  | 'SISTEMA_CLINICO'   // HIS, historia clínica, admisión, farmacia
  | 'RED'               // switches, wifi, enlaces
  | 'SERVIDOR'          // servidores, almacenamiento, respaldos
  | 'EQUIPO_USUARIO'    // PCs, impresoras, periféricos
  | 'SEGURIDAD';        // antivirus, cuentas, accesos

// ─── Estructuras de apoyo ───

export interface AreaAfectada {
  readonly idArea: number;
  readonly nombre: string;           // "Emergencia", "UCI Adultos", "Admisión Central"
  readonly esCritica: boolean;       // Emergencia, UCI, Centro Quirúrgico, Neonatología
}

export interface PasoPlan {
  readonly orden: number;            // 1, 2, 3...
  readonly descripcion: string;
  readonly responsable?: string | null;
  readonly minutosEstimados?: number | null;
}

/** Evaluación de impacto asistencial. */
export interface EvaluacionImpacto {
  readonly nivel: ImpactoAsistencial;
  readonly areasAfectadas: readonly AreaAfectada[];
  readonly requiereInterrupcion: boolean;        // ¿Se cae el servicio?
  readonly minutosInterrupcion: number | null;   // obligatorio si requiereInterrupcion
  readonly serviciosAfectados: readonly string[];// "Registro de admisión", "Impresión de pulseras"
  readonly pacientesPotencialmenteAfectados: string | null; // texto libre: "Pacientes en sala de espera de Emergencia"
  readonly descripcion: string;                  // narrativa del impacto
}

/** Plan de reversa + plan de continuidad asistencial. */
export interface PlanReversa {
  readonly criterioActivacion: string;           // "Si a los 15 min el HIS no permite registrar admisiones"
  readonly pasos: readonly PasoPlan[];           // mínimo 1
  readonly minutosEstimados: number;             // tiempo total para volver al estado anterior
  readonly planContinuidad: string;              // "Admisión registra en formato físico F-ADM-03"
  readonly responsableReversa: string;
}

export interface HorarioProgramado {
  readonly inicioIso: string;                    // ISO 8601
  readonly finIso: string;
}

export interface EventoCambio {
  readonly fechaIso: string;
  readonly usuarioNombre: string;
  readonly estadoAnterior: EstadoCambio | null;
  readonly estadoNuevo: EstadoCambio;
  readonly observacion: string | null;
}

// ─── Modelos de pantalla ───

/** Lo mínimo para la tabla/tarjeta. */
export interface CambioResumen {
  readonly id: number;
  readonly codigo: string;                       // "SC-2026-0007"
  readonly titulo: string;
  readonly tipo: TipoCambio;
  readonly categoria: CategoriaCambio;
  readonly estado: EstadoCambio;
  readonly impacto: ImpactoAsistencial;
  readonly areasAfectadas: readonly string[];    // solo nombres para la lista
  readonly horario: HorarioProgramado | null;    // null en borrador sin programar
  readonly solicitante: string;
  readonly responsableEjecucion: string | null;
  readonly fechaRegistroIso: string;
}

/** Detalle completo para el panel lateral. */
export interface CambioDetalle extends CambioResumen {
  readonly descripcion: string;
  readonly justificacion: string;                // por qué es necesario
  readonly equiposAfectados: readonly string[];  // códigos de inventario: "SW-CORE-01", "SRV-HIS-02"
  readonly idTicketOrigen: number | null;        // ticket que motivó el cambio (opcional)
  readonly evaluacion: EvaluacionImpacto;
  readonly pasosImplementacion: readonly PasoPlan[];
  readonly planReversa: PlanReversa;
  readonly observacionDecision: string | null;   // motivo de rechazo o comentario de aprobación
  readonly resultadoImplementacion: string | null;
  readonly historial: readonly EventoCambio[];
}

/** Lo que envía el formulario (crear / editar borrador). */
export interface CambioFormulario {
  titulo: string;
  tipo: TipoCambio;
  categoria: CategoriaCambio;
  descripcion: string;
  justificacion: string;
  equiposAfectados: string[];
  idTicketOrigen: number | null;
  responsableEjecucion: string | null;
  horario: HorarioProgramado | null;
  evaluacion: {
    nivel: ImpactoAsistencial;
    idsAreasAfectadas: number[];
    requiereInterrupcion: boolean;
    minutosInterrupcion: number | null;
    serviciosAfectados: string[];
    pacientesPotencialmenteAfectados: string | null;
    descripcion: string;
  };
  pasosImplementacion: Omit<PasoPlan, 'orden'>[];   // el orden lo asigna el índice
  planReversa: Omit<PlanReversa, 'pasos'> & { pasos: Omit<PasoPlan, 'orden'>[] };
}

/** Acción de transición de estado. */
export type AccionCambio =
  | 'ENVIAR_EVALUACION'   // BORRADOR → EN_EVALUACION
  | 'APROBAR'             // EN_EVALUACION → APROBADO
  | 'RECHAZAR'            // EN_EVALUACION → RECHAZADO (observación obligatoria)
  | 'DEVOLVER_BORRADOR'   // EN_EVALUACION → BORRADOR (pide correcciones, observación obligatoria)
  | 'INICIAR_EJECUCION'   // APROBADO → EN_EJECUCION
  | 'MARCAR_IMPLEMENTADO';// EN_EJECUCION → IMPLEMENTADO (resultado obligatorio)

export interface TransicionCambio {
  readonly accion: AccionCambio;
  readonly observacion: string | null;
}

export interface FiltroCambios {
  texto: string;
  estado: EstadoCambio | null;
  impacto: ImpactoAsistencial | null;
  tipo: TipoCambio | null;
}

export const FILTRO_CAMBIOS_INICIAL: FiltroCambios = {
  texto: '', estado: null, impacto: null, tipo: null,
};
```

#### 3.2.1 Etiquetas visibles (única fuente de textos — Ley de Similitud)

Archivo: `cambios/utilidades/etiquetas-cambio.ts`

```ts
import { TonoInsignia } from '../../../../compartido/ui/atomos/insignia/insignia.component';
import { EstadoCambio, ImpactoAsistencial, TipoCambio, CategoriaCambio } from '../modelos/cambios.model';

interface Presentacion { readonly texto: string; readonly tono: TonoInsignia; readonly icono: string; }

export const PRESENTACION_ESTADO: Record<EstadoCambio, Presentacion> = {
  BORRADOR:      { texto: 'Borrador',      tono: 'neutro',  icono: 'edit_note' },
  EN_EVALUACION: { texto: 'En evaluación', tono: 'aviso',   icono: 'fact_check' },
  APROBADO:      { texto: 'Aprobado',      tono: 'info',    icono: 'verified' },
  EN_EJECUCION:  { texto: 'En ejecución',  tono: 'marca',   icono: 'engineering' },
  IMPLEMENTADO:  { texto: 'Implementado',  tono: 'exito',   icono: 'task_alt' },
  RECHAZADO:     { texto: 'Rechazado',     tono: 'peligro', icono: 'cancel' },
};

export const PRESENTACION_IMPACTO: Record<ImpactoAsistencial, Presentacion & { ayuda: string }> = {
  BAJO:    { texto: 'Impacto bajo',    tono: 'neutro',  icono: 'check_circle',
             ayuda: 'No afecta la atención de pacientes.' },
  MEDIO:   { texto: 'Impacto medio',   tono: 'info',    icono: 'info',
             ayuda: 'Afecta un servicio de apoyo (ej. impresión, correo) con alternativa disponible.' },
  ALTO:    { texto: 'Impacto alto',    tono: 'aviso',   icono: 'warning',
             ayuda: 'Afecta un servicio asistencial (admisión, farmacia, laboratorio).' },
  CRITICO: { texto: 'Impacto crítico', tono: 'peligro', icono: 'emergency',
             ayuda: 'Afecta áreas críticas: Emergencia, UCI, Centro Quirúrgico o Neonatología.' },
};

export const PRESENTACION_TIPO: Record<TipoCambio, Presentacion> = {
  RUTINARIO:  { texto: 'Rutinario',  tono: 'neutro',  icono: 'sync' },
  PROGRAMADO: { texto: 'Programado', tono: 'info',    icono: 'calendar_today' },
  URGENTE:    { texto: 'Urgente',    tono: 'peligro', icono: 'notification_important' },
};

export const ETIQUETA_CATEGORIA: Record<CategoriaCambio, string> = {
  SISTEMA_CLINICO: 'Sistema clínico (HIS)',
  RED:             'Redes y conectividad',
  SERVIDOR:        'Servidores y respaldos',
  EQUIPO_USUARIO:  'Equipos de usuario',
  SEGURIDAD:       'Seguridad y accesos',
};
```

> Todos los íconos usados en esta guía **ya están registrados** en `compartido/ui/atomos/icono/iconos.ts`. Si usas uno nuevo, regístralo ahí (la maqueta actual usa `event_upcoming` y `construction`, que **no** están registrados; desaparecen con tu refactor).

### 3.3 Reglas de negocio

#### 3.3.1 Máquina de estados

Archivo: `cambios/utilidades/flujo-cambio.ts` (función pura, 100% testeable).

```
                 ENVIAR_EVALUACION             APROBAR               INICIAR_EJECUCION          MARCAR_IMPLEMENTADO
   ┌──────────┐ ─────────────────▶ ┌──────────────┐ ───────▶ ┌──────────┐ ───────────────▶ ┌──────────────┐ ─────────────────▶ ┌──────────────┐
   │ BORRADOR │                     │ EN_EVALUACION│          │ APROBADO │                  │ EN_EJECUCION │                     │ IMPLEMENTADO │
   └──────────┘ ◀───────────────── └──────────────┘          └──────────┘                  └──────────────┘                     └──────────────┘
                 DEVOLVER_BORRADOR         │ RECHAZAR
                                           ▼
                                    ┌───────────┐
                                    │ RECHAZADO │  (terminal)
                                    └───────────┘
```

```ts
import { AccionCambio, EstadoCambio } from '../modelos/cambios.model';

const TRANSICIONES: Record<EstadoCambio, readonly AccionCambio[]> = {
  BORRADOR:      ['ENVIAR_EVALUACION'],
  EN_EVALUACION: ['APROBAR', 'RECHAZAR', 'DEVOLVER_BORRADOR'],
  APROBADO:      ['INICIAR_EJECUCION'],
  EN_EJECUCION:  ['MARCAR_IMPLEMENTADO'],
  IMPLEMENTADO:  [],
  RECHAZADO:     [],
};

const DESTINO: Record<AccionCambio, EstadoCambio> = {
  ENVIAR_EVALUACION: 'EN_EVALUACION',
  APROBAR: 'APROBADO',
  RECHAZAR: 'RECHAZADO',
  DEVOLVER_BORRADOR: 'BORRADOR',
  INICIAR_EJECUCION: 'EN_EJECUCION',
  MARCAR_IMPLEMENTADO: 'IMPLEMENTADO',
};

/** Acciones que exigen escribir una observación. */
export const ACCIONES_CON_OBSERVACION: readonly AccionCambio[] = [
  'RECHAZAR', 'DEVOLVER_BORRADOR', 'MARCAR_IMPLEMENTADO',
];

export function accionesPermitidas(estado: EstadoCambio): readonly AccionCambio[] {
  return TRANSICIONES[estado];
}

export function estadoDestino(estado: EstadoCambio, accion: AccionCambio): EstadoCambio | null {
  return TRANSICIONES[estado].includes(accion) ? DESTINO[accion] : null;
}

export function esEditable(estado: EstadoCambio): boolean {
  return estado === 'BORRADOR';
}
```

Textos de los botones de acción (visibles):

| Acción | Texto del botón | Variante `app-boton` | Confirmación |
|---|---|---|---|
| `ENVIAR_EVALUACION` | "Enviar al comité de evaluación" | `primario` | Sí, simple |
| `APROBAR` | "Aprobar cambio" | `exito` | Sí, con observación opcional |
| `RECHAZAR` | "Rechazar" | `peligro` | Sí, **motivo obligatorio** |
| `DEVOLVER_BORRADOR` | "Solicitar correcciones" | `outline` | Sí, **observación obligatoria** |
| `INICIAR_EJECUCION` | "Iniciar intervención" | `primario` | Sí, simple |
| `MARCAR_IMPLEMENTADO` | "Registrar como implementado" | `exito` | Sí, **resultado obligatorio** |

#### 3.3.2 Validaciones del formulario

Archivo: `cambios/utilidades/validadores-cambio.ts` (validadores de `FormGroup`, puros).

| # | Regla | Cuándo aplica | Mensaje visible |
|---|---|---|---|
| V1 | Título obligatorio, 10–120 caracteres | Siempre | "Describa el cambio en al menos 10 caracteres." |
| V2 | Justificación obligatoria, ≥ 20 caracteres | Siempre | "Explique por qué este cambio es necesario." |
| V3 | Al menos 1 área afectada | Siempre | "Seleccione al menos un área del hospital afectada." |
| V4 | Fin del horario > inicio | Si hay horario | "La hora de fin debe ser posterior a la de inicio." |
| V5 | Inicio en el futuro | Tipo ≠ `URGENTE` | "Programe la intervención en una fecha futura." |
| V6 | Horario obligatorio para enviar a evaluación | Al enviar (no al guardar borrador) | "Defina el horario programado de intervención." |
| V7 | `minutosInterrupcion` obligatorio y > 0 | `requiereInterrupcion = true` | "Indique cuántos minutos se interrumpirá el servicio." |
| V8 | Plan de reversa: criterio + ≥ 1 paso + minutos > 0 | Siempre | "Todo cambio necesita un plan de reversa." |
| V9 | Plan de continuidad asistencial obligatorio | Impacto `ALTO` o `CRITICO` | "Indique cómo seguirá atendiendo el área mientras dure la intervención." |
| V10 | Horario fuera de turno de alta demanda (07:00–19:00) | Impacto `CRITICO` y tipo ≠ `URGENTE` | "Los cambios de impacto crítico deben programarse entre las 19:00 y las 07:00." |
| V11 | Impacto sugerido automáticamente | Si alguna área seleccionada tiene `esCritica` → sugerir `CRITICO` | Mostrar `app-alerta-en-linea tono="aviso"`: "Seleccionó un área crítica. Le sugerimos marcar el impacto como crítico." (no bloquea) |
| V12 | Aviso de reversa larga | `planReversa.minutosEstimados` > duración del horario | Alerta `aviso` (no bloquea): "El tiempo de reversa supera el horario programado." |

> V10 y V11 son reglas de negocio del frontend. **Anótalas en "Notas para backend"** para que el backend las valide también.

### 3.4 Contrato del servicio

Archivo: `cambios/servicios/cambios.api.ts`

```ts
import { Observable } from 'rxjs';
import {
  CambioDetalle, CambioFormulario, CambioResumen, FiltroCambios, TransicionCambio, AreaAfectada,
} from '../modelos/cambios.model';

/** Contrato abstracto de Solicitudes de Cambio Técnico. */
export abstract class CambiosApi {
  abstract listar(filtro?: Partial<FiltroCambios>): Observable<CambioResumen[]>;
  abstract obtener(id: number): Observable<CambioDetalle>;
  abstract crear(formulario: CambioFormulario): Observable<CambioDetalle>;          // nace en BORRADOR
  abstract actualizar(id: number, formulario: CambioFormulario): Observable<CambioDetalle>; // solo BORRADOR → si no, 409
  abstract transicionar(id: number, transicion: TransicionCambio): Observable<CambioDetalle>; // inválida → 409
  abstract eliminar(id: number): Observable<void>;                                    // solo BORRADOR → si no, 409
  abstract listarAreasSeleccionables(): Observable<AreaAfectada[]>;
}
```

Endpoints (añadir a `nucleo/config/api-endpoints.ts` dentro de `admin`). Corresponden a los #55–57 de `docs/matriz_endpoints.md`; los marcados 🆕 hay que acordarlos con backend:

```ts
admin: {
  // ...existentes
  cambios: `${environment.apiUrl}/rfc`,   // ruta interna; NUNCA se muestra en pantalla
},
```

| Método del contrato | HTTP | Ruta |
|---|---|---|
| `listar` | GET | `/api/rfc?texto&estado&impacto&tipo` |
| `obtener` | GET | `/api/rfc/{id}` 🆕 |
| `crear` | POST | `/api/rfc` |
| `actualizar` | PUT | `/api/rfc/{id}` 🆕 |
| `transicionar` | PUT | `/api/rfc/{id}/decision` (body `{ accion, observacion }`) — ampliar a todas las acciones 🆕 |
| `eliminar` | DELETE | `/api/rfc/{id}` 🆕 |
| `listarAreasSeleccionables` | GET | reutiliza `/api/admin/areas` y mapea `esCritica` por nombre (lista de áreas críticas en la utilidad) |

### 3.5 Servicio Mock con datos hospitalarios realistas

Archivo: `cambios/servicios/cambios.mock.ts`. Requisitos:

- `@Injectable()` que `extends CambiosApi`.
- **Mínimo 8 solicitudes**, cubriendo **los 6 estados**, **los 4 impactos** y **los 3 tipos**.
- `delay(400)` en todas las respuestas.
- Reglas de error idénticas a las del backend: `409` si se edita/elimina algo que no es `BORRADOR` o si la transición es inválida; `404` si el id no existe.
- `crear()` genera `codigo` correlativo `SC-2026-00NN`, estado `BORRADOR` y primer evento del historial.
- `transicionar()` usa `estadoDestino()` de `flujo-cambio.ts` (una sola fuente de verdad) y agrega un `EventoCambio` al historial.
- `listar()` filtra por texto **ignorando mayúsculas y tildes** (normaliza con `normalize('NFD').replace(/\p{Diacritic}/gu, '')`) sobre código, título, áreas y solicitante.

Datos semilla sugeridos (úsalos tal cual o amplíalos):

| Código | Título | Tipo | Impacto | Estado | Áreas | Horario |
|---|---|---|---|---|---|---|
| SC-2026-0001 | Actualización del firmware del switch central del Pabellón A | PROGRAMADO | CRITICO | APROBADO | Emergencia, Admisión Central, Laboratorio | 28/11/2026 23:00–01:00 |
| SC-2026-0002 | Mantenimiento preventivo del servidor del sistema de admisión y triaje | PROGRAMADO | ALTO | EN_EVALUACION | Admisión Central, Triaje | 30/11/2026 20:00–22:00 |
| SC-2026-0003 | Reemplazo de fuente de poder en estación de Diagnóstico por Imágenes | URGENTE | ALTO | EN_EJECUCION | Diagnóstico por Imágenes | Hoy, inmediato |
| SC-2026-0004 | Instalación del nuevo controlador para impresoras de pulseras Zebra en Triaje | RUTINARIO | MEDIO | IMPLEMENTADO | Triaje, Emergencia | 15/11/2026 21:00–21:30 |
| SC-2026-0005 | Ampliación de cobertura wifi en hospitalización de Pediatría | PROGRAMADO | BAJO | BORRADOR | Pediatría | sin programar |
| SC-2026-0006 | Migración del módulo de farmacia del sistema clínico a la nueva versión | PROGRAMADO | CRITICO | RECHAZADO (motivo: "Coincide con inventario anual de Farmacia; reprogramar en diciembre") | Farmacia Central, UCI Adultos | 25/11/2026 02:00–05:00 |
| SC-2026-0007 | Renovación del certificado de seguridad del portal de resultados de laboratorio | RUTINARIO | MEDIO | APROBADO | Laboratorio Clínico | 26/11/2026 22:00–22:20 |
| SC-2026-0008 | Cambio de antivirus en estaciones de enfermería de Centro Quirúrgico | PROGRAMADO | ALTO | BORRADOR | Centro Quirúrgico | 02/12/2026 20:00–23:00 |

Ejemplo de un plan de reversa realista (SC-2026-0001):

```ts
planReversa: {
  criterioActivacion:
    'Si a los 15 minutos de reiniciado el switch las estaciones de Emergencia no obtienen dirección IP o el sistema clínico no abre.',
  pasos: [
    { orden: 1, descripcion: 'Cargar la imagen de firmware anterior respaldada en el servidor TFTP.', responsable: 'Ing. Roberto Ramos', minutosEstimados: 10 },
    { orden: 2, descripcion: 'Restaurar la configuración guardada (respaldo del 27/11/2026).', responsable: 'Ing. Roberto Ramos', minutosEstimados: 5 },
    { orden: 3, descripcion: 'Verificar conectividad desde 3 estaciones de Emergencia y 1 de Laboratorio.', responsable: 'Carlos Huamán', minutosEstimados: 10 },
  ],
  minutosEstimados: 25,
  planContinuidad:
    'Emergencia y Admisión registran pacientes en el formato físico F-ADM-03; Laboratorio entrega resultados críticos por teléfono (anexo 210). Se avisa a la jefatura de guardia 30 minutos antes.',
  responsableReversa: 'Ing. Roberto Ramos',
},
```

Áreas críticas (constante en `utilidades/`, usada por mock y V11): `Emergencia`, `UCI Adultos`, `UCI Neonatal`, `Centro Quirúrgico`, `Centro Obstétrico`.

### 3.6 Store

Archivo: `cambios/estado/cambios.store.ts` — mismo estilo que `areas/estado/areas.store.ts`.

```ts
@Injectable()
export class CambiosStore {
  private readonly api = inject(CambiosApi);
  private readonly notificacion = inject(NotificacionService);

  // ── Estado privado
  private readonly _cambios = signal<CambioResumen[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtro = signal<FiltroCambios>(FILTRO_CAMBIOS_INICIAL);
  private readonly _seleccionado = signal<CambioDetalle | null>(null);
  private readonly _cargandoDetalle = signal(false);
  private readonly _guardando = signal(false);
  private readonly _areas = signal<AreaAfectada[]>([]);

  // ── Lectura pública
  readonly cambios = this._cambios.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly seleccionado = this._seleccionado.asReadonly();
  readonly cargandoDetalle = this._cargandoDetalle.asReadonly();
  readonly guardando = this._guardando.asReadonly();
  readonly areas = this._areas.asReadonly();

  // ── Derivados
  readonly vacio = computed(() => !this._cargando() && this._cambios().length === 0);
  readonly filtrosActivos = computed(() => {
    const f = this._filtro();
    return [f.estado, f.impacto, f.tipo].filter((v) => v !== null).length;
  });
  /** Conteo por estado para la fila de resumen (se calcula sobre la lista sin filtrar de estado). */
  readonly conteoPorEstado = computed(() => /* Record<EstadoCambio, number> */);
  readonly accionesDelSeleccionado = computed(() => {
    const s = this._seleccionado();
    return s ? accionesPermitidas(s.estado) : [];
  });

  // ── Comandos
  cargar(): void { /* api.listar(filtro) con finalize(cargando=false); error → _error + notificacion.error */ }
  actualizarFiltro(parcial: Partial<FiltroCambios>): void { /* merge + cargar() */ }
  limpiarFiltros(): void { /* reset + cargar() */ }
  abrirDetalle(id: number): void { /* api.obtener */ }
  cerrarDetalle(): void { this._seleccionado.set(null); }
  cargarAreas(): void { /* una sola vez; cachea */ }
  crear(form: CambioFormulario): Observable<CambioDetalle> { /* tap: insertar al inicio + toast "Solicitud registrada como borrador." */ }
  actualizar(id: number, form: CambioFormulario): Observable<CambioDetalle> { /* tap: reemplazar en lista */ }
  transicionar(id: number, t: TransicionCambio): Observable<CambioDetalle> { /* tap: actualizar lista + seleccionado + toast según acción */ }
  eliminar(id: number): Observable<void> { /* tap: quitar de lista */ }
}
```

Puntos clave:

- **`crear`/`actualizar`/`transicionar`/`eliminar` devuelven `Observable`** para que el diálogo sepa cuándo cerrarse y pueda mostrar errores de campo (409 con `campo`). El store maneja `_guardando` con `finalize`.
- Mensajes de toast (visibles): "Solicitud registrada como borrador.", "Solicitud enviada al comité de evaluación.", "Cambio aprobado.", "Solicitud rechazada.", "Se solicitaron correcciones al responsable.", "Intervención iniciada.", "Cambio registrado como implementado."
- Mensaje de error genérico: "No se pudieron cargar las solicitudes de cambio. Intente nuevamente."

### 3.7 Componentes a construir

#### 3.7.1 `CambiosListaPage` (página contenedora — "smart")

Responsabilidades: inyectar el store, llamar `cargar()` y `cargarAreas()` en `ngOnInit`, orquestar diálogos y panel. **No contiene lógica de negocio ni estilos complejos.**

Estructura de la plantilla:

```html
<app-plantilla-pagina anchoMaximo="completo">
  <app-cabecera-pagina
    titulo="Solicitudes de cambio técnico"
    subtitulo="Evalúe, programe y controle las intervenciones sobre sistemas, red y equipos sin afectar la atención de pacientes."
    icono="change_circle"
  >
    <app-boton acciones icono="add" (alHacerClick)="abrirNuevo()">Nueva solicitud</app-boton>
  </app-cabecera-pagina>

  <app-cambios-resumen
    [conteo]="store.conteoPorEstado()"
    [estadoActivo]="store.filtro().estado"
    (alSeleccionarEstado)="store.actualizarFiltro({ estado: $event })"
  />

  <app-barra-filtros
    placeholder="Buscar por código, título, área o responsable…"
    [busqueda]="store.filtro().texto"
    (busquedaChange)="store.actualizarFiltro({ texto: $event })"
    [filtrosActivos]="store.filtrosActivos()"
    (alLimpiar)="store.limpiarFiltros()"
  >
    <app-cambios-filtros filtros
      [filtro]="store.filtro()"
      (alCambiar)="store.actualizarFiltro($event)" />
  </app-barra-filtros>

  @if (store.cargando()) {
    @for (i of [1, 2, 3, 4]; track i) { <app-esqueleto preset="fila-tabla" /> }
  } @else if (store.error(); as mensaje) {
    <app-alerta-en-linea tono="peligro" icono="error">
      {{ mensaje }}
      <app-boton variante="outline" tamano="sm" icono="refresh" (alHacerClick)="store.cargar()">Reintentar</app-boton>
    </app-alerta-en-linea>
  } @else if (store.vacio()) {
    <app-estado-vacio icono="inbox" mensaje="No hay solicitudes de cambio con los filtros seleccionados." />
  } @else {
    @if (viewport.esDesktop()) {
      <app-cambios-tabla [cambios]="store.cambios()" (alSeleccionar)="store.abrirDetalle($event)" />
    } @else {
      <div class="grid-tarjetas">
        @for (c of store.cambios(); track c.id) {
          <app-tarjeta-cambio [cambio]="c" (alSeleccionar)="store.abrirDetalle(c.id)" />
        }
      </div>
    }
  }

  <app-panel-detalle-cambio ... />
  @if (dialogoAbierto()) { <app-dialogo-solicitud-cambio ... /> }
  @if (accionPendiente(); as accion) { <app-dialogo-decision-cambio ... /> }
</app-plantilla-pagina>
```

> Importante: el slot de `app-cabecera-pagina` se llama **`acciones`** (no `acciones-extra`). Verifica la proyección de contenido de cada componente compartido antes de usarlo.

#### 3.7.2 `CambiosResumenComponent` (molécula)

- Fila horizontal de `app-chip-filtro`, uno por estado + "Todas", con `conteo` y el `icono` de `PRESENTACION_ESTADO`.
- Inputs: `conteo: Record<EstadoCambio, number>`, `estadoActivo: EstadoCambio | null`. Output: `alSeleccionarEstado: EstadoCambio | null`.
- Móvil: scroll horizontal (`overflow-x: auto`, `scroll-snap-type: x mandatory`) sin desbordar la página.
- `role="group"` y `aria-label="Filtrar solicitudes por estado"`.

#### 3.7.3 `CambiosFiltrosComponent` (molécula)

- Tres `app-campo-filtro tipo="seleccion"`: **Estado**, **Impacto asistencial**, **Tipo de cambio**. Opciones construidas desde los mapas de `etiquetas-cambio.ts` (nunca escribas los textos de nuevo).
- Input `filtro`, output `alCambiar: Partial<FiltroCambios>`.

#### 3.7.4 `CambiosTablaComponent` (organismo, escritorio)

Columnas: **Código** (monoespaciado) · **Solicitud** (título + categoría en texto tenue) · **Áreas afectadas** (máx. 2 nombres + "+N") · **Tipo** (`app-insignia`) · **Impacto** (`app-insignia` con ícono) · **Estado** (`app-insignia` con ícono) · **Horario programado** (`dd/MM/yyyy HH:mm` con `DatePipe`; "Sin programar" si null) · **Responsable** · Acción "Ver detalle" (`app-boton-icono icono="visibility" etiqueta="Ver detalle de SC-…"`).

- Usa los tokens `--comp-tabla-*`. Cabecera `position: sticky`.
- Toda la fila es clicable **y** accesible por teclado (`tabindex="0"`, `(keydown.enter)`).
- Filas con impacto `CRITICO` llevan `border-left` con `--color-error-border` (vía `data-impacto`).

#### 3.7.5 `TarjetaCambioComponent` (molécula, móvil/tablet)

```
┌──────────────────────────────────────────┐
│ SC-2026-0001            [● Aprobado]     │  ← código + estado
│ Actualización del firmware del switch…   │  ← título (máx. 2 líneas, line-clamp)
│ [Programado] [⚠ Impacto crítico]         │  ← tipo + impacto
│ 📍 Emergencia, Admisión +1               │
│ 🗓 28/11/2026 · 23:00 – 01:00            │
│ 👤 Ing. Roberto Ramos                    │
└──────────────────────────────────────────┘
```

- Envuelve `app-tarjeta [interactiva]="true"`. Acento izquierdo según impacto.
- Input `cambio: CambioResumen` (requerido), output `alSeleccionar`.
- Grid contenedor: 1 columna < 768px, 2 columnas 768–1023px.

#### 3.7.6 `PanelDetalleCambioComponent` (organismo)

Usa `app-panel-detalle modo="lateral" ancho="lg"`, título = código, subtítulo = título del cambio.

Contenido en `app-barra-pestanas` con 4 pestañas:

| Pestaña | Contenido |
|---|---|
| **Resumen** | Estado, tipo, categoría, solicitante, responsable, horario, justificación, equipos afectados, ticket de origen (con enlace a `/incidentes/{id}` si existe). Usa `app-dato-etiquetado`. `seccion-ciclo-cambio` arriba: las 5 etapas del camino feliz (Borrador → En evaluación → Aprobado → En ejecución → Implementado) marcando la actual; si es `RECHAZADO`, la línea se corta en "En evaluación" con marca de rechazo y el motivo en `app-alerta-en-linea tono="peligro"`. |
| **Impacto asistencial** | Nivel con su ayuda, áreas afectadas (las críticas con ícono `emergency`), ¿interrumpe el servicio? y minutos, servicios afectados, pacientes potencialmente afectados, descripción. |
| **Plan de trabajo y reversa** | Pasos de implementación numerados; bloque "Plan de reversa" con criterio de activación destacado (`aviso`), pasos numerados, tiempo estimado y responsable; bloque "Plan de continuidad asistencial". |
| **Historial** | `app-linea-tiempo-auditoria` mapeando `EventoCambio` → `ItemAuditoria` (`tipoEvento: 'CAMBIO_ESTADO'`, `estadoAnterior/Nuevo` con los **textos** de `PRESENTACION_ESTADO`). |

Slot `[acciones]` del panel: un `app-boton` por cada acción de `store.accionesDelSeleccionado()` (según tabla §3.3.1) + "Editar" y "Eliminar borrador" solo si `esEditable(estado)`.

Mientras `store.cargandoDetalle()`: `app-esqueleto preset="articulo"`.

#### 3.7.7 `DialogoSolicitudCambioComponent` (organismo — formulario nuevo/editar)

Usa `app-dialogo-formulario` (slots `cuerpo` y `acciones`). Título: "Nueva solicitud de cambio técnico" / "Editar solicitud SC-…".

Formulario reactivo tipado, dividido en **3 secciones** (componentes hijos en `secciones/`, cada uno recibe su `FormGroup` por `input.required<FormGroup<...>>()`). En móvil, las secciones se muestran como pasos con `app-barra-pestanas` y botones "Anterior / Siguiente"; en escritorio, apiladas con scroll.

**Sección 1 — Datos generales** (`fieldset` + `legend`)

| Campo | Control | Notas |
|---|---|---|
| Título del cambio | `input text` | V1 |
| Tipo de cambio | radio-cards de 3 opciones con ícono y descripción breve | Rutinario / Programado / Urgente |
| Categoría | `select` | desde `ETIQUETA_CATEGORIA` |
| Descripción | `textarea` (4 filas) | qué se hará |
| Justificación | `textarea` | V2 — "¿Por qué es necesario?" |
| Equipos afectados | input de etiquetas (Enter agrega chip) | códigos de inventario |
| Ticket de origen | `input number` opcional | "N.º de ticket que motivó el cambio (opcional)" |
| Responsable de ejecución | `input text` | |
| Horario programado | dos `input type="datetime-local"` (inicio / fin) + duración calculada en vivo ("Duración: 2 h 00 min") | V4, V5, V6, V10 |
| Pasos de implementación | `FormArray` con agregar / quitar / reordenar (flechas ↑↓) | numeración automática |

**Sección 2 — Evaluación de impacto asistencial**

| Campo | Control | Notas |
|---|---|---|
| Áreas afectadas | lista de casillas agrupadas (críticas primero, con ícono `emergency`) | V3, V11 |
| Nivel de impacto | 4 radio-cards en escala de color (`neutro → info → aviso → peligro`) con el texto de ayuda de `PRESENTACION_IMPACTO` | |
| ¿Requiere interrumpir el servicio? | interruptor sí/no | |
| Minutos de interrupción | `input number` (solo visible si "sí") | V7 |
| Servicios afectados | input de etiquetas | "Registro de admisión", "Impresión de pulseras"… |
| Pacientes potencialmente afectados | `textarea` corto | |
| Descripción del impacto | `textarea` | |

Encima del bloque, un resumen en vivo (`app-alerta-en-linea`) que cambia de tono según el nivel elegido: p. ej. *"Impacto crítico: este cambio requiere plan de continuidad asistencial y debe programarse entre las 19:00 y las 07:00."*

**Sección 3 — Plan de reversa y continuidad asistencial**

| Campo | Control | Notas |
|---|---|---|
| ¿Cuándo se activa la reversa? | `textarea` | V8 — placeholder: "Ej. si a los 15 minutos el sistema clínico no permite registrar admisiones" |
| Pasos de reversa | `FormArray` igual al de implementación | V8 (mín. 1) |
| Tiempo estimado de reversa (min) | `input number` | V8, V12 |
| Responsable de la reversa | `input text` | |
| Plan de continuidad asistencial | `textarea` | V9 — obligatorio si impacto ALTO/CRITICO (el `*` aparece dinámicamente) |

**Botonera (slot `acciones`):**

- "Cancelar" (`fantasma`) → si el formulario está sucio, pedir confirmación con `app-dialogo-confirmacion` ("¿Descartar los cambios no guardados?").
- "Guardar borrador" (`secundario`) → valida V1–V5, V7–V12 (V6 no).
- "Guardar y enviar a evaluación" (`primario`) → valida todo (incluye V6); crea/actualiza y luego `transicionar(ENVIAR_EVALUACION)`.
- Ambos con `[cargando]="store.guardando()"`.

**Comportamiento obligatorio:**

- Errores se muestran **al salir del campo** (`touched`) o al intentar guardar (marca todo como `touched` y enfoca el primer campo inválido; en móvil, salta a la sección que lo contiene).
- Errores 409/400 del servidor con `campo` se asignan al control correspondiente (`control.setErrors({ servidor: mensaje })`); sin `campo`, `app-alerta-en-linea tono="peligro"` arriba del formulario.
- `Escape` cierra (lo resuelve `app-dialogo-formulario`), con la misma confirmación de "sucio".

#### 3.7.8 `DialogoDecisionCambioComponent` (molécula)

Diálogo pequeño reutilizado por todas las acciones. Inputs: `accion: AccionCambio`, `cambio: CambioResumen`. Muestra el título según la acción ("¿Aprobar el cambio SC-2026-0002?"), un `textarea` de observación (obligatorio si la acción está en `ACCIONES_CON_OBSERVACION`, con etiqueta adecuada: "Motivo del rechazo", "Correcciones solicitadas", "Resultado de la intervención") y botones. Output `alConfirmar: TransicionCambio`.

> Para confirmaciones sin observación (`ENVIAR_EVALUACION`, `INICIAR_EJECUCION`) puedes usar directamente `app-dialogo-confirmacion` (input correcto para el estilo de peligro: **`[esPeligroso]="true"`**).

---

## 4. Módulo 2 — Centro de Soluciones y Guías

**Propósito de negocio:** que el personal técnico (y, para las guías públicas, el personal asistencial desde el portal) resuelva rápido las fallas recurrentes —impresora de pulseras atascada, el sistema clínico que no abre, sin red en un consultorio— siguiendo pasos claros y seguros.

### 4.1 Punto de partida: qué existe y qué hay que corregir

Ya existe (y **se reutiliza**, no se duplica):

| Pieza | Ubicación | Quién más la usa |
|---|---|---|
| `ConocimientoApi` (contrato) | `compartido/servicios/conocimiento/conocimiento.api.ts` | Portal asistencial, Mi turno, diálogo "Resolver ticket" |
| `ConocimientoMock` / `ConocimientoHttp` | misma carpeta | — |
| Registro por `usarMocks` | `conocimiento.providers.ts` (global en `app.config.ts`) | — |
| Modelo `ArticuloConocimiento` | `compartido/modelos/articulo-conocimiento.model.ts` | Todos los anteriores |
| Página `ConocimientoListaPage` y `DialogoArticuloEditorComponent` | `funcionalidades/administracion/conocimiento/` | — |

Defectos detectados en la página actual que **debes corregir**:

1. **El botón "Nueva Guía" no se ve:** se proyecta con `<div acciones-extra>`, pero `app-cabecera-pagina` solo proyecta `[acciones]` y `[meta]`.
2. **El diálogo de eliminación no se pinta como peligroso:** usa `tipo="peligro"`, pero el input real de `app-dialogo-confirmacion` es `esPeligroso`.
3. Búsqueda sin debounce (filtra en cada tecla), filtro solo por ámbito (no por categoría), botones con clases propias en vez de `app-boton`, spinner propio en vez de `app-esqueleto`, `rgba(...)` y valores de respaldo hexadecimales en el SCSS, `--espacio-3xl` que no existe en los tokens.
4. La lógica de estado está en la página; debe moverse a un `GuiasStore`.
5. No hay vista de detalle dentro de administración: solo un enlace al portal.

### 4.2 Estructura de carpetas

```
funcionalidades/administracion/conocimiento/
├── modelos/
│   └── guias.model.ts                         ← categorías, filtro, vista de detalle
├── utilidades/
│   ├── categorias-guia.ts                     ← catálogo de 5 categorías (texto, ícono, color)
│   ├── busqueda-guias.ts                      ← normalización y puntuación de coincidencias (pura)
│   └── busqueda-guias.spec.ts
├── estado/
│   ├── guias.store.ts
│   └── guias.store.spec.ts
├── componentes/
│   ├── buscador-guias/                        ← barra de búsqueda + chips de categoría + ámbito
│   ├── chips-categorias/                      ← fila de app-chip-filtro con conteo
│   ├── tarjeta-guia/                          ← tarjeta del grid
│   ├── lista-guias/                           ← grid/lista + estados cargando/vacío/error
│   ├── detalle-guia/                          ← vista paso a paso (dentro de app-panel-detalle)
│   │   └── secciones/
│   │       ├── seccion-sintoma-causa/
│   │       ├── seccion-pasos-solucion/
│   │       └── seccion-precauciones/
│   └── dialogo-articulo-editor/               ← EXISTENTE: ampliar (categoría, pasos, precauciones)
└── paginas/
    └── conocimiento-lista/                    ← EXISTENTE: refactorizar a página "smart" delgada
```

Y **fuera** de tu carpeta, cambios mínimos y retrocompatibles en:

```
compartido/modelos/articulo-conocimiento.model.ts      ← añadir campos OPCIONALES
compartido/servicios/conocimiento/conocimiento.api.ts  ← añadir 1 método nuevo
compartido/servicios/conocimiento/conocimiento.mock.ts ← datos con las 5 categorías + nuevos campos
compartido/servicios/conocimiento/conocimiento.http.ts ← implementar el método nuevo
compartido/servicios/conocimiento/conocimiento.api.contract.ts  ← NUEVO (tests de contrato)
```

### 4.3 Modelos TypeScript

#### 4.3.1 Ampliación retrocompatible de `ArticuloConocimiento`

**Regla:** solo se **añaden campos opcionales**. No se renombra ni se cambia el tipo de ningún campo existente (`pasos: string[]` sigue igual), porque el portal y Mi turno dependen de ellos.

```ts
// compartido/modelos/articulo-conocimiento.model.ts — añadir:
export type NivelDificultad = 'BASICO' | 'INTERMEDIO' | 'AVANZADO';

export interface ArticuloConocimiento {
  // ...campos existentes sin tocar...
  precauciones?: string[];          // advertencias de seguridad del paciente / del equipo
  nivelDificultad?: NivelDificultad;
  minutosEstimados?: number;        // tiempo aproximado para aplicar la solución
  requiereTecnico?: boolean;        // si el personal asistencial NO debe intentarlo solo
  autorNombre?: string;
}
```

#### 4.3.2 Modelos propios del módulo

Archivo: `conocimiento/modelos/guias.model.ts`

```ts
import { ArticuloConocimiento } from '../../../../compartido/modelos/articulo-conocimiento.model';

/** Las 5 categorías oficiales del Centro de Soluciones. */
export type CategoriaGuia =
  | 'SISTEMA_CLINICO'     // HIS / Sistema clínico
  | 'IMPRESORAS_TERMICAS' // Impresoras de etiquetas / térmicas
  | 'REDES'               // Redes y conectividad
  | 'HARDWARE'            // Hardware y periféricos
  | 'SOFTWARE_ASISTENCIAL';

export interface DefinicionCategoriaGuia {
  readonly clave: CategoriaGuia;
  readonly id: number;              // categoriaId en backend (confirmar con backend)
  readonly etiqueta: string;
  readonly descripcion: string;
  readonly icono: string;
  readonly colorToken: string;      // nombre del token N2, p. ej. '--color-categoria-1'
}

export type AmbitoGuia = 'TODOS' | 'PUBLICO' | 'INTERNO';

export interface FiltroGuias {
  texto: string;
  categoria: CategoriaGuia | null;
  ambito: AmbitoGuia;
}

export const FILTRO_GUIAS_INICIAL: FiltroGuias = { texto: '', categoria: null, ambito: 'TODOS' };

/** Guía enriquecida para la vista (añade la categoría resuelta). */
export interface GuiaVista extends ArticuloConocimiento {
  readonly categoria: DefinicionCategoriaGuia;
}
```

Archivo: `conocimiento/utilidades/categorias-guia.ts`

```ts
export const CATEGORIAS_GUIA: readonly DefinicionCategoriaGuia[] = [
  { clave: 'SISTEMA_CLINICO',      id: 1, etiqueta: 'Sistema clínico (HIS)',
    descripcion: 'Historia clínica, admisión, citas, farmacia y laboratorio.',
    icono: 'clinical_notes', colorToken: '--color-categoria-1' },
  { clave: 'IMPRESORAS_TERMICAS',  id: 2, etiqueta: 'Impresoras de etiquetas y térmicas',
    descripcion: 'Pulseras de pacientes, etiquetas de muestras y tickets de turno.',
    icono: 'print', colorToken: '--color-categoria-4' },
  { clave: 'REDES',                id: 3, etiqueta: 'Redes y conectividad',
    descripcion: 'Cable de red, wifi, acceso a la red del hospital.',
    icono: 'lan', colorToken: '--color-categoria-2' },
  { clave: 'HARDWARE',             id: 4, etiqueta: 'Hardware y periféricos',
    descripcion: 'Computadoras, monitores, lectores de código, teclados.',
    icono: 'devices', colorToken: '--color-categoria-3' },
  { clave: 'SOFTWARE_ASISTENCIAL', id: 5, etiqueta: 'Software asistencial',
    descripcion: 'Visores de imágenes, ofimática, correo y aplicaciones de apoyo.',
    icono: 'monitor_heart', colorToken: '--color-categoria-5' },
];

export function categoriaPorId(id: number): DefinicionCategoriaGuia { /* fallback a SOFTWARE_ASISTENCIAL */ }
```

> En la plantilla, el color se aplica con `[style.--chip-color]="'var(' + cat.colorToken + ')'"` y en el SCSS `border-color: var(--chip-color)`. Así sigue sin haber hexadecimales y el modo noche funciona (los `--color-categoria-*` ya tienen variante nocturna).

### 4.4 Contrato del servicio (ampliación)

Añadir **un** método a `ConocimientoApi` (e implementarlo en Mock y Http):

```ts
/** Lista guías para administración: incluye públicas e internas, con filtros. */
// Ya existe listar(filtros?: FiltrosConocimiento). Reutilízalo con { texto, categoriaId, soloPublicos }.

/** NUEVO: conteo de guías por categoría para los chips. */
abstract contarPorCategoria(): Observable<Record<number, number>>;
```

> Si prefieres no añadir el método, el conteo puede calcularse en el store sobre la lista completa (es lo recomendado mientras el volumen sea < 500 guías). **Decisión de Arquitectura: calcular en el store** y no tocar el contrato salvo para lo indispensable. Es decir: el único cambio obligatorio en `compartido/` es el modelo (campos opcionales) y los datos del mock.

Crea `conocimiento.api.contract.ts` siguiendo `areas/servicios/areas.api.contract.ts`, con al menos: lista no vacía, filtro por texto sin tildes, filtro por categoría, `soloPublicos`, obtener por id, crear, actualizar, eliminar, y 404 al pedir un id inexistente. Ejecútalo contra el Mock en `conocimiento.mock.spec.ts`.

### 4.5 Datos del Mock (realistas, con las 5 categorías)

Actualiza `ARTICULOS_INICIALES` en `conocimiento.mock.ts`: **mínimo 12 guías**, al menos 2 por categoría, mezcla de públicas/internas, con `pasos` y `precauciones`. Reasigna las existentes a las nuevas categorías (ej. "Calibración de impresora térmica de triaje" → `IMPRESORAS_TERMICAS`; "Seguridad y Cuentas" → `SOFTWARE_ASISTENCIAL` o `SISTEMA_CLINICO` según el caso).

| Categoría | Guía sugerida | Ámbito |
|---|---|---|
| Sistema clínico (HIS) | El sistema clínico muestra "sesión expirada" al registrar una admisión | Pública |
| Sistema clínico (HIS) | Liberar una historia clínica bloqueada por otro usuario | Interna |
| Impresoras térmicas | Calibración y desatasco de impresora de pulseras de triaje (Zebra / Xprinter) | Pública |
| Impresoras térmicas | Etiquetas de tubos de laboratorio impresas cortadas o desplazadas | Pública |
| Impresoras térmicas | Reinstalar el controlador de impresora térmica en estación de Admisión | Interna |
| Redes | Restablecer la conexión de red cableada en consultorios | Pública |
| Redes | La tablet de enfermería no se conecta al wifi asistencial | Pública |
| Redes | Diagnóstico de puerto de switch sin enlace (piso y gabinete) | Interna |
| Hardware | El lector de código de barras de Farmacia no lee las recetas | Pública |
| Hardware | Monitor sin señal en estación de enfermería | Pública |
| Software asistencial | El visor de imágenes de Rayos X no abre los estudios | Interna |
| Software asistencial | Restablecer la contraseña de correo institucional | Pública |

Ejemplo completo (patrón a seguir):

```ts
{
  id: 3,
  titulo: 'Etiquetas de tubos de laboratorio impresas cortadas o desplazadas',
  resumen: 'Ajuste de sensor y tamaño de etiqueta en la impresora térmica de toma de muestras.',
  contenidoHtml: '',
  categoriaId: 2,
  categoriaNombre: 'Impresoras de etiquetas y térmicas',
  palabrasClave: ['etiqueta', 'tubo', 'laboratorio', 'muestra', 'cortada', 'zebra'],
  equiposCompatibles: ['Zebra ZD220', 'Zebra GK420t'],
  esPublico: true,
  conteoUtil: 27,
  fechaActualizacion: '2026-11-20T09:00:00Z',
  sintoma: 'El código de barras sale cortado o fuera de la etiqueta del tubo.',
  causaRaiz: 'El sensor de separación no detecta el espacio entre etiquetas tras cambiar de rollo.',
  solucionTemporal: 'Rotular a mano con el número de orden y avisar a Laboratorio.',
  pasos: [
    'Verifique que el rollo instalado sea el de etiquetas de tubo (25 × 50 mm) y no el de pulseras.',
    'Abra la tapa y asegúrese de que las guías laterales toquen el borde del rollo sin apretarlo.',
    'Cierre la tapa y mantenga presionado el botón FEED hasta que la luz parpadee dos veces; suelte.',
    'La impresora avanzará algunas etiquetas en blanco: es la calibración automática.',
    'Imprima una etiqueta de prueba desde el sistema clínico y verifique que el lector la reconozca.',
  ],
  precauciones: [
    'Nunca pegue en un tubo una etiqueta que no pueda leerse: puede causar un error de identificación del paciente.',
    'No use objetos metálicos para retirar etiquetas pegadas en el cabezal.',
  ],
  nivelDificultad: 'BASICO',
  minutosEstimados: 5,
  requiereTecnico: false,
},
```

### 4.6 Store

Archivo: `conocimiento/estado/guias.store.ts`

```ts
@Injectable()
export class GuiasStore {
  private readonly api = inject(ConocimientoApi);
  private readonly notificacion = inject(NotificacionService);

  private readonly _guias = signal<ArticuloConocimiento[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filtro = signal<FiltroGuias>(FILTRO_GUIAS_INICIAL);
  private readonly _seleccionadaId = signal<number | null>(null);
  private readonly _guardando = signal(false);

  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filtro = this._filtro.asReadonly();
  readonly guardando = this._guardando.asReadonly();

  /** Lista completa enriquecida con su categoría. */
  private readonly guiasVista = computed<GuiaVista[]>(() =>
    this._guias().map((g) => ({ ...g, categoria: categoriaPorId(g.categoriaId) })));

  /** Resultado filtrado y ordenado por relevancia (busqueda-guias.ts). */
  readonly resultados = computed(() => filtrarYOrdenar(this.guiasVista(), this._filtro()));

  /** Conteo por categoría respetando texto y ámbito, pero NO la categoría (para que los chips muestren cuántos hay en cada una). */
  readonly conteoPorCategoria = computed(() => /* Record<CategoriaGuia, number> */);

  readonly seleccionada = computed(() =>
    this.guiasVista().find((g) => g.id === this._seleccionadaId()) ?? null);

  readonly vacio = computed(() => !this._cargando() && this.resultados().length === 0);
  readonly hayFiltros = computed(() => { const f = this._filtro(); return !!f.texto || !!f.categoria || f.ambito !== 'TODOS'; });

  cargar(): void { /* api.listar() una vez; filtrado en memoria */ }
  buscar(texto: string): void { this._filtro.update((f) => ({ ...f, texto })); }
  seleccionarCategoria(c: CategoriaGuia | null): void { /* toggle: si es la misma, null */ }
  seleccionarAmbito(a: AmbitoGuia): void { ... }
  limpiarFiltros(): void { ... }
  abrirDetalle(id: number): void { this._seleccionadaId.set(id); }
  cerrarDetalle(): void { this._seleccionadaId.set(null); }
  crear(p): Observable<ArticuloConocimiento> { ... }
  actualizar(id, p): Observable<ArticuloConocimiento> { ... }
  eliminar(id): Observable<void> { ... }
}
```

#### 4.6.1 Búsqueda reactiva con debounce

**Decisión:** el debounce lo hace `app-barra-filtros` (ya trae `retardoMs = 300` y emite `busquedaChange` debounced). El store recibe el texto ya estabilizado y filtra en memoria con `computed()`. Ventajas: cero suscripciones manuales y la UI no se recalcula en cada tecla.

Si en el futuro la búsqueda debe ir al servidor (volumen alto), el store cambia así, **sin tocar componentes**:

```ts
constructor() {
  toObservable(this._filtro).pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(() => this._cargando.set(true)),
    switchMap((f) => this.api.listar({ texto: f.texto, categoriaId: idDe(f.categoria) })
      .pipe(catchError(() => { this._error.set('...'); return of([]); }))),
    takeUntilDestroyed(),
  ).subscribe((lista) => { this._guias.set(lista); this._cargando.set(false); });
}
```

#### 4.6.2 Algoritmo de búsqueda (`busqueda-guias.ts`, función pura)

1. Normalizar texto y campos: minúsculas + quitar tildes (`normalize('NFD').replace(/\p{Diacritic}/gu, '')`).
2. Separar la consulta en palabras (ignorar las de < 2 letras). **Todas** deben aparecer en algún campo (AND).
3. Puntuar: título ×5, síntoma ×4, palabras clave ×3, equipos compatibles ×2, resumen ×1.
4. Ordenar por puntuación desc.; a igualdad, por `conteoUtil` desc.; sin texto, por `conteoUtil` desc.
5. Aplicar después filtros de categoría y ámbito.

Casos de test mínimos: "impresora" encuentra las térmicas; "admisión" y "admision" dan lo mismo; "zebra pulsera" exige ambas palabras; texto vacío devuelve todo ordenado por utilidad.

### 4.7 Componentes a construir

#### 4.7.1 `ConocimientoListaPage` (refactor a página delgada)

```html
<app-plantilla-pagina anchoMaximo="completo">
  <app-cabecera-pagina
    titulo="Centro de Soluciones y Guías"
    subtitulo="Guías paso a paso para resolver las fallas más frecuentes en sistemas, impresoras, red y equipos del hospital."
    icono="menu_book"
  >
    <app-boton acciones icono="add" (alHacerClick)="abrirNueva()">Nueva guía</app-boton>
  </app-cabecera-pagina>

  <app-buscador-guias
    [filtro]="store.filtro()"
    [conteoPorCategoria]="store.conteoPorCategoria()"
    [hayFiltros]="store.hayFiltros()"
    (alBuscar)="store.buscar($event)"
    (alSeleccionarCategoria)="store.seleccionarCategoria($event)"
    (alSeleccionarAmbito)="store.seleccionarAmbito($event)"
    (alLimpiar)="store.limpiarFiltros()"
  />

  <app-lista-guias
    [guias]="store.resultados()"
    [cargando]="store.cargando()"
    [error]="store.error()"
    [textoBuscado]="store.filtro().texto"
    (alAbrir)="store.abrirDetalle($event)"
    (alEditar)="abrirEditar($event)"
    (alEliminar)="solicitarEliminar($event)"
    (alReintentar)="store.cargar()"
  />

  <app-panel-detalle
    [abierto]="!!store.seleccionada()"
    [titulo]="store.seleccionada()?.titulo ?? ''"
    [subtitulo]="store.seleccionada()?.categoria?.etiqueta"
    icono="menu_book" modo="lateral" ancho="lg"
    (alCerrar)="store.cerrarDetalle()"
  >
    @if (store.seleccionada(); as guia) { <app-detalle-guia [guia]="guia" /> }
    <div acciones> <!-- Editar / Ver en portal (solo públicas) --> </div>
  </app-panel-detalle>

  @if (editorAbierto()) { <app-dialogo-articulo-editor ... /> }
  @if (guiaParaEliminar(); as g) {
    <app-dialogo-confirmacion
      titulo="¿Eliminar esta guía?"
      [mensaje]="'Se eliminará «' + g.titulo + '». El personal ya no podrá consultarla.'"
      textoConfirmar="Sí, eliminar guía"
      [esPeligroso]="true"
      (confirmar)="confirmarEliminacion()" (cancelar)="guiaParaEliminar.set(null)" />
  }
</app-plantilla-pagina>
```

#### 4.7.2 `BuscadorGuiasComponent` (organismo)

- Envuelve `app-barra-filtros` con `placeholder="Describa el problema: «impresora de pulseras», «sin red», «sistema no abre»…"`.
- En el slot `[filtros]`: `app-chips-categorias` + selector de ámbito (3 opciones: "Todas", "Para el personal asistencial", "Uso interno del equipo técnico").
- Debajo, texto de resultados con `aria-live="polite"`: *"12 guías encontradas para «impresora»"*.
- Atajo de teclado: `/` enfoca el buscador (solo escritorio; ignorar si el foco ya está en un campo).

#### 4.7.3 `ChipsCategoriasComponent` (molécula)

- Un `app-chip-filtro` por categoría de `CATEGORIAS_GUIA` + "Todas", con `icono`, `conteo` y `activo`.
- Comportamiento *toggle*: tocar la activa la desactiva.
- Contenedor `role="group" aria-label="Filtrar por categoría"`; móvil con scroll horizontal; escritorio con `flex-wrap`.
- Chips con conteo 0 se muestran atenuados pero **siguen siendo seleccionables** (el usuario entiende por qué no hay resultados).

#### 4.7.4 `ListaGuiasComponent` + `TarjetaGuiaComponent`

`ListaGuiasComponent` resuelve los 4 estados:

| Estado | Qué se muestra |
|---|---|
| Cargando | 6 × `app-esqueleto preset="articulo"` en el mismo grid |
| Error | `app-alerta-en-linea tono="peligro"` + botón "Reintentar" |
| Vacío con búsqueda | `app-estado-vacio icono="search_off"` + "No encontramos guías para «{{texto}}». Pruebe con otras palabras o registre una nueva guía." + botón "Limpiar filtros" |
| Con datos | Grid: 1 col (< 768px), 2 col (768–1279px), 3 col (≥ 1280px) |

`TarjetaGuiaComponent`:

```
┌───────────────────────────────────────────────┐
│ [🖨 Impresoras de etiquetas]  [Asistencial]   │  ← categoría (color) + ámbito
│ Calibración y desatasco de impresora de       │  ← título (2 líneas máx.)
│ pulseras de triaje                            │
│ Síntoma: luz roja parpadeante o papel…        │  ← síntoma (2 líneas máx.)
│ ⏱ 5 min · Básico · 👍 42                      │  ← metadatos
│ ───────────────────────────────────────────── │
│ Actualizado 15/11/2026      [✏] [🗑]          │  ← acciones con app-boton-icono
└───────────────────────────────────────────────┘
```

- La tarjeta completa abre el detalle (`app-tarjeta [interactiva]="true"`); los botones de editar/eliminar usan `$event.stopPropagation()`.
- Si `requiereTecnico`: `app-insignia tono="aviso" icono="engineering" texto="Requiere técnico"`.
- Resalta las coincidencias del texto buscado en el título con `<mark>` (pipe puro `resaltar` dentro del módulo; **escapar HTML** antes de insertar las marcas).

#### 4.7.5 `DetalleGuiaComponent` (organismo — vista paso a paso)

Orden de lectura (Ley de Continuidad, de arriba a abajo):

1. **Cabecera de datos:** categoría, ámbito, dificultad, tiempo estimado, equipos compatibles (chips), última actualización.
2. **`seccion-sintoma-causa`:** "¿Qué está pasando?" (síntoma) y "Causa identificada" (si existe). Usa `app-dato-etiquetado`.
3. **`seccion-precauciones`** — **antes de los pasos**, para que se lean primero: `app-alerta-en-linea tono="aviso" icono="warning"` con título "Antes de empezar" y la lista de precauciones. Si `requiereTecnico`, alerta `peligro`: "Esta solución debe aplicarla personal técnico. Si usted es personal asistencial, reporte el problema a Mesa de Ayuda."
4. **`seccion-pasos-solucion`:** lista ordenada (`<ol>`) con número grande en círculo (fondo `--color-primary-base`, texto `--color-text-on-primary`) unido por una línea vertical (`border-left` en `--color-border-subtle`). Cada paso tiene una casilla **"Hecho"** (estado local con `signal<Set<number>>`, no se guarda) que tacha el paso y avanza una barra `app-barra-progreso` ("3 de 5 pasos completados").
5. **"Solución temporal"** (si existe): bloque `tono="info"` — "Si no puede completar los pasos, mientras tanto:".
6. **Pie de utilidad:** "¿Le sirvió esta guía?" con botones "Sí" / "No" que llaman a `votarUtil(id, esUtil)`; tras votar se muestra "Gracias por su respuesta" y se deshabilitan.
7. Si la guía solo tiene `contenidoHtml` (datos antiguos) y no `pasos`, se muestra el HTML con `[innerHTML]` (Angular lo sanea) como respaldo.

Accesibilidad: cada sección con `<h3>`; la lista de pasos con `aria-label="Pasos de solución"`; las casillas con etiqueta "Marcar paso N como hecho".

#### 4.7.6 `DialogoArticuloEditorComponent` (existente — ampliar)

Añadir al formulario:

- **Categoría:** `select` desde `CATEGORIAS_GUIA` (obligatoria) — escribe `categoriaId` y `categoriaNombre`.
- **Síntoma** (obligatorio, ≥ 10 caracteres) y **Causa identificada** (opcional).
- **Pasos de solución:** `FormArray<FormControl<string>>` con agregar, quitar y reordenar (mín. 1, cada paso ≥ 5 caracteres).
- **Precauciones:** `FormArray` igual (opcional; **obligatorio ≥ 1 si la guía es pública y `requiereTecnico` es falso**: si el personal asistencial la va a aplicar, debe saber qué no hacer).
- **Solución temporal**, **dificultad**, **minutos estimados**, **¿Requiere técnico?**, **¿Visible para el personal asistencial?** (`esPublico`).
- **Vista previa** (pestaña "Vista previa" en el diálogo) que reutiliza `app-detalle-guia` con los datos del formulario.

---

## 5. Paso a paso de ejecución (Etapas 1 a 4)

> Trabaja en **una sola rama** (`feat/cambios-y-centro-soluciones`) con **commits pequeños** siguiendo `docs/guia_git_commits.md` (`feat(cambios): ...`, `refactor(conocimiento): ...`, `test(cambios): ...`). Al cerrar cada etapa, `ng build` y `ng test` deben pasar.
> Para desarrollar: `usarMocks: true` en `environment.development.ts` **solo en local**.

### Etapa 1 — Cimientos: modelos, reglas puras, contratos y mocks (sin UI)

**Objetivo:** que toda la lógica exista y esté probada antes de dibujar un solo botón.

1. Crea la rama desde `main` actualizado.
2. **Cambios:**
   1. `modelos/cambios.model.ts` (§3.2).
   2. `utilidades/etiquetas-cambio.ts` (§3.2.1).
   3. `utilidades/flujo-cambio.ts` + spec: cada estado con sus acciones; transiciones inválidas → `null`; `esEditable` solo en `BORRADOR`.
   4. `utilidades/validadores-cambio.ts` + spec: V4, V5, V7, V8, V9, V10 con casos válidos e inválidos (incluye el borde 19:00 / 07:00).
   5. `servicios/cambios.api.ts`, `cambios.api.contract.ts`, `cambios.mock.ts` (8 solicitudes, §3.5) y `cambios.mock.spec.ts` que ejecuta el contrato.
   6. `servicios/cambios.dto.ts`, `cambios.mapper.ts`, `cambios.http.ts` + endpoint en `api-endpoints.ts`.
   7. Registro en `administracion.providers.ts` con `environment.usarMocks`.
3. **Centro de Soluciones:**
   1. Campos opcionales en `ArticuloConocimiento` (§4.3.1).
   2. `modelos/guias.model.ts` y `utilidades/categorias-guia.ts`.
   3. `utilidades/busqueda-guias.ts` + spec (§4.6.2).
   4. Datos del mock con 12 guías y 5 categorías (§4.5).
   5. `conocimiento.api.contract.ts` + spec contra el Mock.
4. **Verificación de la etapa:** `ng test` en verde; `ng build` sin errores; el portal (`/portal/ayuda`) sigue abriendo guías.
5. Commits sugeridos: `feat(cambios): modelos, flujo de estados y validadores`, `feat(cambios): contrato, mock y servicio http`, `feat(conocimiento): categorias oficiales y busqueda por relevancia`.

### Etapa 2 — Estado (stores) y páginas contenedoras

**Objetivo:** datos fluyendo de punta a punta, aunque la UI sea básica.

1. `CambiosStore` (§3.6) + spec (con el Mock real como `CambiosApi`): `cargar`, filtros, `conteoPorEstado`, `transicionar` actualiza lista y seleccionado, error → `error()`.
2. `GuiasStore` (§4.6) + spec: búsqueda, toggle de categoría, conteos, `seleccionada`.
3. Registra `CambiosStore` y `GuiasStore` en `administracion.providers.ts`.
4. Reescribe `CambiosListaPage`: borra la interfaz local `SolicitudCambioItem`, el arreglo fijo, el banner "Módulo en Desarrollo" y **todo** el SCSS con hexadecimales. Conecta cabecera, barra de filtros y estados cargando/error/vacío.
5. Refactoriza `ConocimientoListaPage`: mueve la lógica al store, corrige el slot `[acciones]` y `[esPeligroso]`, quita `FormsModule`/`CommonModule`, reemplaza spinner y botones propios por `app-esqueleto` y `app-boton`.
6. **Verificación:** con mocks, ambas rutas cargan datos, filtran y muestran estados vacíos/errores (fuerza un error temporal en el mock para verlo y luego quítalo).

### Etapa 3 — Componentes de presentación, formularios y detalle

**Objetivo:** la experiencia completa.

1. **Cambios — lista:** `CambiosResumenComponent`, `CambiosFiltrosComponent`, `CambiosTablaComponent`, `TarjetaCambioComponent`; alternancia tabla/tarjetas con `ViewportService`.
2. **Cambios — detalle:** `PanelDetalleCambioComponent` con sus 4 pestañas y la botonera dinámica según `accionesPermitidas`.
3. **Cambios — formulario:** `DialogoSolicitudCambioComponent` con sus 3 secciones, `FormArray` de pasos, validaciones V1–V12, sugerencia de impacto, guardar borrador / guardar y enviar.
4. **Cambios — decisiones:** `DialogoDecisionCambioComponent`; recorre el ciclo completo con una solicitud nueva: Borrador → En evaluación → Solicitar correcciones → Borrador → En evaluación → Aprobado → En ejecución → Implementado. Repite con un rechazo.
5. **Guías — búsqueda:** `BuscadorGuiasComponent`, `ChipsCategoriasComponent`.
6. **Guías — lista:** `ListaGuiasComponent`, `TarjetaGuiaComponent` con resaltado de coincidencias.
7. **Guías — detalle:** `DetalleGuiaComponent` con secciones, casillas "Hecho", progreso y voto de utilidad.
8. **Guías — editor:** amplía `DialogoArticuloEditorComponent` (§4.7.6) con vista previa.
9. Commits por componente o por grupo coherente.

### Etapa 4 — Pulido: responsividad, modo noche, accesibilidad, vocabulario y pruebas finales

1. **Responsividad:** prueba en DevTools a **360px**, **768px**, **1024px** y **1440px**. Sin scroll horizontal de página; diálogos a pantalla completa en móvil; botones táctiles ≥ 44px.
2. **Modo noche:** recorre todas las pantallas, diálogos y el panel con el tema noche. Nada debe quedar blanco sobre blanco ni con contraste bajo.
3. **Accesibilidad:** navega **solo con teclado** (Tab, Shift+Tab, Enter, Espacio, Escape): abrir detalle, filtrar, crear una solicitud completa y cerrar diálogos. El foco vuelve al elemento que abrió el diálogo. Verifica `aria-label` de todos los `app-boton-icono`.
4. **Vocabulario:** ejecuta los `grep` de §2.5 → **cero resultados**. Revisa también títulos de ruta y toasts.
5. **Estilos:** `grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(" --include=*.scss cambios conocimiento` → **cero resultados**.
6. **Modo real:** vuelve `usarMocks: false` y verifica que la app compila y que los errores de red se muestran amables (sin pantallas rotas).
7. Captura pantallas (escritorio claro, escritorio noche, móvil claro) de: lista de cambios, formulario, detalle de cambio, centro de soluciones, detalle de guía. Van en el PR.
8. Revisa el checklist de §6 y abre el PR hacia `main`.

---

## 6. Checklist de validación y entrega antes del PR

Copia esta lista en la descripción del PR y márcala con honestidad.

### 6.1 Arquitectura y código

- [ ] Todos los componentes son `standalone` con `ChangeDetectionStrategy.OnPush`.
- [ ] Cero `@Input`/`@Output`/`EventEmitter`; solo `input()`, `output()`, `model()`.
- [ ] Cero `*ngIf`/`*ngFor`; solo `@if`/`@for` con `track` por id.
- [ ] Cero inyección por constructor; solo `inject()`.
- [ ] Ningún componente importa `CambiosMock`, `CambiosHttp`, `ConocimientoMock` ni `ConocimientoHttp`.
- [ ] Los componentes de presentación no inyectan servicios de API (solo inputs/outputs); las páginas hablan con el store.
- [ ] Textos de estado/impacto/tipo/categoría salen **solo** de `etiquetas-cambio.ts` y `categorias-guia.ts`.
- [ ] Las URLs están en `api-endpoints.ts`.
- [ ] `ArticuloConocimiento` solo recibió campos **opcionales**; el portal y Mi turno siguen funcionando.
- [ ] No se modificó la API de ningún componente de `compartido/ui/`.
- [ ] `environment.development.ts` **no** se sube con `usarMocks: true` (salvo indicación).
- [ ] Sin `console.log`, código comentado ni `any` injustificado.

### 6.2 Estilos y diseño

- [ ] Cero hexadecimales, `rgb()`/`rgba()` y valores de respaldo en los `.scss` del módulo.
- [ ] Solo tokens N2/N3 (y N4 locales que apuntan a N2/N3).
- [ ] Se reutilizan `app-boton`, `app-boton-icono`, `app-icono`, `app-insignia`, `app-chip-filtro`, `app-tarjeta`, `app-esqueleto`, `app-estado-vacio`, `app-alerta-en-linea`, `app-barra-filtros`, `app-panel-detalle`, `app-dialogo-formulario`, `app-dialogo-confirmacion`, `app-campo-formulario`.
- [ ] Mismo estado = mismo tono e ícono en tabla, tarjeta, detalle y chips.
- [ ] Íconos nuevos (si los hay) registrados en `iconos.ts`.
- [ ] Modo noche revisado en todas las pantallas y diálogos.

### 6.3 Responsividad y accesibilidad

- [ ] Sin scroll horizontal de página en 360px.
- [ ] Cambios: tabla en ≥ 1024px, tarjetas en < 1024px.
- [ ] Guías: grid 1/2/3 columnas en < 768 / 768–1279 / ≥ 1280px.
- [ ] Objetivos táctiles ≥ 44px; foco visible en todo elemento interactivo.
- [ ] Todo operable solo con teclado; `Escape` cierra diálogos y panel; el foco regresa al disparador.
- [ ] `aria-label` en botones de ícono; `aria-live` en el contador de resultados; `fieldset`/`legend` en secciones del formulario.

### 6.4 Vocabulario (Regla de Oro)

- [ ] Los `grep` de §2.5 devuelven **cero** resultados.
- [ ] Ningún código visible tipo "RFC-…" o "CHG-…": se usa `SC-AAAA-NNNN`.
- [ ] Textos de botones, toasts, errores, `placeholder`, `title` y títulos de ruta revisados.

### 6.5 Funcionalidad — Solicitudes de cambio técnico

- [ ] Lista con los 8 casos del mock; filtros por estado (chips y select), impacto, tipo y texto (sin tildes) combinables.
- [ ] Conteo por estado correcto; "Limpiar filtros" restablece todo.
- [ ] Crear borrador y "Guardar y enviar a evaluación" funcionan; el código se genera correlativo.
- [ ] Validaciones V1–V12 verificadas a mano (incluida la sugerencia de impacto crítico y el horario nocturno).
- [ ] Plan de reversa siempre obligatorio; continuidad asistencial obligatoria en ALTO/CRITICO.
- [ ] Solo se puede editar/eliminar en Borrador.
- [ ] Ciclo completo y rechazo recorridos; observación obligatoria donde corresponde; historial actualizado.
- [ ] Estados cargando, vacío y error visibles y con "Reintentar".

### 6.6 Funcionalidad — Centro de Soluciones y Guías

- [ ] Botón "Nueva guía" visible (slot `[acciones]` corregido).
- [ ] Búsqueda con debounce de 300ms; relevancia correcta; "admision" = "admisión"; varias palabras con AND.
- [ ] Chips de las 5 categorías con conteo y toggle; filtro por ámbito.
- [ ] Coincidencias resaltadas sin inyección de HTML.
- [ ] Detalle con precauciones **antes** de los pasos, pasos numerados, casillas "Hecho", progreso, solución temporal y voto de utilidad.
- [ ] Editor con categoría, síntoma, pasos, precauciones y vista previa; crear/editar/eliminar funcionan.
- [ ] Diálogo de eliminación en estilo peligroso (`[esPeligroso]="true"`).

### 6.7 Calidad

- [ ] `ng build` sin errores ni advertencias nuevas.
- [ ] `ng test` en verde: contratos (Mock), `flujo-cambio`, `validadores-cambio`, `busqueda-guias`, `CambiosStore`, `GuiasStore`.
- [ ] Probado con `usarMocks: true` y compilado con `usarMocks: false`.
- [ ] Capturas (claro/noche, escritorio/móvil) adjuntas al PR.
- [ ] Sección **"Notas para backend"** en el PR: endpoints 🆕 de §3.4, reglas V10/V11, campos nuevos opcionales de guías y confirmación de los `categoriaId` 1–5.
- [ ] Commits con el formato de `docs/guia_git_commits.md`.

---

## 7. Anexos

### 7.1 Íconos ya registrados que usarás

| Uso | Ícono |
|---|---|
| Módulo de cambios / Centro de soluciones | `change_circle` / `menu_book` |
| Estados de cambio | `edit_note`, `fact_check`, `verified`, `engineering`, `task_alt`, `cancel` |
| Impacto | `check_circle`, `info`, `warning`, `emergency` |
| Tipo de cambio | `sync`, `calendar_today`, `notification_important` |
| Reversa / horario / responsable | `restart_alt`, `schedule`, `person` |
| Categorías de guías | `clinical_notes`, `print`, `lan`, `devices`, `monitor_heart` |
| Acciones | `add`, `edit`, `delete`, `visibility`, `refresh`, `close`, `search`, `search_off`, `filter_list`, `thumb_up`, `arrow_upward`, `arrow_downward` |

### 7.2 Archivos de referencia en el repo

| Necesitas… | Mira… |
|---|---|
| Un store con Signals | `funcionalidades/administracion/areas/estado/areas.store.ts` |
| Un contrato de tests compartido | `funcionalidades/administracion/areas/servicios/areas.api.contract.ts` |
| Registro Mock/Http por entorno | `funcionalidades/prestamos/prestamos.providers.ts` |
| Un diálogo con secciones | `funcionalidades/administracion/equipos/componentes/dialogo-equipo/` |
| Un formulario con `app-campo-formulario` | `funcionalidades/administracion/areas/componentes/dialogo-area/` |
| Mixins de responsividad | `estilos/mixins/_responsive.scss` |
| Reglas de diseño y vocabulario | `docs/reglas_diseno_y_vocabulario.md` |
| Endpoints | `docs/matriz_endpoints.md` |

### 7.3 Glosario rápido (interno ↔ pantalla)

| En el código | En pantalla |
|---|---|
| `CambiosApi`, `/api/rfc` | Solicitudes de cambio técnico |
| `EN_EVALUACION` | En evaluación (por el comité de evaluación técnica) |
| `planReversa` | Plan de reversa |
| `planContinuidad` | Plan de continuidad asistencial |
| `horario` | Horario programado de intervención |
| `ConocimientoApi`, `/api/kedb` | Centro de Soluciones y Guías |
| `solucionTemporal` | Solución temporal |
| `causaRaiz` | Causa identificada |
| `esPublico` | Para el personal asistencial / Uso interno del equipo técnico |

---

**¿Dudas?** Antes de inventar una solución, pregunta a Arquitectura. Es más barato aclarar una regla que rehacer un componente. ¡Éxitos, Fernando!
