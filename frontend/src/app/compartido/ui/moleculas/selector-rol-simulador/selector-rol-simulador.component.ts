import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

@Component({
  selector: 'app-selector-rol-simulador',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rol-switcher-container">
      <button
        type="button"
        class="btn-cambiar-rol"
        (click)="alternar()"
        aria-haspopup="true"
        [attr.aria-expanded]="abierto()"
        title="Cambiar rol activo para pruebas"
      >
        <span class="material-symbols-outlined icono-swap">swap_horiz</span>
        <span class="texto-cambiar-rol">Simular Rol</span>
      </button>

      @if (abierto()) {
        <div class="dropdown-selector-rol" role="menu">
          <div class="dropdown-header">Seleccionar Rol RBAC</div>

          <button
            type="button"
            class="opcion-rol"
            [class.seleccionada]="rolActivo() === RolUsuario.USUARIO_FINAL"
            (click)="seleccionar(RolUsuario.USUARIO_FINAL)"
            role="menuitem"
          >
            <span class="material-symbols-outlined">person</span>
            <div class="info-rol">
              <strong>Usuario Final</strong>
              <span>Personal Asistencial / Médico</span>
            </div>
          </button>

          <button
            type="button"
            class="opcion-rol"
            [class.seleccionada]="rolActivo() === RolUsuario.PRACTICANTE"
            (click)="seleccionar(RolUsuario.PRACTICANTE)"
            role="menuitem"
          >
            <span class="material-symbols-outlined">support_agent</span>
            <div class="info-rol">
              <strong>Practicante N1</strong>
              <span>Mesa de Ayuda / FCR</span>
            </div>
          </button>

          <button
            type="button"
            class="opcion-rol"
            [class.seleccionada]="rolActivo() === RolUsuario.ADMINISTRADOR"
            (click)="seleccionar(RolUsuario.ADMINISTRADOR)"
            role="menuitem"
          >
            <span class="material-symbols-outlined">admin_panel_settings</span>
            <div class="info-rol">
              <strong>Administrador TI</strong>
              <span>Soporte N2 / Jefatura</span>
            </div>
          </button>
        </div>
      }
    </div>
  `,
  styleUrl: './selector-rol-simulador.component.scss',
})
export class SelectorRolSimuladorComponent {
  readonly rolActivo = input<RolUsuario | string | null | undefined>(null);
  readonly cambioRol = output<RolUsuario>();

  readonly abierto = signal(false);
  readonly RolUsuario = RolUsuario;

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  seleccionar(rol: RolUsuario): void {
    this.abierto.set(false);
    this.cambioRol.emit(rol);
  }
}
