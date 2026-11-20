import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AreaDetalle, AreaFormulario, AreaResumen, FiltroAreas } from '../modelos/areas.model';
import { formatearPiso } from './areas.mapper';
import { AreasApi, EquipoAreaItem, PersonalAreaItem } from './areas.api';

@Injectable()
export class AreasMock extends AreasApi {
  private areas: AreaDetalle[] = [
    {
      id: 1,
      nombre: 'Admisión',
      piso: 1,
      ubicacionLegible: 'Primer Piso',
      referenciaUbicacion: 'Frente a la Oficina de la Jefatura de Estadística',
      anexo: '105',
      encargado: { id: 10, nombreVisible: 'Lic. Patricia Ramos' },
      activo: true,
      totalPersonal: 4,
      totalComputadoras: 4,
      totalImpresoras: 2,
    },
    {
      id: 2,
      nombre: 'Emergencia',
      piso: 1,
      ubicacionLegible: 'Primer Piso',
      referenciaUbicacion: 'Pabellón de Urgencias y Triage',
      anexo: '210',
      encargado: { id: 20, nombreVisible: 'Lic. Carlos Mendoza' },
      activo: true,
      totalPersonal: 3,
      totalComputadoras: 1,
      totalImpresoras: 1,
    },
  ];

  private personalPorArea: Record<number, PersonalAreaItem[]> = {
    1: [
      {
        id: 10,
        nombreCompleto: 'Patricia Elena Ramos Quispe',
        nombreVisible: 'Lic. Patricia Ramos',
        correo: 'pramos@hospital.gob.pe',
        nombreUsuario: 'pramos',
        rol: 'USUARIO_FINAL',
        activo: true,
        ultimoAcceso: '2026-11-19T08:30:00Z',
      },
      {
        id: 11,
        nombreCompleto: 'Juan Alberto Perez Soto',
        nombreVisible: 'Juan Perez',
        correo: 'jperez@hospital.gob.pe',
        nombreUsuario: 'jperez',
        rol: 'USUARIO_FINAL',
        activo: true,
        ultimoAcceso: '2026-11-18T14:20:00Z',
      },
    ],
    2: [
      {
        id: 20,
        nombreCompleto: 'Carlos Eduardo Mendoza Silva',
        nombreVisible: 'Lic. Carlos Mendoza',
        correo: 'cmendoza@hospital.gob.pe',
        nombreUsuario: 'cmendoza',
        rol: 'USUARIO_FINAL',
        activo: true,
        ultimoAcceso: '2026-11-19T07:15:00Z',
      },
    ],
  };

  private equiposPorArea: Record<number, EquipoAreaItem[]> = {
    1: [
      {
        id: 101,
        codigoInventario: 'PC-ADM-01',
        tipo: 'COMPUTADORA',
        marcaModelo: 'HP ProDesk 400 G7',
        referenciaUbicacion: 'Ventanilla 1',
        ipVigente: '192.168.10.11',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 102,
        codigoInventario: 'PC-ADM-02',
        tipo: 'COMPUTADORA',
        marcaModelo: 'HP ProDesk 400 G7',
        referenciaUbicacion: 'Ventanilla 2',
        ipVigente: '192.168.10.12',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 103,
        codigoInventario: 'PC-ADM-03',
        tipo: 'COMPUTADORA',
        marcaModelo: 'Lenovo ThinkCentre M70q',
        referenciaUbicacion: 'Ventanilla 3',
        ipVigente: '192.168.10.13',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 104,
        codigoInventario: 'PC-ADM-04',
        tipo: 'COMPUTADORA',
        marcaModelo: 'Lenovo ThinkCentre M70q',
        referenciaUbicacion: 'Módulo de Triaje',
        ipVigente: '192.168.10.14',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 105,
        codigoInventario: 'IMP-ADM-01',
        tipo: 'IMPRESORA',
        marcaModelo: 'HP LaserJet Pro M404dw',
        referenciaUbicacion: 'Mesa compartida Ventanillas 1-2',
        ipVigente: '192.168.10.21',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 106,
        codigoInventario: 'IMP-ADM-02',
        tipo: 'IMPRESORA',
        marcaModelo: 'Epson EcoTank L5290',
        referenciaUbicacion: 'Módulo de Impresión de Historias',
        ipVigente: '192.168.10.22',
        estado: 'EN_SERVICIO',
        activo: true,
      },
    ],
    2: [
      {
        id: 201,
        codigoInventario: 'PC-EME-01',
        tipo: 'COMPUTADORA',
        marcaModelo: 'HP ProDesk 600 G6',
        referenciaUbicacion: 'Admisión de Emergencia',
        ipVigente: '192.168.20.10',
        estado: 'EN_SERVICIO',
        activo: true,
      },
      {
        id: 202,
        codigoInventario: 'IMP-EME-01',
        tipo: 'IMPRESORA',
        marcaModelo: 'HP LaserJet Enterprise M507',
        referenciaUbicacion: 'Impresora Central Emergencia',
        ipVigente: '192.168.20.25',
        estado: 'EN_SERVICIO',
        activo: true,
      },
    ],
  };

