import { environment } from '../../../environments/environment';

export const API_ENDPOINTS = {
  tickets: `${environment.apiUrl}/tickets`,
  reportarProblema: `${environment.apiUrl}/tickets/reportar`,
  contextoAtencion: `${environment.apiUrl}/contexto-atencion`,
  contextoCliente: `${environment.apiUrl}/tickets/contexto-cliente`,
  misTickets: `${environment.apiUrl}/tickets/mis-tickets`,
  tecnicos: `${environment.apiUrl}/usuarios/tecnicos`,
  categorias: `${environment.apiUrl}/categorias`,
  areas: `${environment.apiUrl}/areas`,
  conocimiento: `${environment.apiUrl}/conocimiento`,
  prestamos: `${environment.apiUrl}/prestamos`,
  reportes: {
    ejecutivoPdf: `${environment.apiUrl}/reportes/ejecutivo/pdf`,
    enviarCorreo: `${environment.apiUrl}/reportes/ejecutivo/enviar-correo`,
  },
  indicadores: {
    kpis: `${environment.apiUrl}/indicadores/kpis`,
    dashboard: `${environment.apiUrl}/indicadores/dashboard`,
  },
  admin: {
    areas: `${environment.apiUrl}/admin/areas`,
    personal: `${environment.apiUrl}/admin/personal`,
    equipos: `${environment.apiUrl}/admin/equipos`,
    redIpDisponibilidad: `${environment.apiUrl}/admin/red/ip-disponibilidad`,
  },
  catalogos: {
    gradosProfesionales: `${environment.apiUrl}/catalogos/grados-profesionales`,
  },
  cuenta: {
    contrasena: `${environment.apiUrl}/cuenta/contrasena`,
  },
} as const;