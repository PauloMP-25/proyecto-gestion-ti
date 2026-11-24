import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { PanelDetalleComponent } from '../../../../../compartido/ui/organismos/panel-detalle/panel-detalle.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import { BuscadorGuiasComponent } from '../../componentes/buscador-guias/buscador-guias.component';
import { ListaGuiasComponent } from '../../componentes/lista-guias/lista-guias.component';
import { DetalleGuiaComponent } from '../../componentes/detalle-guia/detalle-guia.component';
import {
  DialogoArticuloEditorComponent,
  GuardarArticuloPayload,
} from '../../componentes/dialogo-articulo-editor/dialogo-articulo-editor.component';
import { GuiasStore } from '../../estado/guias.store';
import { GuiaVista } from '../../modelos/guias.model';

@Component({
  selector: 'app-conocimiento-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BotonComponent,
    PanelDetalleComponent,
    DialogoConfirmacionComponent,
    BuscadorGuiasComponent,
    ListaGuiasComponent,
    DetalleGuiaComponent,
    DialogoArticuloEditorComponent,
  ],
  templateUrl: './conocimiento-lista.page.html',
  styleUrl: './conocimiento-lista.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConocimientoListaPage implements OnInit {
  readonly store = inject(GuiasStore);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pilaFoco: HTMLElement[] = [];

  protected readonly editorAbierto = signal(false);
  protected readonly articuloParaEditar = signal<GuiaVista | null>(null);
  protected readonly guiaParaEliminar = signal<GuiaVista | null>(null);

  ngOnInit(): void {
    this.store.cargar();
  }

  protected abrirDetalle(id: number): void {
    this.recordarFoco();
    this.store.abrirDetalle(id);
    this.enfocarPanel();
  }

  protected cerrarDetalle(): void {
    this.store.cerrarDetalle();
    this.restaurarFoco();
  }

  protected abrirNueva(): void {
    this.recordarFoco();
    this.articuloParaEditar.set(null);
    this.editorAbierto.set(true);
  }

  protected abrirEditar(guia: GuiaVista): void {
    this.recordarFoco();
    this.articuloParaEditar.set(guia);
    this.editorAbierto.set(true);
  }

  protected cerrarEditor(): void {
    this.editorAbierto.set(false);
    this.articuloParaEditar.set(null);
    this.restaurarFoco();
  }

  protected guardarArticulo(payload: GuardarArticuloPayload): void {
    const actual = this.articuloParaEditar();
    const peticion = actual
      ? this.store.actualizar(actual.id, payload)
      : this.store.crear(payload);

    peticion.subscribe({
      next: () => this.cerrarEditor(),
      error: () => undefined,
    });
  }

  protected solicitarEliminar(guia: GuiaVista): void {
    this.recordarFoco();
    this.guiaParaEliminar.set(guia);
  }

  protected cancelarEliminacion(): void {
    this.guiaParaEliminar.set(null);
    this.restaurarFoco();
  }

  protected confirmarEliminacion(): void {
    const guia = this.guiaParaEliminar();
    if (!guia) {
      return;
    }
    this.store.eliminar(guia.id).subscribe({
      next: () => {
        this.guiaParaEliminar.set(null);
        this.restaurarFoco();
      },
      error: () => {
        this.guiaParaEliminar.set(null);
        this.restaurarFoco();
      },
    });
  }

  private recordarFoco(): void {
    const activo = document.activeElement;
    if (activo instanceof HTMLElement) {
      this.pilaFoco.push(activo);
    }
  }

  private restaurarFoco(): void {
    const origen = this.pilaFoco.pop();
    if (origen?.isConnected) {
      origen.focus();
    }
  }

  private enfocarPanel(): void {
    setTimeout(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>('.panel-detalle__cabecera button')
        ?.focus();
    }, 50);
  }
}
