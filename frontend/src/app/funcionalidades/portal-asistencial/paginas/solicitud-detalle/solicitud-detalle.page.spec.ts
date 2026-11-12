import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SolicitudDetallePage } from './solicitud-detalle.page';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { SolicitudDetalle } from '../../modelos/solicitud.model';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
} from '../../../../compartido/utilidades/vocabulario-asistencial';

describe('SolicitudDetallePage (A4 - P-03)', () => {
  let component: SolicitudDetallePage;
  let fixture: ComponentFixture<SolicitudDetallePage>;
  let mockApi: {
    obtenerDetalle: any;
    confirmarSolucion: any;
    reabrir: any;
    calificar: any;
  };

  const solicitudMock: SolicitudDetalle = {
    id: 101,
    codigo: 'INC-2026-00231',
    titulo: 'Impresora de recetas no imprime',
    descripcion: 'La impresora de triaje no responde al enviar orden médica.',
    categoriaNombre: 'Hardware / Impresoras',
    areaNombre: 'Triaje de Emergencia',
    etapa: 'EN_ATENCION',
    urgencia: Prioridad.P2_ALTA,
    fechaCreacionIso: new Date(Date.now() - 3600000).toISOString(),
    fechaUltimaNovedadIso: new Date().toISOString(),
    requiereConfirmacion: false,
    calificada: false,
    tecnicoVisible: 'Carlos H. (Soporte N1)',
    tiempoEstimadoSolucionIso: new Date(Date.now() + 3600000).toISOString(),
    reabierta: false,
    equipo: {
      id: 5,
      hostname: 'HSP-TRJ-IMP01',
      ip: '10.20.30.45',
      areaId: 1,
      area: 'Triaje de Emergencia',
      tipo: 'IMPRESORA' as any,
    },
    hitos: [
      {
        id: 1,
        etapa: 'REGISTRADO',
        mensaje: 'Recibimos su solicitud en la Mesa de Ayuda.',
        fechaIso: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        etapa: 'EN_ATENCION',
        mensaje: 'Un técnico tomó su caso y se dirige a Triaje.',
        fechaIso: new Date().toISOString(),
      },
    ],
    calificacion: null,
  };

  beforeEach(async () => {
    mockApi = {
      obtenerDetalle: vi.fn().mockReturnValue(of(solicitudMock)),
      confirmarSolucion: vi.fn().mockReturnValue(of(void 0)),
      reabrir: vi.fn().mockReturnValue(of(void 0)),
      calificar: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [SolicitudDetallePage],
      providers: [
        provideRouter([]),
        { provide: PortalSolicitudesApi, useValue: mockApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (k: string) => (k === 'id' ? '101' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudDetallePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar los datos de la solicitud', () => {
    expect(component).toBeTruthy();
    expect(component.solicitud()).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('INC-2026-00231');
    expect(fixture.nativeElement.textContent).toContain('Impresora de recetas no imprime');
    expect(fixture.nativeElement.textContent).toContain('Carlos H.');
  });

  it('si el tiempo estimado paso, debe mostrar "Estamos priorizando su caso" y NUNCA "vencido"', () => {
    const solicitudAtrasada: SolicitudDetalle = {
      ...solicitudMock,
      tiempoEstimadoSolucionIso: new Date(Date.now() - 3600000).toISOString(), // Pasó hace 1h
    };
    mockApi.obtenerDetalle.mockReturnValue(of(solicitudAtrasada));

    component.cargarSolicitud(101);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent || '';
    expect(texto).toContain('Estamos priorizando su caso');
    expect(texto.toLowerCase().includes('vencido')).toBe(false);
    expect(texto.toLowerCase().includes('sla')).toBe(false);
  });

  it('si la solicitud no existe o la API falla, debe mostrar pantalla de "No encontramos esta solicitud"', () => {
    mockApi.obtenerDetalle.mockReturnValue(throwError(() => new Error('Not found')));

    component.cargarSolicitud(999);
    fixture.detectChanges();

    expect(component.noEncontrado()).toBe(true);
    const vacioEl = fixture.nativeElement.querySelector('.solicitud-detalle__vacio');
    expect(vacioEl).toBeTruthy();
    expect(vacioEl.textContent).toContain('No encontramos esta solicitud');
  });

  it('si etapa es RESUELTO, debe mostrar la tarjeta de confirmacion de solucion', () => {
    const solicitudResuelta: SolicitudDetalle = {
      ...solicitudMock,
      etapa: 'RESUELTO',
      requiereConfirmacion: true,
    };
    mockApi.obtenerDetalle.mockReturnValue(of(solicitudResuelta));

    component.cargarSolicitud(101);
    fixture.detectChanges();

    const confirmacion = fixture.nativeElement.querySelector('app-tarjeta-confirmacion-solucion');
    expect(confirmacion).toBeTruthy();
  });

  it('si etapa es CERRADO y no esta calificada, debe mostrar la tarjeta de calificacion', () => {
    const solicitudCerrada: SolicitudDetalle = {
      ...solicitudMock,
      etapa: 'CERRADO',
      calificada: false,
    };
    mockApi.obtenerDetalle.mockReturnValue(of(solicitudCerrada));

    component.cargarSolicitud(101);
    fixture.detectChanges();

    const calificacion = fixture.nativeElement.querySelector('app-tarjeta-calificacion');
    expect(calificacion).toBeTruthy();
  });

  it('no debe contener terminos prohibidos de ITIL en ninguna seccion', () => {
    const texto = fixture.nativeElement.textContent || '';
    for (const regex of [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL]) {
      expect(regex.test(texto)).toBe(false);
    }
  });
});
