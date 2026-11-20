import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { RolUsuario } from '../../modelos/rol.enum';
import { rutaInicioPorRol } from '../../auth/ruta-inicio';
import { MarcaHospitalComponent } from '../../../compartido/ui/moleculas/marca-hospital/marca-hospital.component';
import { SelectorRolSimuladorComponent } from '../../../compartido/ui/moleculas/selector-rol-simulador/selector-rol-simulador.component';
import { UsuarioPerfilMenuComponent } from '../../../compartido/ui/moleculas/usuario-perfil-menu/usuario-perfil-menu.component';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  imports: [
    CommonModule,
    MarcaHospitalComponent,
    SelectorRolSimuladorComponent,
    UsuarioPerfilMenuComponent,
  ],
  templateUrl: './barra-superior.component.html',
  styleUrl: './barra-superior.component.scss',
})
export class BarraSuperiorComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);
  private router = inject(Router);

  readonly usuarioActual = this.authService.usuarioActual;
  readonly RolUsuario = RolUsuario;

  alternarSidebar(): void {
    this.layoutService.alternarSidebar();
  }

  cambiarRol(rol: RolUsuario): void {
    this.authService.cambiarRol(rol);
    const destino = rutaInicioPorRol(rol);
    this.router.navigateByUrl(destino);
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }
}
