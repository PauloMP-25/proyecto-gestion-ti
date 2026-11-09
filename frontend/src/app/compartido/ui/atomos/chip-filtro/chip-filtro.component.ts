import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'app-chip-filtro',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './chip-filtro.component.html',
  styleUrl: './chip-filtro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipFiltroComponent {
  readonly etiqueta = input.required<string>();
  readonly activo = input<boolean>(false);
  readonly conteo = input<number | undefined>(undefined);
  readonly icono = input<string | undefined>(undefined);

  readonly alHacerClick = output<void>();

  onClick(): void {
    this.alHacerClick.emit();
  }
}
