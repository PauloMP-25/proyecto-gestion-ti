import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { ViewportService } from '../../../../nucleo/servicios/viewport.service';
import { SondeoService } from '../../../../nucleo/servicios/sondeo.service';
import {
  FiltroSolicitudes,
  SolicitudResumen,
} from '../../modelos/solicitud.model';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import { TarjetaSolicitudComponent } from '../../componentes/tarjeta-solicitud/tarjeta-solicitud.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

export interface FiltroOpcion {
  valor: FiltroSolicitudes;
  etiqueta: string;
}

@Component({
  selector: 'app-mis-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    TarjetaSolicitudComponent,
    IconoComponent,
  ],
  templateUrl: './mis-solicitudes.page.html',
  styleUrl: './mis-solicitudes.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisSolicitudesPage implements OnInit {
  private readonly api = inject(PortalSolicitudesApi);
  readonly viewport = inject(ViewportService);
  private readonly sondeo = inject(SondeoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly filtros: readonly FiltroOpcion[] = [
    { valor: 'TODAS', etiqueta: 'Todas' },
    { valor: 'EN_CURSO', etiqueta: 'En atención' },
    { valor: 'POR_CONFIRMAR', etiqueta: 'Por confirmar' },
    { valor: 'CERRADAS', etiqueta: 'Cerradas' },
  ];

  readonly filtroActual = signal<FiltroSolicitudes>('TODAS');
  readonly paginaActual = signal<number>(0);
  readonly tamanoPagina = 10;

  readonly buscador = new FormControl<string>('', { nonNullable: true });

  readonly cargando = signal<boolean>(true);
  readonly actualizando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly datos = signal<Pagina<SolicitudResumen> | null>(null);

  readonly solicitudes = computed(() => this.datos()?.contenido ?? []);
  readonly totalSolicitudes = computed(() => this.datos()?.totalElementos ?? 0);
  readonly totalPaginas = computed(() => this.datos()?.totalPaginas ?? 1);

  readonly anuncioResultados = computed(() => {
    const t = this.totalSolicitudes();
    return t === 1 ? '1 solicitud encontrada' : `${t} solicitudes encontradas`;
  });

  ngOnInit(): void {
    // Sincronizar query params de la URL
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const f = params.get('filtro') as FiltroSolicitudes | null;
        if (f && ['TODAS', 'EN_CURSO', 'POR_CONFIRMAR', 'CERRADAS'].includes(f)) {
          this.filtroActual.set(f);
        } else {
          this.filtroActual.set('TODAS');
        }

        const q = params.get('q') ?? '';
        if (q !== this.buscador.value) {
          this.buscador.setValue(q, { emitEvent: false });
        }

        const p = Number(params.get('pagina')) || 0;
        this.paginaActual.set(Math.max(0, p));

        this.cargarSolicitudes(false);
      });

    // Debounce de búsqueda de 300ms
    this.buscador.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((texto) => {
        this.actualizarUrl({ q: texto.trim() || null, pagina: null });
      });

    // Iniciar sondeo inteligente cada 30 segundos
    this.sondeo
      .crearSondeo(() => {
        if (!this.cargando()) {
          this.cargarSolicitudes(true);
        }
        return this.api.listar({
          filtro: this.filtroActual(),
          texto: this.buscador.value.trim() || undefined,
          pagina: this.paginaActual(),
          tamano: this.tamanoPagina,
        });
      }, 30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.datos.set(pagina);
          this.actualizando.set(false);
        },
        error: () => this.actualizando.set(false),
      });
  }

  cargarSolicitudes(enSegundoPlano: boolean = false): void {
    if (enSegundoPlano) {
      this.actualizando.set(true);
    } else {
      this.cargando.set(true);
      this.error.set(null);
    }

    this.api
      .listar({
        filtro: this.filtroActual(),
        texto: this.buscador.value.trim() || undefined,
        pagina: this.paginaActual(),
        tamano: this.tamanoPagina,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.datos.set(res);
          this.cargando.set(false);
          this.actualizando.set(false);
        },
        error: () => {
          this.error.set('No pudimos cargar sus solicitudes. Verifique su conexión e intente nuevamente.');
          this.cargando.set(false);
          this.actualizando.set(false);
        },
      });
  }

  cambiarFiltro(filtro: FiltroSolicitudes): void {
    if (this.filtroActual() === filtro) return;
    this.actualizarUrl({ filtro: filtro === 'TODAS' ? null : filtro, pagina: null });
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 0 || nuevaPagina >= this.totalPaginas()) return;
    this.actualizarUrl({ pagina: nuevaPagina || null });
  }

  limpiarBusqueda(): void {
    this.buscador.setValue('');
  }

  private actualizarUrl(queryParams: Record<string, any>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
