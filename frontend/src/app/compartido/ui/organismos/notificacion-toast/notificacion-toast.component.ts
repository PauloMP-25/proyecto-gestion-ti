import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { NotificacionService } from '../../../../nucleo/servicios/notificacion.service';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-notificacion-toast',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-contenedor" aria-live="polite">
      @for (n of notificacion.notificaciones(); track n.id) {
        <div class="toast" [class]="'toast toast--' + n.tipo" role="status">
          <app-icono [nombre]="n.tipo === 'exito' ? 'check_circle' : n.tipo === 'error' ? 'error' : 'info'" tamano="sm"></app-icono>
          <span class="toast__texto">{{ n.texto }}</span>
          <button type="button" class="toast__cerrar" (click)="notificacion.cerrar(n.id)" aria-label="Cerrar notificación">
            <app-icono nombre="close" tamano="xs"></app-icono>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-contenedor {
      position: fixed;
      bottom: var(--espacio-4);
      right: var(--espacio-4);
      left: var(--espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--espacio-2);
      z-index: 1000;
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: var(--espacio-2);
      align-self: flex-end;
      max-width: 420px;
      padding: var(--espacio-3) var(--espacio-4);
      border-radius: var(--radius-md);
      border: 1px solid;
      box-shadow: var(--shadow-lg);
      background-color: var(--color-surface-card);
      color: var(--color-text-main);
      pointer-events: auto;
    }
    .toast--exito { border-color: var(--sla-ok-border); }
    .toast--exito app-icono { color: var(--sla-ok-border); }
    .toast--error { border-color: var(--sla-venc-border); }
    .toast--error app-icono { color: var(--sla-venc-border); }
    .toast--info { border-color: var(--color-border-strong); }
    .toast__texto { flex: 1; font-size: 0.9rem; }
    .toast__cerrar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
      min-height: 44px;
      margin: -12px;
      border: none;
      background: none;
      cursor: pointer;
      color: var(--color-text-muted);
    }
    @media (min-width: 768px) {
      .toast-contenedor { left: auto; }
    }
  `],
})
export class NotificacionToastComponent {
  readonly notificacion = inject(NotificacionService);
}