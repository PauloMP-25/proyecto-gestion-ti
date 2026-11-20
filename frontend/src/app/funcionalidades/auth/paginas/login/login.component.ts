import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { TokenStorageService } from '../../../../nucleo/auth/token-storage.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { UsuarioSesion } from '../../../../nucleo/modelos/usuario-sesion.model';
import { rutaInicioPorRol } from '../../../../nucleo/auth/ruta-inicio';
import { environment } from '../../../../../environments/environment';

interface AuthResponse {
  token: string;
  correo: string;
  rol: string;
  nivelSoporte?: string;
}

interface UsuarioMeResponse {
  idUsuario?: number;
  id?: number;
  nombres?: string;
  apellidos?: string;
  nombreVisible?: string;
  nombreUsuario?: string;
  gradoProfesional?: string;
  correo: string;
  rol: string;
  areaProcedencia?: string;
  nivelSoporte?: string;
  debeCambiarContrasena?: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private tokenStorage = inject(TokenStorageService);
  private http = inject(HttpClient);

  public usuario = signal<string>('admin');
  public password = signal<string>('admin');
  public mostrarPassword = signal<boolean>(false);
  public cargando = signal<boolean>(false);
  public errorMensaje = signal<string | null>(null);

  toggleMostrarPassword(): void {
    this.mostrarPassword.update(valor => !valor);
  }

  login(): void {
    const user = this.usuario().trim();
    const pass = this.password().trim();

    if (!user || !pass) {
      this.errorMensaje.set('Por favor, complete todos los campos.');
      return;
    }

    this.errorMensaje.set(null);

    this.cargando.set(true);
    this.http.post<AuthResponse>('/api/auth/login', {
      correo: user,
      contrasena: pass,
    }).pipe(
      switchMap(authRes => {
        this.tokenStorage.guardarToken(authRes.token);
        return this.http.get<UsuarioMeResponse>('/api/auth/me');
      })
    ).subscribe({
      next: (me) => {
        this.cargando.set(false);
        const rolNormalizado = this.normalizarRol(me.rol);
        const sesion: UsuarioSesion = {
          id: String(me.idUsuario ?? me.id ?? '1'),
          nombreCompleto: me.nombreVisible || `${me.nombres ?? ''} ${me.apellidos ?? ''}`.trim() || me.correo,
          correo: me.correo,
          rol: rolNormalizado,
          areaProcedencia: me.areaProcedencia || '',
          cargo: this.obtenerCargoPorRol(rolNormalizado),
          debeCambiarContrasena: !!me.debeCambiarContrasena,
        };
        this.authService.establecerUsuario(sesion);
        this.router.navigateByUrl(rutaInicioPorRol(rolNormalizado));
      },
      error: (err) => {
        this.cargando.set(false);
        const mensaje = err.error?.message || err.error?.error || 'Usuario o contraseña incorrectos. Verifique sus credenciales.';
        this.errorMensaje.set(mensaje);
      }
    });
  }

  private normalizarRol(rol: string): RolUsuario {
    if (rol === 'ADMINISTRADOR') return RolUsuario.ADMINISTRADOR;
    if (rol === 'PRACTICANTE' || rol === 'TECNICO') return RolUsuario.PRACTICANTE;
    return RolUsuario.USUARIO_FINAL;
  }

  private obtenerCargoPorRol(rol: RolUsuario): string {
    switch (rol) {
      case RolUsuario.ADMINISTRADOR:
        return 'Jefe de Estadística e Informática';
      case RolUsuario.PRACTICANTE:
        return 'Soporte Técnico N1 (Mesa de Ayuda)';
      case RolUsuario.USUARIO_FINAL:
      default:
        return 'Personal Hospitalario';
    }
  }
}
