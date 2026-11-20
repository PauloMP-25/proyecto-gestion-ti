
# 📐 Plano Maestro de Refactorización del Frontend: Shell, Catálogo Compartido y Módulos

**Proyecto:** Mesa de Ayuda HSMSI · **Rama:** `refactor/design-system-atomico` · **Stack:** Angular 19 Standalone + Signals + OnPush
**Autor:** Arquitecto de Software · **Ejecutor:** Agente Obrero (Antigravity) · **Fecha:** 2026-11-20

---

## 0. Diagnóstico (línea base medida sobre el código actual)

### 0.1 Componentes con HTML/SCSS dentro del `.ts` (31 archivos, 7.699 líneas)

| Prioridad | Archivo | Líneas |
|---|---|---|
| 🔴 P1 | `administracion/equipos/paginas/equipos-lista/equipos-lista.page.ts` | 1.276 |
| 🔴 P1 | `administracion/areas/paginas/area-detalle/area-detalle.page.ts` | 834 |
| 🔴 P1 | `administracion/personal/componentes/dialogo-personal/dialogo-personal.component.ts` | 679 |
| 🔴 P1 | `administracion/equipos/componentes/dialogo-equipo/dialogo-equipo.component.ts` | 594 |
| 🔴 P1 | `administracion/personal/paginas/personal-lista/personal-lista.page.ts` | 552 |
| 🔴 P1 | `auth/paginas/cambiar-contrasena/cambiar-contrasena.page.ts` | 502 |
| 🔴 P1 | `administracion/areas/paginas/areas-lista/areas-lista.page.ts` | 458 |
| 🟠 P2 | `administracion/areas/componentes/dialogo-area/dialogo-area.component.ts` | 352 |
| 🟠 P2 | `compartido/ui/organismos/tabla-administracion/tabla-administracion.component.ts` | 337 |
| 🟠 P2 | `compartido/ui/moleculas/selector-objetivo-falla/selector-objetivo-falla.component.ts` | 284 |
| 🟠 P2 | `administracion/personal/componentes/dialogo-contrasena-temporal/...component.ts` | 230 |
| 🟠 P2 | `compartido/ui/organismos/dialogo-formulario/...` · `dialogo-confirmacion/...` | 221 · 215 |
| 🟡 P3 | `tarjeta-equipo`, `campo-formulario`, `banner-confirmacion`, `etiqueta-ip`, `selector-rol-simulador`, `usuario-perfil-menu`, `notificacion-toast`, `avatar`, `insignia-grado`, `item-nav`, `semaforo-estado`, `badge-urgencia`, `nivel-insignia`, `marca-hospital`, `spinner`, `info-soporte-pie`, `tarjeta` | 21–160 c/u |

### 0.2 Otras deudas encontradas

| Deuda | Hallazgo |
|---|---|
| **Sin OnPush** | 27 de 111 componentes, entre ellos **todo el shell** (`maquetacion-principal`, `barra-superior`, `menu-lateral`), `login`, `base-conocimiento/*`, `solicitudes/*`, `cabecera-pagina` |
| **Sintaxis legacy** (`*ngIf`, `*ngFor`, `@Input`, `@Output`) | `barra-superior.component.html`, `bandeja-turno.page.html`, `consulta-rapida.page.html`, `tarjeta-calificacion`, `tarjeta-confirmacion-solucion`, `tiene-rol.directive.ts` |
| **Hex hardcodeado** | `equipos-lista.page.ts`, `cambiar-contrasena.page.ts` |
| **Código muerto duplicado** (nadie lo importa) | `compartido/componentes/*` (5 componentes duplicados de `compartido/ui/`) y `panel-control/componentes/kpi-tarjeta` (duplica `ui/moleculas/kpi-tarjeta`) |
| **Moléculas redundantes** | `ui/moleculas/sla-cronometro` y `ui/moleculas/temporizador-sla` cumplen la misma función |
| **Stub vacío** | `ui/moleculas/cabecera-pagina` existe, pero sin inputs ni lógica. Cada página dibuja su propia cabecera |
| **Vocabulario prohibido visible** | 15+ textos: "SLA Restante", "(CMDB)", "Activo CMDB", "MONITOREO DE SLAs", "Niveles SLA", etc. (ver §8) |
| **Lógica de UI en el layout** | `LayoutService` usa `window.innerWidth` en cada clic. El menú por rol es un `switch` gigante dentro de `menu-lateral.component.ts` |
| **Patrones repetidos sin componente** | Cabecera de página, barra de pestañas (`equipos-lista`, `area-detalle`, `cmdb-lista`, `panel-control`), filtros `<select>`, drawer de detalle (`equipos-lista`, `cmdb-lista`), pares etiqueta/valor, barra de ocupación, alerta temporal |

---

## 1. Principios y reglas obligatorias

### 1.1 Terna estricta de archivos
```
<nombre>.component.ts     ← solo lógica (≤ 200 líneas; páginas ≤ 150)
<nombre>.component.html   ← solo plantilla
<nombre>.component.scss   ← solo estilos (≤ 250 líneas)
<nombre>.component.spec.ts← pruebas (opcional por componente, obligatorio en compartido/ui)
```
- Las páginas enrutadas usan el sufijo `.page.ts / .page.html / .page.scss`, como ya se hace hoy.
- **Prohibido:** `template:` y `styles:` en cualquier `@Component`. Se usa siempre `templateUrl` y `styleUrl` (en singular).

