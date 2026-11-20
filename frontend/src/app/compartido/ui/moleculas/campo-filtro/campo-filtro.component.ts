import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface OpcionFiltro<V = unknown> {
  valor: V;
  etiqueta: string;
}

@Component({
  selector: 'app-campo-filtro',
  standalone: true,
  templateUrl: './campo-filtro.component.html',
  styleUrl: './campo-filtro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampoFiltroComponent {
  protected readonly String = String;
  protected readonly Boolean = Boolean;

  readonly tipo = input<'seleccion' | 'casilla'>('seleccion');
  readonly etiqueta = input.required<string>();
  readonly opciones = input<readonly OpcionFiltro[]>([]);
  readonly textoTodos = input<string>('Todos');
  readonly id = input<string>(`filtro-${Math.random().toString(36).substring(2, 9)}`);

  readonly valor = model<unknown>(null);

  alCambiarSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const rawVal = target.value;
    if (rawVal === '' || rawVal === 'null') {
      this.valor.set(null);
      return;
    }

    const opcion = this.opciones().find(op => String(op.valor) === rawVal);
    this.valor.set(opcion ? opcion.valor : rawVal);
  }

  alCambiarCheckbox(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valor.set(target.checked);
  }
}
