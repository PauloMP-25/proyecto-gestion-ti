import { Injectable, signal, computed } from '@angular/core';
import { ActivoCmdb } from '../modelos/activo-cmdb.model';
import { TipoActivo, EstadoActivo, CriticidadActivo } from '../modelos/tipo-activo.enum';
import { SubredCmdb, DireccionIp } from '../modelos/direccion-ip.model';

@Injectable({
  providedIn: 'root',
})
export class CmdbService {
  // Lista de subredes hospitalarias
  readonly subredes = signal<SubredCmdb[]>([
    {
      vlanId: 10,
      nombre: 'VLAN 10 - Red Asistencial Emergencia y Triaje',
      segmento: '192.168.10.0/24',
      gateway: '192.168.10.1',
      mascara: '255.255.255.0',
      colorIdentificador: '#701C1C', // Guinda institucional
      totalIps: 60, // Mapeo de visualización inicial
      ipsOcupadas: 6,
      ipsDisponibles: 50,
      ipsReservadas: 4,
      proposito: 'Estaciones de trabajo médicas, triaje de choque, consultorios de emergencia',
    },
    {
      vlanId: 20,
      nombre: 'VLAN 20 - Cuidados Intensivos (UCI) y Quirófanos',
      segmento: '192.168.20.0/24',
      gateway: '192.168.20.1',
      mascara: '255.255.255.0',
      colorIdentificador: '#1B5E20', // Verde hospitalario
      totalIps: 60,
      ipsOcupadas: 4,
      ipsDisponibles: 52,
      ipsReservadas: 4,
      proposito: 'Monitores centrales UCI, estaciones médicas de anestesia y soporte vital',
    },
    {
      vlanId: 30,
      nombre: 'VLAN 30 - Impresoras Asistenciales y Periféricos',
      segmento: '192.168.30.0/24',
      gateway: '192.168.30.1',
      mascara: '255.255.255.0',
      colorIdentificador: '#D97706', // Ámbar
      totalIps: 60,
      ipsOcupadas: 5,
      ipsDisponibles: 51,
      ipsReservadas: 4,
      proposito: 'Impresoras térmicas de recetas, tickets de laboratorio y brazaletes de admisión',
    },
    {
      vlanId: 40,
      nombre: 'VLAN 40 - Servidores y Almacenamiento Salud (HIS/PACS)',
      segmento: '192.168.1.0/24',
      gateway: '192.168.1.1',
      mascara: '255.255.255.0',
      colorIdentificador: '#0284C7', // Azul clínico
      totalIps: 40,
      ipsOcupadas: 6,
      ipsDisponibles: 30,
      ipsReservadas: 4,
      proposito: 'Servidor de Base de Datos SISGalenPlus, Servidor PACS Radiología, Active Directory',
    },
    {
      vlanId: 50,
      nombre: 'VLAN 50 - Gestión de Red e Infraestructura TI',
      segmento: '192.168.100.0/24',
      gateway: '192.168.100.1',
      mascara: '255.255.255.0',
      colorIdentificador: '#475569', // Slate
      totalIps: 40,
      ipsOcupadas: 4,
      ipsDisponibles: 32,
      ipsReservadas: 4,
      proposito: 'Switches Core, routers de frontera, access points clínicos y enlaces de fibra',
    },
  ]);