### 1.2 Esqueleto canónico de componente
```ts
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-<nombre>',
  imports: [/* solo lo usado */],
  templateUrl: './<nombre>.component.html',
  styleUrl: './<nombre>.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-<nombre>' }        // opcional, para BEM en :host
})
export class <Nombre>Component {
  readonly dato = input.required<Tipo>();
  readonly variante = input<'a' | 'b'>('a');
  readonly seleccionado = model<string | null>(null); // two-way solo cuando aplique
  readonly alAccionar = output<Tipo>();
}
```
- `standalone: true` **se omite** porque es el valor por defecto en Angular 19.
- Se prohíben `CommonModule`, `*ngIf`, `*ngFor`, `[ngClass]` y `@Input/@Output`. En su lugar: `@if`, `@for`, `[class.x]`, `input()`, `output()`, `model()`.
- Los outputs usan el prefijo `al…` (`alBuscar`, `alSeleccionar`), que es la convención que ya existe en `boton` y `chip-filtro`.

### 1.3 Contenedor vs. presentacional (Smart/Dumb)
| Tipo | Dónde vive | Puede `inject()` stores/servicios | Comunicación |
|---|---|---|---|
| **Página (contenedor)** | `funcionalidades/<f>/paginas/<p>/` | ✅ Sí | Orquesta signals y pasa datos hacia abajo |
| **Subcomponente de página** | `paginas/<p>/componentes/<c>/` | ❌ No (solo `input`/`output`) | Presentacional |
| **Componente de feature** | `funcionalidades/<f>/componentes/<c>/` | ⚠️ Solo diálogos con formulario propio | — |
| **Compartido UI** | `compartido/ui/{atomos,moleculas,organismos,plantillas}` | ❌ Nunca importa nada de `funcionalidades/` | 100 % agnóstico del dominio |

### 1.4 Regla de promoción (dónde ubicar un componente nuevo)
1. Lo usa **una sola página** → `paginas/<pagina>/componentes/`.
2. Lo usan **2 o más páginas del mismo feature** → `funcionalidades/<feature>/componentes/`.
3. Lo usan **2 o más features**, o es un patrón visual genérico → `compartido/ui/<nivel>/`.

### 1.5 SCSS y tokens
- Cada `.scss` empieza con `:host { display: block; }` (o `contents`/`flex` según el caso).
- Solo se usan `var(--…)` de N2/N3/N4. Los mixins se importan con `@use 'estilos/mixins' as mx;` (el `includePaths: ["src"]` ya está configurado).
- Si un componente necesita tokens propios, se declaran en `estilos/tokens/_componentes.scss` (N3/N4) con el prefijo del componente: `--barra-pestanas-*`, `--panel-detalle-*`.
- **Cero hex** fuera de `_primitivos.scss`. Los colores dinámicos de datos (ej. `colorIdentificador` de VLAN) se pasan como **custom property**: `[style.--color-vlan]="sub.colorIdentificador"`, nunca como `[style.color]`.
- El modo oscuro se resuelve **solo con tokens**. Prohibido escribir `[data-tema='noche']` dentro de un componente.

### 1.6 Responsividad 100 %
Breakpoints únicos, vía `mixins/_responsive.scss`: `movil < 640`, `tableta 640–1023`, `escritorio ≥ 1024`, `amplio ≥ 1440`.
- Enfoque **mobile-first**.
- Tablas → tarjetas apiladas en `movil`.
- Drawers → hoja inferior (bottom sheet) en `movil`.
- Áreas táctiles de al menos 44×44 px.

---

## 2. Arquitectura de carpetas objetivo

```
src/app/
├── nucleo/
│   └── maquetacion/
│       ├── layout.service.ts                  ← refactor (signals + matchMedia)
│       ├── migas-pan.service.ts               ← NUEVO
│       ├── maquetacion-principal/             ← shell contenedor
│       ├── barra-superior/
│       │   ├── barra-superior.component.{ts,html,scss}
│       │   └── componentes/
│       │       ├── boton-hamburguesa/
│       │       ├── campana-notificaciones/    ← NUEVO
│       │       └── alternador-tema/           ← NUEVO (Día/Noche)
│       ├── menu-lateral/
│       │   ├── menu-lateral.component.{ts,html,scss}
│       │   ├── menu-por-rol.config.ts         ← NUEVO (sale el switch)
│       │   ├── menu.model.ts                  ← ItemMenu, SeccionMenu
│       │   └── componentes/
│       │       ├── menu-grupo/                ← NUEVO
│       │       └── cabecera-menu-movil/       ← NUEVO
│       └── panel-contenido/                   ← NUEVO (migas + router-outlet)
│
├── compartido/
│   ├── componentes/            ← 🗑️ ELIMINAR (código muerto)
│   ├── tuberias/               ← + pipes de etiquetas de dominio genérico
│   └── ui/
│       ├── atomos/      boton, boton-icono*, icono, chip-filtro, estado-etiqueta,
│       │                insignia*, barra-progreso*, etiqueta-ip, avatar, spinner,
│       │                esqueleto, tarjeta, …
│       ├── moleculas/   cabecera-pagina (completar), barra-pestanas*, campo-filtro*,
│       │                dato-etiquetado*, alerta-en-linea*, migas-pan*, kpi-tarjeta,
│       │                estado-vacio, buscador-filtros, item-nav, marca-hospital,
│       │                usuario-perfil-menu, selector-rol-simulador, info-soporte-pie, …
│       ├── organismos/  barra-filtros*, panel-detalle*, tabla-administracion,
│       │                kpi-panel, dialogo-*, notificacion-toast, tabla-tickets, …
│       └── plantillas/  plantilla-layout, plantilla-pagina*
│
└── funcionalidades/<feature>/
    ├── paginas/<pagina>/
    │   ├── <pagina>.page.{ts,html,scss}
    │   └── componentes/<sub>/<sub>.component.{ts,html,scss}
    ├── componentes/       ← compartidos dentro del feature
    ├── estado/  modelos/  servicios/  utilidades/
```
`*` = componente nuevo.

