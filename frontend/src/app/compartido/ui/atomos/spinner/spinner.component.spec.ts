import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse con role="status" y accesibilidad por defecto', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();

    const span = fixture.nativeElement.querySelector('.spinner');
    expect(span.getAttribute('role')).toBe('status');
    expect(span.getAttribute('aria-label')).toBe('Cargando...');
  });

  it('debe admitir tamaño sm y etiqueta personalizada', () => {
    fixture.componentRef.setInput('tamano', 'sm');
    fixture.componentRef.setInput('etiqueta', 'Guardando cambios...');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.spinner');
    expect(span.classList).toContain('spinner--sm');
    expect(span.getAttribute('aria-label')).toBe('Guardando cambios...');
  });
});
