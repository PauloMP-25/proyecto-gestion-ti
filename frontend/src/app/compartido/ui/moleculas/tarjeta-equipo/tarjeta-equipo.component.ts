import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtiquetaIpComponent } from '../../atomos/etiqueta-ip/etiqueta-ip.component';

export interface EquipoTarjetaDatos {
  readonly id: number;
  readonly codigoInventario: string;
  readonly tipo: 'COMPUTADORA' | 'IMPRESORA' | string;
  readonly marcaModelo?: string | null;
  readonly referenciaUbicacion?: string | null;
  readonly ipVigente?: string | null;
  readonly estado?: string | null;
}

@Component({
  selector: 'app-tarjeta-equipo',
  standalone: true,
  imports: [CommonModule, EtiquetaIpComponent],
  template: `
    <article class="tarjeta-equipo">
      <div class="tarjeta-equipo__cabecera">
        <div class="tarjeta-equipo__tipo">
          <span class="icono-tipo" aria-hidden="true">
            {{ esImpresora() ? 'print' : 'computer' }}
          </span>
          <span class="tarjeta-equipo__codigo">{{ datos().codigoInventario }}</span>
        </div>
        @if (datos().estado) {
          <span class="tarjeta-equipo__estado">{{ datos().estado }}</span>
        }
      </div>

      <div class="tarjeta-equipo__cuerpo">
        @if (datos().marcaModelo) {
          <p class="tarjeta-equipo__modelo">{{ datos().marcaModelo }}</p>
        }
        @if (datos().referenciaUbicacion) {
          <p class="tarjeta-equipo__ubicacion">
            <span class="icono-ubicacion" aria-hidden="true">place</span>
            <span>{{ datos().referenciaUbicacion }}</span>
          </p>
        }
      </div>

      <div class="tarjeta-equipo__pie">
        @if (datos().ipVigente) {
          <app-etiqueta-ip [ip]="datos().ipVigente"></app-etiqueta-ip>
        } @else {
          <span class="tarjeta-equipo__sin-ip">Sin IP asignada</span>
        }
      </div>
    </article>
  `,
  styles: [`
    :host {
      display: block;
    }

    .tarjeta-equipo {
      background-color: var(--color-surface-card);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg);
      padding: var(--espacio-4);
      display: flex;
      flex-direction: column;
      gap: var(--espacio-3);
      box-shadow: var(--shadow-sm);
      transition: transform var(--trans-fast), box-shadow var(--trans-fast), border-color var(--trans-fast);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: var(--color-border-strong);
      }

      &__cabecera {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--espacio-2);
      }

      &__tipo {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
      }

      &__codigo {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-sm);
        color: var(--color-text-main);
      }

      &__estado {
        font-size: var(--font-size-xs);
        padding: var(--espacio-2xs) var(--espacio-xs);
        border-radius: var(--radius-sm);
        background-color: var(--color-surface-sunken);
        color: var(--color-text-muted);
        font-weight: var(--font-weight-medium);
      }

      &__cuerpo {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-xs);
      }

      &__modelo {
        margin: 0;
        font-size: var(--font-size-xs);
        color: var(--color-text-main);
      }

      &__ubicacion {
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--espacio-xs);
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      &__pie {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: auto;
        padding-top: var(--espacio-2);
        border-top: 1px dashed var(--color-border-subtle);
      }

      &__sin-ip {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-style: italic;
      }

      .icono-tipo,
      .icono-ubicacion {
        font-family: 'Material Symbols Outlined', sans-serif;
        font-size: var(--font-size-sm);
      }

      .icono-tipo {
        color: var(--color-primary-base);
        font-size: var(--font-size-md);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaEquipoComponent {
  readonly datos = input.required<EquipoTarjetaDatos>();

  esImpresora(): boolean {
    return this.datos().tipo === 'IMPRESORA';
  }
}
