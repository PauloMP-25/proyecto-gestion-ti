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

  // Usuario predeterminado para desarrollo/demostración
  private usuarioPorDefecto: UsuarioSesion = {
    id: 'USR-001',
    nombreCompleto: 'Dra. Rosa Mendoza Quispe',
    correo: 'rmendoza@hsms.gob.pe',
    rol: RolUsuario.USUARIO_FINAL,
    areaProcedencia: 'Triaje de Emergencia',
    cargo: 'Médico Asistencial',
  };

  // Signal reactiva con el usuario actual
  private _usuarioActual = signal<UsuarioSesion | null>(this.cargarUsuarioInicial());

  // Señales calculadas
  readonly usuarioActual = this._usuarioActual.asReadonly();
  readonly estaAutenticado = computed(() => !!this._usuarioActual());
  readonly rolActual = computed(() => this._usuarioActual()?.rol ?? null);

  private cargarUsuarioInicial(): UsuarioSesion | null {
    const usuarioGuardado = this.tokenStorage.obtenerUsuario<UsuarioSesion>();
    if (usuarioGuardado) {
      return usuarioGuardado;
    }
    // Usuario por defecto si hay token o en desarrollo
    return this.usuarioPorDefecto;
  }

  establecerUsuario(usuario: UsuarioSesion): void {
    this._usuarioActual.set(usuario);
    this.tokenStorage.guardarUsuario(usuario);
  }

  cambiarRol(rol: RolUsuario): void {
    const usuarioActual = this._usuarioActual();
    if (!usuarioActual) return;

    let nuevoNombre = usuarioActual.nombreCompleto;
    let nuevoCargo = usuarioActual.cargo;
    let nuevaArea = usuarioActual.areaProcedencia;

    if (rol === RolUsuario.USUARIO_FINAL) {
      nuevoNombre = 'Dra. Rosa Mendoza Quispe';
      nuevoCargo = 'Médico Asistencial';
      nuevaArea = 'Triaje de Emergencia';
    } else if (rol === RolUsuario.PRACTICANTE) {
      nuevoNombre = 'Carlos Huamán Soto';
      nuevoCargo = 'Soporte Técnico N1 (Practicante)';
      nuevaArea = 'Mesa de Ayuda TI';
    } else if (rol === RolUsuario.ADMINISTRADOR) {
      nuevoNombre = 'Ing. Roberto Ramos Cárdenas';
      nuevoCargo = 'Jefe de Estadística e Informática';
      nuevaArea = 'Oficina de Informática y Telecomunicaciones';
    }

    const usuarioModificado: UsuarioSesion = {
      ...usuarioActual,
      nombreCompleto: nuevoNombre,
      rol,
      cargo: nuevoCargo,
      areaProcedencia: nuevaArea,
    };

    this.establecerUsuario(usuarioModificado);
  }

  cerrarSesion(): void {
    this._usuarioActual.set(null);
    this.tokenStorage.limpiar();
    this.router.navigate(['/auth/login']);
  }
}
