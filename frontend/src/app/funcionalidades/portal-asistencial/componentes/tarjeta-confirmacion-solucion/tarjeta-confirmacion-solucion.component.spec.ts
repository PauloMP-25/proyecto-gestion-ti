import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TarjetaConfirmacionSolucionComponent } from './tarjeta-confirmacion-solucion.component';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import {
  TERMINOS_PROHIBIDOS_GLOBAL,
  TERMINOS_PROHIBIDOS_USUARIO_FINAL,
} from '../../../../compartido/utilidades/vocabulario-asistencial';

describe('TarjetaConfirmacionSolucionComponent (A5)', () => {
  let component: TarjetaConfirmacionSolucionComponent;
  let fixture: ComponentFixture<TarjetaConfirmacionSolucionComponent>;
  let mockApi: {
    confirmarSolucion: any;
    reabrir: any;
  };

  beforeEach(async () => {
    mockApi = {
      confirmarSolucion: vi.fn().mockReturnValue(of(void 0)),
      reabrir: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [TarjetaConfirmacionSolucionComponent],
      providers: [{ provide: PortalSolicitudesApi, useValue: mockApi }],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaConfirmacionSolucionComponent);
    component = fixture.componentInstance;
    component.ticketId = 101;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe confirmar solucion al pulsar "Sí" y emitir evento', () => {
    const spyEmit = vi.spyOn(component.solucionConfirmada, 'emit');
    const botonSi: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-confirmacion__btn--si');
    expect(botonSi).toBeTruthy();

    botonSi.click();
    fixture.detectChanges();

    expect(mockApi.confirmarSolucion).toHaveBeenCalledWith(101);
    expect(spyEmit).toHaveBeenCalled();
  });

  it('debe desplegar textarea al pulsar "No" y exigir al menos 10 caracteres utiles', () => {
    const botonNo: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-confirmacion__btn--no');
    botonNo.click();
    fixture.detectChanges();

    expect(component.mostrarFormularioNo()).toBe(true);

    const btnEnviar: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-confirmacion__btn--enviar');
    expect(btnEnviar.disabled).toBe(true);

    // Con espacios o menos de 10 letras utiles
    component.motivoReapertura.set('     hola     ');
    fixture.detectChanges();
    expect(component.esMotivoValido).toBe(false);
    expect(btnEnviar.disabled).toBe(true);

    // Con 10 letras utiles
    component.motivoReapertura.set('Sigue sin imprimir las recetas');
    fixture.detectChanges();
    expect(component.esMotivoValido).toBe(true);
    expect(btnEnviar.disabled).toBe(false);
  });

  it('debe enviar la reapertura con motivo valido y emitir evento', () => {
    const spyEmit = vi.spyOn(component.solicitudReabierta, 'emit');
    component.abrirFormularioNo();
    component.motivoReapertura.set('La luz roja de error parpadea continuamente');
    fixture.detectChanges();

    const btnEnviar: HTMLButtonElement = fixture.nativeElement.querySelector('.tarjeta-confirmacion__btn--enviar');
    btnEnviar.click();
    fixture.detectChanges();

    expect(mockApi.reabrir).toHaveBeenCalledWith(101, {
      motivo: 'La luz roja de error parpadea continuamente',
    });
    expect(spyEmit).toHaveBeenCalledWith('La luz roja de error parpadea continuamente');
  });

  it('no debe borrar el texto si la API falla y debe mostrar mensaje amigable', () => {
    mockApi.reabrir.mockReturnValue(throwError(() => new Error('Error de conexion')));
    component.abrirFormularioNo();
    component.motivoReapertura.set('El lector no reconoce huellas digitales');
    fixture.detectChanges();

    component.enviarReapertura();
    fixture.detectChanges();

    expect(component.motivoReapertura()).toBe('El lector no reconoce huellas digitales');
    expect(component.errorMensaje()).toContain('No se pudo enviar');
  });

  it('no debe contener terminos prohibidos de ITIL en su texto renderizado', () => {
    const texto = fixture.nativeElement.textContent || '';
    for (const regex of [...TERMINOS_PROHIBIDOS_GLOBAL, ...TERMINOS_PROHIBIDOS_USUARIO_FINAL]) {
      expect(regex.test(texto)).toBe(false);
    }
  });
});
