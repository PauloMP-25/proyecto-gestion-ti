import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsultaRapidaPage } from './consulta-rapida.page';
import { ConsultaRapidaApi } from '../../servicios/consulta-rapida.api';
import { ActivoResumen } from '../../../../compartido/modelos/activo-resumen.model';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { TipoActivo } from '../../../cmdb/modelos/tipo-activo.enum';

describe('ConsultaRapidaPage (B7)', () => {
  let component: ConsultaRapidaPage;
  let fixture: ComponentFixture<ConsultaRapidaPage>;

  const activosMock: ActivoResumen[] = [
    {
      id: 1,
      nombre: 'Computadora Triaje',
      tipo: TipoActivo.COMPUTADORA,
      estado: 'ACTIVO',
      hostname: 'HSP-ADM-01',
      ip: '10.20.30.15',
      areaId: 1,
      areaNombre: 'Triaje de Emergencia',
      fallasUltimos90Dias: 2,
      enPrestamo: false,
    },
  ];

  const articulosMock: ArticuloResumen[] = [
    {
      id: 201,
      titulo: 'Restablecer conexión y servicio local GalenHos',
      categoriaId: 1,
      categoriaNombre: 'Sistemas Hospitalarios',
      sintoma: 'Error no se puede establecer conexión con la base de datos.',
    },
  ];

  let consultaApiMock: {
    buscarActivos: ReturnType<typeof vi.fn>;
    buscarArticulos: ReturnType<typeof vi.fn>;
    obtenerArticulo: ReturnType<typeof vi.fn>;
    sugerirArticulos: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    consultaApiMock = {
      buscarActivos: vi.fn(() => of(activosMock)),
      buscarArticulos: vi.fn(() => of(articulosMock)),
      obtenerArticulo: vi.fn(),
      sugerirArticulos: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ConsultaRapidaPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => {
                  if (key === 'tab') return 'equipos';
                  if (key === 'ticket') return '201';
                  return null;
                },
              },
            },
          },
        },
        { provide: ConsultaRapidaApi, useValue: consultaApiMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaRapidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y consultar equipos por defecto', () => {
    expect(component).toBeTruthy();
    expect(component.tabActivo()).toBe('equipos');
    expect(consultaApiMock.buscarActivos).toHaveBeenCalled();
    expect(component.activos().length).toBe(1);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('HSP-ADM-01');
  });

  it('debe cambiar al tab de soluciones y consultar guías', () => {
    component.cambiarTab('soluciones');
    fixture.detectChanges();

    expect(component.tabActivo()).toBe('soluciones');
    expect(consultaApiMock.buscarArticulos).toHaveBeenCalled();
    expect(component.articulos().length).toBe(1);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Restablecer conexión y servicio local GalenHos');
  });

  it('debe permitir limpiar la búsqueda', () => {
    component.terminoBusqueda.set('GalenHos');
    fixture.detectChanges();

    component.limpiarBusqueda();
    fixture.detectChanges();

    expect(component.terminoBusqueda()).toBe('');
  });
});
