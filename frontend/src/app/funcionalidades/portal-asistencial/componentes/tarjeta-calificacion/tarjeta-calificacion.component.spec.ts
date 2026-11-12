import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TarjetaCalificacionComponent } from './tarjeta-calificacion.component';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
} from '../../../../compartido/utilidades/vocabulario-asistencial';

describe('TarjetaCalificacionComponent (A6)', () => {
  let component: TarjetaCalificacionComponent;
  let fixture: ComponentFixture<TarjetaCalificacionComponent>;
  let mockApi: {
    calificar: any;
  };

  beforeEach(async () => {
    mockApi = {
      calificar: vi.fn().mockReturnValue(
        of({
          puntuacion: 5,
          comentario: 'Excelente',
          fechaIso: new Date().toISOString(),
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [TarjetaCalificacionComponent],
      providers: [{ provide: PortalSolicitudesApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaCalificacionComponent);
    component = fixture.componentInstance;
    component.ticketId = 101;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mantener deshabilitado el boton de envio si no se ha seleccionado puntuacion', () => {
    const btnEnviar: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-calificacion__btn--enviar');
    expect(btnEnviar.disabled).toBe(true);
  });

  it('debe habilitar boton de envio al recibir puntuacion y enviar payload', () => {
    const spyEmit = vi.spyOn(component.calificacionEnviada, 'emit');

    component.onPuntuacionCambiada(4);
    component.comentario.set('Muy buena atención');
    fixture.detectChanges();

    const btnEnviar: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-calificacion__btn--enviar');
    expect(btnEnviar.disabled).toBe(false);

    btnEnviar.click();
    fixture.detectChanges();

    expect(mockApi.calificar).toHaveBeenCalledWith(101, {
      puntuacion: 4,
      comentario: 'Muy buena atención',
    });
    expect(spyEmit).toHaveBeenCalled();
    expect(component.enviadoExitoso()).toBe(true);
  });

  it('debe mostrar mensaje accesible de agradecimiento tras el envio exitoso', () => {
    component.onPuntuacionCambiada(5);
    fixture.detectChanges();
    component.enviar();
    fixture.detectChanges();

    const exitoEl = fixture.nativeElement.querySelector('.tarjeta-calificacion__exito');
    expect(exitoEl).toBeTruthy();
    expect(exitoEl.getAttribute('role')).toBe('status');
    expect(exitoEl.textContent).toContain('¡Gracias por ayudarnos a mejorar!');
  });

  it('debe emitir evento pospuesto al pulsar "Ahora no"', () => {
    const spyPosponer = vi.spyOn(component.pospuesto, 'emit');
    const btnPosponer: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-calificacion__btn--posponer');
    btnPosponer.click();
    expect(spyPosponer).toHaveBeenCalled();
  });

  it('no debe contener terminos prohibidos de ITIL', () => {
    const texto = fixture.nativeElement.textContent || '';
    for (const regex of [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL]) {
      expect(regex.test(texto)).toBe(false);
    }
  });
});
