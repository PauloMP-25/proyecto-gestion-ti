import { TipoActivo, EstadoActivo, CriticidadActivo } from './tipo-activo.enum';

export interface ActivoCmdb {
  id: string | number;
  codigoPatrimonial: string; // ej: 'ACT-PC-0104'
  nombre: string;            // ej: 'Estación de Trabajo - Triaje Adultos 01'
  tipo: TipoActivo;
  marca: string;
  modelo: string;
  numeroSerie: string;
  idArea: number;
  areaNombre: string;        // ej: 'Emergencia y Cuidados Críticos'
  ubicacionDetalle?: string; // ej: 'Módulo 2, Pabellón A - 1er Piso'
  ip: string;                // ej: '192.168.10.15'
  vlanId: number;            // ej: 10
  mac: string;               // ej: '70:85:C2:51:AA:19'
  hostname: string;          // ej: 'PC-EMERG-01'
  sistemaOperativo?: string; // ej: 'Windows 11 Pro 64-bit' o 'Debian Linux 12'
  criticidad: CriticidadActivo;
  estado: EstadoActivo;
  fechaRegistro: string;
  ultimoMantenimiento?: string;
  responsableAsignado?: string; // ej: 'Lic. Morales (Jefe de Guardia)'
  observaciones?: string;
  ticketsAbiertos?: number;
}
