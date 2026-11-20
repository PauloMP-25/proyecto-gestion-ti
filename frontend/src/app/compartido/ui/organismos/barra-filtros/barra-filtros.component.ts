import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { InsigniaComponent } from '../../atomos/insignia/insignia.component';

@Component({
  selector: 'app-barra-filtros',
  standalone: true,
  imports: [IconoComponent, InsigniaComponent],
  templateUrl: './barra-filtros.component.html',
  styleUrl: './barra-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarraFiltrosComponent {
  protected readonly String = String;
  private destroyRef = inject(DestroyRef);
  private debounceTimer?: ReturnType<typeof setTimeout>;

  readonly busqueda = model<string>('');
  readonly placeholder = input<string>('Buscar...');
  readonly mostrarBuscador = input<boolean>(true);
  readonly retardoMs = input<number>(300);
  readonly filtrosActivos = input<number>(0);

  readonly alLimpiar = output<void>();

  readonly valorInput = signal<string>(this.busqueda() || '');
  readonly filtrosMovilAbiertos = signal<boolean>(false);

  constructor() {
    effect(() => {
      const ext = this.busqueda();
      if (ext !== this.valorInput()) {
        this.valorInput.set(ext);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
    });
  }

  onInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.valorInput.set(valor);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.busqueda.set(valor);
    }, this.retardoMs());
  }

  limpiarBusqueda(): void {
    this.valorInput.set('');
    this.busqueda.set('');
  }

  alternarFiltrosMovil(): void {
    this.filtrosMovilAbiertos.update(v => !v);
  }

  limpiarTodos(): void {
    this.limpiarBusqueda();
    this.alLimpiar.emit();
  }
}
