import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextoAtencion, ObjetivoFalla } from '../../../../funcionalidades/portal-asistencial/modelos/contexto-atencion.model';
import { IconoComponent } from '../../atomos/icono/icono.component';

export interface SeleccionObjetivo {
  readonly objetivo: ObjetivoFalla;
  readonly idImpresora?: number | null;
}

@Component({
  selector: 'app-selector-objetivo-falla',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  template: `
    <section class="selector-objetivo" aria-labelledby="titulo-objetivo-falla">
      <div class="selector-objetivo__cabecera">
        <app-icono nombre="help" tamano="sm"></app-icono>
        <h3 id="titulo-objetivo-falla" class="selector-objetivo__titulo">
          ¿Dónde está la falla?
        </h3>
      </div>
      <p class="selector-objetivo__ayuda">
        Indique el equipo que presenta el inconveniente para agilizar la atención del técnico.
      </p>

      <div class="selector-objetivo__opciones" role="radiogroup" aria-labelledby="titulo-objetivo-falla">
        <!-- Opción 1: Computadora actual -->
        @if (tieneEquipo()) {
          <div
            class="opcion-card"
            [class.opcion-card--seleccionada]="esEquipoActual()"
            role="radio"
            [attr.aria-checked]="esEquipoActual()"
            tabindex="0"
            (click)="seleccionarEquipoActual()"
            (keydown.space)="seleccionarEquipoActual(); $event.preventDefault()"
            (keydown.enter)="seleccionarEquipoActual(); $event.preventDefault()"
          >
            <div class="opcion-card__radio">
              <span class="circulo-radio" [class.circulo-radio--activo]="esEquipoActual()"></span>
            </div>
            <div class="opcion-card__icono">
              <app-icono nombre="computer" tamano="md"></app-icono>
            </div>
            <div class="opcion-card__info">
              <span class="opcion-card__titulo">
                En esta computadora ({{ contexto()?.equipo?.codigoInventario }})
              </span>
              @if (contexto()?.equipo?.referenciaUbicacion) {
                <span class="opcion-card__subtitulo">
                  {{ contexto()?.equipo?.referenciaUbicacion }}
                </span>
              }
            </div>
          </div>
        }

        <!-- Opción 2: Impresoras del área -->
        @for (imp of impresoras(); track imp.id) {
          <div
            class="opcion-card"
            [class.opcion-card--seleccionada]="esImpresora(imp.id)"
            role="radio"
            [attr.aria-checked]="esImpresora(imp.id)"
            tabindex="0"
            (click)="seleccionarImpresora(imp.id)"
            (keydown.space)="seleccionarImpresora(imp.id); $event.preventDefault()"
            (keydown.enter)="seleccionarImpresora(imp.id); $event.preventDefault()"
          >
            <div class="opcion-card__radio">
              <span class="circulo-radio" [class.circulo-radio--activo]="esImpresora(imp.id)"></span>
            </div>
            <div class="opcion-card__icono">
              <app-icono nombre="print" tamano="md"></app-icono>
            </div>
            <div class="opcion-card__info">
              <span class="opcion-card__titulo">
                Impresora {{ imp.codigoInventario }}
              </span>
              <span class="opcion-card__subtitulo">
                {{ imp.referenciaUbicacion || imp.nombre }}
              </span>
            </div>
          </div>
        }

        <!-- Opción 3: Otro equipo / No estoy seguro -->
        <div
          class="opcion-card"
          [class.opcion-card--seleccionada]="esOtro()"
          role="radio"
          [attr.aria-checked]="esOtro()"
          tabindex="0"
          (click)="seleccionarOtro()"
          (keydown.space)="seleccionarOtro(); $event.preventDefault()"
          (keydown.enter)="seleccionarOtro(); $event.preventDefault()"
        >
          <div class="opcion-card__radio">
            <span class="circulo-radio" [class.circulo-radio--activo]="esOtro()"></span>
          </div>
          <div class="opcion-card__icono">
            <app-icono nombre="devices" tamano="md"></app-icono>
          </div>
          <div class="opcion-card__info">
            <span class="opcion-card__titulo">Otro equipo o no estoy seguro(a)</span>
            <span class="opcion-card__subtitulo">
              Falla de sistema, red, equipo de otra oficina o periférico
            </span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .selector-objetivo {
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--espacio-4);

      &__cabecera {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
        color: var(--color-primary-base);
        margin-bottom: var(--espacio-1);
      }

      &__titulo {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-main);
      }

      &__ayuda {
        margin: 0 0 var(--espacio-4);
        font-size: 0.88rem;
        color: var(--color-text-muted);
      }

      &__opciones {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-3);
      }
    }

    .opcion-card {
      display: flex;
      align-items: center;
      gap: var(--espacio-3);
      padding: var(--espacio-3) var(--espacio-4);
      min-height: var(--touch-min, 44px);
      background-color: var(--color-surface-sunken);
      border: 2px solid var(--color-border-subtle);
      border-radius: var(--radius-md);
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease-in-out;

      &:hover {
        background-color: var(--color-surface-hover);
        border-color: var(--color-border-strong);
      }

      &:focus-visible {
        outline: 2px solid var(--color-primary-base);
        outline-offset: 2px;
      }

      &--seleccionada {
        background-color: var(--comp-objetivo-falla-seleccion-bg, var(--color-secondary-light));
        border-color: var(--comp-objetivo-falla-seleccion-borde, var(--color-secondary-base));
      }

      &__radio {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      &__icono {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
        flex-shrink: 0;
      }

      &__info {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-1);
        min-width: 0;
      }

      &__titulo {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--color-text-main);
      }

      &__subtitulo {
        font-size: 0.82rem;
        color: var(--color-text-muted);
      }
    }

    .circulo-radio {
      display: inline-block;
      width: 1.15rem;
      height: 1.15rem;
      border: 2px solid var(--color-border-strong);
      border-radius: 50%;
      background-color: var(--color-surface-card);
      position: relative;
      transition: all 0.15s ease-in-out;

      &--activo {
        border-color: var(--color-secondary-base);

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 0.55rem;
          height: 0.55rem;
          background-color: var(--color-secondary-base);
          border-radius: 50%;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorObjetivoFallaComponent {
  readonly contexto = input<ContextoAtencion | null>(null);
  readonly objetivo = input<ObjetivoFalla>('EQUIPO_ACTUAL');
  readonly idImpresora = input<number | null>(null);

  readonly seleccionCambiada = output<SeleccionObjetivo>();

  readonly tieneEquipo = computed(() => {
    const c = this.contexto();
    return c?.estadoDeteccion === 'DETECTADO' && !!c.equipo;
  });

  readonly impresoras = computed(() => this.contexto()?.impresorasArea ?? []);

  esEquipoActual(): boolean {
    return this.objetivo() === 'EQUIPO_ACTUAL' && this.tieneEquipo();
  }

  esImpresora(id: number): boolean {
    return this.objetivo() === 'IMPRESORA_AREA' && this.idImpresora() === id;
  }

  esOtro(): boolean {
    return this.objetivo() === 'OTRO' || (!this.tieneEquipo() && this.objetivo() === 'EQUIPO_ACTUAL');
  }

  seleccionarEquipoActual(): void {
    if (!this.tieneEquipo()) return;
    this.seleccionCambiada.emit({ objetivo: 'EQUIPO_ACTUAL', idImpresora: null });
  }

  seleccionarImpresora(id: number): void {
    this.seleccionCambiada.emit({ objetivo: 'IMPRESORA_AREA', idImpresora: id });
  }

  seleccionarOtro(): void {
    this.seleccionCambiada.emit({ objetivo: 'OTRO', idImpresora: null });
  }
}
