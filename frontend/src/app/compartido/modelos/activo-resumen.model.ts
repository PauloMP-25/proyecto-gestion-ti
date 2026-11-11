import { TipoActivo } from '../../funcionalidades/cmdb/modelos/tipo-activo.enum';

export type TipoCI = TipoActivo;

export interface ActivoResumen {
  id: number;
  nombre: string;
  tipo: TipoActivo;
  estado: 'ACTIVO' | 'BAJA' | 'MANTENIMIENTO';
  hostname: string | null;
  ip: string | null;
  areaId: number;
  areaNombre: string;
  fallasUltimos90Dias: number | null;
  enPrestamo: boolean;
}