  // Inventario de activos inicial con datos realistas del Hospital Santa María del Socorro
  private readonly activosIniciales: ActivoCmdb[] = [
    {
      id: 1,
      codigoPatrimonial: 'ACT-PC-0101',
      nombre: 'Estación de Trabajo - Triaje Adultos 01',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'HP',
      modelo: 'ProDesk 400 G7 SFF',
      numeroSerie: 'MXL1082X9P',
      idArea: 1,
      areaNombre: 'Emergencia y Cuidados Críticos',
      ubicacionDetalle: 'Módulo 1 de Triaje, Pabellón Emergencia 1er Piso',
      ip: '192.168.10.11',
      vlanId: 10,
      mac: '70:85:C2:51:AA:11',
      hostname: 'PC-TRIAJE-01',
      sistemaOperativo: 'Windows 11 Pro 64-bit',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-02-15T08:00:00Z',
      ultimoMantenimiento: '2026-10-10T14:30:00Z',
      responsableAsignado: 'Lic. María Delgado (Enfermera de Triage)',
      ticketsAbiertos: 1,
      observaciones: 'Terminal conectada a visor directo de triaje Manchester.',
    },
    {
      id: 2,
      codigoPatrimonial: 'ACT-PC-0102',
      nombre: 'Estación Médica - Shock Trauma Emergencia',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'Dell',
      modelo: 'OptiPlex 7090 Micro',
      numeroSerie: '8XYZ192D',
      idArea: 1,
      areaNombre: 'Emergencia y Cuidados Críticos',
      ubicacionDetalle: 'Sala de Reanimación / Shock Trauma',
      ip: '192.168.10.12',
      vlanId: 10,
      mac: 'F0:2F:74:90:3A:42',
      hostname: 'PC-SHOCK-01',
      sistemaOperativo: 'Windows 11 Pro 64-bit',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-01-20T10:00:00Z',
      ultimoMantenimiento: '2026-10-25T11:00:00Z',
      responsableAsignado: 'Dr. Carlos Mendoza (Médico Emergencista)',
      ticketsAbiertos: 0,
    },
    {
      id: 3,
      codigoPatrimonial: 'ACT-PC-0103',
      nombre: 'Estación Central de Monitoreo UCI Adultos',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'Lenovo',
      modelo: 'ThinkCentre M70s Gen 3',
      numeroSerie: 'MJ09F1LK',
      idArea: 3,
      areaNombre: 'Unidad de Cuidados Intensivos (UCI)',
      ubicacionDetalle: 'Central de Enfermería UCI - 2do Piso',
      ip: '192.168.20.15',
      vlanId: 20,
      mac: 'E4:54:E8:21:40:55',
      hostname: 'PC-UCI-CEN-01',
      sistemaOperativo: 'Windows 10 Enterprise LTSC',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-11-05T09:30:00Z',
      ultimoMantenimiento: '2026-11-01T16:00:00Z',
      responsableAsignado: 'Lic. Carmen Ríos (Supervisora UCI)',
      ticketsAbiertos: 0,
    },
    {
      id: 4,
      codigoPatrimonial: 'ACT-PC-0104',
      nombre: 'Estación de Diagnóstico Radiológico DICOM',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'Barco / HP',
      modelo: 'Z4 G4 Workstation 64GB',
      numeroSerie: 'CZC9405WTL',
      idArea: 4,
      areaNombre: 'Diagnóstico por Imágenes / Radiología',
      ubicacionDetalle: 'Sala de Lectura de Tomografía y Rayos X',
      ip: '192.168.10.22',
      vlanId: 10,
      mac: '3C:52:82:7A:B4:9C',
      hostname: 'PC-RADIO-DICOM-01',
      sistemaOperativo: 'Windows 11 Pro para Estaciones de Trabajo',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-08-12T11:15:00Z',
      ultimoMantenimiento: '2026-09-18T10:00:00Z',
      responsableAsignado: 'Dr. Roberto Huamán (Médico Radiólogo)',
      ticketsAbiertos: 1,
    },
    {
      id: 5,
      codigoPatrimonial: 'ACT-PC-0105',
      nombre: 'Estación de Despacho y Farmacia Central',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'HP',
      modelo: 'ProDesk 400 G6',
      numeroSerie: 'MXL8391K88',
      idArea: 5,
      areaNombre: 'Farmacia Hospitalaria',
      ubicacionDetalle: 'Ventanilla 1 de Dispensación Continua',
      ip: '192.168.10.33',
      vlanId: 10,
      mac: '70:85:C2:88:99:12',
      hostname: 'PC-FAR-01',
      sistemaOperativo: 'Windows 11 Pro 64-bit',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-03-01T12:00:00Z',
      ultimoMantenimiento: '2026-08-14T09:00:00Z',
      responsableAsignado: 'Q.F. Sonia Valenzuela',
      ticketsAbiertos: 0,
    },
    {
      id: 6,
      codigoPatrimonial: 'ACT-PC-0106',
      nombre: 'Estación Médica - Consultorio de Cardiología',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'Lenovo',
      modelo: 'ThinkCentre Neo 50s',
      numeroSerie: 'PB0489AA',
      idArea: 2,
      areaNombre: 'Consulta Externa y Especialidades',
      ubicacionDetalle: 'Consultorio 14, Pabellón B',
      ip: '192.168.10.45',
      vlanId: 10,
      mac: '54:B8:0A:11:09:FE',
      hostname: 'PC-CARDIO-01',
      sistemaOperativo: 'Windows 11 Pro 64-bit',
      criticidad: CriticidadActivo.MEDIA,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-04-10T15:00:00Z',
      ultimoMantenimiento: '2026-07-22T17:00:00Z',
      responsableAsignado: 'Dr. Víctor Ramos',
      ticketsAbiertos: 0,
    },
    {
      id: 7,
      codigoPatrimonial: 'ACT-IMP-0201',
      nombre: 'Impresora Térmica Recetas Médicas Farmacia',
      tipo: TipoActivo.IMPRESORA,
      marca: 'Epson',
      modelo: 'TM-T88VI Ethernet',
      numeroSerie: 'EP88VI-99201',
      idArea: 5,
      areaNombre: 'Farmacia Hospitalaria',
      ubicacionDetalle: 'Mesa de Dispensación de Medicamentos Controlados',
      ip: '192.168.30.12',
      vlanId: 30,
      mac: '00:26:AB:44:12:01',
      hostname: 'IMP-TERM-FAR-01',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-01-15T09:00:00Z',
      ultimoMantenimiento: '2026-10-15T15:00:00Z',
      responsableAsignado: 'Q.F. Sonia Valenzuela',
      ticketsAbiertos: 0,
      observaciones: 'Imprime códigos QR de verificación SIS.',
    },
    {
      id: 8,
      codigoPatrimonial: 'ACT-IMP-0202',
      nombre: 'Impresora Láser de Historias y Boletas Triaje',
      tipo: TipoActivo.IMPRESORA,
      marca: 'Brother',
      modelo: 'HL-L6200DW Red Dúplex',
      numeroSerie: 'BRO-6200-883',
      idArea: 1,
      areaNombre: 'Emergencia y Cuidados Críticos',
      ubicacionDetalle: 'Estación de Triaje y Admisión Rápida',
      ip: '192.168.30.15',
      vlanId: 30,
      mac: '00:80:77:99:32:41',
      hostname: 'IMP-LASER-TRIAJE',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.EN_MANTENIMIENTO,
      fechaRegistro: '2024-09-01T10:00:00Z',
      ultimoMantenimiento: '2026-11-08T08:00:00Z',
      responsableAsignado: 'Mesa de Soporte TI',
      ticketsAbiertos: 1,
      observaciones: 'En revisión por atasco frecuente de rodillo fusor.',
    },
    {
      id: 9,
      codigoPatrimonial: 'ACT-IMP-0203',
      nombre: 'Impresora Térmica de Brazaletes de Pacientes',
      tipo: TipoActivo.IMPRESORA,
      marca: 'Zebra',
      modelo: 'ZD510-HC Hospitalaria Antimicrobiana',
      numeroSerie: 'ZBR-ZD510-0982',
      idArea: 1,
      areaNombre: 'Emergencia y Cuidados Críticos',
      ubicacionDetalle: 'Módulo de Admisión y Registro de Pacientes',
      ip: '192.168.30.20',
      vlanId: 30,
      mac: '00:07:4D:2A:90:8B',
      hostname: 'IMP-BRAZ-ADMIS',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2025-05-18T14:00:00Z',
      ultimoMantenimiento: '2026-10-02T11:00:00Z',
      responsableAsignado: 'Admisión Central',
      ticketsAbiertos: 0,
      observaciones: 'Imprime brazaletes térmicos de identificación con código de barras.',
    },
    {
      id: 10,
      codigoPatrimonial: 'ACT-IMP-0204',
      nombre: 'Impresora Multifuncional Informes Médicos UCI',
      tipo: TipoActivo.IMPRESORA,
      marca: 'HP',
      modelo: 'LaserJet Enterprise MFP M528dn',
      numeroSerie: 'CNB1982741',
      idArea: 3,
      areaNombre: 'Unidad de Cuidados Intensivos (UCI)',
      ubicacionDetalle: 'Pasillo Central UCI, Estación de Informes',
      ip: '192.168.30.25',
      vlanId: 30,
      mac: 'AC:16:2D:FE:10:44',
      hostname: 'IMP-MFP-UCI',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-12-10T16:00:00Z',
      ultimoMantenimiento: '2026-09-30T10:00:00Z',
      responsableAsignado: 'Lic. Carmen Ríos',
      ticketsAbiertos: 0,
    },
    {
      id: 11,
      codigoPatrimonial: 'ACT-SRV-0001',
      nombre: 'Servidor Base de Datos SISGalenPlus Core',
      tipo: TipoActivo.SERVIDOR,
      marca: 'Dell EMC',
      modelo: 'PowerEdge R750xs Rack 2U (128GB RAM)',
      numeroSerie: 'SRV-DEL-750X-01',
      idArea: 6,
      areaNombre: 'Tecnología y Sistemas (Data Center)',
      ubicacionDetalle: 'Rack 1, Sala de Servidores Climatizada - Data Center',
      ip: '192.168.1.10',
      vlanId: 40,
      mac: '18:66:DA:33:01:A0',
      hostname: 'SRV-SISGALEN-DB',
      sistemaOperativo: 'Red Hat Enterprise Linux 9 / SQL Server 2022',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-03-10T09:00:00Z',
      ultimoMantenimiento: '2026-10-30T23:00:00Z',
      responsableAsignado: 'Ing. Administrador de Servidores TI',
      ticketsAbiertos: 0,
      observaciones: 'Servidor de base de datos hospitalario con respaldo en caliente.',
    },
    {
      id: 12,
      codigoPatrimonial: 'ACT-SRV-0002',
      nombre: 'Servidor PACS Radiológico e Imágenes Médicas',
      tipo: TipoActivo.SERVIDOR,
      marca: 'HPE',
      modelo: 'ProLiant DL380 Gen10 Storage Server',
      numeroSerie: 'HPE-DL380-044',
      idArea: 6,
      areaNombre: 'Tecnología y Sistemas (Data Center)',
      ubicacionDetalle: 'Rack 2, Unidad de Almacenamiento SAN 40TB',
      ip: '192.168.1.20',
      vlanId: 40,
      mac: 'D8:9D:67:1A:4C:82',
      hostname: 'SRV-PACS-STORE',
      sistemaOperativo: 'Ubuntu Server 22.04 LTS DCM4CHEE',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-05-20T10:00:00Z',
      ultimoMantenimiento: '2026-11-05T02:00:00Z',
      responsableAsignado: 'Ing. Administrador de Servidores TI',
      ticketsAbiertos: 0,
    },
    {
      id: 13,
      codigoPatrimonial: 'ACT-NET-0001',
      nombre: 'Switch Core Distribución Emergencia y Shock',
      tipo: TipoActivo.RED,
      marca: 'Cisco',
      modelo: 'Catalyst 9300 48-Port PoE+',
      numeroSerie: 'FCW2348A02',
      idArea: 6,
      areaNombre: 'Tecnología y Sistemas (Data Center)',
      ubicacionDetalle: 'Gabinete de Comunicaciones Pabellón A',
      ip: '192.168.100.2',
      vlanId: 50,
      mac: '00:78:88:AC:33:02',
      hostname: 'SW-CORE-EMERG',
      sistemaOperativo: 'Cisco IOS-XE 17.9',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-02-01T08:00:00Z',
      ultimoMantenimiento: '2026-10-12T01:00:00Z',
      responsableAsignado: 'Ing. Especialista en Redes',
      ticketsAbiertos: 0,
    },
    {
      id: 14,
      codigoPatrimonial: 'ACT-NET-0002',
      nombre: 'Switch de Acceso UCI y Quirófanos',
      tipo: TipoActivo.RED,
      marca: 'Aruba / HPE',
      modelo: 'CX 6200F 24G 4SFP+ Switch',
      numeroSerie: 'SG023471A',
      idArea: 6,
      areaNombre: 'Tecnología y Sistemas (Data Center)',
      ubicacionDetalle: 'Gabinete de Comunicaciones Pabellón UCI 2do Piso',
      ip: '192.168.100.5',
      vlanId: 50,
      mac: '20:4C:03:99:A1:75',
      hostname: 'SW-ACC-UCI',
      sistemaOperativo: 'AOS-CX 10.12',
      criticidad: CriticidadActivo.VITAL_STAT,
      estado: EstadoActivo.ACTIVO,
      fechaRegistro: '2024-04-15T09:00:00Z',
      ultimoMantenimiento: '2026-09-20T03:00:00Z',
      responsableAsignado: 'Ing. Especialista en Redes',
      ticketsAbiertos: 0,
    },
  ];

