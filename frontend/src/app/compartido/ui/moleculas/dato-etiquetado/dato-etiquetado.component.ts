import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-dato-etiquetado',
  standalone: true,
  templateUrl: './dato-etiquetado.component.html',
  styleUrl: './dato-etiquetado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatoEtiquetadoComponent {
  readonly etiqueta = input.required<string>();
  readonly valor = input<string | number | null | undefined>(null);
  readonly monoespaciado = input<boolean>(false);
  readonly orientacion = input<'vertical' | 'horizontal'>('vertical');
}
