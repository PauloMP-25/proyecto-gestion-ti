import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoEscalarTicketComponent } from './dialogo-escalar-ticket.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('DialogoEscalarTicketComponent', () => {
  let component: DialogoEscalarTicketComponent;
  let fixture: ComponentFixture<DialogoEscalarTicketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogoEscalarTicketComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogoEscalarTicketComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('codigo', 'INC-2026-00231');
    fixture.componentRef.setInput('titulo', 'Sin conexión a GalenHos');
    fixture.detectChanges();
  });

  it('debe crearse con formulario inválido y botón deshabilitado', () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBe(true);

    const botonSubmit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botonSubmit.disabled).toBe(true);
  });

  it('debe exigir al menos 20 caracteres útiles y no contar espacios vacíos', () => {
    component.form.patchValue({ motivo: '                    ' });
    fixture.detectChanges();

    expect(component.form.controls.motivo.errors?.['minimoUtil']).toBeTruthy();
    expect(component.form.invalid).toBe(true);
  });

  it('debe permitir aplicar sugerencias rápidas desde los chips', () => {
    component.aplicarSugerencia('Servidor / base de datos');
    fixture.detectChanges();

    expect(component.form.controls.motivo.value).toContain('Servidor / base de datos');
    expect(component.form.valid).toBe(true);

    const botonSubmit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botonSubmit.disabled).toBe(false);
  });

  it('debe solicitar confirmación de descarte si el formulario está dirty', () => {
    let cancelado = false;
    component.alCancelar.subscribe(() => (cancelado = true));

    component.form.controls.motivo.setValue('Se verificó cableado local y se descarta problema físico.');
    component.form.markAsDirty();
    fixture.detectChanges();

    component.intentarCerrar();
    expect(component.confirmandoDescarte()).toBe(true);
    expect(cancelado).toBe(false);

    component.cancelarDescarte();
    expect(component.confirmandoDescarte()).toBe(false);

    component.confirmarDescarte();
    expect(cancelado).toBe(true);
  });

  it('debe emitir alConfirmar con el motivo saneado', () => {
    let payloadEmitido: any = null;
    component.alConfirmar.subscribe((p) => (payloadEmitido = p));

    component.form.patchValue({
      motivo: '   Se verificó switch de planta baja y se reporta corte de enlace troncal.   ',
    });
    fixture.detectChanges();

    component.enviar();

    expect(payloadEmitido).toBeTruthy();
    expect(payloadEmitido.motivo).toBe('Se verificó switch de planta baja y se reporta corte de enlace troncal.');
  });
});
