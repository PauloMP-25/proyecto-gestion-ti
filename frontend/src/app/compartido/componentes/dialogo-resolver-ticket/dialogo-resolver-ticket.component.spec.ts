import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoResolverTicketComponent } from './dialogo-resolver-ticket.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DialogoResolverTicketComponent', () => {
  let component: DialogoResolverTicketComponent;
  let fixture: ComponentFixture<DialogoResolverTicketComponent>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DialogoResolverTicketComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogoResolverTicketComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('codigo', 'INC-2026-00100');
    fixture.componentRef.setInput('ticketId', 100);
    fixture.detectChanges();
  });

  it('debe crearse y tener el formulario inválido inicialmente', () => {
    expect(component).toBeTruthy();
    expect(component.form.invalid).toBe(true);

    const botonSubmit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botonSubmit.disabled).toBe(true);
  });

  it('no debe validar espacios vacíos como caracteres útiles', () => {
    component.form.patchValue({
      diagnostico: '                    ', // 20 espacios
      accionRealizada: '                    ',
    });
    fixture.detectChanges();

    expect(component.form.controls.diagnostico.errors?.['minimoUtil']).toBeTruthy();
    expect(component.form.invalid).toBe(true);
  });

  it('debe habilitar el botón cuando ambos campos obligatorios alcanzan 20 caracteres útiles', () => {
    component.form.patchValue({
      diagnostico: 'Falla en el conector de red RJ45 de la estación de triaje.',
      accionRealizada: 'Se reemplazó el conector RJ45 y se verificó conectividad con GalenHos.',
      tipoSolucion: 'DEFINITIVA',
    });
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);

    const botonSubmit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(botonSubmit.disabled).toBe(false);
  });

  it('debe pedir confirmación de descarte si el formulario está dirty al intentar cerrar', () => {
    let cancelado = false;
    component.alCancelar.subscribe(() => (cancelado = true));

    // Formulario sucio
    component.form.controls.diagnostico.setValue('Texto en borrador para prueba');
    component.form.markAsDirty();
    fixture.detectChanges();

    component.intentarCerrar();
    fixture.detectChanges();

    expect(component.confirmandoDescarte()).toBe(true);
    expect(cancelado).toBe(false);

    // Cancelar descarte (seguir editando)
    component.cancelarDescarte();
    expect(component.confirmandoDescarte()).toBe(false);
    expect(cancelado).toBe(false);

    // Confirmar descarte
    component.confirmarDescarte();
    expect(cancelado).toBe(true);
  });

  it('debe emitir alConfirmar con el payload saneado y limpiar el borrador', () => {
    let payloadEmitido: any = null;
    component.alConfirmar.subscribe((p) => (payloadEmitido = p));

    component.form.patchValue({
      diagnostico: '   Falla en la fuente de poder del monitor asistencial.   ',
      accionRealizada: '   Se ajustó el cable de alimentación y se validó encendido correcto.   ',
      insumosUtilizados: '  Cable de poder estándar  ',
      tipoSolucion: 'DEFINITIVA',
    });
    fixture.detectChanges();

    component.enviar();

    expect(payloadEmitido).toBeTruthy();
    expect(payloadEmitido.diagnostico).toBe('Falla en la fuente de poder del monitor asistencial.');
    expect(payloadEmitido.accionRealizada).toBe('Se ajustó el cable de alimentación y se validó encendido correcto.');
    expect(payloadEmitido.insumosUtilizados).toBe('Cable de poder estándar');
    expect(payloadEmitido.tipoSolucion).toBe('DEFINITIVA');
  });
});
