import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import {
  AccionCambio,
  CambioResumen,
  TransicionCambio,
} from '../../modelos/cambios.model';
import {
  PRESENTACION_ACCION,
  tituloDialogoAccion,
} from '../../utilidades/etiquetas-cambio';
import { ACCIONES_CON_OBSERVACION } from '../../utilidades/flujo-cambio';

@Component({
  selector: 'app-dialogo-decision-cambio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
    BotonComponent,
  ],
  templateUrl: './dialogo-decision-cambio.component.html',
  styleUrl: './dialogo-decision-cambio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoDecisionCambioComponent {
  readonly accion = input.required<AccionCambio>();
  readonly cambio = input.required<CambioResumen>();
  readonly guardando = input<boolean>(false);

  readonly alConfirmar = output<TransicionCambio>();
  readonly alCancelar = output<void>();

  protected readonly observacion = new FormControl('', {
    nonNullable: true,
    validators: [Validators.maxLength(500)],
  });

  protected readonly intentado = signal(false);

  protected readonly presentacion = computed(() => PRESENTACION_ACCION[this.accion()]);
  protected readonly titulo = computed(() =>
    tituloDialogoAccion(this.accion(), this.cambio().codigo),
  );
  protected readonly requiereObservacion = computed(() =>
    ACCIONES_CON_OBSERVACION.includes(this.accion()),
  );
  protected readonly muestraObservacion = computed(
    () => this.presentacion().etiquetaObservacion !== null,
  );

  protected readonly mensajeError = computed(() => {
    if (!this.intentado()) {
      return null;
    }
    const valor = this.observacion.value.trim();
    if (this.requiereObservacion() && valor.length === 0) {
      return 'Escriba una observación para continuar.';
    }
    if (this.observacion.hasError('maxlength')) {
      return 'La observación no debe superar los 500 caracteres.';
    }
    return null;
  });

  protected confirmar(): void {
    this.intentado.set(true);
    const valor = this.observacion.value.trim();

    if (this.requiereObservacion() && valor.length === 0) {
      this.observacion.markAsTouched();
      return;
    }

    if (this.mensajeError()) {
      return;
    }

    const transicion: TransicionCambio = {
      accion: this.accion(),
      observacion: valor.length > 0 ? valor : null,
    };
    this.alConfirmar.emit(transicion);
  }
}