---

## 3. FASE 1: Shell general (Layout, Header, Menú lateral, Panel dinámico)

### 3.1 Árbol de composición objetivo
```
<app-maquetacion-principal>                       (contenedor · OnPush)
└── <app-plantilla-layout>                        (plantilla pura con slots)
    ├── [cabecera] <app-barra-superior>
    │   ├── <app-boton-hamburguesa>      (alAlternar)
    │   ├── <app-marca-hospital subtitulo="Mesa de Ayuda">
    │   ├── <app-selector-rol-simulador> (solo en entorno de desarrollo)
    │   ├── <app-alternador-tema>
    │   ├── <app-campana-notificaciones>
    │   └── <app-usuario-perfil-menu>
    ├── [lateral] <app-menu-lateral>
    │   ├── <app-cabecera-menu-movil>
    │   ├── @for → <app-menu-grupo>
    │   │           └── @for → <app-item-nav>
    │   └── <app-info-soporte-pie>
    └── <app-panel-contenido>
        ├── <app-migas-pan [migas]>
        └── <router-outlet />
```

### 3.2 `LayoutService` (refactor)
```ts
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly consultaMovil = window.matchMedia('(max-width: 1023.98px)');
  readonly esMovil = signal(this.consultaMovil.matches);           // se actualiza con 'change'
  private readonly _abiertoMovil = signal(false);
  private readonly _colapsadoEscritorio = signal(leerPreferencia()); // persiste en localStorage

  readonly sidebarAbierto   = computed(() => this.esMovil() && this._abiertoMovil());
  readonly sidebarColapsado = computed(() => !this.esMovil() && this._colapsadoEscritorio());

  alternarSidebar(): void;
  cerrarSidebarMovil(): void;
}
```
- Al pasar de móvil a escritorio, `_abiertoMovil` se resetea a `false`.
- Con `Escape` se cierra el menú en móvil (listener en `menu-lateral` mediante `host: { '(document:keydown.escape)': … }`).
- Si el `window` no está disponible, se cae a `matches = false` con un guard.

### 3.3 Contratos del shell

| Componente | Ubicación | Inputs | Outputs | Notas |
|---|---|---|---|---|
| `plantilla-layout` | `compartido/ui/plantillas/` | `colapsado: boolean` | — | Slots `[cabecera]`, `[lateral]` y default. CSS Grid: `cabecera` fija arriba; `lateral` 264 px / 72 px colapsado; en móvil el lateral es *off-canvas* |
| `maquetacion-principal` | `nucleo/maquetacion/` | — | — | Único que inyecta `LayoutService` y se lo pasa a la plantilla |
| `barra-superior` | `nucleo/maquetacion/` | — | — | Contenedor: inyecta `AuthService`, `LayoutService` y `TemaService`. **Migrar `*ngIf` → `@if`** |
| `boton-hamburguesa` | `barra-superior/componentes/` | `expandido: boolean` | `alAlternar: void` | Usa `app-boton-icono`; `aria-expanded`, `aria-controls="menu-lateral"` |
| `campana-notificaciones` | `barra-superior/componentes/` | `conteo: number`, `notificaciones: NotificacionResumen[]` | `alAbrir: void`, `alSeleccionar: NotificacionResumen` | Badge con `99+`; panel desplegable; `aria-live` en el conteo. De momento se alimenta con mock |
| `alternador-tema` | `barra-superior/componentes/` | `tema: 'dia' \| 'noche'` | `alCambiar: 'dia' \| 'noche'` | `TemaService` setea `document.documentElement.dataset.tema` y persiste |
| `usuario-perfil-menu` | `compartido/ui/moleculas/` (existe) | `usuario: UsuarioSesion` | `cerrarSesion` → **renombrar a `alCerrarSesion`**, `alCambiarContrasena` | Separar en terna |
| `selector-rol-simulador` | existe | `rolActivo` | `cambioRol` → `alCambiarRol` | Mostrar solo si `!environment.production` |
| `marca-hospital` | existe | `subtitulo`, `modoCompacto` | — | Separar en terna. **El subtítulo del menú móvil pasa de "TI" a "Mesa de Ayuda"** |
| `menu-lateral` | `nucleo/maquetacion/` | — | — | Contenedor: `secciones = computed(() => MENU_POR_ROL[rol()] ?? [])` |
| `menu-por-rol.config.ts` | `menu-lateral/` | — | — | `export const MENU_POR_ROL: Record<RolUsuario, SeccionMenu[]>`. `ItemMenu` agrega `exacto?: boolean`, con lo que desaparece el ternario hardcodeado de rutas |
| `menu-grupo` | `menu-lateral/componentes/` | `seccion: SeccionMenu`, `colapsado: boolean` | `alNavegar: void` | Encabezado `<h3>` que se oculta al colapsar y queda como `aria-label` |
| `item-nav` | existe | `titulo, ruta, icono, badge, badgeTipo, colapsado, exacto` | `clickItem` → `alNavegar` | Separar en terna. Tooltip con `titulo` cuando está colapsado |
| `cabecera-menu-movil` | `menu-lateral/componentes/` | — | `alCerrar: void` | Visible solo en `movil` |
| `info-soporte-pie` | existe | `colapsado` | — | Separar en terna |
| `panel-contenido` | `nucleo/maquetacion/` | — | — | Inyecta `MigasPanService`; contiene `<app-migas-pan>` + `<router-outlet>` |
| `migas-pan` | `compartido/ui/moleculas/` | `migas: Miga[]` | — | `<nav aria-label="Ruta de navegación"><ol>`. En `movil` muestra solo "‹ Anterior" |

