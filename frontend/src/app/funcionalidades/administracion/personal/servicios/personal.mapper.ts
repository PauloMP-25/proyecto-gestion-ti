import { GradoProfesional, nombreVisible } from '../../../../compartido/catalogos/grado-profesional.enum';
import {
  ContrasenaTemporalInfo,
  PersonalActualizarForm,
  PersonalItem,
  PersonalRegistroForm,
} from '../modelos/personal.model';
import {
  RestablecerContrasenaRespuestaDto,
  UsuarioActualizarRequestDto,
  UsuarioRegistroRequestDto,
  UsuarioRespuestaDto,
} from './personal.dto';

export function aPersonalItem(dto: UsuarioRespuestaDto): PersonalItem {
  const gradoEnum = (dto.grado as GradoProfesional) || GradoProfesional.SIN_GRADO;
  const visible = dto.nombreVisible || nombreVisible(gradoEnum, dto.nombre, dto.apellidos);

  return {
    id: dto.id,
    nombre: dto.nombre,
    apellidos: dto.apellidos,
    nombreCompleto: dto.nombreCompleto || `${dto.nombre} ${dto.apellidos}`.trim(),
    nombreVisible: visible,
    correo: dto.correo,
    nombreUsuario: dto.nombreUsuario ?? null,
    idArea: dto.idArea ?? null,
    nombreArea: dto.nombreArea ?? null,
    rol: dto.rol,
    grado: gradoEnum,
    activo: dto.activo ?? true,
    debeCambiarContrasena: dto.debeCambiarContrasena ?? false,
    bloqueadoHasta: dto.bloqueadoHasta ?? null,
    ultimoAcceso: dto.ultimoAcceso ?? null,
  };
}

export function aUsuarioRegistroRequestDto(
  form: PersonalRegistroForm
): UsuarioRegistroRequestDto {
  return {
    nombre: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    correo: form.correo.trim().toLowerCase(),
    nombreUsuario: form.nombreUsuario?.trim().toLowerCase() || null,
    idArea: form.idArea,
    rol: form.rol,
    grado: form.grado || GradoProfesional.SIN_GRADO,
    contrasena: form.generarContrasena ? null : form.contrasena || null,
    generarContrasena: form.generarContrasena,
  };
}

export function aUsuarioActualizarRequestDto(
  form: PersonalActualizarForm
): UsuarioActualizarRequestDto {
  return {
    nombre: form.nombres.trim(),
    apellidos: form.apellidos.trim(),
    correo: form.correo.trim().toLowerCase(),
    nombreUsuario: form.nombreUsuario?.trim().toLowerCase() || null,
    idArea: form.idArea,
    rol: form.rol,
    grado: form.grado || GradoProfesional.SIN_GRADO,
  };
}

export function aContrasenaTemporalInfo(
  dto: RestablecerContrasenaRespuestaDto
): ContrasenaTemporalInfo {
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    correo: dto.correo,
    contrasenaTemporal: dto.contrasenaTemporal,
    mensaje: dto.mensaje,
  };
}
