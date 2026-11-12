import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AyudaArticuloPage } from './ayuda-articulo.page';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { ArticuloDetalle } from '../../../../compartido/modelos/articulo-conocimiento.model';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
} from '../../../../compartido/utilidades/vocabulario-asistencial';

describe('AyudaArticuloPage (A7 - P-05 detalle)', () => {
  let component: AyudaArticuloPage;
  let fixture: ComponentFixture<AyudaArticuloPage>;
  let router: Router;
  let mockApi: {
    obtener: any;
    buscar: any;
    destacados: any;
  };

  const articuloMock: ArticuloDetalle = {
    id: 1,
    titulo: 'No puedo ingresar al sistema GalenHos',
    categoriaId: 1,
    categoriaNombre: 'Software Asistencial / GalenHos',
    sintoma: 'Aparece ventana con mensaje de error de conexión.',
    causaRaiz: 'Servicio local desactualizado.',
    solucionTemporal: 'Cierre ventanas auxiliares y reinicie.',
    pasos: [
      'Cierre todas las pestañas abiertas de GalenHos.',
      'Verifique que la tecla Bloq Mayús esté apagada.',
      'Ingrese su usuario institucional.',
    ],
  };

  beforeEach(async () => {
    mockApi = {
      obtener: vi.fn().mockReturnValue(of(articuloMock)),
      buscar: vi.fn(),
      destacados: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AyudaArticuloPage],
      providers: [
        provideRouter([]),
        { provide: PortalAyudaApi, useValue: mockApi },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (k: string) => (k === 'articuloId' ? '1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AyudaArticuloPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y renderizar titulo y pasos numerados', () => {
    expect(component).toBeTruthy();
    expect(mockApi.obtener).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('No puedo ingresar al sistema GalenHos');
    expect(fixture.nativeElement.textContent).toContain('Cierre todas las pestañas abiertas');
  });

  it('debe mostrar mensaje accesible al presionar "Sí, resolvió mi problema"', () => {
    const btnSi: HTMLButtonElement = fixture.nativeElement.querySelector('.ayuda-articulo__btn--si');
    expect(btnSi).toBeTruthy();

    btnSi.click();
    fixture.detectChanges();

    expect(component.resueltoPorGuia()).toBe(true);
    const exitoEl = fixture.nativeElement.querySelector('.ayuda-articulo__exito');
    expect(exitoEl).toBeTruthy();
    expect(exitoEl.getAttribute('role')).toBe('status');
    expect(exitoEl.textContent).toContain('¡Nos alegra haberle ayudado!');
  });

  it('debe navegar al formulario de nueva solicitud con queryParams al presionar "No"', () => {
    const spyNavigate = vi.spyOn(router, 'navigate');
    const btnNo: HTMLButtonElement = fixture.nativeElement.querySelector('.ayuda-articulo__btn--no');
    expect(btnNo).toBeTruthy();

    btnNo.click();

    expect(spyNavigate).toHaveBeenCalledWith(['/solicitudes/nuevo'], {
      queryParams: {
        categoria: 1,
        origen: 'ayuda',
        articulo: 1,
      },
    });
  });

  it('si el articulo no existe debe mostrar estado de guia no encontrada', () => {
    mockApi.obtener.mockReturnValue(throwError(() => new Error('Not found')));
    component.cargarArticulo(999);
    fixture.detectChanges();

    expect(component.noEncontrado()).toBe(true);
    const vacioEl = fixture.nativeElement.querySelector('.ayuda-articulo__vacio');
    expect(vacioEl).toBeTruthy();
    expect(vacioEl.textContent).toContain('Guía no encontrada');
  });

  it('no debe contener terminos prohibidos de ITIL', () => {
    const texto = fixture.nativeElement.textContent || '';
    for (const regex of [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL]) {
      expect(regex.test(texto)).toBe(false);
    }
  });
});
