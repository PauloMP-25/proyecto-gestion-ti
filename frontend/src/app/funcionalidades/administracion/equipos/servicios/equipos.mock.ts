import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Pagina } from '../../../../compartido/modelos/pagina.model';
import {
  DisponibilidadIp,
  EquipoFormulario,
  EquipoItem,
  FiltroEquipos,
} from '../modelos/equipos.model';
import { EquiposApi } from './equipos.api';

@Injectable()
export class EquiposMock extends EquiposApi {
  private equipos: EquipoItem[] = [
    {
      id: 101,
      codigoInventario: 'PC-ADM-01',
      tipo: 'COMPUTADORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'HP ProDesk 400 G7',
      referenciaUbicacion: 'Ventanilla 1',
      ipVigente: '192.168.10.11',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'pc-adm-01',
      mac: '00:1A:2B:3C:4D:01',
    },
    {
      id: 102,
      codigoInventario: 'PC-ADM-02',
      tipo: 'COMPUTADORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'HP ProDesk 400 G7',
      referenciaUbicacion: 'Ventanilla 2',
      ipVigente: '192.168.10.12',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'pc-adm-02',
      mac: '00:1A:2B:3C:4D:02',
    },
    {
      id: 103,
      codigoInventario: 'PC-ADM-03',
      tipo: 'COMPUTADORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'HP ProDesk 400 G7',
      referenciaUbicacion: 'Ventanilla 3',
      ipVigente: '192.168.10.13',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'pc-adm-03',
      mac: '00:1A:2B:3C:4D:03',
    },
    {
      id: 104,
      codigoInventario: 'PC-ADM-04',
      tipo: 'COMPUTADORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'HP ProDesk 400 G7',
      referenciaUbicacion: 'Ventanilla 4',
      ipVigente: '192.168.10.14',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'pc-adm-04',
      mac: '00:1A:2B:3C:4D:04',
    },
    {
      id: 105,
      codigoInventario: 'IMP-ADM-01',
      tipo: 'IMPRESORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'Kyocera ECOSYS M2040dn',
      referenciaUbicacion: 'Junto a ventanilla 1',
      ipVigente: '192.168.10.21',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'imp-adm-01',
      mac: '00:1A:2B:3C:4D:11',
    },
    {
      id: 106,
      codigoInventario: 'IMP-ADM-02',
      tipo: 'IMPRESORA',
      idArea: 1,
      nombreArea: 'Admisión',
      marcaModelo: 'Kyocera ECOSYS M2040dn',
      referenciaUbicacion: 'Junto a ventanilla 4',
      ipVigente: '192.168.10.22',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'imp-adm-02',
      mac: '00:1A:2B:3C:4D:12',
    },
    {
      id: 201,
      codigoInventario: 'PC-EME-01',
      tipo: 'COMPUTADORA',
      idArea: 2,
      nombreArea: 'Emergencia',
      marcaModelo: 'Dell OptiPlex 3080',
      referenciaUbicacion: 'Triage de Urgencias',
      ipVigente: '192.168.20.11',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'pc-eme-01',
      mac: '00:1A:2B:3C:4E:01',
    },
    {
      id: 202,
      codigoInventario: 'IMP-EME-01',
      tipo: 'IMPRESORA',
      idArea: 2,
      nombreArea: 'Emergencia',
      marcaModelo: 'HP LaserJet Pro M404dw',
      referenciaUbicacion: 'Estación Central de Triage',
      ipVigente: '192.168.20.21',
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: 'imp-eme-01',
      mac: '00:1A:2B:3C:4E:11',
    },
  ];

