import { Injectable, signal } from '@angular/core';
import { ApiError } from '../modelos/api-error.model';

export interface Notificacion {
  id: number;
  tipo: 'exito' | 'error' | 'info';
  texto: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private correlativo = 0;
  readonly notificaciones = signal<Notificacion[]>([]);

  exito(texto: string): void {
    this.agregar('exito', texto);
  }

  error(texto: string): void {
    this.agregar('error', texto);
  }

  info(texto: string): void {
    this.agregar('info', texto);
  }

  mostrarError(err: unknown): void {
    const cuerpo = (err as { error?: ApiError })?.error;
    let texto = cuerpo?.mensaje ?? 'No se pudo completar la operación. Intente nuevamente.';
    if (cuerpo?.erroresValidacion?.length) {
      texto += `: ${cuerpo.erroresValidacion[0].detalle}`;
    }
    this.error(texto);
  }

  cerrar(id: number): void {
    this.notificaciones.update(lista => lista.filter(n => n.id !== id));
  }

  private agregar(tipo: Notificacion['tipo'], texto: string): void {
    const id = ++this.correlativo;
    this.notificaciones.update(lista => [...lista, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), 6000);
  }
}