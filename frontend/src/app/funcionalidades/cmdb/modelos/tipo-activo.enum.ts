export enum TipoActivo {
  COMPUTADORA = 'COMPUTADORA',
  IMPRESORA = 'IMPRESORA',
  SERVIDOR = 'SERVIDOR',
  RED = 'RED',
  BIOMEDICO = 'BIOMEDICO',
  OTRO = 'OTRO',
}

export enum EstadoActivo {
  ACTIVO = 'ACTIVO',
  EN_MANTENIMIENTO = 'EN_MANTENIMIENTO',
  DADO_DE_BAJA = 'DADO_DE_BAJA',
}

export enum CriticidadActivo {
  VITAL_STAT = 'VITAL_STAT', // Equipos de UCI, Shock, Servidor PACS/HIS
  ALTA = 'ALTA',             // Triaje, Emergencia, Farmacia
  MEDIA = 'MEDIA',           // Admisión, Consultorios
  ESTANDAR = 'ESTANDAR',     // Oficinas administrativas
}
