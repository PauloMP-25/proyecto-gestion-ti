import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../../ui/atomos/icono/icono.component';
import { EtapaSeguimiento, ETAPAS_SEGUIMIENTO } from '../../modelos/etapa-seguimiento.model';
import { ETIQUETA_ETAPA, MENSAJE_ETAPA } from '../../utilidades/vocabulario-asistencial';

export interface HitoSeguimiento {
  id: number;
  etapa: EtapaSeguimiento;
  mensaje: string;
  fechaIso: string;
}

export interface EtapaItemVista {
  clave: EtapaSeguimiento;
  titulo: string;
  descripcion: string;
  esPasada: boolean;
  esActual: boolean;
  esFutura: boolean;
  fechaIso: string | null;
}

@Component({
  selector: 'app-linea-tiempo-etapas',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './linea-tiempo-etapas.component.html',
  styleUrl: './linea-tiempo-etapas.component.scss',
})
export class LineaTiempoEtapasComponent {
  readonly etapaActual = input.required<EtapaSeguimiento>();
  readonly hitos = input<HitoSeguimiento[]>([]);

  readonly etapasVista = computed<EtapaItemVista[]>(() => {
    const actual = this.etapaActual();
    const indiceActual = ETAPAS_SEGUIMIENTO.indexOf(actual);
    const mapaHitos = new Map<EtapaSeguimiento, HitoSeguimiento>();
    (this.hitos() || []).forEach(h => mapaHitos.set(h.etapa, h));

    return ETAPAS_SEGUIMIENTO.map((etapa, idx) => {
      const hito = mapaHitos.get(etapa);
      return {
        clave: etapa,
        titulo: ETIQUETA_ETAPA[etapa],
        descripcion: hito?.mensaje || MENSAJE_ETAPA[etapa],
        esPasada: idx < indiceActual,
        esActual: idx === indiceActual,
        esFutura: idx > indiceActual,
        fechaIso: hito?.fechaIso || null,
      };
    });
  });
}
