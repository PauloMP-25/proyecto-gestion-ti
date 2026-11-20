import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-marca-hospital',
  standalone: true,
  templateUrl: './marca-hospital.component.html',
  styleUrl: './marca-hospital.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarcaHospitalComponent {
  readonly modoCompacto = input<boolean>(false);
  readonly subtitulo = input<string>('Mesa de Ayuda');
  readonly logoSrc = input<string>('assets/logo.ico');
}