### 3.4 Migas de pan (breadcrumbs)
- En `app.routes.ts` y en las rutas hijas se agrega `data: { miga: 'Inventario de equipos y red' }`. Para títulos dinámicos se usa un resolver (`miga: (r) => r.data.area.nombre`).
- `MigasPanService` aplica `toSignal(router.events.pipe(filter(NavigationEnd)))`, recorre `ActivatedRoute.root` hasta la hoja y expone `readonly migas: Signal<Miga[]>`.
```ts
export interface Miga { etiqueta: string; ruta?: string; } // sin ruta = página actual
```

### 3.5 Criterios de aceptación de la Fase 1
- [ ] Ningún archivo del shell tiene `template:`/`styles:`, `*ngIf` ni `CommonModule`; todos tienen OnPush.
- [ ] En 360 px: la hamburguesa abre el *off-canvas*; el backdrop y `Esc` lo cierran; al navegar se cierra.
- [ ] En 1280 px: la hamburguesa colapsa a 72 px y la preferencia persiste tras recargar.
- [ ] El tema noche se aplica sin parpadeo (script inline en `index.html` que lee `localStorage` antes del bootstrap).
- [ ] Las migas aparecen en todas las rutas con `data.miga`.
- [ ] Siguen en verde `menu-lateral.component.spec.ts` y `plantilla-layout.component.spec.ts`.

---

## 4. FASE 2: Catálogo de componentes compartidos (contratos)

> Se aplica a todo componente de esta fase: terna de archivos, OnPush, cero inyección de dominio, `spec.ts` mínimo (render + un input + un output) y responsivo.

### 4.1 Átomos

**`boton-icono`** (nuevo, reemplaza los `.btn-accion` y `.btn-icono` repetidos)
```ts
readonly icono = input.required<string>();
readonly etiqueta = input.required<string>();        // aria-label + title (obligatorio por accesibilidad)
readonly variante = input<'fantasma' | 'suave' | 'peligro'>('fantasma');
readonly tamano = input<'sm' | 'md'>('md');
readonly deshabilitado = input(false);
readonly alHacerClick = output<MouseEvent>();
```

**`insignia`** (nuevo y genérico; reemplaza `insignia-tipo`, `insignia-estado` y `pestana-conteo`)
```ts
readonly texto = input.required<string>();
readonly tono = input<'neutro' | 'exito' | 'aviso' | 'peligro' | 'info' | 'marca'>('neutro');
readonly forma = input<'pildora' | 'cuadrada'>('pildora');
readonly icono = input<string>();
```
> `estado-etiqueta`, `badge-urgencia`, `prioridad-insignia` y `nivel-insignia` se mantienen como **wrappers semánticos** que internamente usan `<app-insignia>`. Así se unifica el estilo sin romper sus usos.

**`barra-progreso`** (nuevo; lo usa la ocupación de subred, los Compromisos de Atención y los KPIs)
```ts
readonly segmentos = input.required<{ valor: number; tono: TonoInsignia; etiqueta: string }[]>();
readonly total = input.required<number>();
readonly etiquetaAccesible = input.required<string>(); // role="progressbar"
```

**Se separan en terna:** `etiqueta-ip`, `avatar`, `insignia-grado`, `semaforo-estado`, `badge-urgencia`, `nivel-insignia`, `spinner`, `tarjeta`.

### 4.2 Moléculas

**`cabecera-pagina`** (completar el stub vacío; hoy cada página la reimplementa)
```ts
readonly titulo = input.required<string>();
readonly subtitulo = input<string>();
readonly icono = input<string>();
readonly nivelTitulo = input<1 | 2>(1);
// Slots: [acciones] (botones a la derecha), [meta] (insignias bajo el título)
```
Comportamiento responsivo: en `movil` el bloque `[acciones]` baja debajo del título y ocupa el 100 % del ancho.

**`barra-pestanas`** (nueva; la repiten `equipos-lista`, `area-detalle`, `cmdb-lista` y `panel-control`)
```ts
export interface Pestana<T extends string = string> {
  id: T; etiqueta: string; icono?: string;
  conteo?: number | string; conteoDestacado?: boolean; deshabilitada?: boolean;
}
readonly pestanas = input.required<readonly Pestana[]>();
readonly activa = model.required<string>();           // [(activa)]="pestanaActiva"
readonly etiquetaAccesible = input.required<string>();
```
Accesibilidad: `role="tablist"`, `role="tab"`, `aria-selected`, navegación con ←/→/Home/End y *roving tabindex*. En `movil` se convierte en scroll horizontal con *snap*.

**`campo-filtro`** (nueva; unifica los `<select class="select-filtro">` y los checkbox de filtro)
```ts
export interface OpcionFiltro<V = unknown> { valor: V; etiqueta: string; }
readonly tipo = input<'seleccion' | 'casilla'>('seleccion');
readonly etiqueta = input.required<string>();          // label visible o aria-label
readonly opciones = input<readonly OpcionFiltro[]>([]);
readonly textoTodos = input<string>('Todos');          // opción con valor null
readonly valor = model<unknown>(null);
```

**`dato-etiquetado`** (nueva; reemplaza `drawer-item`, `subred-info-item` y las fichas de detalle)
```ts
readonly etiqueta = input.required<string>();
readonly valor = input<string | number | null>();
readonly monoespaciado = input(false);
readonly orientacion = input<'vertical' | 'horizontal'>('vertical');
// Slot por defecto: contenido rico en lugar de `valor`
```

