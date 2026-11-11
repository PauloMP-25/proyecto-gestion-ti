import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CmdbListaComponent } from './cmdb-lista.component';
import { CmdbService } from '../../servicios/cmdb.service';
import { TipoActivo, EstadoActivo, CriticidadActivo } from '../../modelos/tipo-activo.enum';

describe('CmdbListaComponent', () => {
  let component: CmdbListaComponent;
  let fixture: ComponentFixture<CmdbListaComponent>;
  let cmdbService: CmdbService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmdbListaComponent],
      providers: [CmdbService],
    }).compileComponents();

    fixture = TestBed.createComponent(CmdbListaComponent);
    component = fixture.componentInstance;
    cmdbService = TestBed.inject(CmdbService);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar en la pestaña de INVENTARIO', () => {
    expect(component.pestanaActiva()).toBe('INVENTARIO');
  });

  it('debe cambiar de pestaña a MATRIZ_IP', () => {
    component.cambiarPestana('MATRIZ_IP');
    expect(component.pestanaActiva()).toBe('MATRIZ_IP');
  });

  it('debe filtrar activos por búsqueda de texto', () => {
    component.busquedaTexto.set('Triaje');
    fixture.detectChanges();
    const filtrados = component.activosFiltrados();
    expect(filtrados.length).toBeGreaterThan(0);
    expect(filtrados.every(a => 
      a.nombre.toLowerCase().includes('triaje') || 
      a.areaNombre.toLowerCase().includes('triaje') ||
      a.hostname.toLowerCase().includes('triaje')
    )).toBe(true);
  });

  it('debe filtrar activos por tipo COMPUTADORA', () => {
    component.filtroTipo.set(TipoActivo.COMPUTADORA);
    fixture.detectChanges();
    const filtrados = component.activosFiltrados();
    expect(filtrados.every(a => a.tipo === TipoActivo.COMPUTADORA)).toBe(true);
  });

  it('debe alternar el estado de un activo entre ACTIVO y EN_MANTENIMIENTO', () => {
    const activo = component.activos()[0];
    const estadoOriginal = activo.estado;

    component.toggleEstadoActivo(activo);
    const activoActualizado = component.activos().find(a => a.id === activo.id);
    expect(activoActualizado?.estado).not.toBe(estadoOriginal);
  });

  it('debe abrir y cerrar el modal de formulario', () => {
    expect(component.modalAbierto()).toBe(false);
    component.abrirModalNuevo('192.168.10.35', 10);
    expect(component.modalAbierto()).toBe(true);
    expect(component.ipPreseleccionada()).toBe('192.168.10.35');

    component.cerrarModal();
    expect(component.modalAbierto()).toBe(false);
  });
});
