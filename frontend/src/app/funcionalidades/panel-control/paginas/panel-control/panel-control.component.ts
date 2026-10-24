import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

@Component({
  selector: 'app-panel-control',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-control.component.html',
  styleUrl: './panel-control.component.scss',
})
export class PanelControlComponent {
  private authService = inject(AuthService);

  readonly usuarioActual = this.authService.usuarioActual;
  readonly rolActual = this.authService.rolActual;
  readonly RolUsuario = RolUsuario;
}
