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
      gap: 16px;
      padding: 16px 20px;
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 6px solid #f59e0b;
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      margin-bottom: 20px;

      &__icono {
        color: #d97706;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      &__cuerpo {
        flex: 1;
      }

      &__titulo {
        font-size: 1rem;
        font-weight: 700;
        color: #92400e;
        margin: 0 0 4px;
      }

      &__texto {
        font-size: 0.875rem;
        color: #78350f;
        margin: 0;
        line-height: 1.4;
      }

      &__accion {
        flex-shrink: 0;
      }

      &__btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 8px 16px;
        background-color: #d97706;
        color: #ffffff;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        border-radius: var(--radius-md, 8px);
        transition: background-color 0.15s ease;

        &:hover {
          background-color: #b45309;
        }

        &:focus-visible {
          outline: 3px solid #1b5e20;
          outline-offset: 2px;
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
