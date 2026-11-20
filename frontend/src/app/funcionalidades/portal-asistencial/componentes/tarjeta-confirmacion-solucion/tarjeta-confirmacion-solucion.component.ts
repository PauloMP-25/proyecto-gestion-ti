import {
  Component,
  input,
  output,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { tieneMinimoCaracteresUtiles, contarCaracteresUtiles } from '../../../../compartido/utilidades/validadores-texto';

@Component({
  selector: 'app-tarjeta-confirmacion-solucion',
  standalone: true,
  imports: [FormsModule, IconoComponent],
  templateUrl: './tarjeta-confirmacion-solucion.component.html',
  styleUrl: './tarjeta-confirmacion-solucion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaConfirmacionSolucionComponent {
  readonly ticketId = input.required<number>();
  readonly solucionConfirmada = output<void>();
  readonly solicitudReabierta = output<string>();

  private readonly solicitudesApi = inject(PortalSolicitudesApi);

  readonly mostrarFormularioNo = signal(false);
  readonly motivoReapertura = signal('');
  readonly enviando = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  get caracteresUtiles(): number {
    return contarCaracteresUtiles(this.motivoReapertura());
  }

  get esMotivoValido(): boolean {
    return tieneMinimoCaracteresUtiles(this.motivoReapertura(), 10);
  }

  abrirFormularioNo(): void {
    this.errorMensaje.set(null);
    this.mostrarFormularioNo.set(true);
  }

  cancelarNo(): void {
    this.errorMensaje.set(null);
    this.mostrarFormularioNo.set(false);
  }

  confirmarSi(): void {
    if (this.enviando()) return;
    this.enviando.set(true);
    this.errorMensaje.set(null);

    this.solicitudesApi.confirmarSolucion(this.ticketId()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.solucionConfirmada.emit();
      },
      error: () => {
        this.enviando.set(false);
        this.errorMensaje.set('No se pudo confirmar en este momento. Por favor, intente nuevamente.');
      },
    });
  }

  enviarReapertura(): void {
    if (this.enviando() || !this.esMotivoValido) return;
    this.enviando.set(true);
    this.errorMensaje.set(null);

    const motivo = this.motivoReapertura().trim();
    this.solicitudesApi.reabrir(this.ticketId(), { motivo }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.solicitudReabierta.emit(motivo);
      },
      error: () => {
        this.enviando.set(false);
        this.errorMensaje.set('No se pudo enviar el reporte. Su texto se mantiene seguro, por favor reintente.');
      },
    });
  }
}
