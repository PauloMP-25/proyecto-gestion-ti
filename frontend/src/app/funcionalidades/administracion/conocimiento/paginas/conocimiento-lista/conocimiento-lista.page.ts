import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConocimientoApi } from '../../../../../compartido/servicios/conocimiento/conocimiento.api';
import { ArticuloConocimiento } from '../../../../../compartido/modelos/articulo-conocimiento.model';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import {
  DialogoArticuloEditorComponent,
  GuardarArticuloPayload,
} from '../../componentes/dialogo-articulo-editor/dialogo-articulo-editor.component';

export type FiltroAmbito = 'TODOS' | 'PUBLICO' | 'INTERNO';

@Component({
  selector: 'app-conocimiento-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    IconoComponent,
    DialogoConfirmacionComponent,
    DialogoArticuloEditorComponent,
  ],
  templateUrl: './conocimiento-lista.page.html',
  styleUrls: ['./conocimiento-lista.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConocimientoListaPage implements OnInit {
  private readonly conocimientoApi = inject(ConocimientoApi);

  readonly articulos = signal<ArticuloConocimiento[]>([]);
  readonly cargando = signal<boolean>(true);
  readonly guardando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly textoBusqueda = signal<string>('');
  readonly filtroAmbito = signal<FiltroAmbito>('TODOS');

  readonly editorAbierto = signal<boolean>(false);
  readonly articuloParaEditar = signal<ArticuloConocimiento | null>(null);
  readonly articuloParaEliminar = signal<ArticuloConocimiento | null>(null);

  readonly articulosFiltrados = computed(() => {
    const query = this.textoBusqueda().toLowerCase().trim();
    const ambito = this.filtroAmbito();

    return this.articulos().filter((art) => {
      // Filtro ámbito
      if (ambito === 'PUBLICO' && !art.esPublico) return false;
      if (ambito === 'INTERNO' && art.esPublico) return false;

      // Filtro búsqueda
      if (!query) return true;
      const coincideTitulo = art.titulo.toLowerCase().includes(query);
      const coincideResumen = art.resumen.toLowerCase().includes(query);
      const coincideCategoria = art.categoriaNombre.toLowerCase().includes(query);
      const coincideTags = art.palabrasClave?.some((p) => p.toLowerCase().includes(query));

      return coincideTitulo || coincideResumen || coincideCategoria || coincideTags;
    });
  });

  ngOnInit(): void {
    this.cargarArticulos();
  }

  cargarArticulos(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.conocimientoApi.listar().subscribe({
      next: (lista) => {
        this.articulos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la base de conocimientos. Intente de nuevo.');
        this.cargando.set(false);
      },
    });
  }

  abrirNuevo(): void {
    this.articuloParaEditar.set(null);
    this.editorAbierto.set(true);
  }

  abrirEditar(articulo: ArticuloConocimiento): void {
    this.articuloParaEditar.set(articulo);
    this.editorAbierto.set(true);
  }

  cerrarEditor(): void {
    this.editorAbierto.set(false);
    this.articuloParaEditar.set(null);
  }

  guardarArticulo(payload: GuardarArticuloPayload): void {
    this.guardando.set(true);
    const actual = this.articuloParaEditar();

    if (actual) {
      this.conocimientoApi.actualizar(actual.id, payload).subscribe({
        next: (artActualizado) => {
          this.articulos.update((items) =>
            items.map((it) => (it.id === artActualizado.id ? artActualizado : it))
          );
          this.guardando.set(false);
          this.cerrarEditor();
        },
        error: () => {
          this.error.set('Error al actualizar la guía.');
          this.guardando.set(false);
        },
      });
    } else {
      this.conocimientoApi.crear(payload).subscribe({
        next: (artNuevo) => {
          this.articulos.update((items) => [artNuevo, ...items]);
          this.guardando.set(false);
          this.cerrarEditor();
        },
        error: () => {
          this.error.set('Error al crear la nueva guía.');
          this.guardando.set(false);
        },
      });
    }
  }

  solicitarEliminar(articulo: ArticuloConocimiento): void {
    this.articuloParaEliminar.set(articulo);
  }

  confirmarEliminacion(): void {
    const art = this.articuloParaEliminar();
    if (!art) return;

    this.conocimientoApi.eliminar(art.id).subscribe({
      next: () => {
        this.articulos.update((items) => items.filter((it) => it.id !== art.id));
        this.articuloParaEliminar.set(null);
      },
      error: () => {
        this.error.set('No se pudo eliminar el artículo.');
        this.articuloParaEliminar.set(null);
      },
    });
  }

  cancelarEliminacion(): void {
    this.articuloParaEliminar.set(null);
  }
}
