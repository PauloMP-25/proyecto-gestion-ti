import { TipoActivo } from './tipo-activo.enum';

export type EstadoDireccionIp = 'OCUPADA' | 'DISPONIBLE' | 'RESERVADA';

export interface DireccionIp {
  ip: string;                  // ej: '192.168.10.15'
  vlanId: number;              // ej: 10
  vlanNombre: string;          // ej: 'VLAN 10 - Red Asistencial Emergencia'
  octetoFinal: number;         // ej: 15 (para la cuadrícula de trazabilidad)
  estado: EstadoDireccionIp;
  activoAsignado?: {
    id: string | number;
    codigoPatrimonial: string;
    nombre: string;
    tipo: TipoActivo;
    areaNombre: string;
    hostname: string;
    mac?: string;
  };
  descripcionUso?: string;     // ej: 'Gateway', 'Switch Core HSMSI', etc.
}

export interface SubredCmdb {
  vlanId: number;
  nombre: string;
  segmento: string;            // ej: '192.168.10.0/24'
  gateway: string;             // ej: '192.168.10.1'
  mascara: string;             // ej: '255.255.255.0'
  colorIdentificador: string;  // color hexadecimal representativo
  totalIps: number;
  ipsOcupadas: number;
  ipsDisponibles: number;
  ipsReservadas: number;
  proposito: string;
}
