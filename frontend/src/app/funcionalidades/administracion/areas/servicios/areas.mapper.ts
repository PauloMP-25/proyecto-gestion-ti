import { AreaDetalle, AreaFormulario, AreaResumen, PISOS_HOSPITALARIOS } from '../modelos/areas.model';
import { AreaDetalleDto, AreaResumenDto, AreaSolicitudDto } from './areas.dto';

export function formatearPiso(piso: number | null | undefined): string {
  if (piso === null || piso === undefined) {
    return 'Sin piso especificado';
  }
  const encontrado = PISOS_HOSPITALARIOS.find((p) => p.valor === piso);
  return encontrado ? encontrado.etiqueta : `Piso ${piso}`;
}

export function aAreaResumen(dto: AreaResumenDto): AreaResumen {
  return {
    id: dto.id,
    nombre: dto.nombre,
    piso: dto.piso,
    ubicacionLegible: dto.ubicacionLegible || formatearPiso(dto.piso),
    anexo: dto.anexo ?? null,
    encargado: dto.encargado
      ? { id: dto.encargado.id, nombreVisible: dto.encargado.nombreVisible }
      : null,
    activo: dto.activo,
    totalPersonal: dto.totalPersonal ?? 0,
    totalComputadoras: dto.totalComputadoras ?? 0,
    totalImpresoras: dto.totalImpresoras ?? 0,
    prioridadDefecto: dto.prioridadDefecto ?? 'P3',
  };
}

export function aAreaDetalle(dto: AreaDetalleDto): AreaDetalle {
  return {
    ...aAreaResumen(dto),
    referenciaUbicacion: dto.referenciaUbicacion ?? null,
  };
}

export function aAreaSolicitudDto(form: AreaFormulario): AreaSolicitudDto {
  return {
    nombre: form.nombre.trim(),
    piso: form.piso,
    referenciaUbicacion: form.referenciaUbicacion?.trim() || null,
    anexo: form.anexo?.trim() || null,
    idEncargado: form.idEncargado,
    prioridadDefecto: form.prioridadDefecto || 'P3',
  };
}
