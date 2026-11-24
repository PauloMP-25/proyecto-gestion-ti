import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CambiosStore } from './cambios.store';
import { CambiosApi } from '../servicios/cambios.api';
import { CambiosMock } from '../servicios/cambios.mock';
import { ESTADOS_CAMBIO } from '../modelos/cambios.model';

function esperar(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('CambiosStore', () => {
  let store: CambiosStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CambiosStore, { provide: CambiosApi, useClass: CambiosMock }],
    });
    store = TestBed.inject(CambiosStore);
  });

  it('carga las solicitudes y apaga el indicador de carga', async () => {
    store.cargar();
    expect(store.cargando()).toBe(true);
    await esperar();

    expect(store.cargando()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.cambios().length).toBeGreaterThanOrEqual(8);
  });

  it('calcula el conteo por estado sumando toda la lista', async () => {
    store.cargar();
    await esperar();

    const conteo = store.conteoPorEstado();
    const total = ESTADOS_CAMBIO.reduce((suma, estado) => suma + conteo[estado], 0);
    expect(total).toBe(store.cambios().length);
    expect(conteo.BORRADOR).toBeGreaterThan(0);
  });

  it('filtra por estado sin perder los conteos de los demás estados', async () => {
    store.cargar();
    await esperar();

    const conteoInicial = store.conteoPorEstado();
    store.actualizarFiltro({ estado: 'BORRADOR' });
    await esperar();

    expect(store.cambios().every((c) => c.estado === 'BORRADOR')).toBe(true);
    expect(store.conteoPorEstado().BORRADOR).toBe(conteoInicial.BORRADOR);
    expect(store.filtrosActivos()).toBe(1);
  });

  it('limpia los filtros y vuelve a la lista completa', async () => {
    store.cargar();
    await esperar();
    store.actualizarFiltro({ estado: 'BORRADOR', impacto: 'CRITICO' });
    await esperar();

    store.limpiarFiltros();
    await esperar();

    expect(store.filtro().estado).toBeNull();
    expect(store.filtro().impacto).toBeNull();
    expect(store.filtrosActivos()).toBe(0);
  });

  it('abre el detalle y expone las acciones permitidas de su estado', async () => {
    store.cargar();
    await esperar();
    const borrador = store.cambios().find((c) => c.estado === 'BORRADOR');
    expect(borrador).toBeTruthy();

    store.abrirDetalle(borrador!.id);
    await esperar();

    expect(store.seleccionado()?.id).toBe(borrador!.id);
    expect(store.accionesDelSeleccionado()).toEqual(['ENVIAR_EVALUACION']);
  });

  it('transicionar actualiza la lista, el detalle y emite el aviso', async () => {
    store.cargar();
    await esperar();
    const borrador = store.cambios().find((c) => c.estado === 'BORRADOR')!;
    store.abrirDetalle(borrador.id);
    await esperar();

    store
      .transicionar(borrador.id, { accion: 'ENVIAR_EVALUACION', observacion: null })
      .subscribe();
    await esperar();

    expect(store.cambios().find((c) => c.id === borrador.id)?.estado).toBe('EN_EVALUACION');
    expect(store.seleccionado()?.estado).toBe('EN_EVALUACION');
    expect(store.guardando()).toBe(false);
  });

  it('elimina una solicitud en borrador de la lista y cierra el detalle', async () => {
    store.cargar();
    await esperar();
    const borrador = store.cambios().find((c) => c.estado === 'BORRADOR')!;
    store.abrirDetalle(borrador.id);
    await esperar();

    store.eliminar(borrador.id).subscribe();
    await esperar();

    expect(store.cambios().some((c) => c.id === borrador.id)).toBe(false);
    expect(store.seleccionado()).toBeNull();
  });

  it('expone el error cuando la carga falla', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        CambiosStore,
        {
          provide: CambiosApi,
          useValue: {
            listar: () => throwError(() => new Error('falla')),
            listarAreasSeleccionables: () => of([]),
          },
        },
      ],
    });
    const storeConError = TestBed.inject(CambiosStore);

    storeConError.cargar();
    await esperar();

    expect(storeConError.error()).toBe('No se pudieron cargar las solicitudes de cambio. Intente nuevamente.');
    expect(storeConError.cargando()).toBe(false);
  });
});
