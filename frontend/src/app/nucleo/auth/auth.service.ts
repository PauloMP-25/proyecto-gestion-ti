import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RolUsuario } from '../modelos/rol.enum';
import { UsuarioSesion } from '../modelos/usuario-sesion.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private tokenStorage = inject(TokenStorageService);

  // Signal reactiva con el usuario autenticado real
  private _usuarioActual = signal<UsuarioSesion | null>(this.cargarUsuarioInicial());

  // Señales calculadas
  readonly usuarioActual = this._usuarioActual.asReadonly();
  readonly estaAutenticado = computed(() => !!this._usuarioActual());
  readonly rolActual = computed(() => this._usuarioActual()?.rol ?? null);
  readonly debeCambiarContrasena = computed(() => !!this._usuarioActual()?.debeCambiarContrasena);

  private cargarUsuarioInicial(): UsuarioSesion | null {
    const usuarioGuardado = this.tokenStorage.obtenerUsuario<UsuarioSesion>();
    if (usuarioGuardado && this.tokenStorage.obtenerToken()) {
      return usuarioGuardado;
    }
    return null;
  }

  establecerUsuario(usuario: UsuarioSesion): void {
    this._usuarioActual.set(usuario);
    this.tokenStorage.guardarUsuario(usuario);
  }

  marcarContrasenaCambiada(): void {
    const usuarioActual = this._usuarioActual();
    if (!usuarioActual) return;
    this.establecerUsuario({
      ...usuarioActual,
      debeCambiarContrasena: false,
    });
  }

  cerrarSesion(): void {
    this._usuarioActual.set(null);
    this.tokenStorage.limpiar();
    this.router.navigate(['/auth/login']);
  }
}
