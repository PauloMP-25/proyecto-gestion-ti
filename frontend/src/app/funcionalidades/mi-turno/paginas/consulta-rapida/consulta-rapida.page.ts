import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { ConsultaRapidaApi } from '../../servicios/consulta-rapida.api';
import { ActivoResumen } from '../../../../compartido/modelos/activo-resumen.model';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { TarjetaActivoComponent } from '../../componentes/tarjeta-activo/tarjeta-activo.component';

export type TabConsulta = 'equipos' | 'soluciones';

@Component({
  selector: 'app-consulta-rapida',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconoComponent,
    TarjetaActivoComponent,
  ],
  templateUrl: './consulta-rapida.page.html',
  styleUrls: ['./consulta-rapida.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaRapidaPage implements OnInit {
  private readonly consultaApi = inject(ConsultaRapidaApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly tabActivo = signal<TabConsulta>('equipos');
  readonly terminoBusqueda = signal<string>('');
  readonly ticketOrigenId = signal<number | null>(null);
  readonly categoriaFiltroId = signal<number | null>(null);

  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly activos = signal<ActivoResumen[]>([]);
  readonly articulos = signal<ArticuloResumen[]>([]);

  private readonly buscar$ = new Subject<string>();

  ngOnInit(): void {
    this.leerParametrosUrl();
    this.configurarBuscador();
    this.ejecutarConsulta();
  }

  private leerParametrosUrl(): void {
    const qp = this.route.snapshot.queryParamMap;
    const tab = qp.get('tab');
    if (tab === 'soluciones' || tab === 'equipos') {
      this.tabActivo.set(tab);
    }

    const q = qp.get('q');
    if (q) {
      this.terminoBusqueda.set(q);
    }

    const ticket = qp.get('ticket');
    if (ticket) {
      this.ticketOrigenId.set(Number(ticket));
    }

    const catId = qp.get('categoriaId');
    if (catId) {
      this.categoriaFiltroId.set(Number(catId));
    }
  }

  private configurarBuscador(): void {
    this.buscar$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((texto) => {
        this.terminoBusqueda.set(texto);
        this.sincronizarUrl();
        this.ejecutarConsulta();
      });
  }

  cambiarTab(tab: TabConsulta): void {
    this.tabActivo.set(tab);
    this.sincronizarUrl();
    this.ejecutarConsulta();
  }

  onInputBusqueda(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.buscar$.next(input.value);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.sincronizarUrl();
    this.ejecutarConsulta();
  }

  ejecutarConsulta(): void {
    this.cargando.set(true);
    this.error.set(null);

    const termino = this.terminoBusqueda();
    const tab = this.tabActivo();

    if (tab === 'equipos') {
      this.consultaApi.buscarActivos(termino)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.activos.set(res);
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.error.set('No se pudo consultar el catálogo de equipos hospitalarios.');
          },
        });
    } else {
      const catId = this.categoriaFiltroId() || undefined;
      this.consultaApi.buscarArticulos(termino, catId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.articulos.set(res);
            this.cargando.set(false);
          },
          error: () => {
            this.cargando.set(false);
            this.error.set('No se pudo consultar las guías de soporte.');
          },
        });
    }
  }

  verArticulo(articuloId: number): void {
    const queryParams: Record<string, string | number> = {};
    if (this.ticketOrigenId()) {
      queryParams['ticket'] = this.ticketOrigenId()!;
    }

    this.router.navigate(['/mi-turno/consulta/articulo', articuloId], { queryParams });
  }

  volver(): void {
    if (this.ticketOrigenId()) {
      this.router.navigate(['/mi-turno/ticket', this.ticketOrigenId()]);
    } else {
      this.router.navigate(['/mi-turno']);
    }
  }

  private sincronizarUrl(): void {
    const queryParams: Record<string, string | number | null> = {
      tab: this.tabActivo(),
      q: this.terminoBusqueda() || null,
      ticket: this.ticketOrigenId(),
      categoriaId: this.categoriaFiltroId(),
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
