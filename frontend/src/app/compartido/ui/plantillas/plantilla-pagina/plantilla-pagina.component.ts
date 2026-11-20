import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AnchoMaximoPagina = 'sm' | 'md' | 'lg' | 'completo';

@Component({
  selector: 'app-plantilla-pagina',
  standalone: true,
  templateUrl: './plantilla-pagina.component.html',
  styleUrl: './plantilla-pagina.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlantillaPaginaComponent {
  readonly anchoMaximo = input<AnchoMaximoPagina>('lg');
  readonly conPadding = input<boolean>(true);
}
