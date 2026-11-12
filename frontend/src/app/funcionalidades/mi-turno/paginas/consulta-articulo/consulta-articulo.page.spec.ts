import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsultaArticuloPage } from './consulta-articulo.page';
import { ConsultaRapidaApi } from '../../servicios/consulta-rapida.api';
import { ArticuloDetalle } from '../../../../compartido/modelos/articulo-conocimiento.model';

describe('ConsultaArticuloPage (B7)', () => {
  let component: ConsultaArticuloPage;
  let fixture: ComponentFixture<ConsultaArticuloPage>;
  let router: Router;

  const articuloMock: ArticuloDetalle = {
    id: 201,
    titulo: 'Restablecer conexión y servicio local GalenHos',
    categoriaId: 1,
    categoriaNombre: 'Sistemas Hospitalarios',
    sintoma: 'Error no se puede establecer conexión.',
    causaRaiz: 'Servicio detenido.',
    solucionTemporal: 'Reiniciar servicio.',
    pasos: [
      'Cerrar ventanas.',
      'Abrir services.msc y reiniciar GalenHos Agent.',
      'Probar ping.',
    ],
  };

  let consultaApiMock: {
    obtenerArticulo: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    consultaApiMock = {
      obtenerArticulo: vi.fn(() => of(articuloMock)),
    };

    await TestBed.configureTestingModule({
      imports: [ConsultaArticuloPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '201' : null),
              },
              queryParamMap: {
                get: (key: string) => (key === 'ticket' ? '101' : null),
              },
            },
          },
        },
        { provide: ConsultaRapidaApi, useValue: consultaApiMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ConsultaArticuloPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y renderizar el detalle del artículo con sus pasos numerados', () => {
    expect(component).toBeTruthy();
    expect(component.cargando()).toBe(false);
    expect(component.articulo()?.titulo).toBe('Restablecer conexión y servicio local GalenHos');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sistemas Hospitalarios');
    expect(el.textContent).toContain('Cerrar ventanas.');
    expect(el.textContent).toContain('Abrir services.msc y reiniciar GalenHos Agent.');
    expect(el.textContent).toContain('Probar ping.');
  });

  it('debe mostrar el botón Usar esta solución en el ticket y navegar al hacer clic', () => {
    const spyNavigate = vi.spyOn(router, 'navigate');

    const el = fixture.nativeElement as HTMLElement;
    const boton = el.querySelector('.btn-usar-ticket') as HTMLButtonElement;
    expect(boton).toBeTruthy();

    boton.click();

    expect(spyNavigate).toHaveBeenCalledWith(['/mi-turno/ticket', 101], {
      queryParams: { solucionId: 201 },
    });
  });

  it('debe mostrar estado de error si no se encuentra el artículo', () => {
    consultaApiMock.obtenerArticulo.mockReturnValue(throwError(() => new Error('Not found')));

    component.cargarDetalle();
    fixture.detectChanges();

    expect(component.articulo()).toBeNull();
    expect(component.error()).toContain('No se encontró la guía');
  });
});
