export type TipoTicket = 'INCIDENTE' | 'SOLICITUD';

// ALTO = área crítica 24/7 (Emergencia, Admisión, SIS, Cajas, Farmacia)
export type Impacto = 'ALTO' | 'MEDIO' | 'BAJO';

// ALTA = paraliza la atención en este momento (urgencia en femenino)
export type Urgencia = 'ALTA' | 'MEDIA' | 'BAJA';