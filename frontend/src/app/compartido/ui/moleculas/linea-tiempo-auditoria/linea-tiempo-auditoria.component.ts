import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../../atomos/icono/icono.component';
import {
  ItemAuditoria,
  ConfiguracionVisualEvento,
  obtenerConfiguracionEvento,
} from '../../../modelos/auditoria.model';

export interface ItemAuditoriaVista extends ItemAuditoria {
  configVisual: ConfiguracionVisualEvento;
  fechaFormateada: string;
}

@Component({
  selector: 'app-linea-tiempo-auditoria',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './linea-tiempo-auditoria.component.html',
  styleUrl: './linea-tiempo-auditoria.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineaTiempoAuditoriaComponent {
  /** Lista de eventos de auditoría o trazabilidad */
  readonly eventos = input.required<ItemAuditoria[]>();

  /** Título accesible de la lista */
  readonly ariaLabel = input<string>('Historial y trazabilidad de la solicitud');

  /** Indica si se deben mostrar detalles técnicos adicionales (IP, notas internas) */
  readonly modoTecnico = input<boolean>(true);

  /** Eventos enriquecidos con configuración visual para el render */
  readonly eventosVista = computed<ItemAuditoriaVista[]>(() => {
    const items = this.eventos() || [];
    return items.map((item) => {
      const config = obtenerConfiguracionEvento(item.tipoEvento);
      return {
        ...item,
        configVisual: {
          titulo: item.tituloPersonalizado || config.titulo,
          icono: item.iconoPersonalizado || config.icono,
          variante: config.variante,
        },
        fechaFormateada: item.fechaIso,
      };
    });
  });
}
