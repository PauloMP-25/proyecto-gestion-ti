import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BadgeUrgenciaComponent } from './badge-urgencia.component';

describe('BadgeUrgenciaComponent', () => {
  let component: BadgeUrgenciaComponent;
  let fixture: ComponentFixture<BadgeUrgenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeUrgenciaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeUrgenciaComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.componentRef.setInput('prioridad', 'P1');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debe renderizar variante técnica con código y severidad', () => {
    fixture.componentRef.setInput('prioridad', 'P1');
    fixture.componentRef.setInput('variante', 'tecnica');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.textContent).toContain('P1 · Crítico');
    expect(span.classList).toContain('badge--p1');
  });

  it('debe renderizar variante asistencial sin código técnico', () => {
    fixture.componentRef.setInput('prioridad', 'P1');
    fixture.componentRef.setInput('variante', 'asistencial');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.textContent).toContain('Atención inmediata');
    expect(span.textContent).not.toContain('P1');
    expect(span.textContent).not.toContain('ITIL');
  });

  it('debe renderizar modo compacto para tablas densas', () => {
    fixture.componentRef.setInput('prioridad', 'P2');
    fixture.componentRef.setInput('compacto', true);
    fixture.detectChanges();

    const texto = fixture.nativeElement.querySelector('.badge__texto');
    expect(texto.textContent.trim()).toBe('P2');

    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('badge--compacto');
    expect(span.classList).toContain('badge--p2');
  });

  it('debe tolerar inputs en formato de texto legacy como CRITICA o ALTA', () => {
    fixture.componentRef.setInput('prioridad', 'CRITICA');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.badge');
    expect(span.classList).toContain('badge--p1');
  });
});
