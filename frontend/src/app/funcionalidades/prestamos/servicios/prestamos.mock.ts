import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  DevolverPrestamoForm,
  EntregarPrestamoForm,
  FiltroPrestamos,
  PrestamoItem,
} from '../modelos/prestamos.model';
import { PrestamosApi } from './prestamos.api';

@Injectable()
export class PrestamosMockService extends PrestamosApi {
  private prestamos: PrestamoItem[] = [
    {
      id: 1,
      idCi: 101,
      codigoInventario: 'EQ-CONT-001',
      nombreEquipo: 'Laptop HP Contingencia N1',
      tipoCi: 'Computadora Portátil',
      marcaModelo: 'HP ProBook 450 G8',
      idAreaDestino: 2,
      nombreAreaDestino: 'Emergencia General',
      idTicket: 15,
      codigoTicket: 'INC-2026-0015',
      solicitante: 'Dra. María Mendoza (Médico de Turno)',
      tecnicoEntrego: 'practicante',
      fechaPrestamo: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      fechaDevolucionPactada: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      fechaDevolucionReal: null,
      estado: 'VIGENTE',
      estadoDevolucion: null,
      observaciones: 'Préstamo por falla de equipo en triaje de emergencia',
    },
    {
      id: 2,
      idCi: 102,
      codigoInventario: 'IMP-CONT-002',
      nombreEquipo: 'Impresora Térmica Tickets Contingencia',
      tipoCi: 'Impresora',
      marcaModelo: 'Epson TM-T20III',
      idAreaDestino: 1,
      nombreAreaDestino: 'Admisión Central',
      idTicket: null,
      codigoTicket: null,
      solicitante: 'Lic. Juan Pérez',
      tecnicoEntrego: 'admin',
      fechaPrestamo: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      fechaDevolucionPactada: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      fechaDevolucionReal: null,
      estado: 'VENCIDO',
      estadoDevolucion: null,
      observaciones: 'Impresora de respaldo temporal para módulo 3',
    },
    {
      id: 3,
      idCi: 103,
      codigoInventario: 'EQ-CONT-003',
      nombreEquipo: 'Monitor LED 24 Contingencia',
      tipoCi: 'Monitor',
      marcaModelo: 'Dell P2419H',
      idAreaDestino: 4,
      nombreAreaDestino: 'Unidad de Cuidados Intensivos (UCI)',
      idTicket: 11,
      codigoTicket: 'INC-2026-0011',
      solicitante: 'Lic. Rosa Sánchez',
      tecnicoEntrego: 'practicante',
      fechaPrestamo: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      fechaDevolucionPactada: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      fechaDevolucionReal: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      estado: 'DEVUELTO',
      estadoDevolucion: 'OPERATIVO',
      observaciones: 'Devuelto en óptimas condiciones de funcionamiento',
    },
  ];

  listar(filtro?: FiltroPrestamos): Observable<PrestamoItem[]> {
    let resultado = [...this.prestamos];

    if (filtro?.estado && filtro.estado !== 'TODOS') {
      resultado = resultado.filter((p) => p.estado === filtro.estado);
    }

    if (filtro?.areaId) {
      resultado = resultado.filter((p) => p.idAreaDestino === filtro.areaId);
    }

    if (filtro?.buscar && filtro.buscar.trim()) {
      const q = filtro.buscar.trim().toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.codigoInventario.toLowerCase().includes(q) ||
          p.nombreEquipo.toLowerCase().includes(q) ||
          p.solicitante.toLowerCase().includes(q) ||
          p.nombreAreaDestino.toLowerCase().includes(q)
      );
    }

    return of(resultado).pipe(delay(200));
  }

  obtenerPorId(id: number): Observable<PrestamoItem> {
    const item = this.prestamos.find((p) => p.id === id);
    if (!item) {
      return throwError(() => new Error(`Préstamo ${id} no encontrado`));
    }
    return of(item).pipe(delay(150));
  }

  listarVencidos(): Observable<PrestamoItem[]> {
    return of(this.prestamos.filter((p) => p.estado === 'VENCIDO')).pipe(delay(200));
  }

  crear(formulario: EntregarPrestamoForm): Observable<PrestamoItem> {
    const nuevoId = Math.max(0, ...this.prestamos.map((p) => p.id)) + 1;
    const nuevo: PrestamoItem = {
      id: nuevoId,
      idCi: formulario.idCi,
      codigoInventario: `EQ-PREST-${nuevoId.toString().padStart(3, '0')}`,
      nombreEquipo: `Equipo Asignado #${formulario.idCi}`,
      tipoCi: 'Equipo Hospitalario',
      idAreaDestino: formulario.idAreaDestino,
      nombreAreaDestino: 'Área Asignada',
      idTicket: formulario.idTicket ?? null,
      codigoTicket: formulario.idTicket ? `INC-${formulario.idTicket}` : null,
      solicitante: formulario.solicitante,
      tecnicoEntrego: 'guardia-ti',
      fechaPrestamo: new Date().toISOString(),
      fechaDevolucionPactada: formulario.fechaDevolucionPactada,
      fechaDevolucionReal: null,
      estado: 'VIGENTE',
      estadoDevolucion: null,
      observaciones: formulario.observaciones ?? null,
    };

    this.prestamos.unshift(nuevo);
    return of(nuevo).pipe(delay(300));
  }

  devolver(id: number, formulario: DevolverPrestamoForm): Observable<PrestamoItem> {
    const idx = this.prestamos.findIndex((p) => p.id === id);
    if (idx === -1) {
      return throwError(() => new Error(`Préstamo ${id} no encontrado`));
    }

    const actual = this.prestamos[idx];
    const actualizado: PrestamoItem = {
      ...actual,
      fechaDevolucionReal: new Date().toISOString(),
      estado: 'DEVUELTO',
      estadoDevolucion: formulario.estadoDevolucion,
      observaciones: formulario.observaciones ?? actual.observaciones,
    };

    this.prestamos[idx] = actualizado;
    return of(actualizado).pipe(delay(300));
  }
}
