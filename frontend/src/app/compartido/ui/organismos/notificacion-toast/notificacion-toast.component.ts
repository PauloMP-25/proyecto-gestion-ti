import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-notificacion-toast',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './notificacion-toast.component.html',
  styleUrl: './notificacion-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificacionToastComponent {
  readonly notificacion = inject(NotificacionService);
}