**`alerta-en-linea`** (nueva; reemplaza `alerta-copiado` y los avisos de éxito o error de página)
```ts
readonly tono = input<'exito' | 'info' | 'aviso' | 'peligro'>('info');
readonly icono = input<string>();
readonly descartable = input(false);
readonly alDescartar = output<void>();
// Slot por defecto: mensaje. role="status" o "alert" según el tono
```

**`migas-pan`** (ver §3.4).

**Se separan en terna:** `selector-objetivo-falla`, `tarjeta-equipo`, `campo-formulario`, `selector-rol-simulador`, `usuario-perfil-menu`, `item-nav`, `marca-hospital`, `info-soporte-pie`.

**Consolidación:** `sla-cronometro` + `temporizador-sla` → **`cronometro-atencion`** (una sola molécula). Se actualizan los 3 consumidores: `tabla-tickets`, `bandeja-turno` y `ficha-atencion`.

### 4.3 Organismos

**`barra-filtros`** (nueva; contenedor estándar de búsqueda + filtros + acciones)
```ts
readonly busqueda = model<string>('');
readonly placeholder = input<string>('Buscar...');
readonly mostrarBuscador = input(true);
readonly retardoMs = input(300);                       // debounce interno
readonly filtrosActivos = input<number>(0);            // muestra "Limpiar filtros (n)"
readonly alLimpiar = output<void>();
// Slots: [filtros] (app-campo-filtro…), [acciones]
```
En `movil` los filtros se pliegan tras un botón "Filtros (n)" en un panel desplegable.

**`panel-detalle`** (drawer nuevo; reemplaza `drawer-detalle-ip` y el drawer de `cmdb-lista`)
```ts
readonly abierto = model<boolean>(false);
readonly titulo = input.required<string>();
readonly subtitulo = input<string>();
readonly icono = input<string>();
readonly modo = input<'lateral' | 'en-linea'>('lateral');  // en-linea = embebido bajo la matriz
readonly ancho = input<'sm' | 'md' | 'lg'>('md');
// Slots: default (cuerpo), [acciones] (pie)
```
Comportamiento: cierra con `Esc` y con el backdrop, atrapa el foco en modo lateral y devuelve el foco al disparador. En `movil` se muestra como hoja inferior.

**`tabla-administracion`** (existe: **separar en terna** y además)
- Sustituir el buscador interno por `<app-barra-filtros>` (el contrato `busqueda`/`busquedaChange` se mantiene como `model`).
- Agregar `columna.ocultarEnMovil?: boolean` y `columna.alineacion?: 'inicio' | 'fin'`.
- Vista tarjeta en `movil`: cada fila se apila usando `data-etiqueta` de la columna.
- Agregar `paginacion` (input opcional `{ pagina, tamano, total }`) y output `alCambiarPagina`.

**`plantillas/plantilla-pagina`** (nueva; estructura estándar de cualquier página de gestión)
```html
<app-plantilla-pagina>
  <app-cabecera-pagina cabecera … />
  <app-barra-pestanas pestanas … />      <!-- opcional -->
  <app-alerta-en-linea avisos … />       <!-- opcional -->
  <!-- default: contenido -->
</app-plantilla-pagina>
```
Responsable del *gap* vertical, el ancho máximo y el padding responsivo, que hoy cada página repite en su SCSS.

**Se separan en terna:** `dialogo-formulario`, `dialogo-confirmacion`, `notificacion-toast`.

### 4.4 Pipes compartidos (`compartido/tuberias/`)
- `etiquetaEnum` (puro): `{{ item.tipo | etiquetaEnum: ETIQUETAS_TIPO_EQUIPO }}`. Sustituye a los métodos `obtenerEtiquetaTipo/Estado` que hoy se llaman desde las plantillas. Los diccionarios viven en `funcionalidades/<f>/utilidades/etiquetas.ts`.

### 4.5 Limpieza
- 🗑️ Borrar `compartido/componentes/` (5 duplicados) y `panel-control/componentes/kpi-tarjeta/`. **Antes de borrar**, confirmar con `grep -rn "compartido/componentes/" src/` y `grep -rn "panel-control/componentes/kpi-tarjeta" src/` que no queda ningún import.
- Crear `compartido/ui/index.ts` (barrel) **por nivel** (`atomos/index.ts`, etc.) para acortar los imports.

### 4.6 Criterios de aceptación de la Fase 2
- [ ] 0 archivos en `compartido/ui` con `template:` o `styles:`.
- [ ] Cada componente nuevo tiene `spec.ts` en verde.
- [ ] Página de muestra temporal `/dev/catalogo` (solo en desarrollo, fuera del menú) con todos los componentes en día y noche, en 360/768/1280 px.

---

## 5. FASE 3: Módulos específicos (descomposición)

> Orden de ejecución: equipos-lista → areas-lista → area-detalle → personal-lista → diálogos de administración → cambiar-contrasena → cmdb-lista (unificación) → resto P3.

### 5.1 `equipos-lista` (1.276 → ~150 líneas en la página)
```
equipos/
├── utilidades/etiquetas-equipo.ts              ← ETIQUETAS_TIPO, ETIQUETAS_ESTADO
├── componentes/
│   └── matriz-red/                             ← se promueve a feature (también lo usará el Catálogo de Equipos y Red)
│       ├── matriz-red.component.{ts,html,scss}         (presentacional, compone los 5 hijos)
│       ├── selector-vlan/                              tarjetas VLAN
│       ├── resumen-subred/                             dato-etiquetado ×4 + barra-progreso
│       ├── leyenda-matriz/                             estados de IP
│       ├── cuadricula-ips/                             celdas IP clicables
│       └── detalle-ip/                                 contenido del panel-detalle
└── paginas/equipos-lista/
    ├── equipos-lista.page.{ts,html,scss}       (contenedor)
    └── componentes/
        ├── equipos-filtros/                    3 × app-campo-filtro
        └── equipos-tabla/                      tabla-administracion + celdas personalizadas
```

