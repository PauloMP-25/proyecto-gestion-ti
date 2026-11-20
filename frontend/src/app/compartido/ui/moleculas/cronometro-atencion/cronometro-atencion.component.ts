import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { SlaCalculado } from '../../../modelos/sla-vista.model';
import { SlaInfo } from '../../../modelos/sla-info.model';
import { EstadoSla, EstadoSLA } from '../../../modelos/estado-sla.enum';
import { RelojServidorService } from '../../../../nucleo/servicios/reloj-servidor.service';

export type DatosCompromisoAtencion = SlaCalculado | SlaInfo;

@Component({
  selector: 'app-cronometro-atencion, app-sla-cronometro, app-temporizador-sla',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './cronometro-atencion.component.html',
  styleUrl: './cronometro-atencion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CronometroAtencionComponent {
  private readonly relojServidor = inject(RelojServidorService);

  readonly sla = input.required<DatosCompromisoAtencion>();
  readonly compacto = input<boolean>(false);
  readonly mostrarBarra = input<boolean>(true);

  // Normalización de datos calculados
  readonly datosCalculados = computed(() => {
    const s = this.sla();

    // Caso 1: Ya viene como SlaCalculado
    if ('fase' in s && 'porcentajeRestante' in s && 'texto' in s) {
      const porcentajeConsumido = Math.round((1 - s.porcentajeRestante) * 100);
      return {
        estado: s.estado,
        texto: s.texto,
        porcentajeConsumido: Math.min(Math.max(porcentajeConsumido, 0), 100),
        esVencido: s.estado === EstadoSla.INCUMPLIDO,
        esAlerta: s.estado === EstadoSla.ALERTA,
        fase: s.fase,
      };
    }

    // Caso 2: Viene como SlaInfo
    const ahora = this.relojServidor.ahora();
    const vencimiento = new Date(s.fechaVencimiento).getTime();
    const inicio = new Date(s.fechaInicio).getTime();
    const duracionTotal = vencimiento - inicio;

    let estado = s.estado as unknown as EstadoSla;
    let esVencido = ahora >= vencimiento || s.estado === EstadoSLA.INCUMPLIDO;

    let porcentajeConsumido = 100;
    if (duracionTotal > 0) {
      const tiempoConsumido = ahora - inicio;
      porcentajeConsumido = Math.min(Math.max(Math.round((tiempoConsumido / duracionTotal) * 100), 0), 100);
      if (porcentajeConsumido >= 80 && !esVencido) {
        estado = EstadoSla.ALERTA;
      }
    }

    if (esVencido) {
      estado = EstadoSla.INCUMPLIDO;
    }

    // Formatear texto restante
    const diffMs = vencimiento - ahora;
    let texto = '';
    if (diffMs <= 0) {
      const minVencidos = Math.abs(Math.floor(diffMs / 60000));
      texto = minVencidos > 60
        ? `Vencido hace ${Math.floor(minVencidos / 60)} h`
        : `Vencido hace ${minVencidos} min`;
    } else {
      const minRestantes = Math.floor(diffMs / 60000);
      if (minRestantes > 60) {
        const horas = Math.floor(minRestantes / 60);
        const minutos = minRestantes % 60;
        texto = `${horas} h ${minutos} min`;
      } else {
        texto = `${minRestantes} min`;
      }
    }

    return {
      estado,
      texto,
      porcentajeConsumido,
      esVencido,
      esAlerta: estado === EstadoSla.ALERTA,
      fase: 'RESOLUCION',
    };
  });

  readonly icono = computed(() => {
    const d = this.datosCalculados();
    if (d.esVencido) return 'warning';
    if (d.esAlerta) return 'hourglass_empty';
    return 'schedule';
  });

  readonly etiquetaEstado = computed(() => {
    const d = this.datosCalculados();
    if (d.esVencido) return 'Vencido';
    if (d.esAlerta) return 'Por vencer';
    return 'A tiempo';
  });

  readonly claseEstado = computed(() => {
    const d = this.datosCalculados();
    if (d.esVencido) return 'estado-vencido';
    if (d.esAlerta) return 'estado-alerta';
    return 'estado-atiempo';
  });

  readonly etiquetaAccesible = computed(() => {
    const d = this.datosCalculados();
    return `Compromiso de atención: ${this.etiquetaEstado()}, tiempo restante: ${d.texto}`;
  });
}
