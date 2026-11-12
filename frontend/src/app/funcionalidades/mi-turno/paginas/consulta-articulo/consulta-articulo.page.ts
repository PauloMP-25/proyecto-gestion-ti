import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConsultaRapidaApi } from '../../servicios/consulta-rapida.api';
import { ArticuloDetalle } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-consulta-articulo',
  standalone: true,
  imports: [CommonModule, RouterModule, IconoComponent],
  templateUrl: './consulta-articulo.page.html',
  styleUrls: ['./consulta-articulo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsultaArticuloPage implements OnInit {
  private readonly consultaApi = inject(ConsultaRapidaApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly articulo = signal<ArticuloDetalle | null>(null);

  readonly ticketOrigenId = signal<number | null>(null);

  readonly articuloId = computed(() => {
    const param = this.route.snapshot.paramMap.get('id');
    return param ? Number(param) : 0;
  });

  ngOnInit(): void {
    const qpTicket = this.route.snapshot.queryParamMap.get('ticket');
    if (qpTicket) {
      this.ticketOrigenId.set(Number(qpTicket));
    }

    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const id = this.articuloId();
    if (!id) {
      this.error.set('Identificador de guía no válido');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.consultaApi.obtenerArticulo(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (art) => {
          this.articulo.set(art);
          this.cargando.set(false);
        },
        error: () => {
          this.articulo.set(null);
          this.cargando.set(false);
          this.error.set('No se encontró la guía de solución solicitada.');
        },
      });
  }

  usarEnTicket(): void {
    const ticketId = this.ticketOrigenId();
    const artId = this.articuloId();
    if (ticketId) {
      this.router.navigate(['/mi-turno/ticket', ticketId], {
        queryParams: { solucionId: artId },
      });
    }
  }

  volver(): void {
    const queryParams: Record<string, string | number> = { tab: 'soluciones' };
    if (this.ticketOrigenId()) {
      queryParams['ticket'] = this.ticketOrigenId()!;
    }
    this.router.navigate(['/mi-turno/consulta'], { queryParams });
  }
}
