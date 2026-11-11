import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { MenuLateralComponent } from './menu-lateral.component';
import { AuthService } from '../../auth/auth.service';
import { LayoutService } from '../layout.service';
import { RolUsuario } from '../../modelos/rol.enum';
import { describe, it, expect, beforeEach } from 'vitest';

describe('MenuLateralComponent', () => {
  let component: MenuLateralComponent;
  let fixture: ComponentFixture<MenuLateralComponent>;
  let rolSignal = signal<RolUsuario | null>(RolUsuario.USUARIO_FINAL);

  beforeEach(async () => {
    rolSignal = signal<RolUsuario | null>(RolUsuario.USUARIO_FINAL);

    await TestBed.configureTestingModule({
      imports: [MenuLateralComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            rolActual: rolSignal,
          },
        },
        {
          provide: LayoutService,
          useValue: {
            sidebarAbierto: signal(true),
            sidebarColapsado: signal(false),
            cerrarSidebarMovil: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuLateralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('para USUARIO_FINAL: no debe mostrar terminos tecnicos y debe tener las 4 rutas asistenciales', () => {
    rolSignal.set(RolUsuario.USUARIO_FINAL);
    fixture.detectChanges();

    const secciones = component.seccionesMenu();
    expect(secciones.length).toBe(1);
    expect(secciones[0].encabezado).toBe('Atención Asistencial');

    const rutas = secciones[0].items.map((i) => i.ruta);
    expect(rutas).toEqual([
      '/portal',
      '/solicitudes/nuevo',
      '/portal/mis-solicitudes',
      '/portal/ayuda',
    ]);

    const textoHtml = fixture.nativeElement.textContent;
    expect(textoHtml).not.toContain('KEDB');
    expect(textoHtml).not.toContain('CMDB');
    expect(textoHtml).not.toContain('RFC');
    expect(textoHtml).not.toContain('ITIL');
    expect(textoHtml).toContain('Inicio');
    expect(textoHtml).toContain('Reportar un problema');
    expect(textoHtml).toContain('Mis solicitudes');
    expect(textoHtml).toContain('Ayuda rápida');
  });

  it('para PRACTICANTE: debe mostrar Mi turno y Consultar equipos y soluciones', () => {
    rolSignal.set(RolUsuario.PRACTICANTE);
    fixture.detectChanges();

    const secciones = component.seccionesMenu();
    expect(secciones.length).toBe(1);
    expect(secciones[0].encabezado).toBe('Mesa de Ayuda (Mi Turno)');

    const rutas = secciones[0].items.map((i) => i.ruta);
    expect(rutas).toContain('/mi-turno');
    expect(rutas).toContain('/mi-turno/consulta');

    const textoHtml = fixture.nativeElement.textContent;
    expect(textoHtml).toContain('Mi turno');
    expect(textoHtml).toContain('Consultar equipos y soluciones');
    expect(textoHtml).not.toContain('KEDB');
  });

  it('para ADMINISTRADOR: debe mostrar Panel de control y opciones de gestion', () => {
    rolSignal.set(RolUsuario.ADMINISTRADOR);
    fixture.detectChanges();

    const secciones = component.seccionesMenu();
    expect(secciones.length).toBe(2);

    const textoHtml = fixture.nativeElement.textContent;
    expect(textoHtml).toContain('Panel de Control');
  });
});
