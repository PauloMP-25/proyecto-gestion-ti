import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalificacionEstrellasComponent } from './calificacion-estrellas.component';

describe('CalificacionEstrellasComponent', () => {
  let component: CalificacionEstrellasComponent;
  let fixture: ComponentFixture<CalificacionEstrellasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalificacionEstrellasComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CalificacionEstrellasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse con 5 botones de estrella y texto inicial', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    const botones = compiled.querySelectorAll('.boton-estrella');
    expect(botones.length).toBe(5);
    expect(compiled.textContent).toContain('Seleccione una calificación');
  });

  it('debe seleccionar puntuación al hacer click en una estrella', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const boton4 = compiled.querySelectorAll<HTMLButtonElement>('.boton-estrella')[3]; // 4ta estrella
    boton4.click();
    fixture.detectChanges();

    expect(component.valor()).toBe(4);
    expect(compiled.textContent).toContain('4 de 5: Satisfecho');
  });

  it('debe permitir navegar y seleccionar con teclado numérico', () => {
    const container = fixture.nativeElement.querySelector('.calificacion-estrellas') as HTMLElement;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }));
    fixture.detectChanges();

    expect(component.valor()).toBe(5);
    expect(fixture.nativeElement.textContent).toContain('5 de 5: Excelente atención');
  });

  it('debe incrementar y decrementar con las teclas de flecha', () => {
    component.seleccionar(3);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.calificacion-estrellas') as HTMLElement;
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(component.valor()).toBe(4);

    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(component.valor()).toBe(3);
  });

  it('debe respetar el estado deshabilitado', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const boton5 = compiled.querySelectorAll<HTMLButtonElement>('.boton-estrella')[4];
    boton5.click();
    fixture.detectChanges();

    expect(component.valor()).toBeNull();
  });
});
