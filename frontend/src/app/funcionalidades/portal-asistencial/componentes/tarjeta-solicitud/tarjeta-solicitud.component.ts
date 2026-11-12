import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SolicitudResumen } from '../../modelos/solicitud.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-tarjeta-solicitud',
  standalone: true,
  imports: [CommonModule, RouterLink, IconoComponent],
  templateUrl: './tarjeta-solicitud.component.html',
  styleUrl: './tarjeta-solicitud.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaSolicitudComponent {
  readonly solicitud = input.required<SolicitudResumen>();

  readonly etapaTexto = computed(() => {
    switch (this.solicitud().etapa) {
      case 'REGISTRADO': return 'Registrado';
      case 'EN_ATENCION': return 'En atención';
      case 'RESUELTO': return 'Resuelto';
      case 'CERRADO': return 'Cerrado';
    }
  });

  readonly iconoEtapa = computed(() => {
    switch (this.solicitud().etapa) {
      case 'REGISTRADO': return 'fiber_manual_record';
      case 'EN_ATENCION': return 'sync';
      case 'RESUELTO': return 'task_alt';
      case 'CERRADO': return 'check_circle';
    }
  });
}
