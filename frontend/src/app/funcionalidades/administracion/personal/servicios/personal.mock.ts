import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import { GradoProfesional, nombreVisible } from '../../../../compartido/catalogos/grado-profesional.enum';
import {
  ContrasenaTemporalInfo,
  FiltroPersonal,
  PersonalActualizarForm,
  PersonalItem,
  PersonalRegistroForm,
} from '../modelos/personal.model';
import { PersonalApi } from './personal.api';

@Injectable()
export class PersonalMock extends PersonalApi {
  private colaboradores: PersonalItem[] = [
    {
      id: 1,
      nombre: 'Patricia Elena',
      apellidos: 'Ramos Quispe',
      nombreCompleto: 'Patricia Elena Ramos Quispe',
      nombreVisible: 'Lic. Patricia Ramos',
      correo: 'pramos@hospital.gob.pe',
      nombreUsuario: 'pramos',
      idArea: 1,
      nombreArea: 'Admisión',
      rol: 'USUARIO_FINAL',
      grado: GradoProfesional.LIC,
      activo: true,
      debeCambiarContrasena: false,
      bloqueadoHasta: null,
      ultimoAcceso: '2026-11-20T08:15:00Z',
    },
    {
      id: 2,
      nombre: 'Carlos Eduardo',
      apellidos: 'Mendoza Silva',
      nombreCompleto: 'Carlos Eduardo Mendoza Silva',
      nombreVisible: 'Lic. Carlos Mendoza',
      correo: 'cmendoza@hospital.gob.pe',
      nombreUsuario: 'cmendoza',
      idArea: 2,
      nombreArea: 'Emergencia',
      rol: 'USUARIO_FINAL',
      grado: GradoProfesional.LIC,
      activo: true,
      debeCambiarContrasena: false,
      bloqueadoHasta: null,
      ultimoAcceso: '2026-11-20T07:30:00Z',
    },
    {
      id: 3,
      nombre: 'Roberto',
      apellidos: 'Sánchez Paredes',
      nombreCompleto: 'Roberto Sánchez Paredes',
      nombreVisible: 'Ing. Roberto Sánchez',
      correo: 'admin@hospital.gob.pe',
      nombreUsuario: 'admin',
      idArea: 1,
      nombreArea: 'Admisión',
      rol: 'ADMINISTRADOR',
      grado: GradoProfesional.ING,
      activo: true,
      debeCambiarContrasena: false,
      bloqueadoHasta: null,
      ultimoAcceso: '2026-11-20T08:45:00Z',
    },
  ];

  listar(filtro?: FiltroPersonal): Observable<Pagina<PersonalItem>> {
    let resultado = [...this.colaboradores];

    if (filtro?.busqueda && filtro.busqueda.trim()) {
      const q = filtro.busqueda.trim().toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombreCompleto.toLowerCase().includes(q) ||
          p.correo.toLowerCase().includes(q) ||
          (p.nombreUsuario && p.nombreUsuario.toLowerCase().includes(q))
      );
    }

    if (filtro?.idArea) {
      resultado = resultado.filter((p) => p.idArea === filtro.idArea);
    }

    if (filtro?.rol) {
      resultado = resultado.filter((p) => p.rol === filtro.rol);
    }

    const pagina = filtro?.pagina ?? 0;
    const tamano = filtro?.tamano ?? 10;
    const inicio = pagina * tamano;
    const contenido = resultado.slice(inicio, inicio + tamano);

    return of({
      contenido,
      pagina,
      tamano,
      totalElementos: resultado.length,
      totalPaginas: Math.ceil(resultado.length / tamano) || 1,
    });
  }

  obtener(id: number): Observable<PersonalItem> {
    const item = this.colaboradores.find((p) => p.id === id);
    if (!item) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: 'Colaborador no encontrado.' },
      }));
    }
    return of({ ...item });
  }

  crear(
    formulario: PersonalRegistroForm
  ): Observable<PersonalItem & { contrasenaTemporal?: string }> {
    const correoNorm = formulario.correo.trim().toLowerCase();
    const duplicado = this.colaboradores.find((p) => p.correo === correoNorm);
    if (duplicado) {
      return throwError(() => ({
        status: 409,
        error: {
          codigo: 'CORREO_DUPLICADO',
          campo: 'correo',
          mensaje: 'Ya existe una cuenta con ese correo institucional.',
        },
      }));
    }

    const nuevoId = Math.max(0, ...this.colaboradores.map((p) => p.id)) + 1;
    const claveTemporal = formulario.generarContrasena
      ? 'Hsmsi.' + Math.floor(1000 + Math.random() * 9000) + '!'
      : undefined;

    const visible = nombreVisible(
      formulario.grado,
      formulario.nombres,
      formulario.apellidos
    );

    const nuevo: PersonalItem = {
      id: nuevoId,
      nombre: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      nombreCompleto: `${formulario.nombres} ${formulario.apellidos}`.trim(),
      nombreVisible: visible,
      correo: correoNorm,
      nombreUsuario: formulario.nombreUsuario?.trim().toLowerCase() || null,
      idArea: formulario.idArea,
      nombreArea: formulario.idArea === 1 ? 'Admisión' : 'Emergencia',
      rol: formulario.rol,
      grado: formulario.grado,
      activo: true,
      debeCambiarContrasena: true,
      bloqueadoHasta: null,
      ultimoAcceso: null,
    };

    this.colaboradores.push(nuevo);
    return of({ ...nuevo, contrasenaTemporal: claveTemporal });
  }

  actualizar(
    id: number,
    formulario: PersonalActualizarForm
  ): Observable<PersonalItem> {
    const idx = this.colaboradores.findIndex((p) => p.id === id);
    if (idx === -1) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: 'Colaborador no encontrado.' },
      }));
    }

    const visible = nombreVisible(
      formulario.grado,
      formulario.nombres,
      formulario.apellidos
    );

    const actual = this.colaboradores[idx];
    const actualizado: PersonalItem = {
      ...actual,
      nombre: formulario.nombres.trim(),
      apellidos: formulario.apellidos.trim(),
      nombreCompleto: `${formulario.nombres} ${formulario.apellidos}`.trim(),
      nombreVisible: visible,
      idArea: formulario.idArea,
      rol: formulario.rol,
      grado: formulario.grado,
      correo: formulario.correo.trim().toLowerCase(),
      nombreUsuario: formulario.nombreUsuario?.trim().toLowerCase() || null,
    };

    this.colaboradores[idx] = actualizado;
    return of({ ...actualizado });
  }

  toggleActivo(id: number): Observable<PersonalItem> {
    const idx = this.colaboradores.findIndex((p) => p.id === id);
    if (idx === -1) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: 'Colaborador no encontrado.' },
      }));
    }

    const actual = this.colaboradores[idx];
    const actualizado = { ...actual, activo: !actual.activo };
    this.colaboradores[idx] = actualizado;
    return of({ ...actualizado });
  }

  restablecerContrasena(id: number): Observable<ContrasenaTemporalInfo> {
    const item = this.colaboradores.find((p) => p.id === id);
    if (!item) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: 'Colaborador no encontrado.' },
      }));
    }

    const claveTemporal = 'Temp.' + Math.floor(1000 + Math.random() * 9000) + '!';
    return of({
      id: item.id,
      nombreCompleto: item.nombreCompleto,
      correo: item.correo,
      contrasenaTemporal: claveTemporal,
      mensaje: 'Contraseña temporal generada con éxito.',
    });
  }
}
