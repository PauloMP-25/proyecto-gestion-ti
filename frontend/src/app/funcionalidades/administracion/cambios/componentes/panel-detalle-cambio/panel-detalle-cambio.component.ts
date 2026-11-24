import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PanelDetalleComponent } from '../../../../../compartido/ui/organismos/panel-detalle/panel-detalle.component';
import {
  BarraPestanasComponent,
  Pestana,
} from '../../../../../compartido/ui/moleculas/barra-pestanas/barra-pestanas.component';
import { EsqueletoComponent } from '../../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { DatoEtiquetadoComponent } from '../../../../../compartido/ui/moleculas/dato-etiquetado/dato-etiquetado.component';
import { LineaTiempoAuditoriaComponent } from '../../../../../compartido/ui/moleculas/linea-tiempo-auditoria/linea-tiempo-auditoria.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { ItemAuditoria } from '../../../../../compartido/modelos/auditoria.model';
import {
  AccionCambio,
  CambioDetalle,
  ImpactoAsistencial,
} from '../../modelos/cambios.model';
import {
  ETIQUETA_CATEGORIA,
  PRESENTACION_ACCION,
  PRESENTACION_ESTADO,
  PRESENTACION_IMPACTO,
  PRESENTACION_TIPO,
} from '../../utilidades/etiquetas-cambio';
import { esEditable } from '../../utilidades/flujo-cambio';
import { SeccionCicloCambioComponent } from './seccion-ciclo-cambio/seccion-ciclo-cambio.component';

const PESTANAS: readonly Pestana[] = [
  { id: 'resumen', etiqueta: 'Resumen', icono: 'description' },
  { id: 'impacto', etiqueta: 'Impacto asistencial', icono: 'ecg_heart' },
  { id: 'plan', etiqueta: 'Plan de trabajo y reversa', icono: 'format_list_numbered' },
  { id: 'historial', etiqueta: 'Historial', icono: 'history' },
];

const TONO_ALERTA_IMPACTO: Record<ImpactoAsistencial, 'info' | 'aviso' | 'peligro'> = {
  BAJO: 'info',
  MEDIO: 'info',
  ALTO: 'aviso',
  CRITICO: 'peligro',
};

function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return iso;
  }
  const dos = (numero: number): string => String(numero).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

@Component({
  selector: 'app-panel-detalle-cambio',
  standalone: true,
  imports: [
    RouterLink,
    PanelDetalleComponent,
    BarraPestanasComponent,
    EsqueletoComponent,
    AlertaEnLineaComponent,
    DatoEtiquetadoComponent,
    LineaTiempoAuditoriaComponent,
    BotonComponent,
    IconoComponent,
    SeccionCicloCambioComponent,
  ],
  templateUrl: './panel-detalle-cambio.component.html',
  styleUrl: './panel-detalle-cambio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDetalleCambioComponent {
  readonly abierto = model<boolean>(false);
  readonly cambio = input<CambioDetalle | null>(null);
  readonly cargando = input<boolean>(false);
  readonly acciones = input<readonly AccionCambio[]>([]);
  readonly guardando = input<boolean>(false);

  readonly alCerrar = output<void>();
  readonly alAccion = output<AccionCambio>();
  readonly alEditar = output<void>();
  readonly alEliminar = output<void>();

  protected readonly PESTANAS = PESTANAS;
  protected readonly PRESENTACION_ACCION = PRESENTACION_ACCION;
  protected readonly PRESENTACION_ESTADO = PRESENTACION_ESTADO;
  protected readonly PRESENTACION_IMPACTO = PRESENTACION_IMPACTO;
  protected readonly PRESENTACION_TIPO = PRESENTACION_TIPO;
  protected readonly ETIQUETA_CATEGORIA = ETIQUETA_CATEGORIA;
  protected readonly formatearFechaHora = formatearFechaHora;
  protected readonly esEditable = esEditable;

  protected readonly pestanaActiva = signal<string>('resumen');

  constructor() {
    effect(() => {
      if (this.cambio()) {
        this.pestanaActiva.set('resumen');
      }
    });
  }

  protected readonly historial = computed<ItemAuditoria[]>(() => {
    const eventos = this.cambio()?.historial ?? [];
    return eventos.map((evento, indice) => ({
      id: indice,
      tipoEvento: 'CAMBIO_ESTADO',
      fechaIso: evento.fechaIso,
      usuarioNombre: evento.usuarioNombre,
      estadoAnterior: evento.estadoAnterior
        ? PRESENTACION_ESTADO[evento.estadoAnterior].texto
        : null,
      estadoNuevo: PRESENTACION_ESTADO[evento.estadoNuevo].texto,
      comentario: evento.observacion,
      tituloPersonalizado: evento.estadoAnterior
        ? `Cambio de estado a ${PRESENTACION_ESTADO[evento.estadoNuevo].texto}`
        : `Registro inicial en ${PRESENTACION_ESTADO[evento.estadoNuevo].texto}`,
    }));
  });

  protected tonoAlertaImpacto(nivel: ImpactoAsistencial): 'info' | 'aviso' | 'peligro' {
    return TONO_ALERTA_IMPACTO[nivel];
  }

  protected horarioTexto(cambio: CambioDetalle): string {
    if (!cambio.horario) {
      return 'Sin programar';
    }
    return `${formatearFechaHora(cambio.horario.inicioIso)} – ${formatearFechaHora(cambio.horario.finIso)}`;
  }

  protected cerrar(): void {
    this.abierto.set(false);
    this.alCerrar.emit();
  }
}
