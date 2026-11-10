import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SolicitudFormularioComponent } from '../../componentes/solicitud-formulario/solicitud-formulario.component';
import { SolicitudRegistradaRespuesta } from '../../modelos/solicitud.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';

@Component({
  selector: 'app-solicitud-crear',
  standalone: true,
  imports: [
    CommonModule, 
    SolicitudFormularioComponent, 
    IconoComponent, 
    BotonComponent
  ],
  templateUrl: './solicitud-crear.component.html',
  styleUrl: './solicitud-crear.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudCrearComponent {
  private router = inject(Router);

  ticketCreado = signal<SolicitudRegistradaRespuesta | null>(null);

  onTicketRegistrado(ticket: SolicitudRegistradaRespuesta): void {
    this.ticketCreado.set(ticket);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverAlPanel(): void {
    this.router.navigate(['/panel-control']);
  }

  registrarOtro(): void {
    this.ticketCreado.set(null);
  }
}
