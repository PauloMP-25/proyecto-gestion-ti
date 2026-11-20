import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-banner-confirmacion',
  standalone: true,
  imports: [CommonModule, RouterLink, IconoComponent],
  template: `
    @if (conteo() > 0) {
      <aside class="banner-confirmacion" role="status" aria-label="Confirmación de atención pendiente">
        <div class="banner-confirmacion__icono" aria-hidden="true">
          <app-icono nombre="notification_important" tamano="md" />
        </div>
        <div class="banner-confirmacion__cuerpo">
          <h3 class="banner-confirmacion__titulo">
            {{ conteo() === 1 ? '1 solicitud ya fue atendida' : conteo() + ' solicitudes ya fueron atendidas' }}
          </h3>
          <p class="banner-confirmacion__texto">
            El personal de soporte técnico reportó la solución. Necesitamos su confirmación para verificar que el servicio esté funcionando correctamente.
          </p>
        </div>
        <div class="banner-confirmacion__accion">
          <a
            routerLink="/portal/mis-solicitudes"
            [queryParams]="{ filtro: 'POR_CONFIRMAR' }"
            class="banner-confirmacion__btn"
          >
            Revisar ahora
          </a>
        </div>
      </aside>
    }
  `,
  styles: [`
    .banner-confirmacion {
      display: flex;
      align-items: center;
      gap: var(--espacio-md);
      padding: var(--espacio-md) var(--prim-espacio-5);
      background-color: var(--comp-banner-aviso-bg);
      border: 1px solid var(--comp-banner-aviso-borde);
      border-left: var(--espacio-2xs) solid var(--comp-banner-aviso-acento);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      margin-bottom: var(--prim-espacio-5);

      &__icono {
        color: var(--comp-banner-aviso-icono);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &__cuerpo {
        flex: 1;
      }

      &__titulo {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-bold);
        color: var(--comp-banner-aviso-titulo);
        margin: 0 0 var(--espacio-2xs);
      }

      &__texto {
        font-size: var(--font-size-sm);
        color: var(--comp-banner-aviso-texto);
        margin: 0;
        line-height: var(--text-caption-lh);
      }

      &__accion {
        flex-shrink: 0;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: var(--touch-min);
        padding: var(--espacio-xs) var(--espacio-md);
        background-color: var(--comp-banner-aviso-boton-bg);
        color: var(--comp-banner-aviso-boton-texto);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        text-decoration: none;
        border-radius: var(--radius-md);
        transition: background-color var(--transition-fast);

        &:hover {
          background-color: var(--comp-banner-aviso-boton-hover-bg);
        }

        &:focus-visible {
          outline: var(--foco-anillo);
          outline-offset: var(--foco-offset);
        }
      }
    }

    @media (max-width: 599.98px) {
      .banner-confirmacion {
        flex-direction: column;
        align-items: flex-start;

        &__btn {
          width: 100%;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerConfirmacionComponent {
  readonly conteo = input.required<number>();
}
