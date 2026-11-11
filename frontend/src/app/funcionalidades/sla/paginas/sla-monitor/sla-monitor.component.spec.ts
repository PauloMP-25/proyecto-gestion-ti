import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlaMonitorComponent } from './sla-monitor.component';
import { SlaService } from '../../servicios/sla.service';
import { provideRouter } from '@angular/router';

describe('SlaMonitorComponent', () => {
  let component: SlaMonitorComponent;
  let fixture: ComponentFixture<SlaMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlaMonitorComponent],
      providers: [
        SlaService,
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SlaMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar métricas globales de SLA', () => {
    expect(component.metricasGlobales()).toBeDefined();
    expect(component.metricasGlobales().porcentajeCumplimientoGlobal).toBeGreaterThan(0);
  });

  it('debe calcular la clase semafórica según el porcentaje consumido', () => {
    expect(component.obtenerClasePorcentaje(50)).toBe('progreso--a-tiempo');
    expect(component.obtenerClasePorcentaje(85)).toBe('progreso--alerta');
    expect(component.obtenerClasePorcentaje(105)).toBe('progreso--incumplido');
  });

  it('debe contener tickets activos bajo monitoreo', () => {
    expect(component.ticketsBajoMonitoreo().length).toBeGreaterThan(0);
  });
});
