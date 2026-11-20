import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';

@Component({
  selector: 'app-etiqueta-ip',
  standalone: true,
  imports: [],
  templateUrl: './etiqueta-ip.component.html',
  styleUrl: './etiqueta-ip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EtiquetaIpComponent {
  readonly ip = input.required<string | null | undefined>();
  readonly copiable = input<boolean>(true);

  readonly copiado = signal<boolean>(false);

  copiar(): void {
    const direccion = this.ip();
    if (!direccion || !navigator.clipboard) return;

    navigator.clipboard.writeText(direccion).then(() => {
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    });
  }
}
