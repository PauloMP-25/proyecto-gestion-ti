import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Ticket } from '../../../../compartido/modelos/ticket.model';
import { SolicitudFormularioComponent } from '../../componentes/solicitud-formulario/solicitud-formulario.component';

@Component({
  selector: 'app-solicitud-crear',
  imports: [RouterLink, SolicitudFormularioComponent],
  templateUrl: './solicitud-crear.component.html',
  styleUrl: './solicitud-crear.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudCrearComponent {
  private readonly router = inject(Router);

  readonly ticketCreado = signal<Ticket | null>(null);

  alRegistrar(ticket: Ticket): void {
    this.ticketCreado.set(ticket);
    window.scrollTo({ top: 0 });
  }

  registrarOtro(): void {
    this.ticketCreado.set(null);
  }

  cancelar(): void {
    this.router.navigate(['/incidentes/mis-tickets']);
  }
}