  // Estado reactivo principal de activos
  readonly activos = signal<ActivoCmdb[]>(this.activosIniciales);

  // KPIs calculados
  readonly totalActivos = computed(() => this.activos().length);
  readonly totalComputadoras = computed(() => this.activos().filter(a => a.tipo === TipoActivo.COMPUTADORA).length);
  readonly totalImpresoras = computed(() => this.activos().filter(a => a.tipo === TipoActivo.IMPRESORA).length);
  readonly totalServidoresYRed = computed(() => this.activos().filter(a => a.tipo === TipoActivo.SERVIDOR || a.tipo === TipoActivo.RED).length);
  readonly porcentajeOperativos = computed(() => {
    const total = this.activos().length;
    if (total === 0) return 100;
    const operativos = this.activos().filter(a => a.estado === EstadoActivo.ACTIVO).length;
    return Math.round((operativos / total) * 100);
  });

  // Generador de la matriz de direcciones IP para una subred dada
  obtenerMatrizIps(vlanId: number): DireccionIp[] {
    const subred = this.subredes().find(s => s.vlanId === vlanId);
    if (!subred) return [];

    const basePrefix = subred.segmento.split('.')[0] + '.' + 
                       subred.segmento.split('.')[1] + '.' + 
                       subred.segmento.split('.')[2];

    const activosEnSubred = this.activos().filter(a => a.vlanId === vlanId);
    const matriz: DireccionIp[] = [];

    // Generar mapeo del rango .1 al .totalIps
    for (let i = 1; i <= subred.totalIps; i++) {
      const ipGenerada = `${basePrefix}.${i}`;

      // IPs .1 a .4 son reservadas para Gateway, switches de gestión o firewall
      if (i === 1) {
        matriz.push({
          ip: ipGenerada,
          vlanId: subred.vlanId,
          vlanNombre: subred.nombre,
          octetoFinal: i,
          estado: 'RESERVADA',
          descripcionUso: 'Gateway por Defecto (Router Core)',
        });
      } else if (i === 2 || i === 3) {
        matriz.push({
          ip: ipGenerada,
          vlanId: subred.vlanId,
          vlanNombre: subred.nombre,
          octetoFinal: i,
          estado: 'RESERVADA',
          descripcionUso: 'IP Reservada para Enlace Redundante / Switch de Gestión',
        });
      } else if (i === 4) {
        matriz.push({
          ip: ipGenerada,
          vlanId: subred.vlanId,
          vlanNombre: subred.nombre,
          octetoFinal: i,
          estado: 'RESERVADA',
          descripcionUso: 'Servicio DHCP y DNS Hospitalario',
        });
      } else {
        // Verificar si algún activo tiene esta IP
        const activo = activosEnSubred.find(a => a.ip === ipGenerada);
        if (activo) {
          matriz.push({
            ip: ipGenerada,
            vlanId: subred.vlanId,
            vlanNombre: subred.nombre,
            octetoFinal: i,
            estado: 'OCUPADA',
            activoAsignado: {
              id: activo.id,
              codigoPatrimonial: activo.codigoPatrimonial,
              nombre: activo.nombre,
              tipo: activo.tipo,
              areaNombre: activo.areaNombre,
              hostname: activo.hostname,
              mac: activo.mac,
            },
          });
        } else {
          matriz.push({
            ip: ipGenerada,
            vlanId: subred.vlanId,
            vlanNombre: subred.nombre,
            octetoFinal: i,
            estado: 'DISPONIBLE',
          });
        }
      }
    }

    return matriz;
  }

