import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  private readonly TOKEN_KEY = 'hsmsi_auth_token';
  private readonly USER_KEY = 'hsmsi_auth_user';

  guardarToken(token: string): void {
    if (this.esNavegador()) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  obtenerToken(): string | null {
    if (this.esNavegador()) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  eliminarToken(): void {
    if (this.esNavegador()) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  guardarUsuario(usuario: unknown): void {
    if (this.esNavegador()) {
      localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
    }
  }

  obtenerUsuario<T>(): T | null {
    if (this.esNavegador()) {
      const data = localStorage.getItem(this.USER_KEY);
      if (data) {
        try {
          return JSON.parse(data) as T;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  limpiar(): void {
    if (this.esNavegador()) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private esNavegador(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
