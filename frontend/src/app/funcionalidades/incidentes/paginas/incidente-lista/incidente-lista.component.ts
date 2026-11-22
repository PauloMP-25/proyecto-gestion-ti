import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, EMPTY, catchError, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import { TicketResumen } from '../../../../compartido/modelos/ticket.model';
import { TicketFiltros } from '../../../../compartido/modelos/ticket-filtros.model';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { PrioridadInsigniaComponent } from '../../../../compartido/ui/atomos/prioridad-insignia/prioridad-insignia.component';
import { EstadoEtiquetaComponent } from '../../../../compartido/ui/atomos/estado-etiqueta/estado-etiqueta.component';
import { SlaInsigniaComponent } from '../../../../compartido/ui/atomos/sla-insignia/sla-insignia.component';
import { EsqueletoComponent } from '../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { EstadoVacioComponent } from '../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { IncidenteFiltrosComponent } from '../../componentes/incidente-filtros/incidente-filtros.component';

const TAMANO_PAGINA = 10;

const PESO_PRIORIDAD: Record<string, number> = {
  P1: 1,
  CRITICA: 1,
  P2: 2,
  ALTA: 2,
  P3: 3,
  MEDIA: 3,
  P4: 4,
  BAJA: 4,
};

@Component({
  selector: 'app-incidente-lista',
  imports: [
    CommonModule,
    RouterLink,
    PrioridadInsigniaComponent,
    EstadoEtiquetaComponent,
    SlaInsigniaComponent,
    EsqueletoComponent,
    EstadoVacioComponent,
    IncidenteFiltrosComponent,
  ],
  templateUrl: './incidente-lista.component.html',
  styleUrl: './incidente-lista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteListaComponent implements OnInit {
  private ticketsService = inject(TicketsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly recargar$ = new Subject<void>();

  protected readonly EstadoTicket = EstadoTicket;
  readonly modoPropios = this.route.snapshot.data['modo'] === 'propios';
  readonly modoEscalados = this.route.snapshot.data['modo'] === 'escalados';
  readonly titulo = this.modoEscalados
    ? 'Tickets Derivados a Soporte Nivel 2'
    : this.modoPropios
      ? 'Mis Tickets'
      : 'Bandeja de Tickets';

  readonly cargando = signal(true);
  readonly resultado = signal<Pagina<TicketResumen> | null>(null);
  readonly pagina = signal(0);
  private filtros: TicketFiltros = this.modoEscalados ? { estado: EstadoTicket.ESCALADO } : {};

  get mensajeVacio(): string {
    if (this.modoPropios) {
      return 'Aún no ha registrado tickets.';
    }
    if (this.modoEscalados) {
      return 'No hay tickets derivados a Nivel 2 en este momento.';
    }
    return 'No se encontraron tickets con los filtros seleccionados.';
  }

  constructor() {
    this.recargar$.pipe(
      switchMap(() => {
        this.cargando.set(true);
        const paginacion = { pagina: this.pagina(), tamano: TAMANO_PAGINA };
        const peticion = this.modoPropios
          ? this.ticketsService.misTickets(paginacion)
          : this.ticketsService.listar(this.filtros, paginacion);
        return peticion.pipe(catchError(() => {
          this.cargando.set(false);
          return EMPTY;
        }));
      }),
      takeUntilDestroyed(),
    ).subscribe(pagina => {
      const contenido = this.modoEscalados
        ? this.ordenarPorUrgenciaYSla(pagina.contenido)
        : pagina.contenido;
      this.resultado.set({ ...pagina, contenido });
      this.cargando.set(false);
    });
  }

  ngOnInit(): void {
    this.recargar$.next();
  }

  alCambiarFiltros(filtros: TicketFiltros): void {
    this.filtros = filtros;
    this.pagina.set(0);
    this.recargar$.next();
  }

  irAPagina(pagina: number): void {
    const total = this.resultado()?.totalPaginas ?? 0;
    if (pagina < 0 || pagina >= total) return;
    this.pagina.set(pagina);
    this.recargar$.next();
  }

  abrirTicket(id: number): void {
    this.router.navigate(['/incidentes', id]);
  }

  limiteSla(t: TicketResumen): string | null {
    const abierto = t.estado !== EstadoTicket.RESUELTO && t.estado !== EstadoTicket.CERRADO;
    return abierto ? t.fechaLimiteResolucion : null;
  }

  private ordenarPorUrgenciaYSla(tickets: TicketResumen[]): TicketResumen[] {
    return [...tickets].sort((a, b) => {
      const pesoA = PESO_PRIORIDAD[a.prioridad] ?? 99;
      const pesoB = PESO_PRIORIDAD[b.prioridad] ?? 99;
      if (pesoA !== pesoB) {
        return pesoA - pesoB;
      }
      const tA = a.fechaLimiteResolucion ? new Date(a.fechaLimiteResolucion).getTime() : Number.MAX_SAFE_INTEGER;
      const tB = b.fechaLimiteResolucion ? new Date(b.fechaLimiteResolucion).getTime() : Number.MAX_SAFE_INTEGER;
      return tA - tB;
    });
  }
}