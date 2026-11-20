import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

export type TamanoAvatar = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="avatar"
      [class]="'avatar avatar--' + tamano() + ' ' + claseRol()"
      [attr.data-rol]="rol() ?? 'USUARIO_FINAL'"
      aria-hidden="true"
    >
      {{ iniciales() }}
    </div>
  `,
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly nombre = input<string | null | undefined>('');
  readonly rol = input<RolUsuario | string | null | undefined>(null);
  readonly tamano = input<TamanoAvatar>('md');

  protected readonly iniciales = computed(() => {
    const n = this.nombre()?.trim();
    if (!n) return 'U';
    const partes = n.split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0].slice(0, 2).toUpperCase();
  });

  protected readonly claseRol = computed(() => {
    const r = this.rol();
    switch (r) {
      case RolUsuario.ADMINISTRADOR:
      case 'ADMINISTRADOR':
        return 'avatar--admin';
      case RolUsuario.PRACTICANTE:
      case 'PRACTICANTE':
        return 'avatar--practicante';
      case RolUsuario.USUARIO_FINAL:
      case 'USUARIO_FINAL':
      default:
        return 'avatar--usuario';
    }
  });
}
