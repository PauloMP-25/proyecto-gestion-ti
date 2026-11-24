import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { AbstractControl, NonNullableFormBuilder } from '@angular/forms';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import {
  BarraPestanasComponent,
  Pestana,
} from '../../../../../compartido/ui/moleculas/barra-pestanas/barra-pestanas.component';
import { ViewportService } from '../../../../../nucleo/servicios/viewport.service';
import {
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
} from '../../modelos/cambios.model';
import {
  evaluarContinuidad,
  evaluarHorario,
  evaluarInterrupcion,
  evaluarPlanReversa,
} from '../../utilidades/validadores-cambio';
import { MENSAJES_CAMBIO } from '../../utilidades/mensajes-cambio';
import {
  FormularioCambioVista,
  aCambioFormulario,
  completarFormularioCambio,
  crearFormularioCambio,
  duracionMinutos,
} from './formulario-cambio';
import { SeccionDatosGeneralesComponent } from './secciones/seccion-datos-generales/seccion-datos-generales.component';
import { SeccionImpactoComponent } from './secciones/seccion-impacto/seccion-impacto.component';
import { SeccionReversaComponent } from './secciones/seccion-reversa/seccion-reversa.component';

export interface ResultadoSolicitudCambio {
  readonly formulario: CambioFormulario;
  readonly enviarAEvaluacion: boolean;
}

interface ErrorFormulario {
  readonly paso: number;
  readonly mensaje: string;
  readonly campoId: string;
}

const PASOS: readonly (Pestana & { campoId: string })[] = [
  { id: 'generales', etiqueta: 'Datos generales', icono: 'description', campoId: 'cambio-titulo' },
  { id: 'impacto', etiqueta: 'Impacto', icono: 'ecg_heart', campoId: 'cambio-minutos-interrupcion' },
  { id: 'reversa', etiqueta: 'Reversa', icono: 'restart_alt', campoId: 'cambio-reversa-criterio' },
];

