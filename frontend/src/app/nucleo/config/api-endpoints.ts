import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  tickets: `${environment.apiUrl}/tickets`,
  contextoCliente: `${environment.apiUrl}/tickets/contexto-cliente`,
  misTickets: `${environment.apiUrl}/tickets/mis-tickets`,
  tecnicos: `${environment.apiUrl}/usuarios/tecnicos`,
  categorias: `${environment.apiUrl}/categorias`,
  areas: `${environment.apiUrl}/areas`,
  admin: {
    areas: `${environment.apiUrl}/admin/areas`,
    personal: `${environment.apiUrl}/admin/personal`,
    equipos: `${environment.apiUrl}/admin/equipos`,
    redIpDisponibilidad: `${environment.apiUrl}/admin/red/ip-disponibilidad`,
  },
  catalogos: {
    gradosProfesionales: `${environment.apiUrl}/catalogos/grados-profesionales`,
  },
} as const;