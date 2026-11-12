import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EsqueletoComponent } from './esqueleto.component';

describe('EsqueletoComponent', () => {
  let component: EsqueletoComponent;
  let fixture: ComponentFixture<EsqueletoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EsqueletoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EsqueletoComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse con preset de línea por defecto', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    const el = fixture.nativeElement.querySelector('.esqueleto');
    expect(el).toBeTruthy();
  });

  it('debe renderizar la silueta de tarjeta-ticket cuando se solicita el preset', () => {
    fixture.componentRef.setInput('preset', 'tarjeta-ticket');
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.sk-tarjeta');
    expect(card).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sk--cronometro')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.sk--boton')).toBeTruthy();
  });

  it('debe renderizar preset de fila de tabla', () => {
    fixture.componentRef.setInput('preset', 'fila-tabla');
    fixture.detectChanges();

    const fila = fixture.nativeElement.querySelector('.sk-fila-tabla');
    expect(fila).toBeTruthy();
  });
});