**Contratos:**
| Componente | Inputs | Outputs |
|---|---|---|
| `equipos-filtros` | `areas: AreaResumen[]`, `area: model<number\|null>`, `tipo: model<string\|null>`, `sinIp: model<boolean>` | — (vía `model`) |
| `equipos-tabla` | `equipos: EquipoItem[]`, `cargando`, `vacio`, `busqueda: model<string>` | `alEditar: EquipoItem`, `alCambiarEstado: EquipoItem`, `alRegistrar: void` |
| `matriz-red` | `subredes: SubredCmdb[]`, `vlanSeleccionada: model<number>`, `ips: DireccionIp[]`, `ipSeleccionada: model<DireccionIp\|null>` | `alCopiarIp: string`, `alAsignarIp: DireccionIp` |
| `selector-vlan` | `subredes`, `seleccionada: model<number>` | — |
| `resumen-subred` | `subred: SubredCmdb` | — (los porcentajes son `computed` internos) |
| `leyenda-matriz` | `conteos: Record<EstadoIp, number>` | — |
| `cuadricula-ips` | `ips: DireccionIp[]`, `seleccionada: model<DireccionIp\|null>` | — |
| `detalle-ip` | `ip: DireccionIp` | `alCopiar: string`, `alAsignar: DireccionIp`, `alCerrar: void` |

**Página (contenedor):** conserva `store`, los signals de filtros, el modal y la confirmación. `ipCopiada` usa `alerta-en-linea` con un *timeout* gestionado mediante `DestroyRef`; el `setTimeout` actual no se limpia y se debe corregir. Un `effect()` o `computed` dispara `store.cargar(filtros())` combinando los 4 filtros en un solo `computed<FiltrosEquipo>`, en vez de los 4 métodos `alCambiar*` actuales.

**Plantilla resultante (referencia):**
```html
<app-plantilla-pagina>
  <app-cabecera-pagina cabecera icono="devices" titulo="Inventario de equipos y red"
      subtitulo="Equipamiento hospitalario, direccionamiento IP y trazabilidad por subredes.">
    <app-boton acciones icono="add_to_queue" (alHacerClick)="abrirModalNuevo()">Registrar equipo</app-boton>
  </app-cabecera-pagina>
  <app-barra-pestanas pestanas etiquetaAccesible="Secciones del inventario"
      [pestanas]="pestanas()" [(activa)]="pestanaActiva" />
  @if (ipCopiada(); as ip) { <app-alerta-en-linea avisos tono="exito">IP <strong>{{ ip }}</strong> copiada</app-alerta-en-linea> }

  @switch (pestanaActiva()) {
    @case ('equipos') { <app-equipos-tabla … /> }
    @case ('red')     { <app-matriz-red … /> }
  }
</app-plantilla-pagina>
<app-dialogo-equipo … /> <app-dialogo-confirmacion … />
```

### 5.2 `areas-lista` (458)
```
paginas/areas-lista/componentes/
├── areas-filtros/        campo-filtro (estado, tipo de área)
└── areas-tabla/          tabla-administracion + celdas (insignia-grado, insignia)
```
Página = `plantilla-pagina` + `cabecera-pagina` + `kpi-panel` (si muestra totales) + `areas-tabla`.

### 5.3 `area-detalle` (834)
```
paginas/area-detalle/componentes/
├── ficha-area/                 dato-etiquetado × n (datos generales)
├── area-personal-asignado/     tabla del personal del área
├── area-equipos-asignados/     tabla de equipos del área (reutiliza celdas de equipos vía insignia/etiqueta-ip)
└── area-historial/             línea de tiempo (reutiliza ui/organismos/linea-tiempo-etapas si aplica)
```
Las pestañas pasan a `barra-pestanas`. La cabecera usa `cabecera-pagina` con un slot `[meta]` para el grado y el estado.

### 5.4 `personal-lista` (552)
```
paginas/personal-lista/componentes/
├── personal-filtros/
└── personal-tabla/             celdas: avatar + nombre, rol (insignia), área, estado, acciones (boton-icono)
```

### 5.5 Diálogos de administración (`dialogo-personal` 679, `dialogo-equipo` 594, `dialogo-area` 352, `dialogo-contrasena-temporal` 230)
- Todos montan sobre `ui/organismos/dialogo-formulario`, al que se le separa la terna antes.
- Se dividen en **secciones de formulario** como subcomponentes que reciben un `FormGroup` hijo:
```
componentes/dialogo-personal/
├── dialogo-personal.component.{ts,html,scss}   (FormGroup raíz, guardar/cancelar)
└── secciones/
    ├── seccion-datos-personales/   input: grupo: FormGroup<DatosPersonalesForm>
    ├── seccion-credenciales/
    └── seccion-asignacion-area/
```
- El patrón es el mismo para `dialogo-equipo` (`seccion-identificacion`, `seccion-ubicacion`, `seccion-red`).
- Los validadores se quedan en `administracion/validacion/`, que ya existe.

### 5.6 `cambiar-contrasena` (502)
```
paginas/cambiar-contrasena/componentes/
├── indicador-fortaleza/        input: contrasena → computed nivel (usa barra-progreso)
└── requisitos-contrasena/      input: contrasena → lista de reglas ✓/✗
```
Se eliminan los hex: se sustituyen por los tokens `--color-estado-*`.

