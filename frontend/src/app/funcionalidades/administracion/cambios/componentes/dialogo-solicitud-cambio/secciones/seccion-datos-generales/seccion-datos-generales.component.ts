import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { BotonComponent } from '../../../../../../../compartido/ui/atomos/boton/boton.component';
import { BotonIconoComponent } from '../../../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { IconoComponent } from '../../../../../../../compartido/ui/atomos/icono/icono.component';
import {
  CategoriaCambio,
  TipoCambio,
} from '../../../../modelos/cambios.model';
import { ETIQUETA_CATEGORIA } from '../../../../utilidades/etiquetas-cambio';
import { evaluarHorario } from '../../../../utilidades/validadores-cambio';
import { MENSAJES_CAMBIO } from '../../../../utilidades/mensajes-cambio';
import {
  GeneralesForm,
  crearPaso,
  duracionMinutos,
} from '../../formulario-cambio';

interface OpcionTipo {
  readonly valor: TipoCambio;
  readonly titulo: string;
  readonly descripcion: string;
  readonly icono: string;
}

const TIPOS: readonly OpcionTipo[] = [
  {
    valor: 'RUTINARIO',
    titulo: 'Rutinario',
    descripcion: 'Intervención habitual y de bajo riesgo.',
    icono: 'sync',
  },
  {
    valor: 'PROGRAMADO',
    titulo: 'Programado',
    descripcion: 'Intervención planificada en un horario acordado.',
    icono: 'calendar_today',
  },
  {
    valor: 'URGENTE',
    titulo: 'Urgente',
    descripcion: 'Debe aplicarse de inmediato porque afecta la atención.',
    icono: 'notification_important',
  },
];

const CATEGORIAS: readonly CategoriaCambio[] = [
  'SISTEMA_CLINICO',
  'RED',
  'SERVIDOR',
  'EQUIPO_USUARIO',
  'SEGURIDAD',
];

const OPCIONES_CATEGORIA = CATEGORIAS.map((categoria) => ({
  valor: categoria,
  etiqueta: ETIQUETA_CATEGORIA[categoria],
}));

@Component({
  selector: 'app-seccion-datos-generales',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CampoFormularioComponent,
    BotonComponent,
    BotonIconoComponent,
    IconoComponent,
  ],
  templateUrl: './seccion-datos-generales.component.html',
  styleUrl: './seccion-datos-generales.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionDatosGeneralesComponent {
  readonly form = input.required<FormGroup<GeneralesForm>>();
  readonly intentado = input<boolean>(false);

  protected readonly TIPOS = TIPOS;
  protected readonly OPCIONES_CATEGORIA = OPCIONES_CATEGORIA;

  protected readonly equipoEntrada = new FormControl('', { nonNullable: true });

  protected readonly pasos = computed(() => this.form().controls.pasos);

  protected mensajeTitulo(): string | null {
    const control = this.form().controls.titulo;
    if (!(control.touched || this.intentado()) || control.valid) {
      return null;
    }
    if (control.hasError('maxlength')) {
      return 'El título no debe superar los 120 caracteres.';
    }
    return MENSAJES_CAMBIO.V1;
  }

  protected mensajeJustificacion(): string | null {
    const control = this.form().controls.justificacion;
    if (!(control.touched || this.intentado()) || control.valid) {
      return null;
    }
    return MENSAJES_CAMBIO.V2;
  }

  protected mensajeHorario(): string | null {
    const formulario = this.form();
    const inicio = formulario.controls.horarioInicio;
    const fin = formulario.controls.horarioFin;
    if (!(inicio.touched || fin.touched || this.intentado())) {
      return null;
    }
    const errores = evaluarHorario({
      inicioIso: inicio.value,
      finIso: fin.value,
      tipo: formulario.controls.tipo.value,
      nivel: 'MEDIO',
      requiereHorario: false,
      ahoraMs: Date.now(),
    });
    if (!errores) {
      return null;
    }
    if (errores['finNoPosterior']) {
      return MENSAJES_CAMBIO.V4;
    }
    if (errores['inicioNoFuturo']) {
      return MENSAJES_CAMBIO.V5;
    }
    return null;
  }

  protected duracionTexto(): string | null {
    const formulario = this.form();
    const minutos = duracionMinutos(
      formulario.controls.horarioInicio.value,
      formulario.controls.horarioFin.value,
    );
    if (minutos === null) {
      return null;
    }
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return horas > 0
      ? `Duración: ${horas} h ${String(resto).padStart(2, '0')} min`
      : `Duración: ${resto} min`;
  }

  protected equipos(): readonly string[] {
    return this.form().controls.equiposAfectados.value;
  }

  protected agregarEquipo(evento: Event): void {
    evento.preventDefault();
    const valor = this.equipoEntrada.value.trim();
    if (!valor) {
      return;
    }
    const actual = this.form().controls.equiposAfectados.value;
    if (!actual.includes(valor)) {
      this.form().controls.equiposAfectados.setValue([...actual, valor]);
    }
    this.equipoEntrada.setValue('');
  }

  protected quitarEquipo(valor: string): void {
    const actual = this.form().controls.equiposAfectados.value;
    this.form().controls.equiposAfectados.setValue(actual.filter((item) => item !== valor));
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
