import { TestBed } from '@angular/core/testing';
import { CmdbService } from './cmdb.service';
import { TipoActivo, EstadoActivo, CriticidadActivo } from '../modelos/tipo-activo.enum';

describe('CmdbService', () => {
  let service: CmdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CmdbService);
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe inicializar con activos hospitalarios y subredes', () => {
    expect(service.activos().length).toBeGreaterThan(0);
    expect(service.subredes().length).toBeGreaterThan(0);
    expect(service.totalComputadoras()).toBeGreaterThan(0);
    expect(service.totalImpresoras()).toBeGreaterThan(0);
  });

  it('debe generar la matriz de IPs para la VLAN 10 con estados adecuados', () => {
    const matriz = service.obtenerMatrizIps(10);
    expect(matriz.length).toBeGreaterThan(0);

    // .1 debe ser reservada (Gateway)
    const gateway = matriz.find(m => m.octetoFinal === 1);
    expect(gateway?.estado).toBe('RESERVADA');

    // Debe contener IPs ocupadas asignadas a activos
    const ocupadas = matriz.filter(m => m.estado === 'OCUPADA');
    expect(ocupadas.length).toBeGreaterThan(0);
    expect(ocupadas[0].activoAsignado).toBeDefined();

    // Debe contener IPs disponibles
    const disponibles = matriz.filter(m => m.estado === 'DISPONIBLE');
    expect(disponibles.length).toBeGreaterThan(0);
  });

  it('debe registrar un nuevo activo y reflejarlo en la lista reactiva', () => {
    const totalInicial = service.activos().length;

    const nuevoActivo = service.registrarActivo({
      codigoPatrimonial: 'ACT-PC-9999',
      nombre: 'Estación de Telemedicina Pediátrica',
      tipo: TipoActivo.COMPUTADORA,
      marca: 'Dell',
      modelo: 'OptiPlex 7000',
      numeroSerie: 'S9921D',
      idArea: 1,
      areaNombre: 'Pediatría',
      ip: '192.168.10.40',
      vlanId: 10,
      mac: 'AA:BB:CC:DD:EE:FF',
      hostname: 'PC-PED-01',
      criticidad: CriticidadActivo.ALTA,
      estado: EstadoActivo.ACTIVO,
    });

    expect(nuevoActivo.id).toBeDefined();
    expect(service.activos().length).toBe(totalInicial + 1);
    expect(service.activos()[0].codigoPatrimonial).toBe('ACT-PC-9999');
  });

  it('debe cambiar el estado de un activo', () => {
    const primerActivo = service.activos()[0];
    service.cambiarEstadoActivo(primerActivo.id, EstadoActivo.EN_MANTENIMIENTO);

    const actualizado = service.activos().find(a => a.id === primerActivo.id);
    expect(actualizado?.estado).toBe(EstadoActivo.EN_MANTENIMIENTO);
  });
});
