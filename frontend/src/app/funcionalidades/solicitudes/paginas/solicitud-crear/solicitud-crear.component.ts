import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Ticket } from '../../../../compartido/modelos/ticket.model';
import { SolicitudFormularioComponent } from '../../componentes/solicitud-formulario/solicitud-formulario.component';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

@Component({
  selector: 'app-solicitud-crear',
  standalone: true,
  imports: [RouterLink, SolicitudFormularioComponent],
  templateUrl: './solicitud-crear.component.html',
  styleUrl: './solicitud-crear.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudCrearComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly ticketCreado = signal<Ticket | null>(null);

  readonly esUsuarioFinal = computed(
    () => this.authService.rolActual() === RolUsuario.USUARIO_FINAL
  );

  readonly rutaMisSolicitudes = computed(() =>
    this.esUsuarioFinal() ? '/portal/mis-solicitudes' : '/incidentes/mis-tickets'
  );

  readonly textoMisSolicitudes = computed(() =>
    this.esUsuarioFinal() ? 'Ver mis solicitudes' : 'Ver mis tickets'
  );

  alRegistrar(ticket: Ticket): void {
    this.ticketCreado.set(ticket);
    window.scrollTo({ top: 0 });
  }

  registrarOtro(): void {
    this.ticketCreado.set(null);
  }

  cancelar(): void {
    this.router.navigate([this.rutaMisSolicitudes()]);
  }
}