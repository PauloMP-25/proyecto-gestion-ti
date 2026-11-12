import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { CalificacionEstrellasComponent } from '../../../../compartido/componentes/calificacion-estrellas/calificacion-estrellas.component';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { CalificacionAtencion } from '../../modelos/solicitud.model';

@Component({
  selector: 'app-tarjeta-calificacion',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoComponent, CalificacionEstrellasComponent],
  templateUrl: './tarjeta-calificacion.component.html',
  styleUrls: ['./tarjeta-calificacion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaCalificacionComponent {
  @Input({ required: true }) ticketId!: number;
  @Output() calificacionEnviada = new EventEmitter<CalificacionAtencion>();
  @Output() pospuesto = new EventEmitter<void>();

  private solicitudesApi = inject(PortalSolicitudesApi);

  readonly puntuacion = signal<number>(0);
  readonly comentario = signal<string>('');
  readonly enviando = signal<boolean>(false);
  readonly enviadoExitoso = signal<boolean>(false);
  readonly errorMensaje = signal<string | null>(null);

  get puedeEnviar(): boolean {
    return this.puntuacion() >= 1 && this.puntuacion() <= 5 && !this.enviando();
  }

  onPuntuacionCambiada(valor: number): void {
    this.puntuacion.set(valor);
    this.errorMensaje.set(null);
  }

  enviar(): void {
    if (!this.puedeEnviar) return;
    this.enviando.set(true);
    this.errorMensaje.set(null);

    const valorPuntuacion = this.puntuacion() as 1 | 2 | 3 | 4 | 5;
    const comentarioLimpio = this.comentario().trim() || undefined;

    this.solicitudesApi
      .calificar(this.ticketId, {
        puntuacion: valorPuntuacion,
        comentario: comentarioLimpio,
      })
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.enviadoExitoso.set(true);
          this.calificacionEnviada.emit(res);
        },
        error: () => {
          this.enviando.set(false);
          this.errorMensaje.set('No se pudo registrar su opinión en este momento. Por favor, reintente.');
        },
      });
  }

  posponer(): void {
    this.pospuesto.emit();
  }
}
