import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { BotonIconoComponent } from '../../atomos/boton-icono/boton-icono.component';

export type TonoAlerta = 'exito' | 'info' | 'aviso' | 'peligro';

@Component({
  selector: 'app-alerta-en-linea',
  standalone: true,
  imports: [IconoComponent, BotonIconoComponent],
  templateUrl: './alerta-en-linea.component.html',
  styleUrl: './alerta-en-linea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertaEnLineaComponent {
  readonly tono = input<TonoAlerta>('info');
  readonly icono = input<string | undefined>(undefined);
  readonly descartable = input<boolean>(false);

  readonly alDescartar = output<void>();

  readonly iconoEfectivo = computed(() => {
    const iconProp = this.icono();
    if (iconProp) return iconProp;
    switch (this.tono()) {
      case 'exito':
        return 'check_circle';
      case 'aviso':
        return 'warning';
      case 'peligro':
        return 'error';
      case 'info':
      default:
        return 'info';
    }
  });

  readonly roleAria = computed(() => {
    return this.tono() === 'peligro' ? 'alert' : 'status';
  });

  readonly ariaLive = computed(() => {
    return this.tono() === 'peligro' ? 'assertive' : 'polite';
  });
}
