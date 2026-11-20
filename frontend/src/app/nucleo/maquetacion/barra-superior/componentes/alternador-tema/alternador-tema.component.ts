import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { TemaService } from '../../../../servicios/tema.service';

@Component({
  selector: 'app-alternador-tema',
  standalone: true,
  imports: [BotonIconoComponent],
  templateUrl: './alternador-tema.component.html',
  styleUrl: './alternador-tema.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlternadorTemaComponent {
  private temaService = inject(TemaService);

  readonly tema = this.temaService.tema;

  alternar(): void {
    this.temaService.alternarTema();
  }
}
