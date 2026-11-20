import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../atomos/avatar/avatar.component';
import { UsuarioSesion } from '../../../../nucleo/modelos/usuario-sesion.model';

@Component({
  selector: 'app-usuario-perfil-menu',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (usuario(); as user) {
      <div class="perfil-menu-container">
        <button
          type="button"
          class="btn-perfil"
          (click)="alternar()"
          [attr.aria-expanded]="abierto()"
          aria-haspopup="true"
        >
          <app-avatar
            [nombre]="user.nombreCompleto"
            [rol]="user.rol"
            tamano="md"
          />

          <div class="perfil-info">
            <span class="perfil-nombre">{{ user.nombreCompleto }}</span>
            <span class="perfil-cargo">{{ user.cargo || 'Colaborador HSMSI' }}</span>
          </div>

          <span class="material-symbols-outlined flecha-desplegable">expand_more</span>
        </button>

        @if (abierto()) {
          <div class="dropdown-perfil" role="menu">
            <div class="dropdown-usuario-resumen">
              <p class="resumen-nombre">{{ user.nombreCompleto }}</p>
              <p class="resumen-correo">{{ user.correo }}</p>
              <span class="resumen-rol">{{ user.cargo || 'Colaborador HSMSI' }}</span>
            </div>

            <div class="dropdown-divisor"></div>

            <button
              type="button"
              class="dropdown-item item-logout"
              (click)="cerrarSesionAccion()"
              role="menuitem"
            >
              <span class="material-symbols-outlined">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './usuario-perfil-menu.component.scss',
})
export class UsuarioPerfilMenuComponent {
  readonly usuario = input<UsuarioSesion | null | undefined>(null);
  readonly cerrarSesion = output<void>();

  readonly abierto = signal(false);

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  cerrarSesionAccion(): void {
    this.abierto.set(false);
    this.cerrarSesion.emit();
  }
}
