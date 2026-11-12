import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MisSolicitudesPage } from './mis-solicitudes.page';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { ViewportService } from '../../../../nucleo/servicios/viewport.service';
import { SondeoService } from '../../../../nucleo/servicios/sondeo.service';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MisSolicitudesPage (A3)', () => {
  let component: MisSolicitudesPage;
  let fixture: ComponentFixture<MisSolicitudesPage>;
  let esDesktopSignal = signal(true);

  const solicitudesMock = [
    {
      id: 1,
      codigo: 'INC-2026-00001',
      titulo: 'Impresora térmica de recetas trabada',
      categoriaNombre: 'Hardware',
      areaNombre: 'Farmacia',
      etapa: 'RESUELTO' as const,
      urgencia: Prioridad.P2,
      fechaCreacionIso: '2026-11-11T10:00:00Z',
      fechaUltimaNovedadIso: '2026-11-11T11:00:00Z',
      requiereConfirmacion: true,
      calificada: false,
    },
    {
      id: 2,
      codigo: 'INC-2026-00002',
      titulo: 'No carga módulo de triaje GalenHos',
      categoriaNombre: 'Software',
      areaNombre: 'Triaje',
      etapa: 'EN_ATENCION' as const,
      urgencia: Prioridad.P1,
      fechaCreacionIso: '2026-11-11T10:30:00Z',
      fechaUltimaNovedadIso: '2026-11-11T11:30:00Z',
      requiereConfirmacion: false,
      calificada: false,
    },
  ];

  beforeEach(async () => {
    esDesktopSignal = signal(true);

    await TestBed.configureTestingModule({
      imports: [MisSolicitudesPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(new Map([['filtro', 'TODAS']])),
          },
        },
        {
          provide: ViewportService,
          useValue: {
            esDesktop: esDesktopSignal,
            esMovil: signal(false),
          },
        },
        {
          provide: SondeoService,
          useValue: {
            crearSondeo: (fuente$: any) => fuente$(),
          },
        },
        {
          provide: PortalSolicitudesApi,
          useValue: {
            listar: vi.fn(() =>
              of({
                contenido: solicitudesMock,
                pagina: 0,
                tamano: 10,
                totalElementos: 2,
                totalPaginas: 1,
              })
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MisSolicitudesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('en desktop (>= 1024px): debe renderizar tabla semántica y 0 tarjetas', () => {
    esDesktopSignal.set(true);
    fixture.detectChanges();

    const tabla = fixture.nativeElement.querySelector('table.mis-solicitudes__tabla');
    const tarjetas = fixture.nativeElement.querySelectorAll('app-tarjeta-solicitud');

    expect(tabla).toBeTruthy();
    expect(tarjetas.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('INC-2026-00001');
  });

  it('en móvil/tablet (< 1024px): debe renderizar tarjetas y 0 tablas (Regla de oro: un solo DOM)', () => {
    esDesktopSignal.set(false);
    fixture.detectChanges();

    const tabla = fixture.nativeElement.querySelector('table.mis-solicitudes__tabla');
    const tarjetas = fixture.nativeElement.querySelectorAll('app-tarjeta-solicitud');

    expect(tabla).toBeNull();
    expect(tarjetas.length).toBe(2);
  });

  it('no debe contener terminos prohibidos de ITIL ni SLA en pantalla', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).not.toContain('ITIL');
    expect(texto).not.toContain('SLA');
    expect(texto).not.toContain('CMDB');
    expect(texto).not.toContain('KEDB');
  });
});