### 5.7 `cmdb-lista` (HTML 567 + **SCSS 1.110**): unificación
- Tras el commit `d7d382e`, el inventario se unificó en `equipos-lista`. Hay que **reutilizar `matriz-red` y `panel-detalle`** y eliminar el drawer y la matriz duplicados de `cmdb-lista`.
- El título visible "Gestión de Activos y Conectividad (CMDB)" pasa a **"Catálogo de Equipos y Red"**.
- ⚠️ **Decisión pendiente para el líder:** ¿`/cmdb` redirige a `/administracion/equipos?pestana=red`, o se mantiene como vista de solo lectura para técnicos? Mientras tanto, se refactoriza consumiendo los mismos componentes.

### 5.8 Resto (P3 y P4)
- `bandeja-turno` (SCSS 711) y `reloj-ticket-activo` (SCSS 649): extraer subcomponentes y migrar `*ngIf` → `@if`.
- `tarjeta-calificacion` y `tarjeta-confirmacion-solucion`: `@Input/@Output` → `input()/output()`.
- Los 27 componentes sin OnPush: agregar OnPush y verificar que no muten objetos de entrada.
- `tiene-rol.directive.ts`: migrar a `input()`.

---

## 6. Guía paso a paso para Antigravity

> **Regla de oro de ejecución:** un componente por commit, refactor **sin cambio funcional** (la UI se ve igual salvo las correcciones de vocabulario y responsividad indicadas). Después de cada paso: `ng build` + `ng test` + `npx stylelint "src/**/*.scss"` en verde.

### Paso 0: Preparación
1. Partir de la rama `refactor/design-system-atomico`, actualizada.
2. Guardar capturas de referencia (360/768/1280 px, día/noche) de: shell, equipos-lista, areas-lista, area-detalle, personal-lista, cmdb-lista y cambiar-contrasena.
3. Agregar reglas de bloqueo:
   - `eslint`: `@angular-eslint/prefer-on-push-component-change-detection: error`, `@angular-eslint/component-max-inline-declarations: ["error", { template: 0, styles: 0 }]`, `@angular-eslint/template/prefer-control-flow: error`, `@angular-eslint/prefer-signals`.
   - Script `scripts/verificar-refactor.sh` que falle si encuentra:
     ```bash
     grep -rlE "^\s*(template|styles)\s*:" --include=*.ts src/app
     grep -rlE "\*ngIf|\*ngFor|@Input\(|@Output\(" src/app
     grep -rnE "#[0-9a-fA-F]{3,8}\b" --include=*.scss --include=*.ts --include=*.html src/app
     grep -rnE ">[^<]*\b(ITIL|CMDB|KEDB|RFC|SLA)s?\b[^<]*<" --include=*.html src/app
     ```
4. Commit: `chore(refactor): agregar reglas de lint y script de verificacion`.

### Paso 1: Shell (Fase 1)
| # | Tarea | Commit |
|---|---|---|
| 1.1 | Refactor de `LayoutService` (matchMedia, `computed`, persistencia) + spec | `refactor(layout): migrar layout service a signals con matchmedia` |
| 1.2 | `TemaService` + script anti-parpadeo en `index.html` | `feat(layout): agregar servicio de tema dia/noche` |
| 1.3 | Átomo `boton-icono` | `feat(ui): agregar atomo boton-icono` |
| 1.4 | Separar en terna: `marca-hospital`, `usuario-perfil-menu`, `selector-rol-simulador`, `item-nav`, `info-soporte-pie` (uno por commit) | `refactor(ui): separar <x> en archivos ts/html/scss` |
| 1.5 | `boton-hamburguesa`, `alternador-tema`, `campana-notificaciones` | `feat(barra-superior): modularizar acciones de cabecera` |
| 1.6 | `barra-superior` con OnPush, `@if` y composición nueva | `refactor(barra-superior): componer con subcomponentes y onpush` |
| 1.7 | `menu.model.ts` + `menu-por-rol.config.ts` (mover el switch, agregar `exacto`) | `refactor(menu-lateral): extraer configuracion de menu por rol` |
| 1.8 | `menu-grupo`, `cabecera-menu-movil`; `menu-lateral` con OnPush | `refactor(menu-lateral): modularizar grupos y cabecera movil` |
| 1.9 | `MigasPanService`, `migas-pan`, `panel-contenido`; `data.miga` en las rutas | `feat(layout): agregar panel de contenido con migas de pan` |
| 1.10 | `plantilla-layout` y `maquetacion-principal` con OnPush y la composición final | `refactor(layout): consolidar shell principal` |
| ✅ | Verificar los criterios de §3.5 | — |

### Paso 2: Catálogo (Fase 2)
| # | Tarea |
|---|---|
| 2.1 | Borrar el código muerto (§4.5), previa verificación con grep |
| 2.2 | Átomos nuevos: `insignia`, `barra-progreso`. Adaptar `estado-etiqueta`, `badge-urgencia`, `prioridad-insignia` y `nivel-insignia` como wrappers |
| 2.3 | Moléculas: `cabecera-pagina` (completar), `barra-pestanas`, `campo-filtro`, `dato-etiquetado`, `alerta-en-linea` |
| 2.4 | Organismos: `barra-filtros`, `panel-detalle`; refactor de `tabla-administracion` (terna + barra-filtros + vista móvil + paginación) |
| 2.5 | Plantilla `plantilla-pagina` |
| 2.6 | Pipe `etiquetaEnum` |
| 2.7 | Consolidar `cronometro-atencion` (fusión de `sla-cronometro` y `temporizador-sla`) y actualizar sus 3 consumidores |
| 2.8 | Separar en terna el resto de `compartido/ui` (lista P2/P3 de §0.1) |
| 2.9 | Barrels `index.ts` por nivel + página `/dev/catalogo` |
| ✅ | Criterios de §4.6 |

