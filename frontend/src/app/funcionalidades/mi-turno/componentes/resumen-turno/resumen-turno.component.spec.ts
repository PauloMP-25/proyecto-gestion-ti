import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResumenTurnoComponent } from './resumen-turno.component';
import { ResumenTurno } from '../../modelos/ticket-turno.model';

describe('ResumenTurnoComponent', () => {
  let component: ResumenTurnoComponent;
  let fixture: ComponentFixture<ResumenTurnoComponent>;

  const resumenMock: ResumenTurno = {
    asignados: 3,
    porVencer: 1,
    vencidos: 1,
    resueltosHoy: 5,
    hayP1SinTomar: true,
    ahoraServidorIso: new Date().toISOString(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenTurnoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResumenTurnoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('resumen', resumenMock);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar los 4 contadores con los valores correctos', () => {
    const el = fixture.nativeElement as HTMLElement;
    const valores = el.querySelectorAll('.tarjeta-contador__valor');
    expect(valores.length).toBe(4);
    expect(valores[0].textContent?.trim()).toBe('3');
    expect(valores[1].textContent?.trim()).toBe('1');
    expect(valores[2].textContent?.trim()).toBe('1');
    expect(valores[3].textContent?.trim()).toBe('5');
  });

  it('debe mostrar la alerta P1 si hayP1SinTomar es true y emitir irAPorTomar al hacer clic', () => {
    const el = fixture.nativeElement as HTMLElement;
    const alerta = el.querySelector('.alerta-p1');
    expect(alerta).toBeTruthy();

    let emitido = false;
    component.irAPorTomar.subscribe(() => {
      emitido = true;
    });

    const boton = el.querySelector('.alerta-p1__boton') as HTMLButtonElement;
    boton.click();
    expect(emitido).toBe(true);
  });

  it('no debe mostrar la alerta P1 si hayP1SinTomar es false', () => {
    fixture.componentRef.setInput('resumen', {
      ...resumenMock,
      hayP1SinTomar: false,
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const alerta = el.querySelector('.alerta-p1');
    expect(alerta).toBeNull();
  });
});
