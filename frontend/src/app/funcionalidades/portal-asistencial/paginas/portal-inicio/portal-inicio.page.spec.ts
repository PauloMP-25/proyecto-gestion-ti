import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PortalInicioPage } from './portal-inicio.page';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { Prioridad } from '../../../../compartido/modelos/prioridad.enum';

describe('PortalInicioPage (A2)', () => {
  let component: PortalInicioPage;
  let fixture: ComponentFixture<PortalInicioPage>;

  const usuarioMock = {
    id: 'USR-001',
    nombreCompleto: 'Dra. Rosa Mendoza Quispe',
    correo: 'rmendoza@hsms.gob.pe',
    rol: RolUsuario.USUARIO_FINAL,
    areaProcedencia: 'Triaje de Emergencia',
    cargo: 'Médico Asistencial',
  };

  const solicitudesMock = [
    {
      id: 1,
      codigo: 'INC-2026-00001',
      titulo: 'Impresora trabada',
      categoriaNombre: 'Hardware',
      areaNombre: 'Triaje',
      etapa: 'RESUELTO' as const,
      urgencia: Prioridad.P2,
      fechaCreacionIso: '2026-11-11T12:00:00Z',
      fechaUltimaNovedadIso: '2026-11-11T13:00:00Z',
      requiereConfirmacion: true,
      calificada: false,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalInicioPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuarioActual: signal(usuarioMock),
          },
        },
        {
          provide: PortalSolicitudesApi,
          useValue: {
            contarPorConfirmar: () => of(1),
            listar: () => of({
              contenido: solicitudesMock,
              pagina: 0,
              tamano: 3,
              totalElementos: 1,
              totalPaginas: 1,
            }),
          },
        },
        {
          provide: PortalAyudaApi,
          useValue: {
            destacados: () => of([
              { id: 1, titulo: 'Guía GalenHos', categoriaId: 1, categoriaNombre: 'Software', sintoma: 'Error' },
            ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PortalInicioPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el saludo asistencial y los datos de área del usuario', () => {
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Dra. Rosa Mendoza Quispe');
    expect(texto).toContain('Triaje de Emergencia');
    expect(texto).toContain('Médico Asistencial');
  });

  it('debe contener el botón principal CTA a /solicitudes/nuevo', () => {
    const cta = fixture.nativeElement.querySelector('#cta-reportar');
    expect(cta).toBeTruthy();
    expect(cta.getAttribute('href')).toBe('/solicitudes/nuevo');
    expect(cta.textContent).toContain('Reportar un problema');
  });

  it('debe renderizar el banner de confirmación cuando hay solicitudes resueltas', () => {
    const banner = fixture.nativeElement.querySelector('app-banner-confirmacion');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('1 solicitud ya fue atendida');
  });

  it('debe renderizar la lista de solicitudes recientes', () => {
    const tarjetas = fixture.nativeElement.querySelectorAll('app-tarjeta-solicitud');
    expect(tarjetas.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('INC-2026-00001');
  });

  it('no debe contener terminos tecnicos ni referencias a ITIL en pantalla', () => {
    const textoCompleto = fixture.nativeElement.textContent;
    expect(textoCompleto).not.toContain('ITIL');
    expect(textoCompleto).not.toContain('SLA');
    expect(textoCompleto).not.toContain('KEDB');
    expect(textoCompleto).not.toContain('CMDB');
  });
});
