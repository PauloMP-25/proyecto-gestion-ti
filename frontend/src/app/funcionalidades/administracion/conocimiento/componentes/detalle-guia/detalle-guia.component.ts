import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DatoEtiquetadoComponent } from '../../../../../compartido/ui/moleculas/dato-etiquetado/dato-etiquetado.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { ETIQUETA_DIFICULTAD, GuiaVista } from '../../modelos/guias.model';
import { SeccionSintomaCausaComponent } from './secciones/seccion-sintoma-causa/seccion-sintoma-causa.component';
import { SeccionPrecaucionesComponent } from './secciones/seccion-precauciones/seccion-precauciones.component';
import { SeccionPasosSolucionComponent } from './secciones/seccion-pasos-solucion/seccion-pasos-solucion.component';

@Component({
  selector: 'app-detalle-guia',
  standalone: true,
  imports: [
    DatePipe,
    DatoEtiquetadoComponent,
    AlertaEnLineaComponent,
    BotonComponent,
    IconoComponent,
    SeccionSintomaCausaComponent,
    SeccionPrecaucionesComponent,
    SeccionPasosSolucionComponent,
  ],
  templateUrl: './detalle-guia.component.html',
  styleUrl: './detalle-guia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalleGuiaComponent {
  readonly guia = input.required<GuiaVista>();

  readonly alVotar = output<boolean>();

  private readonly _voto = signal<{ id: number; util: boolean } | null>(null);

  protected readonly sintoma = computed(() => this.guia().sintoma || this.guia().resumen);
  protected readonly pasos = computed<readonly string[]>(() => this.guia().pasos ?? []);
  protected readonly precauciones = computed<readonly string[]>(
    () => this.guia().precauciones ?? [],
  );
  protected readonly equipos = computed<readonly string[]>(
    () => this.guia().equiposCompatibles ?? [],
  );
  protected readonly ambitoTexto = computed(() =>
    this.guia().esPublico
      ? 'Para el personal asistencial'
      : 'Uso interno del equipo técnico',
  );
  protected readonly dificultadTexto = computed(() => {
    const dificultad = this.guia().nivelDificultad;
    return dificultad ? ETIQUETA_DIFICULTAD[dificultad] : null;
  });
  protected readonly tiempoTexto = computed(() => {
    const minutos = this.guia().minutosEstimados;
    return minutos ? `${minutos} min` : null;
  });
  protected readonly colorCategoria = computed(
    () => `var(${this.guia().categoria.colorToken})`,
  );
  protected readonly yaVoto = computed(() => this._voto()?.id === this.guia().id);

  protected votar(esUtil: boolean): void {
    this._voto.set({ id: this.guia().id, util: esUtil });
    this.alVotar.emit(esUtil);
  }
}
