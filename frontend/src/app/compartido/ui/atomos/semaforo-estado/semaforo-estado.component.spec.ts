import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SemaforoEstadoComponent } from './semaforo-estado.component';

describe('SemaforoEstadoComponent', () => {
  let component: SemaforoEstadoComponent;
  let fixture: ComponentFixture<SemaforoEstadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemaforoEstadoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SemaforoEstadoComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.componentRef.setInput('estado', 'A_TIEMPO');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe renderizar estado A tiempo con check_circle y clase verde', () => {
    fixture.componentRef.setInput('estado', 'A_TIEMPO');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.semaforo');
    expect(span.textContent).toContain('A tiempo');
    expect(span.classList).toContain('semaforo--ok');
  });

  it('debe renderizar estado Por vencer con hourglass_empty y clase ambar', () => {
    fixture.componentRef.setInput('estado', 'ALERTA');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.semaforo');
    expect(span.textContent).toContain('Por vencer');
    expect(span.classList).toContain('semaforo--alerta');
  });

  it('debe renderizar estado Vencido con warning y clase roja', () => {
    fixture.componentRef.setInput('estado', 'INCUMPLIDO');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.semaforo');
    expect(span.textContent).toContain('Vencido');
    expect(span.classList).toContain('semaforo--vencido');
  });

  it('debe soportar modo compacto mostrando solo el ícono con title accesible', () => {
    fixture.componentRef.setInput('estado', 'ALERTA');
    fixture.componentRef.setInput('compacto', true);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.semaforo');
    expect(span.classList).toContain('semaforo--compacto');
    expect(span.getAttribute('title')).toBe('Por vencer');
  });
});
