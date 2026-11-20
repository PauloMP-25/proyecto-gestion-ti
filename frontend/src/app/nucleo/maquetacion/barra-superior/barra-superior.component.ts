
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { MarcaHospitalComponent } from '../../../compartido/ui/moleculas/marca-hospital/marca-hospital.component';
import { UsuarioPerfilMenuComponent } from '../../../compartido/ui/moleculas/usuario-perfil-menu/usuario-perfil-menu.component';

@Component({
  selector: 'app-barra-superior',
  standalone: true,
  imports: [
    CommonModule,
    MarcaHospitalComponent,
    UsuarioPerfilMenuComponent,
  ],
  templateUrl: './barra-superior.component.html',
  styleUrl: './barra-superior.component.scss',
})
export class BarraSuperiorComponent {
  private authService = inject(AuthService);
  private layoutService = inject(LayoutService);

  readonly usuarioActual = this.authService.usuarioActual;

  alternarSidebar(): void {
    this.layoutService.alternarSidebar();
  }

  cerrarSesion(): void {
    this.authService.cerrarSesion();
  }
}