### Paso 3: Módulos (Fase 3)
Para **cada** página se sigue este micro-procedimiento:
1. **Extraer** el `template` a `.page.html` y los `styles` a `.page.scss` tal cual (commit "mecánico" que no cambia nada visual).
2. **Sustituir** los bloques repetidos por componentes del catálogo (cabecera, pestañas, filtros, alertas, drawer). Borrar el SCSS que queda huérfano.
3. **Extraer** los subcomponentes a `paginas/<p>/componentes/` según §5, empezando por el más profundo (hojas → raíz).
4. **Reemplazar** los métodos de etiqueta por el pipe `etiquetaEnum`.
5. **Verificar:** `verificar-refactor.sh`, build, tests y comparación visual con las capturas del Paso 0.
6. **Commit:** `refactor(<feature>): modularizar <pagina> en subcomponentes`.

Orden: §5.1 → §5.2 → §5.3 → §5.4 → §5.5 → §5.6 → §5.7 → §5.8.

### Paso 4: Cierre
1. `verificar-refactor.sh` sin hallazgos y `ng lint` limpio.
2. Actualizar `docs/refactor/linea-base.md` con las métricas antes y después (§7).
3. Crear un PR hacia `main` con las capturas comparativas.

---

## 7. Métricas de éxito (Definition of Done global)

| Métrica | Hoy | Meta |
|---|---|---|
| Componentes con `template:`/`styles:` inline | 31 | **0** |
| Componentes sin OnPush | 27 | **0** |
| Archivos con `*ngIf`/`*ngFor`/`@Input`/`@Output` | 6 | **0** |
| Archivos con hex fuera de primitivos | 2 | **0** |
| Textos visibles con ITIL/CMDB/SLA/KEDB/RFC | 15+ | **0** |
| `.ts` de componente/página más grande | 1.276 | **≤ 200** |
| `.scss` más grande | 1.110 | **≤ 250** |
| Componentes duplicados o muertos | 7 | **0** |

---

## 8. Correcciones de vocabulario obligatorias

| Archivo | Texto actual | Texto nuevo |
|---|---|---|
| `tabla-tickets.component.html:12,119` | SLA Restante | Tiempo restante de atención |
| `cmdb-lista.component.html:9` | Gestión de Activos y Conectividad (CMDB) | Catálogo de Equipos y Red |
| `bandeja-turno.page.html:290` | Compromiso (SLA) | Compromiso de atención |
| `ficha-atencion.page.html:189` | Compromiso de Atención (SLA) | Compromiso de atención |
| `distribucion-tipo.component.html:4` | Fallas por Activo de Infraestructura CMDB | Fallas por equipo del catálogo |
| `grafico-prioridades.component.html:47` | SLA: {{…}} | Plazo: {{…}} |
| `grafico-sla-cumplimiento.component.html:4` | MONITOREO DE SLAs | Cumplimiento de compromisos de atención |
| `reloj-ticket-activo.component.html:45` | Activo CMDB: | Equipo: |
| `reloj-ticket-activo.component.html:167,185,248` | Ventana / Consumo / cronómetro de SLA | … de atención |
| `panel-control.component.html:13` | Métricas y monitoreo SLA | Métricas y compromisos de atención |
| `sla-configuracion.component.html:10,28` | … Niveles SLA / tiempos SLA | … Compromisos de Atención / tiempos de atención |
| `menu-lateral` (móvil) | subtítulo "TI" | "Mesa de Ayuda" |

> Los nombres de carpetas, clases y rutas internas (`sla/`, `cmdb/`) **no se renombran** en este refactor porque no son visibles. Si se quiere, eso va en un PR aparte.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Al activar OnPush, vistas que mutan arrays u objetos dejan de refrescarse | Revisar los stores: siempre `signal.update(x => [...x])`; probar cada vista después del cambio |
| Pérdida de estilos al extraer el SCSS (cambia la especificidad de `:host`) | Commit mecánico primero y comparación visual con capturas antes de tocar estructura |
| `equipos` depende de `CmdbService` (acoplamiento entre features) | Registrar como deuda: mover `subredes` a `administracion/equipos/servicios/red.api.ts` en la fase de backend |
| Romper los specs existentes de `menu-lateral` y `plantilla-layout` | Actualizar los specs en el mismo commit que el componente |
| El drawer con *focus trap* sin CDK (no está en `package.json`) | Implementar un trap mínimo con `inert` en el fondo, o evaluar `@angular/cdk/a11y` (decisión del líder; solo añade `cdk`) |

---

## 10. Decisiones pendientes del líder
1. Destino de `/cmdb` frente a la pestaña Red de equipos (§5.7).
2. ¿Se autoriza agregar `@angular/cdk` (layout + a11y)? Con él se simplifican el `LayoutService` y el `panel-detalle`.
3. ¿Se retira `selector-rol-simulador` en producción o solo se oculta?
4. Fuente de datos de la `campana-notificaciones`: endpoint nuevo o mock temporal.

---

Todas las cifras salen del código actual de la rama. Dos de los hallazgos conviene conocerlos antes de empezar. Primero, `compartido/componentes/` (5 componentes) y `panel-control/componentes/kpi-tarjeta` no los importa nadie: son código muerto. Segundo, `cabecera-pagina` existe, pero es un stub vacío, sin inputs ni lógica.

No guardé el documento en disco porque lo pediste solo en consola. Según el `CLAUDE.md`, los planes van en `docs/`. Si quieres, lo guardo como `docs/refactor/plano_maestro_refactorizacion_frontend.md` para que Antigravity lo tome desde ahí.
