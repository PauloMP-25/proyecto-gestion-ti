import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  BarraProgresoComponent,
  SegmentoProgreso,
} from '../../../../../../compartido/ui/atomos/barra-progreso/barra-progreso.component';
import { TonoInsignia } from '../../../../../../compartido/ui/atomos/insignia/insignia.component';

@Component({
  selector: 'app-indicador-fortaleza',
  standalone: true,
  imports: [BarraProgresoComponent],
  templateUrl: './indicador-fortaleza.component.html',
  styleUrl: './indicador-fortaleza.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorFortalezaComponent {
  readonly contrasena = input<string>('');

  readonly puntosCumplidos = computed(() => {
    const c = this.contrasena() || '';
    if (!c) return 0;
    let puntos = 0;
    if (c.length >= 8) puntos++;
    if (/[A-Z]/.test(c)) puntos++;
    if (/[a-z]/.test(c)) puntos++;
    if (/\d/.test(c)) puntos++;
    return puntos;
  });

  readonly tonoNivel = computed<TonoInsignia>(() => {
    const puntos = this.puntosCumplidos();
    if (puntos === 0) return 'neutro';
    if (puntos <= 2) return 'peligro';
    if (puntos === 3) return 'aviso';
    return 'exito';
  });

  readonly etiquetaNivel = computed<string>(() => {
    const puntos = this.puntosCumplidos();
    if (puntos === 0) return 'Sin ingresar';
    if (puntos <= 2) return 'Débil';
    if (puntos === 3) return 'Moderada';
    return 'Segura';
  });

  readonly segmentos = computed<readonly SegmentoProgreso[]>(() => {
    const puntos = this.puntosCumplidos();
    if (puntos === 0) return [];
    return [
      {
        valor: puntos,
        tono: this.tonoNivel(),
        etiqueta: this.etiquetaNivel(),
      },
    ];
  });
}
