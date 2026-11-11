import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlaCronometroComponent } from './sla-cronometro.component';
import { SlaCalculado } from '../../modelos/sla-vista.model';
import { EstadoSla } from '../../modelos/estado-sla.enum';

describe('SlaCronometroComponent', () => {
  let component: SlaCronometroComponent;
  let fixture: ComponentFixture<SlaCronometroComponent>;

  const slaEjemplo: SlaCalculado = {
    fase: 'RESPUESTA',
    restanteMs: 45 * 60000,
    porcentajeRestante: 0.75,
    estado: EstadoSla.A_TIEMPO,
    texto: '45 min'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlaCronometroComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SlaCronometroComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sla', slaEjemplo);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar el texto de tiempo y estado', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('A tiempo');
    expect(compiled.textContent).toContain('45 min');
  });

  it('debe cambiar de estilo e ícono según el estado semafórico', () => {
    const slaAlerta: SlaCalculado = {
      fase: 'RESOLUCION',
      restanteMs: 10 * 60000,
      porcentajeRestante: 0.15,
      estado: EstadoSla.ALERTA,
      texto: '10 min'
    };
    fixture.componentRef.setInput('sla', slaAlerta);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Por vencer');
    expect(component.icono()).toBe('hourglass_empty');
    expect(component.etiquetaAccesible()).toContain('Por vencer. Tiempo restante 10 min');
  });

  it('no debe renderizar nada si la fase es COMPLETADO', () => {
    const slaCompletado: SlaCalculado = {
      fase: 'COMPLETADO',
      restanteMs: 0,
      porcentajeRestante: 1,
      estado: EstadoSla.A_TIEMPO,
      texto: ''
    };
    fixture.componentRef.setInput('sla', slaCompletado);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sla-cronometro')).toBeNull();
  });

  it('debe ocultar la barra de progreso en modo compacto', () => {
    fixture.componentRef.setInput('compacto', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.barra')).toBeNull();
  });
});
