import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  info(mensaje: string, detalle?: unknown): void {
    console.info(`[HSMSI] ${mensaje}`, detalle ?? '');
  }

  warn(mensaje: string, detalle?: unknown): void {
    console.warn(`[HSMSI] ${mensaje}`, detalle ?? '');
  }

  error(mensaje: string, detalle?: unknown): void {
    console.error(`[HSMSI] ${mensaje}`, detalle ?? '');
  }
}