import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaComponent } from './tarjeta.component';

describe('TarjetaComponent', () => {
  let component: TarjetaComponent;
  let fixture: ComponentFixture<TarjetaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente con clase base de tarjeta', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const el = fixture.nativeElement.querySelector('.tarjeta');
    expect(el).toBeTruthy();
    expect(el.classList).not.toContain('tarjeta--interactiva');
  });

  it('debe aplicar clase interactiva cuando se activa', () => {
    fixture.componentRef.setInput('interactiva', true);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.tarjeta');
    expect(el.classList).toContain('tarjeta--interactiva');
  });

  it('debe admitir borde de acento izquierdo para severidad o estado', () => {
    fixture.componentRef.setInput('acento', 'var(--color-p1-base)');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('.tarjeta');
    expect(el.classList).toContain('tarjeta--con-acento');
    expect(el.style.borderLeftColor).toBeTruthy();
  });
});
