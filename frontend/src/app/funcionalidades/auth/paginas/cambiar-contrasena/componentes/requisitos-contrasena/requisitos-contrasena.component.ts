import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-requisitos-contrasena',
  standalone: true,
  templateUrl: './requisitos-contrasena.component.html',
  styleUrl: './requisitos-contrasena.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequisitosContrasenaComponent {
  readonly contrasena = input<string>('');

  readonly tieneLongitudMinima = computed(() => {
    return (this.contrasena() || '').length >= 8;
  });

  readonly tieneMayuscula = computed(() => {
    return /[A-Z]/.test(this.contrasena() || '');
  });

  readonly tieneMinuscula = computed(() => {
    return /[a-z]/.test(this.contrasena() || '');
  });

  readonly tieneNumero = computed(() => {
    return /\d/.test(this.contrasena() || '');
  });
}