  listar(filtro?: FiltroEquipos): Observable<Pagina<EquipoItem>> {
    let resultado = [...this.equipos];

    if (filtro?.idArea) {
      resultado = resultado.filter((e) => e.idArea === filtro.idArea);
    }

    if (filtro?.tipo) {
      resultado = resultado.filter((e) => e.tipo === filtro.tipo);
    }

    if (filtro?.estado) {
      resultado = resultado.filter((e) => e.estado === filtro.estado);
    }

    if (filtro?.sinIp === true) {
      resultado = resultado.filter((e) => !e.ipVigente);
    }

    if (filtro?.buscar && filtro.buscar.trim()) {
      const q = filtro.buscar.trim().toLowerCase();
      resultado = resultado.filter(
        (e) =>
          e.codigoInventario.toLowerCase().includes(q) ||
          e.nombreArea.toLowerCase().includes(q) ||
          (e.marcaModelo && e.marcaModelo.toLowerCase().includes(q)) ||
          (e.ipVigente && e.ipVigente.toLowerCase().includes(q)) ||
          (e.referenciaUbicacion && e.referenciaUbicacion.toLowerCase().includes(q))
      );
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

  obtener(id: number): Observable<EquipoItem> {
    const equipo = this.equipos.find((e) => e.id === id);
    if (!equipo) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: `Equipo con id ${id} no encontrado` },
      }));
    }
    return of({ ...equipo });
  }

  crear(formulario: EquipoFormulario): Observable<EquipoItem> {
    const codigoNormalizado = formulario.codigoInventario.trim().toUpperCase();
    const existe = this.equipos.some(
      (e) => e.codigoInventario.toUpperCase() === codigoNormalizado
    );
    if (existe) {
      return throwError(() => ({
        status: 409,
        error: {
          campo: 'codigoInventario',
          mensaje: 'Ya existe un equipo con ese código de inventario',
        },
      }));
    }

    if (formulario.ipEstatica && formulario.ipEstatica.trim()) {
      const ip = formulario.ipEstatica.trim();
      const enUso = this.equipos.find(
        (e) => e.ipVigente === ip && e.activo
      );
      if (enUso) {
        return throwError(() => ({
          status: 409,
          error: {
            campo: 'ipEstatica',
            mensaje: `La IP ${ip} ya está en uso por ${enUso.codigoInventario}`,
          },
        }));
      }
    }

    const nuevoId =
      this.equipos.length > 0
        ? Math.max(...this.equipos.map((e) => e.id)) + 1
        : 1;

    const nombreArea = formulario.idArea === 1 ? 'Admisión' : formulario.idArea === 2 ? 'Emergencia' : 'Área ' + formulario.idArea;

    const nuevo: EquipoItem = {
      id: nuevoId,
      codigoInventario: codigoNormalizado,
      tipo: formulario.tipo,
      idArea: formulario.idArea,
      nombreArea,
      marcaModelo: formulario.marcaModelo?.trim() || null,
      referenciaUbicacion: formulario.referenciaUbicacion?.trim() || null,
      ipVigente: formulario.ipEstatica?.trim() || null,
      estado: 'EN_SERVICIO',
      activo: true,
      hostname: formulario.hostname?.trim() || null,
      mac: formulario.mac?.trim().toUpperCase() || null,
    };

    this.equipos.push(nuevo);
    return of({ ...nuevo });
  }

  actualizar(id: number, formulario: EquipoFormulario): Observable<EquipoItem> {
    const idx = this.equipos.findIndex((e) => e.id === id);
    if (idx === -1) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: `Equipo con id ${id} no encontrado` },
      }));
    }

    const codigoNormalizado = formulario.codigoInventario.trim().toUpperCase();
    const existe = this.equipos.some(
      (e) => e.id !== id && e.codigoInventario.toUpperCase() === codigoNormalizado
    );
    if (existe) {
      return throwError(() => ({
        status: 409,
        error: {
          campo: 'codigoInventario',
          mensaje: 'Ya existe un equipo con ese código de inventario',
        },
      }));
    }

    if (formulario.ipEstatica && formulario.ipEstatica.trim()) {
      const ip = formulario.ipEstatica.trim();
      const enUso = this.equipos.find(
        (e) => e.id !== id && e.ipVigente === ip && e.activo
      );
      if (enUso) {
        return throwError(() => ({
          status: 409,
          error: {
            campo: 'ipEstatica',
            mensaje: `La IP ${ip} ya está en uso por ${enUso.codigoInventario}`,
          },
        }));
      }
    }

    const nombreArea = formulario.idArea === 1 ? 'Admisión' : formulario.idArea === 2 ? 'Emergencia' : 'Área ' + formulario.idArea;

    const actualizado: EquipoItem = {
      ...this.equipos[idx],
      codigoInventario: codigoNormalizado,
      tipo: formulario.tipo,
      idArea: formulario.idArea,
      nombreArea,
      marcaModelo: formulario.marcaModelo?.trim() || null,
      referenciaUbicacion: formulario.referenciaUbicacion?.trim() || null,
      ipVigente: formulario.ipEstatica?.trim() || null,
      hostname: formulario.hostname?.trim() || null,
      mac: formulario.mac?.trim().toUpperCase() || null,
    };

    this.equipos[idx] = actualizado;
    return of({ ...actualizado });
  }

  cambiarEstado(id: number, estado: string): Observable<EquipoItem> {
    const idx = this.equipos.findIndex((e) => e.id === id);
    if (idx === -1) {
      return throwError(() => ({
        status: 404,
        error: { mensaje: `Equipo con id ${id} no encontrado` },
      }));
    }

    const actualizado: EquipoItem = {
      ...this.equipos[idx],
      estado,
      activo: estado !== 'DE_BAJA',
    };

    this.equipos[idx] = actualizado;
    return of({ ...actualizado });
  }

  sugerirCodigo(tipo: string, idArea: number): Observable<string> {
    const prefijoTipo = tipo === 'IMPRESORA' ? 'IMP' : tipo === 'COMPUTADORA' ? 'PC' : 'EQ';
    const abreviaturaArea = idArea === 1 ? 'ADM' : idArea === 2 ? 'EME' : 'ARE';

    const patron = new RegExp(`^${prefijoTipo}-${abreviaturaArea}-(\\d+)$`);
    let maxCorrelativo = 0;

    for (const equipo of this.equipos) {
      const match = equipo.codigoInventario.match(patron);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxCorrelativo) {
          maxCorrelativo = num;
        }
      }
    }

    const siguiente = String(maxCorrelativo + 1).padStart(2, '0');
    return of(`${prefijoTipo}-${abreviaturaArea}-${siguiente}`);
  }

  verificarDisponibilidadIp(
    ip: string,
    idEquipo?: number
  ): Observable<DisponibilidadIp> {
    const ipLimpia = ip.trim();
    // Validar formato ipv4 básico
    const regexIpv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regexIpv4.test(ipLimpia)) {
      return of({
        disponible: false,
        mensaje: 'La dirección IP ingresada no es válida',
        equipoEnUso: null,
        idEquipoEnUso: null,
      });
    }

    const enUso = this.equipos.find(
      (e) => e.ipVigente === ipLimpia && (!idEquipo || e.id !== idEquipo)
    );

    if (enUso) {
      return of({
        disponible: false,
        mensaje: `La IP ${ipLimpia} ya está en uso por ${enUso.codigoInventario}`,
        equipoEnUso: enUso.codigoInventario,
        idEquipoEnUso: enUso.id,
      });
    }

    return of({
      disponible: true,
      mensaje: 'IP disponible para asignación',
      equipoEnUso: null,
      idEquipoEnUso: null,
    });
  }
}
