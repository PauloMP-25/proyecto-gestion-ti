import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-cabecera-pagina',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './cabecera-pagina.component.html',
  styleUrl: './cabecera-pagina.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraPaginaComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string | undefined>(undefined);
  readonly icono = input<string | undefined>(undefined);
  readonly nivelTitulo = input<1 | 2>(1);
}
