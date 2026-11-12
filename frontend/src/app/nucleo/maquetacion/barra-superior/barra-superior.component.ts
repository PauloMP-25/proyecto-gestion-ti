import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { RolUsuario } from '../../modelos/rol.enum';
import { rutaInicioPorRol } from '../../auth/ruta-inicio';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './barra-superior.component.html',
  styleUrl: './barra-superior.component.scss',
})
export class BarraSuperiorComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);

  readonly usuarioActual = this.authService.usuarioActual;
  readonly RolUsuario = RolUsuario;

  menuUsuarioAbierto = signal<boolean>(false);
  selectorRolAbierto = signal<boolean>(false);

  alternarSidebar(): void {
    this.layoutService.alternarSidebar();
  }

  alternarMenuUsuario(): void {
    this.menuUsuarioAbierto.update(v => !v);
    if (this.menuUsuarioAbierto()) {
      this.selectorRolAbierto.set(false);
    }
  }

  alternarSelectorRol(): void {
    this.selectorRolAbierto.update(v => !v);
  }

  cambiarRol(rol: RolUsuario): void {
    this.authService.cambiarRol(rol);
    this.selectorRolAbierto.set(false);
    this.menuUsuarioAbierto.set(false);
    const destino = rutaInicioPorRol(rol);
    this.router.navigateByUrl(destino);
  }

  cerrarSesion(): void {
    this.menuUsuarioAbierto.set(false);
    this.authService.cerrarSesion();
  }

  // Helper para iniciales de avatar
  obtenerIniciales(nombreCompleto?: string): string {
    if (!nombreCompleto) return 'U';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  }
}
