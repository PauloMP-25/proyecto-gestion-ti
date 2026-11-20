import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-info-soporte-pie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sidebar-footer" [class.oculto-colapsado]="colapsado()">
      <div class="sla-soporte-info">
        <span class="material-symbols-outlined icono-help" aria-hidden="true">headset_mic</span>
        <div class="soporte-detalles">
          <span class="titulo-soporte">{{ titulo() }}</span>
          <span class="anexo-soporte">Anexo interno: {{ anexo() }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrl: './info-soporte-pie.component.scss',
})
export class InfoSoportePieComponent {
  readonly colapsado = input(false);
  readonly titulo = input('Mesa de Ayuda TI');
  readonly anexo = input('2400');
}