  // Obtener lista de IPs disponibles para asignación rápida en una VLAN
  obtenerIpsDisponibles(vlanId: number): string[] {
    const matriz = this.obtenerMatrizIps(vlanId);
    return matriz.filter(ip => ip.estado === 'DISPONIBLE').map(ip => ip.ip);
  }

  // Crear un nuevo activo en el inventario y actualizar los registros de IPs
  registrarActivo(nuevo: Omit<ActivoCmdb, 'id' | 'fechaRegistro'>): ActivoCmdb {
    const nuevoId = Date.now();
    const activoCreado: ActivoCmdb = {
      ...nuevo,
      id: nuevoId,
      fechaRegistro: new Date().toISOString(),
      ticketsAbiertos: 0,
    };

    this.activos.update(lista => [activoCreado, ...lista]);
    this.actualizarMetricasSubredes();
    return activoCreado;
  }

  // Actualizar un activo existente
  actualizarActivo(id: string | number, cambios: Partial<ActivoCmdb>): void {
    this.activos.update(lista =>
      lista.map(a => (a.id === id ? { ...a, ...cambios } : a))
    );
    this.actualizarMetricasSubredes();
  }

  // Cambiar estado operativo del activo
  cambiarEstadoActivo(id: string | number, nuevoEstado: EstadoActivo): void {
    this.activos.update(lista =>
      lista.map(a => (a.id === id ? { ...a, estado: nuevoEstado } : a))
    );
  }

  // Eliminar o dar de baja activo
  darDeBajaActivo(id: string | number): void {
    this.cambiarEstadoActivo(id, EstadoActivo.DADO_DE_BAJA);
  }

  // Recalcular métricas de IPs ocupadas en las subredes
  private actualizarMetricasSubredes(): void {
    const listaActual = this.activos();
    this.subredes.update(subredes =>
      subredes.map(s => {
        const ocupadas = listaActual.filter(a => a.vlanId === s.vlanId && a.estado !== EstadoActivo.DADO_DE_BAJA).length;
        const disponibles = Math.max(0, s.totalIps - ocupadas - s.ipsReservadas);
        return {
          ...s,
          ipsOcupadas: ocupadas,
          ipsDisponibles: disponibles,
        };
      })
    );
  }
}
