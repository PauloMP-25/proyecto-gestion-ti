import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { rutaInicioPorRol } from '../../../../nucleo/auth/ruta-inicio';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  public usuario = signal<string>('admin');
  public password = signal<string>('admin');
  public mostrarPassword = signal<boolean>(false);
  public errorMensaje = signal<string | null>(null);

  toggleMostrarPassword(): void {
    this.mostrarPassword.update(valor => !valor);
  }

  login(): void {
    const user = this.usuario().trim().toLowerCase();
    const pass = this.password().trim();

    if (!user || !pass) {
      this.errorMensaje.set('Por favor, complete todos los campos.');
      return;
    }

    if (user === 'admin' && pass === 'admin') {
      this.errorMensaje.set(null);
      this.authService.cambiarRol(RolUsuario.ADMINISTRADOR);
      this.router.navigateByUrl(rutaInicioPorRol(RolUsuario.ADMINISTRADOR));
    } else if (user === 'practicante' && pass === 'practicante') {
      this.errorMensaje.set(null);
      this.authService.cambiarRol(RolUsuario.PRACTICANTE);
      this.router.navigateByUrl(rutaInicioPorRol(RolUsuario.PRACTICANTE));
    } else if ((user === 'usuario' || user === 'medico') && (pass === 'usuario' || pass === 'medico')) {
      this.errorMensaje.set(null);
      this.authService.cambiarRol(RolUsuario.USUARIO_FINAL);
      this.router.navigateByUrl(rutaInicioPorRol(RolUsuario.USUARIO_FINAL));
    } else {
      this.errorMensaje.set('Credenciales no válidas. Para pruebas use admin, practicante o usuario.');
    }
  }
}
