import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { AlertaEnLineaComponent } from '../../../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { BotonComponent } from '../../../../../../../compartido/ui/atomos/boton/boton.component';
import { BotonIconoComponent } from '../../../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { MENSAJES_CAMBIO } from '../../../../utilidades/mensajes-cambio';
import { ReversaForm, crearPaso } from '../../formulario-cambio';

@Component({
  selector: 'app-seccion-reversa',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CampoFormularioComponent,
    AlertaEnLineaComponent,
    BotonComponent,
    BotonIconoComponent,
  ],
  templateUrl: './seccion-reversa.component.html',
  styleUrl: './seccion-reversa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionReversaComponent {
  readonly form = input.required<FormGroup<ReversaForm>>();
  readonly intentado = input<boolean>(false);
  readonly requiereContinuidad = input<boolean>(false);
  readonly duracionHorario = input<number | null>(null);

  protected readonly pasos = computed(() => this.form().controls.reversaPasos);

  protected mensajePlanReversa(): string | null {
    if (!this.intentado() || !this.form().hasError('planReversaIncompleto')) {
      return null;
    }
    return MENSAJES_CAMBIO.V8;
  }

  protected mensajeContinuidad(): string | null {
    if (!this.intentado() || !this.requiereContinuidad()) {
      return null;
    }
    return this.form().controls.planContinuidad.value.trim().length === 0
      ? MENSAJES_CAMBIO.V9
      : null;
  }

  protected avisoReversaLarga(): boolean {
    const minutos = this.form().controls.reversaMinutos.value;
    const duracion = this.duracionHorario();
    return minutos !== null && duracion !== null && minutos > 0 && minutos > duracion;
  }

  protected agregarPaso(): void {
    this.pasos().push(crearPaso());
  }

  protected quitarPaso(indice: number): void {
    if (this.pasos().length > 1) {
      this.pasos().removeAt(indice);
    }
  }

  protected moverPaso(indice: number, direccion: number): void {
    const destino = indice + direccion;
    const pasos = this.pasos();
    if (destino < 0 || destino >= pasos.length) {
      return;
    }
    const control = pasos.at(indice);
    if (!control) {
      return;
    }
    pasos.removeAt(indice);
    pasos.insert(destino, control);
  }
}
