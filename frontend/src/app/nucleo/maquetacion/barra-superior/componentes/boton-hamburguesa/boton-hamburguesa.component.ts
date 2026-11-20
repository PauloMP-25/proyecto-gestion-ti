import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-boton-hamburguesa',
  standalone: true,
  templateUrl: './boton-hamburguesa.component.html',
  styleUrl: './boton-hamburguesa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonHamburguesaComponent {
  readonly expandido = input<boolean>(false);
  readonly alAlternar = output<void>();
}
