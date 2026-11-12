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
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { TurnoApi } from '../../servicios/turno.api';
import {
  TicketTurno,
  ResumenTurno,
  VistaTurno,
  AccionTurno,
  accionesDisponibles,
} from '../../modelos/ticket-turno.model';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { RelojService } from '../../../../nucleo/servicios/reloj.service';
import { SondeoService } from '../../../../nucleo/servicios/sondeo.service';
import { calcularSla } from '../../../../compartido/utilidades/calculo-sla';
import { SlaCalculado } from '../../../../compartido/modelos/sla-vista.model';
import { EstadoSla } from '../../../../compartido/modelos/estado-sla.enum';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { SlaCronometroComponent } from '../../../../compartido/componentes/sla-cronometro/sla-cronometro.component';
import { ResumenTurnoComponent } from '../../componentes/resumen-turno/resumen-turno.component';
import { DialogoResolverTicketComponent } from '../../../../compartido/componentes/dialogo-resolver-ticket/dialogo-resolver-ticket.component';
import { ResolverTicketPayload } from '../../../../compartido/modelos/dialogos-acciones.model';
import { HttpErrorResponse } from '@angular/common/http';

import { AlertasTurnoService } from '../../servicios/alertas-turno.service';

@Component({
  selector: 'app-bandeja-turno',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IconoComponent,
    SlaCronometroComponent,
    ResumenTurnoComponent,
    DialogoResolverTicketComponent,
  ],
  templateUrl: './bandeja-turno.page.html',
  styleUrls: ['./bandeja-turno.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BandejaTurnoPage implements OnInit {
  private readonly turnoApi = inject(TurnoApi);
  private readonly reloj = inject(RelojService);
  private readonly sondeo = inject(SondeoService);
  private readonly alertas = inject(AlertasTurnoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly online = this.alertas.online;
  readonly ultimoAnuncio = this.alertas.ultimoAnuncio;

  // Estados reactivos principales
  readonly vistaActual = signal<VistaTurno>('EN_ATENCION');
  readonly terminoBusqueda = signal<string>('');
  readonly soloUrgentes = signal<boolean>(false);
  readonly cargando = signal<boolean>(true);
  readonly actualizando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly mensajeAlerta = signal<string | null>(null);
  readonly mensajeExito = signal<string | null>(null);

  readonly tickets = signal<TicketTurno[]>([]);
  readonly resumen = signal<ResumenTurno>({
    asignados: 0,
    porVencer: 0,
    vencidos: 0,
    resueltosHoy: 0,
    hayP1SinTomar: false,
    ahoraServidorIso: new Date().toISOString(),
  });

  // Ticket para el diálogo de resolución
  readonly ticketParaResolver = signal<TicketTurno | null>(null);
  readonly procesandoResolucion = signal<boolean>(false);

  // Botón con acción en curso (id de ticket)
  readonly ticketEnProcesoId = signal<number | null>(null);

  // Hora de última actualización
  readonly ultimaActualizacion = signal<string>('');

  private readonly buscar$ = new Subject<string>();

  ngOnInit(): void {
    this.leerParametrosUrl();
    this.inicializarBuscador();
    this.iniciarSondeo();
  }

  private leerParametrosUrl(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const tab = params.get('tab');
        if (tab === 'por-tomar') {
          this.vistaActual.set('POR_TOMAR');
        } else if (tab === 'historial') {
          this.vistaActual.set('HISTORIAL');
        } else if (tab === 'en-atencion') {
          this.vistaActual.set('EN_ATENCION');
        }

        const q = params.get('q');
        if (q) {
          this.terminoBusqueda.set(q);
        }

        const urg = params.get('urgentes');
        if (urg === 'true') {
          this.soloUrgentes.set(true);
        }
      });
  }

  private inicializarBuscador(): void {
    this.buscar$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((texto) => {
        this.terminoBusqueda.set(texto);
        this.sincronizarParametrosUrl();
        this.cargarDatos(false);
      });
  }

  private iniciarSondeo(): void {
    this.sondeo
      .crearSondeo(() => this.turnoApi.resumen(), 30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.resumen.set(res);
          this.cargarDatos(false);
        },
        error: () => {
          // El sondeo no debe interrumpir la interacción del usuario
        },
      });
  }

  cargarDatos(mostrarEsqueleto: boolean = true): void {
    if (mostrarEsqueleto) {
      this.cargando.set(true);
    } else {
      this.actualizando.set(true);
    }
    this.error.set(null);

    combineLatest([
      this.turnoApi.resumen(),
      this.turnoApi.listar({
        vista: this.vistaActual(),
        texto: this.terminoBusqueda(),
        soloP1P2: this.soloUrgentes(),
        pagina: 0,
        tamano: 50,
      }),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([resumen, pagina]) => {
          this.resumen.set(resumen);
          this.tickets.set(pagina.contenido);
          this.alertas.inspeccionarTransicionesSla(pagina.contenido, this.reloj.ahora());
          this.cargando.set(false);
          this.actualizando.set(false);
          const ahora = new Date();
          const horas = String(ahora.getHours()).padStart(2, '0');
          const minutos = String(ahora.getMinutes()).padStart(2, '0');
          this.ultimaActualizacion.set(`${horas}:${minutos}`);
        },
        error: (err: unknown) => {
          this.cargando.set(false);
          this.actualizando.set(false);
          this.error.set('No fue posible cargar la información de los tickets. Verifique su conexión.');
        },
      });
  }

  cambiarVista(nuevaVista: VistaTurno): void {
    this.vistaActual.set(nuevaVista);
    this.sincronizarParametrosUrl();
    this.cargarDatos(true);
  }

  onInputBusqueda(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.buscar$.next(input.value);
  }

  limpiarBusqueda(): void {
    this.terminoBusqueda.set('');
    this.sincronizarParametrosUrl();
    this.cargarDatos(false);
  }

  toggleSoloUrgentes(): void {
    this.soloUrgentes.update((v) => !v);
    this.sincronizarParametrosUrl();
    this.cargarDatos(false);
  }

  actualizarAhora(): void {
    this.cargarDatos(false);
  }

  private sincronizarParametrosUrl(): void {
    const tabMap: Record<VistaTurno, string> = {
      POR_TOMAR: 'por-tomar',
      EN_ATENCION: 'en-atencion',
      HISTORIAL: 'historial',
    };

    const queryParams: Record<string, string | null> = {
      tab: tabMap[this.vistaActual()],
      q: this.terminoBusqueda() || null,
      urgentes: this.soloUrgentes() ? 'true' : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // Helpers de SLA y acciones
  obtenerSlaCalculado(ticket: TicketTurno): SlaCalculado {
    return calcularSla(ticket.sla, this.reloj.ahora());
  }

  obtenerAccionPrimaria(ticket: TicketTurno): AccionTurno | null {
    return accionesDisponibles(ticket, RolUsuario.PRACTICANTE).primaria;
  }

  etiquetaAccion(accion: AccionTurno): string {
    switch (accion) {
      case 'TOMAR':
        return 'Tomar ticket';
      case 'TOMAR_Y_COMENZAR':
        return 'Tomar y comenzar';
      case 'INICIAR':
        return 'Iniciar atención';
      case 'RESOLVER':
        return 'Resolver';
      case 'ESCALAR':
        return 'Escalar a N2';
      default:
        return 'Atender';
    }
  }

  ejecutarAccion(ticket: TicketTurno, accion: AccionTurno, evento: Event): void {
    evento.stopPropagation();

    if (accion === 'TOMAR') {
      this.tomarTicket(ticket.id, false);
    } else if (accion === 'TOMAR_Y_COMENZAR') {
      this.tomarTicket(ticket.id, true);
    } else if (accion === 'INICIAR') {
      this.iniciarAtencion(ticket.id);
    } else if (accion === 'RESOLVER') {
      this.ticketParaResolver.set(ticket);
    }
  }

  private tomarTicket(id: number, iniciarAtencion: boolean): void {
    this.ticketEnProcesoId.set(id);
    this.mensajeAlerta.set(null);
    this.mensajeExito.set(null);

    this.turnoApi.tomar(id, { iniciarAtencion })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticketActualizado) => {
          this.ticketEnProcesoId.set(null);
          this.mensajeExito.set(`Ticket ${ticketActualizado.codigo} asignado a su turno.`);
          this.cargarDatos(false);
        },
        error: (err: unknown) => {
          this.ticketEnProcesoId.set(null);
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.mensajeAlerta.set('Otro técnico ya tomó este ticket. Actualizando la bandeja...');
          } else {
            this.mensajeAlerta.set('No se pudo tomar el ticket. Intente nuevamente.');
          }
          this.cargarDatos(false);
        },
      });
  }

  private iniciarAtencion(id: number): void {
    this.ticketEnProcesoId.set(id);
    this.turnoApi.iniciarAtencion(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticketActualizado) => {
          this.ticketEnProcesoId.set(null);
          this.mensajeExito.set(`Ticket ${ticketActualizado.codigo} en atención.`);
          this.cargarDatos(false);
        },
        error: () => {
          this.ticketEnProcesoId.set(null);
          this.mensajeAlerta.set('No se pudo iniciar la atención. Intente nuevamente.');
        },
      });
  }

  confirmarResolucion(payload: ResolverTicketPayload): void {
    const ticket = this.ticketParaResolver();
    if (!ticket) return;

    this.procesandoResolucion.set(true);
    this.turnoApi.resolver(ticket.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticketActualizado) => {
          this.procesandoResolucion.set(false);
          this.ticketParaResolver.set(null);
          this.mensajeExito.set(`Ticket ${ticketActualizado.codigo} marcado como resuelto.`);
          this.cargarDatos(false);
        },
        error: () => {
          this.procesandoResolucion.set(false);
          this.mensajeAlerta.set('No se pudo registrar la solución del ticket. Intente nuevamente.');
        },
      });
  }

  cancelarResolucion(): void {
    this.ticketParaResolver.set(null);
  }

  verFicha(ticketId: number): void {
    this.router.navigate(['/mi-turno/ticket', ticketId]);
  }

  // Clases y colores
  claseBordeSla(ticket: TicketTurno): string {
    const sla = this.obtenerSlaCalculado(ticket);
    if (sla.fase === 'COMPLETADO') return 'borde-sla--completado';
    if (sla.estado === EstadoSla.INCUMPLIDO) return 'borde-sla--vencido';
    if (sla.estado === EstadoSla.ALERTA) return 'borde-sla--alerta';
    return 'borde-sla--atiempo';
  }

  esP1(ticket: TicketTurno): boolean {
    return ticket.prioridad === Prioridad.P1_CRITICA;
  }

  esP2(ticket: TicketTurno): boolean {
    return ticket.prioridad === Prioridad.P2_ALTA;
  }
}
