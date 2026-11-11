import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  tickets: `${environment.apiUrl}/tickets`,
  contextoCliente: `${environment.apiUrl}/tickets/contexto-cliente`,
  misTickets: `${environment.apiUrl}/tickets/mis-tickets`,
  tecnicos: `${environment.apiUrl}/usuarios/tecnicos`,
  categorias: `${environment.apiUrl}/categorias`,
  areas: `${environment.apiUrl}/areas`,
} as const;