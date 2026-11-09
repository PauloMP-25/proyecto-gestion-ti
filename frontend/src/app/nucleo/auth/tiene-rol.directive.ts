import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect } from '@angular/core';
import { AuthService } from './auth.service';
import { RolUsuario } from '../modelos/rol.enum';

@Directive({
  selector: '[appTieneRol]',
  standalone: true,
})
export class TieneRolDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private rolesPermitidos: RolUsuario[] = [];
  private visible = false;

  @Input()
  set appTieneRol(roles: RolUsuario | RolUsuario[]) {
    this.rolesPermitidos = Array.isArray(roles) ? roles : [roles];
    this.actualizarVista();
  }

  constructor() {
    effect(() => {
      // Reacciona a cambios en rolActual signal
      this.authService.rolActual();
      this.actualizarVista();
    });
  }

  private actualizarVista(): void {
    const rolActual = this.authService.rolActual();
    const tienePermiso = rolActual !== null && this.rolesPermitidos.includes(rolActual);

    if (tienePermiso && !this.visible) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.visible = true;
    } else if (!tienePermiso && this.visible) {
      this.viewContainer.clear();
      this.visible = false;
    }
  }
}
