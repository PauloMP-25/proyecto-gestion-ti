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
import { TurnoApi } from '../../servicios/turno.api';
import { TicketTurno } from '../../modelos/ticket-turno.model';
import { RelojService } from '../../../../nucleo/servicios/reloj.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { calcularSla } from '../../../../compartido/utilidades/calculo-sla';
import { SlaCalculado } from '../../../../compartido/modelos/sla-vista.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { SlaCronometroComponent } from '../../../../compartido/componentes/sla-cronometro/sla-cronometro.component';
import { BarraAccionesTicketComponent } from '../../componentes/barra-acciones-ticket/barra-acciones-ticket.component';
import { DialogoResolverTicketComponent } from '../../../../compartido/componentes/dialogo-resolver-ticket/dialogo-resolver-ticket.component';
import { DialogoEscalarTicketComponent } from '../../../../compartido/componentes/dialogo-escalar-ticket/dialogo-escalar-ticket.component';
import { ResolverTicketPayload, EscalarTicketPayload } from '../../../../compartido/modelos/dialogos-acciones.model';
import { HttpErrorResponse } from '@angular/common/http';

export interface HitoInternoTurno {
  id: number;
  etiqueta: string;
  detalle: string;
  fechaIso: string;
  icono: string;
  tipo: 'registro' | 'asignacion' | 'atencion' | 'resolucion' | 'escalamiento';
}

