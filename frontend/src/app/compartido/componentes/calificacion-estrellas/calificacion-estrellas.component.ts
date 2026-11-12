import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  HostListener,
  input,
  output,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconoComponent } from '../../ui/atomos/icono/icono.component';

export type PuntuacionEstrellas = 1 | 2 | 3 | 4 | 5;

const TEXTO_CALIFICACION: Record<PuntuacionEstrellas, string> = {
  1: 'Muy insatisfecho',
  2: 'Insatisfecho',
  3: 'Aceptable',
  4: 'Satisfecho',
  5: 'Excelente atención',
};

@Component({
  selector: 'app-calificacion-estrellas',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CalificacionEstrellasComponent),
      multi: true,
    },
  ],
  templateUrl: './calificacion-estrellas.component.html',
  styleUrl: './calificacion-estrellas.component.scss',
})
export class CalificacionEstrellasComponent implements ControlValueAccessor {
  readonly valorInicial = input<number | null>(null);
  readonly calificacionSeleccionada = output<number>();

  readonly valor = signal<PuntuacionEstrellas | null>(null);
  readonly deshabilitado = signal<boolean>(false);
  readonly valorHover = signal<PuntuacionEstrellas | null>(null);

  readonly estrellas: readonly PuntuacionEstrellas[] = [1, 2, 3, 4, 5];

  readonly valorActivo = computed(() => this.valorHover() ?? this.valor());

  readonly textoVisible = computed(() => {
    const v = this.valorActivo();
    return v ? `${v} de 5: ${TEXTO_CALIFICACION[v]}` : 'Seleccione una calificación del 1 al 5';
  });

  private onChange: (val: PuntuacionEstrellas | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: PuntuacionEstrellas | null): void {
    this.valor.set(val);
  }

  registerOnChange(fn: (val: PuntuacionEstrellas | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.deshabilitado.set(isDisabled);
  }

  constructor() {
    effect(() => {
      const v = this.valorInicial();
      if (v && v >= 1 && v <= 5) {
        this.valor.set(v as PuntuacionEstrellas);
      }
    });
  }

  seleccionar(p: PuntuacionEstrellas): void {
    if (this.deshabilitado()) return;
    this.valor.set(p);
    this.onChange(p);
    this.onTouched();
    this.calificacionSeleccionada.emit(p);
  }

  hover(p: PuntuacionEstrellas): void {
    if (!this.deshabilitado()) {
      this.valorHover.set(p);
    }
  }

  limpiarHover(): void {
    this.valorHover.set(null);
  }

  etiquetaEstrella(n: PuntuacionEstrellas): string {
    return `${n} estrellas, ${TEXTO_CALIFICACION[n]}`;
  }

  @HostListener('keydown', ['$event'])
  manejarTeclado(event: KeyboardEvent): void {
    if (this.deshabilitado()) return;

    const actual = this.valor() || 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      const siguiente = Math.min(5, actual + 1) as PuntuacionEstrellas;
      this.seleccionar(siguiente || 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      const anterior = Math.max(1, actual - 1) as PuntuacionEstrellas;
      this.seleccionar(anterior);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.seleccionar(1);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.seleccionar(5);
    } else if (['1', '2', '3', '4', '5'].includes(event.key)) {
      event.preventDefault();
      this.seleccionar(Number(event.key) as PuntuacionEstrellas);
    }
  }
}
