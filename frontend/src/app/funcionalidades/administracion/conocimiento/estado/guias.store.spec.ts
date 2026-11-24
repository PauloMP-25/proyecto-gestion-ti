import { TestBed } from '@angular/core/testing';
import { throwError } from 'rxjs';
import { GuiasStore } from './guias.store';
import { ConocimientoApi } from '../../../../compartido/servicios/conocimiento/conocimiento.api';
import { ConocimientoMock } from '../../../../compartido/servicios/conocimiento/conocimiento.mock';
import { CATEGORIAS_GUIA } from '../utilidades/categorias-guia';

function esperar(ms = 450): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('GuiasStore', () => {
  let store: GuiasStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GuiasStore, { provide: ConocimientoApi, useClass: ConocimientoMock }],
    });
    store = TestBed.inject(GuiasStore);
  });

  it('carga las guías y apaga el indicador de carga', async () => {
    store.cargar();
    expect(store.cargando()).toBe(true);
    await esperar();

    expect(store.cargando()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.resultados().length).toBeGreaterThanOrEqual(12);
  });

  it('busca por texto ignorando tildes y mayúsculas', async () => {
    store.cargar();
    await esperar();

    store.buscar('IMPRESORA');
    const mayusculas = store.resultados().map((g) => g.id);
    store.buscar('impresora');
    const minusculas = store.resultados().map((g) => g.id);

    expect(mayusculas.length).toBeGreaterThan(0);
    expect(minusculas).toEqual(mayusculas);
    expect(store.hayFiltros()).toBe(true);
  });

  it('filtra por categoría y la vuelve a quitar con toggle', async () => {
    store.cargar();
    await esperar();

    store.seleccionarCategoria('REDES');
    expect(store.filtro().categoria).toBe('REDES');
    expect(store.resultados().every((g) => g.categoria.clave === 'REDES')).toBe(true);

    store.seleccionarCategoria('REDES');
    expect(store.filtro().categoria).toBeNull();
  });

  it('cuenta por categoría respetando el ámbito seleccionado', async () => {
    store.cargar();
    await esperar();

    const todos = store.conteoPorCategoria();
    for (const definicion of CATEGORIAS_GUIA) {
      expect(todos[definicion.clave]).toBeGreaterThan(0);
    }

    store.seleccionarAmbito('INTERNO');
    const internos = store.conteoPorCategoria();
    const publicos = store.resultados().filter((g) => g.esPublico);
    expect(publicos).toEqual([]);
    for (const definicion of CATEGORIAS_GUIA) {
      expect(internos[definicion.clave]).toBeLessThanOrEqual(todos[definicion.clave]);
    }
  });

  it('limpiarFiltros restablece texto, categoría y ámbito', async () => {
    store.cargar();
    await esperar();
    store.buscar('red');
    store.seleccionarCategoria('REDES');
    store.seleccionarAmbito('PUBLICO');

    store.limpiarFiltros();

    expect(store.hayFiltros()).toBe(false);
    expect(store.filtro().ambito).toBe('TODOS');
    expect(store.filtro().categoria).toBeNull();
  });

  it('abre y cierra el detalle de una guía', async () => {
    store.cargar();
    await esperar();
    const primera = store.resultados()[0];

    store.abrirDetalle(primera.id);
    expect(store.seleccionada()?.id).toBe(primera.id);
    expect(store.seleccionada()?.categoria.clave).toBe(primera.categoria.clave);

    store.cerrarDetalle();
    expect(store.seleccionada()).toBeNull();
  });

  it('crear inserta la guía al inicio de la lista', async () => {
    store.cargar();
    await esperar();
    const cantidadInicial = store.resultados().length;

    store
      .crear({
        titulo: 'Guía creada desde el store',
        resumen: 'Resumen de prueba del store.',
        categoriaId: 1,
        pasos: ['Un paso'],
      })
      .subscribe();
    await esperar();

    expect(store.resultados().length).toBe(cantidadInicial + 1);
    expect(store.guardando()).toBe(false);
  });

  it('expone el error cuando la carga falla', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        GuiasStore,
        { provide: ConocimientoApi, useValue: { listar: () => throwError(() => new Error('x')) } },
      ],
    });
    const storeConError = TestBed.inject(GuiasStore);

    storeConError.cargar();
    await esperar();

    expect(storeConError.error()).toBe('No se pudieron cargar las guías. Intente nuevamente.');
    expect(storeConError.vacio()).toBe(true);
  });
});