  listar(filtro?: FiltroAreas): Observable<AreaResumen[]> {
    let resultado = [...this.areas];

    if (!filtro?.incluirInactivas) {
      resultado = resultado.filter((a) => a.activo);
    }

    if (filtro?.buscar && filtro.buscar.trim()) {
      const q = this.normalizar(filtro.buscar);
      resultado = resultado.filter((a) => this.normalizar(a.nombre).includes(q));
    }

    const resumenes: AreaResumen[] = resultado.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      piso: a.piso,
      ubicacionLegible: a.ubicacionLegible,
      anexo: a.anexo,
      encargado: a.encargado,
      activo: a.activo,
      totalPersonal: a.totalPersonal,
      totalComputadoras: a.totalComputadoras,
      totalImpresoras: a.totalImpresoras,
    }));

    return of(resumenes);
  }

  obtener(id: number): Observable<AreaDetalle> {
    const encontrada = this.areas.find((a) => a.id === id);
    if (!encontrada) {
      return throwError(() => ({
        status: 404,
        error: { codigo: 'AREA_NO_ENCONTRADA', mensaje: 'Área no encontrada' },
      }));
    }
    return of({ ...encontrada });
  }

  crear(formulario: AreaFormulario): Observable<AreaDetalle> {
    const nombreNorm = this.normalizar(formulario.nombre);
    const duplicada = this.areas.find((a) => this.normalizar(a.nombre) === nombreNorm);
    if (duplicada) {
      return throwError(() => ({
        status: 409,
        error: {
          codigo: 'NOMBRE_DUPLICADO',
          campo: 'nombre',
          mensaje: 'Ya existe un área con ese nombre',
        },
      }));
    }

    const nuevoId = Math.max(0, ...this.areas.map((a) => a.id)) + 1;
    const nueva: AreaDetalle = {
      id: nuevoId,
      nombre: formulario.nombre.trim(),
      piso: formulario.piso,
      ubicacionLegible: formatearPiso(formulario.piso),
      referenciaUbicacion: formulario.referenciaUbicacion?.trim() || null,
      anexo: formulario.anexo?.trim() || null,
      encargado: null,
      activo: true,
      totalPersonal: 0,
      totalComputadoras: 0,
      totalImpresoras: 0,
    };

    this.areas.push(nueva);
    return of({ ...nueva });
  }

  actualizar(id: number, formulario: AreaFormulario): Observable<AreaDetalle> {
    const idx = this.areas.findIndex((a) => a.id === id);
    if (idx === -1) {
      return throwError(() => ({ status: 404, error: { mensaje: 'Área no encontrada' } }));
    }

    const nombreNorm = this.normalizar(formulario.nombre);
    const duplicada = this.areas.find(
      (a) => a.id !== id && this.normalizar(a.nombre) === nombreNorm
    );
    if (duplicada) {
      return throwError(() => ({
        status: 409,
        error: {
          codigo: 'NOMBRE_DUPLICADO',
          campo: 'nombre',
          mensaje: 'Ya existe un área con ese nombre',
        },
      }));
    }

    const actual = this.areas[idx];
    const actualizada: AreaDetalle = {
      ...actual,
      nombre: formulario.nombre.trim(),
      piso: formulario.piso,
      ubicacionLegible: formatearPiso(formulario.piso),
      referenciaUbicacion: formulario.referenciaUbicacion?.trim() || null,
      anexo: formulario.anexo?.trim() || null,
    };

    this.areas[idx] = actualizada;
    return of({ ...actualizada });
  }

  cambiarEstado(id: number, activo: boolean): Observable<AreaDetalle> {
    const idx = this.areas.findIndex((a) => a.id === id);
    if (idx === -1) {
      return throwError(() => ({ status: 404, error: { mensaje: 'Área no encontrada' } }));
    }

    // Si se intenta desactivar pero tiene personal o equipos, simular validación de negocio
    if (!activo && (this.areas[idx].totalPersonal > 0 || this.areas[idx].totalComputadoras > 0)) {
      return throwError(() => ({
        status: 409,
        error: {
          codigo: 'AREA_CON_RECURSOS_ACTIVOS',
          mensaje: `No se puede desactivar el área porque aún cuenta con ${this.areas[idx].totalPersonal} colaboradores y ${this.areas[idx].totalComputadoras} computadoras en servicio.`,
        },
      }));
    }

    this.areas[idx] = { ...this.areas[idx], activo };
    return of({ ...this.areas[idx] });
  }

  listarPersonal(idArea: number, incluirInactivos: boolean = false): Observable<PersonalAreaItem[]> {
    const lista = this.personalPorArea[idArea] || [];
    return of(incluirInactivos ? lista : lista.filter((p) => p.activo));
  }

  listarEquipos(idArea: number, tipo?: string): Observable<EquipoAreaItem[]> {
    let lista = this.equiposPorArea[idArea] || [];
    if (tipo) {
      lista = lista.filter((e) => e.tipo === tipo);
    }
    return of(lista);
  }

  reasignarPersonal(idArea: number, idUsuario: number): Observable<void> {
    let usuarioEncontrado: PersonalAreaItem | null = null;
    let areaOrigenId: number | null = null;

    for (const [areaKey, personas] of Object.entries(this.personalPorArea)) {
      const idx = personas.findIndex((p) => p.id === idUsuario);
      if (idx !== -1) {
        usuarioEncontrado = personas[idx];
        areaOrigenId = Number(areaKey);
        personas.splice(idx, 1);
        break;
      }
    }

    if (!this.personalPorArea[idArea]) {
      this.personalPorArea[idArea] = [];
    }

    if (usuarioEncontrado) {
      this.personalPorArea[idArea].push(usuarioEncontrado);
    }

    const idxDest = this.areas.findIndex((a) => a.id === idArea);
    if (idxDest !== -1) {
      this.areas[idxDest] = {
        ...this.areas[idxDest],
        totalPersonal: this.personalPorArea[idArea].length,
      };
    }
    if (areaOrigenId) {
      const idxOrig = this.areas.findIndex((a) => a.id === areaOrigenId);
      if (idxOrig !== -1) {
        this.areas[idxOrig] = {
          ...this.areas[idxOrig],
          totalPersonal: (this.personalPorArea[areaOrigenId] || []).length,
        };
      }
    }

    return of(void 0);
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}
