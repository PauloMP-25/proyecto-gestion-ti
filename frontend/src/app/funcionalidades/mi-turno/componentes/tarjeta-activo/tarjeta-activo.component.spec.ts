import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaActivoComponent } from './tarjeta-activo.component';
import { ActivoResumen } from '../../../../compartido/modelos/activo-resumen.model';
import { TipoActivo } from '../../../cmdb/modelos/tipo-activo.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TarjetaActivoComponent', () => {
  let component: TarjetaActivoComponent;
  let fixture: ComponentFixture<TarjetaActivoComponent>;

  const activoMock: ActivoResumen = {
    id: 1,
    nombre: 'Computadora Triaje',
    tipo: TipoActivo.COMPUTADORA,
    estado: 'ACTIVO',
    hostname: 'HSP-ADM-01',
    ip: '10.20.30.15',
    areaId: 1,
    areaNombre: 'Triaje de Emergencia',
    fallasUltimos90Dias: 3,
    enPrestamo: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaActivoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaActivoComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activo', activoMock);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar datos del equipo', () => {
    expect(component).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('HSP-ADM-01');
    expect(el.textContent).toContain('10.20.30.15');
    expect(el.textContent).toContain('Triaje de Emergencia');
    expect(el.textContent).toContain('Operativo');
  });

  it('debe mostrar la insignia de préstamo vigente y el conteo de fallas', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.badge-prestamo')).toBeTruthy();
    expect(el.querySelector('.badge-fallas')).toBeTruthy();
    expect(el.textContent).toContain('3 fallas en 90 días');
  });
});
