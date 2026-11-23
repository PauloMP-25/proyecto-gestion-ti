import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistorialEntrada } from '../../../../compartido/modelos/ticket.model';
import { LineaTiempoAuditoriaComponent } from '../../../../compartido/ui/moleculas/linea-tiempo-auditoria/linea-tiempo-auditoria.component';
import { mapearHistorialEntradaAItemAuditoria, ItemAuditoria } from '../../../../compartido/modelos/auditoria.model';

@Component({
  selector: 'app-incidente-linea-tiempo',
  standalone: true,
  imports: [CommonModule, LineaTiempoAuditoriaComponent],
  templateUrl: './incidente-linea-tiempo.component.html',
  styleUrl: './incidente-linea-tiempo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteLineaTiempoComponent {
  readonly historial = input.required<HistorialEntrada[]>();

  readonly eventosAuditoria = computed<ItemAuditoria[]>(() => {
    const list = this.historial() || [];
    return list.map((item, index) => mapearHistorialEntradaAItemAuditoria(item, index));
  });
}