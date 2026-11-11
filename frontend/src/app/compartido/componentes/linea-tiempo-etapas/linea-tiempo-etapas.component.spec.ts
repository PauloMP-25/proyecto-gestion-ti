import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineaTiempoEtapasComponent } from './linea-tiempo-etapas.component';

describe('LineaTiempoEtapasComponent', () => {
  let component: LineaTiempoEtapasComponent;
  let fixture: ComponentFixture<LineaTiempoEtapasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineaTiempoEtapasComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LineaTiempoEtapasComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('etapaActual', 'EN_ATENCION');
    fixture.detectChanges();
  });

  it('debe crearse y renderizar las 4 etapas con ol y li', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll('ol.linea-tiempo li.paso');
    expect(items.length).toBe(4);
  });

  it('debe marcar la etapa actual con aria-current="step"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const itemActual = compiled.querySelector('li.paso.actual');
    expect(itemActual).not.toBeNull();
    expect(itemActual?.getAttribute('aria-current')).toBe('step');
    expect(itemActual?.textContent).toContain('En atención');
  });

  it('debe marcar etapas anteriores como pasadas y posteriores como futuras', () => {
    const etapas = component.etapasVista();
    expect(etapas[0].clave).toBe('REGISTRADO');
    expect(etapas[0].esPasada).toBe(true);

    expect(etapas[1].clave).toBe('EN_ATENCION');
    expect(etapas[1].esActual).toBe(true);

    expect(etapas[2].clave).toBe('RESUELTO');
    expect(etapas[2].esFutura).toBe(true);

    expect(etapas[3].clave).toBe('CERRADO');
    expect(etapas[3].esFutura).toBe(true);
  });
});
