import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, of, catchError, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Ticket } from '../../../../compartido/modelos/ticket.model';
import { ContextoAtencion } from '../../../portal-asistencial/modelos/contexto-atencion.model';
import { EstadoTicket } from '../../../../compartido/modelos/estado-ticket.enum';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { AccionEstado, TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { PrioridadInsigniaComponent } from '../../../../compartido/ui/atomos/prioridad-insignia/prioridad-insignia.component';
import { EstadoEtiquetaComponent } from '../../../../compartido/ui/atomos/estado-etiqueta/estado-etiqueta.component';
import { SlaInsigniaComponent } from '../../../../compartido/ui/atomos/sla-insignia/sla-insignia.component';
import { NivelInsigniaComponent } from '../../../../compartido/ui/atomos/nivel-insignia/nivel-insignia.component';
import { EsqueletoComponent } from '../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { EstadoVacioComponent } from '../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { ContextoEquipoComponent } from '../../../../compartido/ui/moleculas/contexto-equipo/contexto-equipo.component';
import { IncidenteLineaTiempoComponent } from '../../componentes/incidente-linea-tiempo/incidente-linea-tiempo.component';
import { DialogoAsignarComponent, ResultadoAsignar } from '../../componentes/dialogo-asignar/dialogo-asignar.component';
import { DialogoCambiarEstadoComponent } from '../../componentes/dialogo-cambiar-estado/dialogo-cambiar-estado.component';
import { DialogoEscalarTicketComponent } from '../../../../compartido/ui/organismos/dialogo-escalar-ticket/dialogo-escalar-ticket.component';
import { DialogoResolverTicketComponent } from '../../../../compartido/ui/organismos/dialogo-resolver-ticket/dialogo-resolver-ticket.component';

type TipoDialogo = 'asignar' | 'iniciar' | 'cerrar' | 'reabrir' | 'escalar' | 'resolver';

interface Accion {
  tipo: TipoDialogo | 'tomar';
  etiqueta: string;
  icono: string;
  destacada?: boolean;
}

const ETIQUETAS_IMPACTO = { ALTO: 'Alto', MEDIO: 'Medio', BAJO: 'Bajo' } as const;
const ETIQUETAS_URGENCIA = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' } as const;

@Component({
  selector: 'app-incidente-detalle',
  imports: [
    CommonModule,
    RouterLink,
    PrioridadInsigniaComponent,
    EstadoEtiquetaComponent,
    SlaInsigniaComponent,
    NivelInsigniaComponent,
    EsqueletoComponent,
    EstadoVacioComponent,
    ContextoEquipoComponent,
    IncidenteLineaTiempoComponent,
    DialogoAsignarComponent,
    DialogoCambiarEstadoComponent,
    DialogoEscalarTicketComponent,
    DialogoResolverTicketComponent,
  ],
  templateUrl: './incidente-detalle.component.html',
  styleUrl: './incidente-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteDetalleComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketsService = inject(TicketsService);
  private authService = inject(AuthService);
  private notificacion = inject(NotificacionService);
  private destroyRef = inject(DestroyRef);

  readonly ticket = signal<Ticket | null>(null);
  readonly cargando = signal(true);
  readonly noEncontrado = signal(false);
  readonly dialogo = signal<TipoDialogo | null>(null);
  readonly procesando = signal(false);

  readonly rutaVolver = this.authService.rolActual() === RolUsuario.USUARIO_FINAL
    ? '/incidentes/mis-tickets'
    : '/incidentes/bandeja';

  readonly impactoTexto = (t: Ticket) => ETIQUETAS_IMPACTO[t.impacto];
  readonly urgenciaTexto = (t: Ticket) => ETIQUETAS_URGENCIA[t.urgencia];

  readonly limiteSla = computed(() => {
    const t = this.ticket();
    if (!t) return null;
    const abierto = t.estado !== EstadoTicket.RESUELTO && t.estado !== EstadoTicket.CERRADO;
    return abierto ? t.fechaLimiteResolucion : null;
  });

  readonly acciones = computed<Accion[]>(() => {
    const t = this.ticket();
    const rol = this.authService.rolActual();
    if (!t || !rol || rol === RolUsuario.USUARIO_FINAL) return [];
    const esAdmin = rol === RolUsuario.ADMINISTRADOR;
    switch (t.estado) {
      case EstadoTicket.NUEVO:
      case EstadoTicket.REABIERTO:
        return esAdmin
          ? [{ tipo: 'asignar', etiqueta: 'Asignar técnico', icono: 'person_add', destacada: true }]
          : [{ tipo: 'tomar', etiqueta: 'Tomar ticket', icono: 'pan_tool', destacada: true }];
      case EstadoTicket.ASIGNADO:
        return [{ tipo: 'iniciar', etiqueta: 'Iniciar atención', icono: 'play_arrow', destacada: true }];
      case EstadoTicket.EN_PROCESO:
        return [
          { tipo: 'resolver', etiqueta: 'Resolver', icono: 'check_circle', destacada: true },
          { tipo: 'escalar', etiqueta: 'Escalar a N2', icono: 'trending_up' },
        ];
      case EstadoTicket.ESCALADO:
        return esAdmin
          ? [
              { tipo: 'asignar', etiqueta: 'Asignar especialista N2', icono: 'person_add', destacada: true },
              { tipo: 'tomar', etiqueta: 'Asumir atención N2', icono: 'pan_tool' },
              { tipo: 'resolver', etiqueta: 'Resolver', icono: 'check_circle' },
            ]
          : [];
      case EstadoTicket.RESUELTO:
        return esAdmin
          ? [
              { tipo: 'cerrar', etiqueta: 'Cerrar ticket', icono: 'lock', destacada: true },
              { tipo: 'reabrir', etiqueta: 'Reabrir', icono: 'restart_alt' },
            ]
          : [];
      default:
        return [];
    }
  });

  readonly contexto = computed<ContextoAtencion | null>(() => {
    const t = this.ticket();
    if (!t) return null;
    return {
      estadoDeteccion: t.equipo ? 'DETECTADO' : 'IP_SIN_EQUIPO',
      ipOrigen: t.ipOrigen ?? '',
      equipo: t.equipo
        ? {
            id: t.equipo.id,
            codigoInventario: t.equipo.hostname ?? `EQ-${t.equipo.id}`,
            nombre: t.equipo.hostname ?? 'Equipo',
            tipo: 'COMPUTADORA',
            referenciaUbicacion: null,
          }
        : null,
      area: {
        id: t.area.id,
        nombre: t.area.nombre,
        ubicacionLegible: null,
        referenciaUbicacion: null,
        anexo: t.anexoContacto,
        encargado: null,
      },
      impresorasArea: [],
      persona: {
        id: t.solicitante.id,
        nombreVisible: t.solicitante.nombre,
        grado: null,
        areaAdscrita: { id: t.area.id, nombre: t.area.nombre },
      },
      personaEnOtraArea: false,
    };
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        this.cargando.set(true);
        this.noEncontrado.set(false);
        return this.ticketsService.obtener(Number(params.get('id'))).pipe(
          catchError(() => {
            this.noEncontrado.set(true);
            return of(null);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(t => {
      this.ticket.set(t);
      this.cargando.set(false);
    });
  }

  ejecutar(accion: Accion): void {
    const t = this.ticket();
    if (!t || this.procesando()) return;
    if (accion.tipo === 'tomar') {
      this.llamada(this.ticketsService.tomar(t.id), 'Ticket tomado. Ya puede iniciar la atención.');
    } else {
      this.dialogo.set(accion.tipo);
    }
  }

  cerrarDialogo(): void {
    if (!this.procesando()) this.dialogo.set(null);
  }

  confirmarAsignar(resultado: ResultadoAsignar): void {
    const t = this.ticket();
    if (!t) return;
    this.llamada(
      this.ticketsService.asignar(t.id, resultado.idTecnico, resultado.comentario),
      'Ticket asignado correctamente.',
    );
  }

  confirmarCambioEstado(texto: string | undefined): void {
    const t = this.ticket();
    const accion = this.dialogo() as AccionEstado | null;
    if (!t || !accion) return;
    this.llamada(this.ticketsService.cambiarEstado(t.id, accion, texto), 'Estado actualizado correctamente.');
  }

  confirmarEscalamiento(motivo: string): void {
    const t = this.ticket();
    if (!t) return;
    this.llamada(this.ticketsService.escalar(t.id, motivo), 'Ticket derivado al Nivel 2 (Especialista TI).');
  }

  confirmarResolucion(solucion: string): void {
    const t = this.ticket();
    if (!t) return;
    this.llamada(this.ticketsService.resolver(t.id, solucion), 'Ticket marcado como resuelto.');
  }

  private llamada(peticion: Observable<Ticket>, mensaje: string): void {
    if (this.procesando()) return;
    this.procesando.set(true);
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: t => {
        this.ticket.set(t);
        this.procesando.set(false);
        this.dialogo.set(null);
        this.notificacion.exito(mensaje);
      },
      error: () => this.procesando.set(false),
    });
  }
}