@Component({
  selector: 'app-ficha-atencion',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconoComponent,
    SlaCronometroComponent,
    BarraAccionesTicketComponent,
    DialogoResolverTicketComponent,
    DialogoEscalarTicketComponent,
  ],
  templateUrl: './ficha-atencion.page.html',
  styleUrls: ['./ficha-atencion.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FichaAtencionPage implements OnInit {
  private readonly turnoApi = inject(TurnoApi);
  private readonly reloj = inject(RelojService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly rolUsuario = RolUsuario.PRACTICANTE;

  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly ticket = signal<TicketTurno | null>(null);

  // Mensajes de feedback
  readonly mensajeExito = signal<string | null>(null);
  readonly mensajeAlerta = signal<string | null>(null);

  // Estados de modales
  readonly modalResolverAbierto = signal<boolean>(false);
  readonly modalEscalarAbierto = signal<boolean>(false);
  readonly procesandoAccion = signal<boolean>(false);

  // Sugerencia de solución vinculada desde la URL (?solucionId=...)
  readonly solucionSugeridaId = signal<number | null>(null);

  readonly ticketId = computed(() => {
    const param = this.route.snapshot.paramMap.get('id');
    return param ? Number(param) : 0;
  });

  readonly slaCalculado = computed<SlaCalculado | null>(() => {
    const t = this.ticket();
    if (!t) return null;
    return calcularSla(t.sla, this.reloj.ahora());
  });

  // Hitos simulados para trazabilidad interna del ticket
  readonly hitosInternos = computed<HitoInternoTurno[]>(() => {
    const t = this.ticket();
    if (!t) return [];

    const hitos: HitoInternoTurno[] = [
      {
        id: 1,
        etiqueta: 'Solicitud registrada',
        detalle: `Registrada por ${t.solicitanteNombre} para el área ${t.areaNombre}`,
        fechaIso: t.fechaCreacionIso,
        icono: 'edit_note',
        tipo: 'registro',
      },
    ];

    if (t.asignadoA) {
      hitos.push({
        id: 2,
        etiqueta: 'Asignado a soporte',
        detalle: `Asignado a ${t.asignadoA.nombre}`,
        fechaIso: t.sla.inicioIso,
        icono: 'person',
        tipo: 'asignacion',
      });
    }

    if (t.estado === EstadoTicket.EN_PROCESO) {
      hitos.push({
        id: 3,
        etiqueta: 'Atención técnica en curso',
        detalle: 'Técnico inició labores de diagnóstico y resolución',
        fechaIso: t.sla.respuestaRealIso || new Date().toISOString(),
        icono: 'play_arrow',
        tipo: 'atencion',
      });
    } else if (t.estado === EstadoTicket.ESCALADO) {
      hitos.push({
        id: 4,
        etiqueta: 'Derivado a Soporte Nivel 2',
        detalle: 'Escalado por requerir intervención de infraestructura especializada',
        fechaIso: new Date().toISOString(),
        icono: 'arrow_upward',
        tipo: 'escalamiento',
      });
    } else if (t.estado === EstadoTicket.RESUELTO || t.estado === EstadoTicket.CERRADO) {
      hitos.push({
        id: 5,
        etiqueta: 'Atención finalizada',
        detalle: 'Problema solucionado y validado operativamente',
        fechaIso: new Date().toISOString(),
        icono: 'check_circle',
        tipo: 'resolucion',
      });
    }

    return hitos;
  });

  ngOnInit(): void {
    const paramSolucion = this.route.snapshot.queryParamMap.get('solucionId');
    if (paramSolucion) {
      this.solucionSugeridaId.set(Number(paramSolucion));
    }

    this.cargarDetalle();
  }

  cargarDetalle(): void {
    const id = this.ticketId();
    if (!id) {
      this.error.set('Identificador de ticket no válido');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.turnoApi.obtener(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (t) => {
          this.ticket.set(t);
          this.cargando.set(false);
        },
        error: (err: unknown) => {
          this.ticket.set(null);
          this.cargando.set(false);
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.error.set('El ticket solicitado no existe o fue reasignado.');
          } else {
            this.error.set('No se pudo cargar la información del ticket. Verifique su conexión.');
          }
        },
      });
  }

  // Manejadores de acciones de la barra
  onTomar(ev: { iniciarAtencion: boolean }): void {
    const t = this.ticket();
    if (!t) return;

    this.procesandoAccion.set(true);
    this.mensajeAlerta.set(null);

    this.turnoApi.tomar(t.id, ev)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.procesandoAccion.set(false);
          this.ticket.set(actualizado);
          this.mensajeExito.set(
            ev.iniciarAtencion
              ? `Ticket tomado e iniciado en proceso.`
              : `Ticket tomado y asignado a su turno.`
          );
        },
        error: (err: unknown) => {
          this.procesandoAccion.set(false);
          if (err instanceof HttpErrorResponse && err.status === 409) {
            this.mensajeAlerta.set('Otro técnico ya tomó este ticket.');
          } else {
            this.mensajeAlerta.set('No se pudo tomar el ticket. Intente nuevamente.');
          }
        },
      });
  }

  onIniciar(): void {
    const t = this.ticket();
    if (!t) return;

    this.procesandoAccion.set(true);
    this.turnoApi.iniciarAtencion(t.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.procesandoAccion.set(false);
          this.ticket.set(actualizado);
          this.mensajeExito.set('Atención técnica iniciada (fase de resolución activada).');
        },
        error: () => {
          this.procesandoAccion.set(false);
          this.mensajeAlerta.set('No se pudo iniciar la atención. Intente nuevamente.');
        },
      });
  }

  abrirDialogoResolver(): void {
    this.modalResolverAbierto.set(true);
  }

  abrirDialogoEscalar(): void {
    this.modalEscalarAbierto.set(true);
  }

  confirmarResolucion(payload: ResolverTicketPayload): void {
    const t = this.ticket();
    if (!t) return;

    this.procesandoAccion.set(true);
    this.turnoApi.resolver(t.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.procesandoAccion.set(false);
          this.modalResolverAbierto.set(false);
          this.ticket.set(actualizado);
          this.mensajeExito.set('¡Ticket resuelto exitosamente! Solución documentada.');
        },
        error: () => {
          this.procesandoAccion.set(false);
          this.mensajeAlerta.set('Ocurrió un error al guardar la solución. No se perdió su texto.');
        },
      });
  }

  confirmarEscalamiento(payload: EscalarTicketPayload): void {
    const t = this.ticket();
    if (!t) return;

    this.procesandoAccion.set(true);
    this.turnoApi.escalar(t.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.procesandoAccion.set(false);
          this.modalEscalarAbierto.set(false);
          this.ticket.set(actualizado);
          this.mensajeExito.set('Ticket derivado a Soporte de Nivel 2.');
        },
        error: () => {
          this.procesandoAccion.set(false);
          this.mensajeAlerta.set('Ocurrió un error al derivar el ticket. Intente nuevamente.');
        },
      });
  }

  consultarEquipo(hostname?: string | null): void {
    if (!hostname) return;
    this.router.navigate(['/mi-turno/consulta'], {
      queryParams: {
        tab: 'equipos',
        q: hostname,
        ticket: this.ticketId(),
      },
    });
  }

  consultarSoluciones(categoriaId: number): void {
    this.router.navigate(['/mi-turno/consulta'], {
      queryParams: {
        tab: 'soluciones',
        categoriaId,
        ticket: this.ticketId(),
      },
    });
  }

  cerrarMensajeAlerta(): void {
    this.mensajeAlerta.set(null);
  }

  cerrarMensajeExito(): void {
    this.mensajeExito.set(null);
  }
}
