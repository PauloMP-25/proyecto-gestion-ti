import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-marca-hospital',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="marca-hospital" [class.marca-hospital--compacto]="modoCompacto()">
      <img
        [src]="logoSrc()"
        alt="Logo Hospital Santa María del Socorro"
        class="marca-hospital__logo"
      />
      @if (!modoCompacto()) {
        <div class="marca-hospital__textos">
          <span class="marca-hospital__titulo">Hospital Santa María del Socorro</span>
          <span class="marca-hospital__subtitulo">{{ subtitulo() }}</span>
        </div>
      }
    </div>
  `,
  styleUrl: './marca-hospital.component.scss',
})
export class MarcaHospitalComponent {
  readonly modoCompacto = input(false);
  readonly subtitulo = input('Mesa de Ayuda');
  readonly logoSrc = input('assets/logo.ico');
}
