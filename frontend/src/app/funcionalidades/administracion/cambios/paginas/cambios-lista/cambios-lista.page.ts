import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BarraFiltrosComponent } from '../../../../../compartido/ui/organismos/barra-filtros/barra-filtros.component';
import { EsqueletoComponent } from '../../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { EstadoVacioComponent } from '../../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { ViewportService } from '../../../../../nucleo/servicios/viewport.service';
import { CambiosStore } from '../../estado/cambios.store';
import {
  AccionCambio,
  CambioDetalle,
  CambioResumen,
  TransicionCambio,
} from '../../modelos/cambios.model';
import { CambiosResumenComponent } from '../../componentes/cambios-resumen/cambios-resumen.component';
import { CambiosFiltrosComponent } from '../../componentes/cambios-filtros/cambios-filtros.component';
import { CambiosTablaComponent } from '../../componentes/cambios-tabla/cambios-tabla.component';
import { TarjetaCambioComponent } from '../../componentes/tarjeta-cambio/tarjeta-cambio.component';
import {
  PanelDetalleCambioComponent,
} from '../../componentes/panel-detalle-cambio/panel-detalle-cambio.component';
import {
  DialogoSolicitudCambioComponent,
  ResultadoSolicitudCambio,
} from '../../componentes/dialogo-solicitud-cambio/dialogo-solicitud-cambio.component';
import { DialogoDecisionCambioComponent } from '../../componentes/dialogo-decision-cambio/dialogo-decision-cambio.component';

@Component({
  selector: 'app-cambios-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BarraFiltrosComponent,
    EsqueletoComponent,
    AlertaEnLineaComponent,
    EstadoVacioComponent,
    DialogoConfirmacionComponent,
    BotonComponent,
    CambiosResumenComponent,
    CambiosFiltrosComponent,
    CambiosTablaComponent,
    TarjetaCambioComponent,
    PanelDetalleCambioComponent,
    DialogoSolicitudCambioComponent,
    DialogoDecisionCambioComponent,
  ],
  templateUrl: './cambios-lista.page.html',
  styleUrls: ['./cambios-lista.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosListaPage implements OnInit {
  readonly store = inject(CambiosStore);
  protected readonly viewport = inject(ViewportService);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly pilaFoco: HTMLElement[] = [];

  protected readonly panelAbierto = signal(false);
  protected readonly dialogoAbierto = signal(false);
  protected readonly solicitudEnEdicion = signal<CambioDetalle | null>(null);
  protected readonly accionPendiente = signal<AccionCambio | null>(null);
  protected readonly cambioParaEliminar = signal<CambioResumen | null>(null);

  private readonly dialogoSolicitud = viewChild(DialogoSolicitudCambioComponent);

  ngOnInit(): void {
    this.store.cargar();
    this.store.cargarAreas();
  }

  protected seleccionar(id: number): void {
    this.recordarFoco();
    this.panelAbierto.set(true);
    this.store.abrirDetalle(id);
    this.enfocarPanel();
  }

  protected cerrarPanel(): void {
    this.panelAbierto.set(false);
    this.store.cerrarDetalle();
    this.restaurarFoco();
  }

  protected abrirNuevo(): void {
    this.recordarFoco();
    this.solicitudEnEdicion.set(null);
    this.dialogoAbierto.set(true);
  }

  protected abrirEditar(): void {
    const detalle = this.store.seleccionado();
    if (!detalle) {
      return;
    }
    this.recordarFoco();
    this.solicitudEnEdicion.set(detalle);
    this.dialogoAbierto.set(true);
  }

  protected cerrarDialogo(): void {
    this.dialogoAbierto.set(false);
    this.solicitudEnEdicion.set(null);
    this.restaurarFoco();
  }

  protected guardarSolicitud(resultado: ResultadoSolicitudCambio): void {
    const enEdicion = this.solicitudEnEdicion();
    const operacion = enEdicion
      ? this.store.actualizar(enEdicion.id, resultado.formulario)
      : this.store.crear(resultado.formulario);

    operacion.subscribe({
      next: (guardado) => {
        if (!resultado.enviarAEvaluacion) {
          this.cerrarDialogo();
          this.seleccionar(guardado.id);
          return;
        }
        this.store
          .transicionar(guardado.id, { accion: 'ENVIAR_EVALUACION', observacion: null })
          .subscribe({
            next: () => {
              this.cerrarDialogo();
              this.seleccionar(guardado.id);
            },
            error: () => {
              // El store ya notifica el error al usuario.
            },
          });
      },
      error: (err) => this.dialogoSolicitud()?.aplicarErrorServidor(err),
    });
  }

  protected solicitarAccion(accion: AccionCambio): void {
    this.recordarFoco();
    this.accionPendiente.set(accion);
  }

  protected cancelarAccion(): void {
    this.accionPendiente.set(null);
    this.restaurarFoco();
  }

  protected confirmarAccion(transicion: TransicionCambio): void {
    const detalle = this.store.seleccionado();
    if (!detalle) {
      return;
    }
    this.store.transicionar(detalle.id, transicion).subscribe({
      next: () => {
        this.accionPendiente.set(null);
        this.restaurarFoco();
      },
      error: () => {
        // El store ya notifica el error al usuario.
      },
    });
  }

  protected solicitarEliminar(): void {
    const detalle = this.store.seleccionado();
    if (detalle) {
      this.recordarFoco();
      this.cambioParaEliminar.set(detalle);
    }
  }

  protected cancelarEliminar(): void {
    this.cambioParaEliminar.set(null);
    this.restaurarFoco();
  }

  protected confirmarEliminar(): void {
    const cambio = this.cambioParaEliminar();
    if (!cambio) {
      return;
    }
    this.store.eliminar(cambio.id).subscribe({
      next: () => {
        this.cambioParaEliminar.set(null);
        this.restaurarFoco();
        this.cerrarPanel();
      },
      error: () => {
        // El store ya notifica el error al usuario.
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
