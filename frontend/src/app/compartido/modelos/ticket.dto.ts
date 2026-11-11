import { Impacto, TipoTicket, Urgencia } from './impacto-urgencia.enum';
import { NivelSoporte } from './nivel-soporte.enum';
import { RolUsuario } from '../../nucleo/modelos/rol.enum';

export interface CrearTicketDto {
  tipo: TipoTicket;
  idCategoria: number;
  impacto: Impacto;
  urgencia: Urgencia;
  titulo: string;
  descripcion: string;
  anexoContacto?: string;
}

export interface ContextoCliente {
  ip: string;
  hostname: string | null;
  idArea: number | null;
  area: string | null;
  anexo: string | null;
  idEquipo: number | null;
  ipRegistrada: boolean;
}

export interface Tecnico {
  id: number;
  nombreCompleto: string;
  rol: RolUsuario;
  nivelSoporte: NivelSoporte;
  ticketsAbiertos: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  idPadre?: number | null;
}

export interface Area {
  id: number;
  nombre: string;
}