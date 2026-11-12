import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TarjetaSolicitudComponent } from './tarjeta-solicitud.component';
import { SolicitudResumen } from '../../modelos/solicitud.model';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('TarjetaSolicitudComponent', () => {
  let component: TarjetaSolicitudComponent;
  let fixture: ComponentFixture<TarjetaSolicitudComponent>;

  const mockSolicitud: SolicitudResumen = {
    id: 1,
    codigo: 'INC-2026-00001',
    titulo: 'Problema en impresora de farmacia',
    categoriaNombre: 'Hardware',
    areaNombre: 'Farmacia Central',
    etapa: 'EN_ATENCION',
    urgencia: Prioridad.P2,
    fechaCreacionIso: '2026-11-11T12:00:00Z',
    fechaUltimaNovedadIso: '2026-11-11T12:30:00Z',
    requiereConfirmacion: false,
    calificada: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaSolicitudComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaSolicitudComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('solicitud', mockSolicitud);
    fixture.detectChanges();
  });

  it('debe crearse y renderizar codigo, titulo y etapa asistencial', () => {
    expect(component).toBeTruthy();
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('INC-2026-00001');
    expect(texto).toContain('Problema en impresora de farmacia');
    expect(texto).toContain('En atención');
  });

  it('debe contener un enlace al detalle de la solicitud', () => {
    const enlace = fixture.nativeElement.querySelector('a.tarjeta-solicitud__enlace');
    expect(enlace).toBeTruthy();
    expect(enlace.getAttribute('href')).toBe('/portal/mis-solicitudes/1');
  });
});
