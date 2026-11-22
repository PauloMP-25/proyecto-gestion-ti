import { ArticuloConocimiento } from './articulo-conocimiento.model';

export interface ArticuloConocimientoDto {
  id?: number;
  idError?: number;
  titulo?: string;
  asunto?: string;
  resumen?: string;
  descripcionProblema?: string;
  contenidoHtml?: string;
  solucionTrabajo?: string;
  categoriaId?: number;
  categoriaNombre?: string;
  palabrasClave?: string[] | string;
  equiposCompatibles?: string[] | string;
  publicado?: boolean;
  esPublico?: boolean;
  conteoUtil?: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export function mapearArticuloConocimiento(dto: ArticuloConocimientoDto): ArticuloConocimiento {
  const id = dto.id ?? dto.idError ?? 0;
  const titulo = dto.titulo || dto.asunto || 'Guía de Soporte';
  const resumen = dto.resumen || dto.descripcionProblema || 'Instrucciones técnicas de autoatención';
  const contenidoHtml = dto.contenidoHtml || dto.solucionTrabajo || '';

  // Parsear palabras clave si vienen como CSV string o array
  let palabrasClave: string[] = [];
  if (Array.isArray(dto.palabrasClave)) {
    palabrasClave = dto.palabrasClave;
  } else if (typeof dto.palabrasClave === 'string' && dto.palabrasClave.trim()) {
    palabrasClave = dto.palabrasClave.split(',').map((p) => p.trim());
  }

  // Parsear equipos compatibles
  let equiposCompatibles: string[] = [];
  if (Array.isArray(dto.equiposCompatibles)) {
    equiposCompatibles = dto.equiposCompatibles;
  } else if (typeof dto.equiposCompatibles === 'string' && dto.equiposCompatibles.trim()) {
    equiposCompatibles = dto.equiposCompatibles.split(',').map((e) => e.trim());
  }

  // Derivar pasos secuenciales a partir del contenido si tiene saltos de línea
  const lineas = contenidoHtml
    .replace(/<[^>]*>/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const pasos = lineas.length > 1 ? lineas : [contenidoHtml || 'Siga los pasos indicados.'];

  return {
    id,
    titulo,
    resumen,
    contenidoHtml,
    categoriaId: dto.categoriaId ?? 1,
    categoriaNombre: dto.categoriaNombre ?? 'General',
    palabrasClave,
    equiposCompatibles,
    esPublico: dto.esPublico ?? dto.publicado ?? true,
    conteoUtil: dto.conteoUtil ?? 0,
    fechaActualizacion: dto.fechaActualizacion ?? dto.fechaCreacion ?? new Date().toISOString(),
    sintoma: resumen,
    causaRaiz: null,
    solucionTemporal: contenidoHtml,
    pasos,
  };
}
