import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AyudaRapidaPage } from './ayuda-rapida.page';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
} from '../../../../compartido/utilidades/vocabulario-asistencial';

describe('AyudaRapidaPage (A7 - P-05)', () => {
  let component: AyudaRapidaPage;
  let fixture: ComponentFixture<AyudaRapidaPage>;
  let mockApi: {
    destacados: any;
    buscar: any;
    obtener: any;
  };

  const articulosMock: ArticuloResumen[] = [
    {
      id: 1,
      titulo: 'No puedo ingresar al sistema GalenHos',
      categoriaId: 1,
      categoriaNombre: 'Software Asistencial / GalenHos',
      sintoma: 'Aparece ventana con mensaje de error de conexión.',
    },
    {
      id: 2,
      titulo: 'Lector de huella no reconoce al personal',
      categoriaId: 2,
      categoriaNombre: 'Hardware / Biometría',
      sintoma: 'El sensor óptico parpadea en rojo.',
    },
  ];

  beforeEach(async () => {
    mockApi = {
      destacados: vi.fn().mockReturnValue(of(articulosMock)),
      buscar: vi.fn().mockReturnValue(of([articulosMock[0]])),
      obtener: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AyudaRapidaPage],
      providers: [provideRouter([]), { provide: PortalAyudaApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(AyudaRapidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar las guías recomendadas iniciales', () => {
    expect(component).toBeTruthy();
    expect(mockApi.destacados).toHaveBeenCalled();
    expect(component.articulos().length).toBe(2);

    const texto = fixture.nativeElement.textContent || '';
    expect(texto).toContain('No puedo ingresar al sistema GalenHos');
    expect(texto).toContain('Lector de huella no reconoce al personal');
  });

  it('debe buscar con debounce cuando el usuario escribe al menos 2 caracteres', () => {
    vi.useFakeTimers();
    try {
      component.busquedaControl.setValue('GalenHos');
      vi.advanceTimersByTime(200);
      expect(mockApi.buscar).not.toHaveBeenCalled();

      vi.advanceTimersByTime(150);
      expect(mockApi.buscar).toHaveBeenCalledWith('GalenHos');
      expect(component.articulos().length).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('al pulsar un tema frecuente debe actualizar el buscador', () => {
    component.seleccionarTema('huella');
    expect(component.busquedaControl.value).toBe('huella');
  });

  it('si no hay resultados debe mostrar mensaje humano con boton para reportar solicitud', () => {
    component.articulos.set([]);
    fixture.detectChanges();

    const sinResultados = fixture.nativeElement.querySelector('.ayuda-rapida__sin-resultados');
    expect(sinResultados).toBeTruthy();
    expect(sinResultados.textContent).toContain('No encontramos guías');
    expect(sinResultados.textContent).toContain('Reportar solicitud de soporte');
  });

  it('no debe contener terminos prohibidos de ITIL', () => {
    const texto = fixture.nativeElement.textContent || '';
    for (const regex of [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL]) {
      expect(regex.test(texto)).toBe(false);
    }
  });
});
