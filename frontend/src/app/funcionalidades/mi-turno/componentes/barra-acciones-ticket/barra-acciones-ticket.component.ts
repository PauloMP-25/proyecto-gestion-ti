import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketTurno, AccionTurno, accionesDisponibles } from '../../modelos/ticket-turno.model';
import { Rol, RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-barra-acciones-ticket',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './barra-acciones-ticket.component.html',
  styleUrls: ['./barra-acciones-ticket.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraAccionesTicketComponent {
  readonly ticket = input.required<TicketTurno>();
  readonly rol = input<Rol>(RolUsuario.PRACTICANTE);
  readonly procesando = input<boolean>(false);

  readonly alTomar = output<{ iniciarAtencion: boolean }>();
  readonly alIniciar = output<void>();
  readonly alResolver = output<void>();
  readonly alEscalar = output<void>();

  readonly acciones = computed(() => accionesDisponibles(this.ticket(), this.rol()));
  readonly primaria = computed(() => this.acciones().primaria);
  readonly secundarias = computed(() => this.acciones().secundarias);

  ejecutarAccion(accion: AccionTurno): void {
    if (this.procesando()) return;

    switch (accion) {
      case 'TOMAR':
        this.alTomar.emit({ iniciarAtencion: false });
        break;
      case 'TOMAR_Y_COMENZAR':
        this.alTomar.emit({ iniciarAtencion: true });
        break;
      case 'INICIAR':
        this.alIniciar.emit();
        break;
      case 'RESOLVER':
        this.alResolver.emit();
        break;
      case 'ESCALAR':
        this.alEscalar.emit();
        break;
    }
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
        return 'Resolver ticket';
      case 'ESCALAR':
        return 'Escalar a Nivel 2';
      default:
        return 'Continuar';
    }
  }

  iconoAccion(accion: AccionTurno): string {
    switch (accion) {
      case 'TOMAR':
      case 'TOMAR_Y_COMENZAR':
        return 'assignment_turned_in';
      case 'INICIAR':
        return 'play_arrow';
      case 'RESOLVER':
        return 'check_circle';
      case 'ESCALAR':
        return 'arrow_upward';
      default:
        return 'arrow_forward';
    }
  }
}
