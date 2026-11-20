import {
  DisponibilidadIp,
  EquipoFormulario,
  EquipoItem,
} from '../modelos/equipos.model';
import {
  DisponibilidadIpRespuestaDto,
  EquipoDetalleDto,
  EquipoResumenDto,
  EquipoSolicitudDto,
} from './equipos.dto';

export function aEquipoItem(
  dto: EquipoResumenDto | EquipoDetalleDto
): EquipoItem {
  const detalle = dto as EquipoDetalleDto;
  return {
    id: dto.id,
    codigoInventario: dto.codigoInventario,
    tipo: dto.tipo,
    idArea: dto.idArea,
    nombreArea: dto.nombreArea,
    marcaModelo: dto.marcaModelo ?? null,
    referenciaUbicacion: dto.referenciaUbicacion ?? null,
    ipVigente: dto.ipVigente ?? null,
    estado: dto.estado,
    activo: dto.activo,
    hostname: detalle.hostname ?? null,
    mac: detalle.mac ?? null,
  };
}

export function aEquipoSolicitudDto(
  form: EquipoFormulario
): EquipoSolicitudDto {
  return {
    tipo: form.tipo,
    idArea: form.idArea,
    codigoInventario: form.codigoInventario.trim().toUpperCase(),
    marcaModelo: form.marcaModelo?.trim() || null,
    referenciaUbicacion: form.referenciaUbicacion?.trim() || null,
    ipEstatica: form.ipEstatica?.trim() || null,
    hostname: form.hostname?.trim() || null,
    mac: form.mac?.trim().toUpperCase() || null,
  };
}

export function aDisponibilidadIp(
  dto: DisponibilidadIpRespuestaDto
): DisponibilidadIp {
  return {
    disponible: dto.disponible,
    mensaje: dto.mensaje,
    equipoEnUso: dto.equipoEnUso ?? null,
    idEquipoEnUso: dto.idEquipoEnUso ?? null,
  };
}
