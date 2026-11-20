import { Directive, TemplateRef, ViewContainerRef, inject, effect, input } from '@angular/core';
import { AuthService } from './auth.service';
import { RolUsuario } from '../modelos/rol.enum';

@Directive({
  selector: '[appTieneRol]',
  standalone: true,
})
export class TieneRolDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly roles = input<RolUsuario | RolUsuario[]>([], { alias: 'appTieneRol' });
  private visible = false;

  constructor() {
    effect(() => {
      const rolesInput = this.roles();
      const rolesPermitidos = Array.isArray(rolesInput) ? rolesInput : [rolesInput];
      const rolActual = this.authService.rolActual();
      const tienePermiso = rolActual !== null && rolesPermitidos.includes(rolActual);

      if (tienePermiso && !this.visible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.visible = true;
      } else if (!tienePermiso && this.visible) {
        this.viewContainer.clear();
        this.visible = false;
      }
    });
  }
}
