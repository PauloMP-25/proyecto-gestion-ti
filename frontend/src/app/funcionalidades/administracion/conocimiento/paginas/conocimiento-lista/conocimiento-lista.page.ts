import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ArticuloConocimiento } from '../../../../../compartido/modelos/articulo-conocimiento.model';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { BarraFiltrosComponent } from '../../../../../compartido/ui/organismos/barra-filtros/barra-filtros.component';
import {
  CampoFiltroComponent,
  OpcionFiltro,
} from '../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';
import { EsqueletoComponent } from '../../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { EstadoVacioComponent } from '../../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { InsigniaComponent } from '../../../../../compartido/ui/atomos/insignia/insignia.component';
import { TarjetaComponent } from '../../../../../compartido/ui/atomos/tarjeta/tarjeta.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import {
  DialogoArticuloEditorComponent,
  GuardarArticuloPayload,
} from '../../componentes/dialogo-articulo-editor/dialogo-articulo-editor.component';
import { GuiasStore } from '../../estado/guias.store';
import { AmbitoGuia } from '../../modelos/guias.model';

const OPCIONES_AMBITO: readonly OpcionFiltro[] = [
  { valor: 'TODOS', etiqueta: 'Todas' },
  { valor: 'PUBLICO', etiqueta: 'Para el personal asistencial' },
  { valor: 'INTERNO', etiqueta: 'Uso interno del equipo técnico' },
];

@Component({
  selector: 'app-conocimiento-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BotonComponent,
    BotonIconoComponent,
    BarraFiltrosComponent,
    CampoFiltroComponent,
    EsqueletoComponent,
    AlertaEnLineaComponent,
    EstadoVacioComponent,
    InsigniaComponent,
    TarjetaComponent,
    DialogoConfirmacionComponent,
    DialogoArticuloEditorComponent,
  ],
  templateUrl: './conocimiento-lista.page.html',
  styleUrls: ['./conocimiento-lista.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConocimientoListaPage implements OnInit {
  readonly store = inject(GuiasStore);

  readonly opcionesAmbito = OPCIONES_AMBITO;

  readonly editorAbierto = signal(false);
  readonly articuloParaEditar = signal<ArticuloConocimiento | null>(null);
  readonly articuloParaEliminar = signal<ArticuloConocimiento | null>(null);

  ngOnInit(): void {
    this.store.cargar();
  }

  cambiarAmbito(valor: unknown): void {
    this.store.seleccionarAmbito(valor as AmbitoGuia);
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
    const actual = this.articuloParaEditar();
    const peticion = actual
      ? this.store.actualizar(actual.id, payload)
      : this.store.crear(payload);

    peticion.subscribe({
      next: () => this.cerrarEditor(),
      error: () => undefined,
    });
  }

  solicitarEliminar(articulo: ArticuloConocimiento): void {
    this.articuloParaEliminar.set(articulo);
  }

  confirmarEliminacion(): void {
    const articulo = this.articuloParaEliminar();
    if (!articulo) {
      return;
    }
    this.store.eliminar(articulo.id).subscribe({
      next: () => this.articuloParaEliminar.set(null),
      error: () => this.articuloParaEliminar.set(null),
    });
  }

  cancelarEliminacion(): void {
    this.articuloParaEliminar.set(null);
  }
}
