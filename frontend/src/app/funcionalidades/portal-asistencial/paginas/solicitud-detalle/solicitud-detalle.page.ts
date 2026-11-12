import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { LineaTiempoEtapasComponent } from '../../../../compartido/componentes/linea-tiempo-etapas/linea-tiempo-etapas.component';
import { TarjetaConfirmacionSolucionComponent } from '../../componentes/tarjeta-confirmacion-solucion/tarjeta-confirmacion-solucion.component';
import { TarjetaCalificacionComponent } from '../../componentes/tarjeta-calificacion/tarjeta-calificacion.component';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { SolicitudDetalle } from '../../modelos/solicitud.model';
import { ETAPAS_SEGUIMIENTO } from '../../../../compartido/modelos/etapa-seguimiento.model';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';

@Component({
  selector: 'app-solicitud-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IconoComponent,
    LineaTiempoEtapasComponent,
    TarjetaConfirmacionSolucionComponent,
    TarjetaCalificacionComponent,
  ],
  templateUrl: './solicitud-detalle.page.html',
  styleUrls: ['./solicitud-detalle.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudDetallePage implements OnInit {
  private route = inject(ActivatedRoute);
  private solicitudesApi = inject(PortalSolicitudesApi);

  readonly cargando = signal(true);
  readonly solicitud = signal<SolicitudDetalle | null>(null);
  readonly noEncontrado = signal(false);
  readonly calificacionPospuesta = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? parseInt(idParam, 10) : NaN;

    if (isNaN(id)) {
      this.cargando.set(false);
      this.noEncontrado.set(true);
      return;
    }

    this.cargarSolicitud(id);
  }

  cargarSolicitud(id: number): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);

    this.solicitudesApi.obtenerDetalle(id).subscribe({
      next: (data) => {
        this.solicitud.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.solicitud.set(null);
        this.noEncontrado.set(true);
        this.cargando.set(false);
      },
    });
  }

  onSolucionConfirmada(): void {
    const s = this.solicitud();
    if (s) {
      this.solicitud.set({
        ...s,
        etapa: 'CERRADO',
        requiereConfirmacion: false,
        hitos: [
          ...s.hitos,
          {
            id: s.hitos.length + 1,
            etapa: 'CERRADO',
            mensaje: 'Confirmó que el problema fue resuelto satisfactoriamente.',
            fechaIso: new Date().toISOString(),
          },
        ],
      });
    }
  }

  onSolicitudReabierta(motivo: string): void {
    const s = this.solicitud();
    if (s) {
      this.solicitud.set({
        ...s,
        etapa: 'EN_ATENCION',
        reabierta: true,
        requiereConfirmacion: false,
        hitos: [
          ...s.hitos,
          {
            id: s.hitos.length + 1,
            etapa: 'EN_ATENCION',
            mensaje: `Usted indicó que el problema continúa: ${motivo}`,
            fechaIso: new Date().toISOString(),
          },
        ],
      });
    }
  }

  onCalificacionEnviada(): void {
    const s = this.solicitud();
    if (s) {
      this.solicitud.set({
        ...s,
        calificada: true,
      });
    }
  }

  onCalificacionPospuesta(): void {
    this.calificacionPospuesta.set(true);
  }

  esTiempoExcedido(isoFecha: string | null): boolean {
    if (!isoFecha) return false;
    const tiempo = new Date(isoFecha).getTime();
    return tiempo < Date.now();
  }

  formatearFechaHora(isoFecha: string): string {
    const d = new Date(isoFecha);
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  obtenerTextoUrgencia(urgencia: Prioridad): string {
    switch (urgencia) {
      case Prioridad.P1_CRITICA:
      case Prioridad.P1:
        return 'Urgencia Inmediata';
      case Prioridad.P2_ALTA:
      case Prioridad.P2:
        return 'Urgente';
      case Prioridad.P3_MEDIA:
      case Prioridad.P3:
        return 'Normal';
      default:
        return 'Planificada';
    }
  }

  obtenerClaseUrgencia(urgencia: Prioridad): string {
    switch (urgencia) {
      case Prioridad.P1_CRITICA:
      case Prioridad.P1:
        return 'solicitud-detalle__badge--critica';
      case Prioridad.P2_ALTA:
      case Prioridad.P2:
        return 'solicitud-detalle__badge--alta';
      case Prioridad.P3_MEDIA:
      case Prioridad.P3:
        return 'solicitud-detalle__badge--media';
      default:
        return 'solicitud-detalle__badge--baja';
    }
  }
}