@Component({
  selector: 'app-dialogo-solicitud-cambio',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    DialogoConfirmacionComponent,
    BotonComponent,
    AlertaEnLineaComponent,
    BarraPestanasComponent,
    SeccionDatosGeneralesComponent,
    SeccionImpactoComponent,
    SeccionReversaComponent,
  ],
  templateUrl: './dialogo-solicitud-cambio.component.html',
  styleUrl: './dialogo-solicitud-cambio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoSolicitudCambioComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly viewport = inject(ViewportService);

  readonly solicitud = input<CambioDetalle | null>(null);
  readonly areas = input<readonly AreaAfectada[]>([]);
  readonly guardando = input<boolean>(false);

  readonly alGuardar = output<ResultadoSolicitudCambio>();
  readonly alCancelar = output<void>();

  protected readonly esDesktop = this.viewport.esDesktop;

  protected readonly formulario: FormularioCambioVista = crearFormularioCambio(this.fb);
  protected readonly formGenerales = this.formulario.generales;
  protected readonly formImpacto = this.formulario.impacto;
  protected readonly formReversa = this.formulario.reversa;
  protected readonly form = this.fb.group({
    generales: this.formGenerales,
    impacto: this.formImpacto,
    reversa: this.formReversa,
  });

  private readonly valorImpacto = toSignal(this.formImpacto.valueChanges, {
    initialValue: this.formImpacto.getRawValue(),
  });
  private readonly valorGenerales = toSignal(this.formGenerales.valueChanges, {
    initialValue: this.formGenerales.getRawValue(),
  });

  protected readonly requiereContinuidad = computed(() => {
    const nivel = this.valorImpacto().nivel;
    return nivel === 'ALTO' || nivel === 'CRITICO';
  });

  protected readonly duracionActual = computed(() =>
    duracionMinutos(
      this.valorGenerales().horarioInicio ?? '',
      this.valorGenerales().horarioFin ?? '',
    ),
  );

  protected readonly PASOS = PASOS;
  protected readonly pasoActivo = signal<string>('generales');
  protected readonly intentado = signal(false);
  protected readonly errores = signal<readonly ErrorFormulario[]>([]);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly mostrarDescarte = signal(false);

  protected readonly titulo = computed(() =>
    this.solicitud()
      ? `Editar solicitud ${this.solicitud()?.codigo ?? ''}`
      : 'Nueva solicitud de cambio técnico',
  );

  ngOnInit(): void {
    const detalle = this.solicitud();
    if (detalle) {
      completarFormularioCambio(this.formulario, detalle);
    }
    this.form.markAsPristine();
  }

  protected anterior(): void {
    const indice = PASOS.findIndex((paso) => paso.id === this.pasoActivo());
    if (indice > 0) {
      this.pasoActivo.set(PASOS[indice - 1].id);
    }
  }

  protected siguiente(): void {
    const indice = PASOS.findIndex((paso) => paso.id === this.pasoActivo());
    if (indice >= 0 && indice < PASOS.length - 1) {
      this.pasoActivo.set(PASOS[indice + 1].id);
    }
  }

  protected guardar(enviarAEvaluacion: boolean): void {
    this.intentado.set(true);
    this.errorServidor.set(null);
    this.form.markAllAsTouched();

    const problemas = this.recolectarErrores(enviarAEvaluacion);
    this.errores.set(problemas);

    if (problemas.length > 0) {
      const primero = problemas[0];
      this.pasoActivo.set(PASOS.at(primero.paso)?.id ?? 'generales');
      this.enfocar(primero.campoId);
      return;
    }

    this.alGuardar.emit({
      formulario: aCambioFormulario(this.formulario),
      enviarAEvaluacion,
    });
  }

  protected solicitarCierre(): void {
    if (this.form.dirty) {
      this.mostrarDescarte.set(true);
      return;
    }
    this.alCancelar.emit();
  }

  protected confirmarDescarte(): void {
    this.mostrarDescarte.set(false);
    this.alCancelar.emit();
  }

  /** Aplica un error de servidor (409/400) al campo correspondiente. */
  aplicarErrorServidor(error: unknown): void {
    const cuerpo = (error as { error?: { mensaje?: string; campo?: string } })?.error;
    const mensaje = cuerpo?.mensaje ?? 'No se pudo guardar la solicitud de cambio.';
    this.errorServidor.set(mensaje);

    const nombre = cuerpo?.campo?.split('.').pop();
    if (!nombre) {
      return;
    }

    const grupos: readonly AbstractControl[] = [
      this.formGenerales,
      this.formImpacto,
      this.formReversa,
    ];
    const grupo = grupos.find((candidato) => candidato.get(nombre));
    const control = grupo?.get(nombre);
    if (!grupo || !control) {
      return;
    }

    control.setErrors({ ...(control.errors ?? {}), servidor: mensaje });
    control.markAsTouched();

    const indice = grupo === this.formGenerales ? 0 : grupo === this.formImpacto ? 1 : 2;
    this.pasoActivo.set(PASOS.at(indice)?.id ?? 'generales');
    this.enfocar(PASOS.at(indice)?.campoId ?? '');
  }

  private recolectarErrores(enviarAEvaluacion: boolean): readonly ErrorFormulario[] {
    const problemas: ErrorFormulario[] = [];
    const generales = this.formGenerales.getRawValue();

    if (this.formGenerales.controls.titulo.invalid) {
      problemas.push({ paso: 0, mensaje: MENSAJES_CAMBIO.V1, campoId: 'cambio-titulo' });
    }
    if (this.formGenerales.controls.justificacion.invalid) {
      problemas.push({ paso: 0, mensaje: MENSAJES_CAMBIO.V2, campoId: 'cambio-justificacion' });
    }

    const errorHorario = evaluarHorario({
      inicioIso: generales.horarioInicio,
      finIso: generales.horarioFin,
      tipo: generales.tipo,
      nivel: this.formImpacto.controls.nivel.value,
      requiereHorario: enviarAEvaluacion,
      ahoraMs: Date.now(),
    });
    if (errorHorario) {
      let mensaje: string = MENSAJES_CAMBIO.V4;
      if (errorHorario['horarioRequerido']) {
        mensaje = MENSAJES_CAMBIO.V6;
      } else if (errorHorario['inicioNoFuturo']) {
        mensaje = MENSAJES_CAMBIO.V5;
      } else if (errorHorario['horarioCriticoDiurno']) {
        mensaje = MENSAJES_CAMBIO.V10;
      }
      problemas.push({ paso: 0, mensaje, campoId: 'cambio-horario-inicio' });
    }

    const impacto = this.formImpacto.getRawValue();
    if (impacto.idsAreasAfectadas.length === 0) {
      problemas.push({ paso: 1, mensaje: MENSAJES_CAMBIO.V3, campoId: '' });
    }
    if (evaluarInterrupcion(impacto.requiereInterrupcion, impacto.minutosInterrupcion)) {
      problemas.push({
        paso: 1,
        mensaje: MENSAJES_CAMBIO.V7,
        campoId: 'cambio-minutos-interrupcion',
      });
    }

    const reversa = this.formReversa.getRawValue();
    if (evaluarPlanReversa(reversa.reversaCriterio, reversa.reversaPasos, reversa.reversaMinutos)) {
      problemas.push({
        paso: 2,
        mensaje: MENSAJES_CAMBIO.V8,
        campoId: 'cambio-reversa-criterio',
      });
    }
    if (evaluarContinuidad(impacto.nivel, reversa.planContinuidad)) {
      problemas.push({
        paso: 2,
        mensaje: MENSAJES_CAMBIO.V9,
        campoId: 'cambio-plan-continuidad',
      });
    }

    return problemas;
  }

  private enfocar(campoId: string): void {
    if (!campoId) {
      return;
    }
    setTimeout(() => {
      const elemento = document.getElementById(campoId);
      elemento?.focus();
    });
  }
}
