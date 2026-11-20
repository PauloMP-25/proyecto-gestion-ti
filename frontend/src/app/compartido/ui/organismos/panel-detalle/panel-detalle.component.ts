import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { BotonIconoComponent } from '../../atomos/boton-icono/boton-icono.component';

export type ModoPanelDetalle = 'lateral' | 'en-linea';
export type AnchoPanelDetalle = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-panel-detalle',
  standalone: true,
  imports: [IconoComponent, BotonIconoComponent],
  templateUrl: './panel-detalle.component.html',
  styleUrl: './panel-detalle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class PanelDetalleComponent {
  private elementRef = inject(ElementRef);

  readonly abierto = model<boolean>(false);
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | undefined>(undefined);
  readonly icono = input<string | undefined>(undefined);
  readonly modo = input<ModoPanelDetalle>('lateral');
  readonly ancho = input<AnchoPanelDetalle>('md');

  readonly alCerrar = output<void>();

  cerrar(): void {
    this.abierto.set(false);
    this.alCerrar.emit();
  }

  onEscape(): void {
    if (this.abierto()) {
      this.cerrar();
    }
  }

  onBackdropClick(): void {
    this.cerrar();
  }
}
