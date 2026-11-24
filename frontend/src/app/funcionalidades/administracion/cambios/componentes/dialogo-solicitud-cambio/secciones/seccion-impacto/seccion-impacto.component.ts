import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { AlertaEnLineaComponent } from '../../../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { IconoComponent } from '../../../../../../../compartido/ui/atomos/icono/icono.component';
import { AreaAfectada, ImpactoAsistencial } from '../../../../modelos/cambios.model';
import { PRESENTACION_IMPACTO } from '../../../../utilidades/etiquetas-cambio';
import { sugiereImpactoCritico } from '../../../../utilidades/validadores-cambio';
import { MENSAJES_CAMBIO } from '../../../../utilidades/mensajes-cambio';
import { ImpactoForm } from '../../formulario-cambio';

interface OpcionNivel {
  readonly valor: ImpactoAsistencial;
  readonly texto: string;
  readonly ayuda: string;
  readonly icono: string;
  readonly tono: 'neutro' | 'info' | 'aviso' | 'peligro';
}

const TONO_NIVEL: Record<ImpactoAsistencial, 'neutro' | 'info' | 'aviso' | 'peligro'> = {
  BAJO: 'neutro',
  MEDIO: 'info',
  ALTO: 'aviso',
  CRITICO: 'peligro',
};

const NIVELES: readonly OpcionNivel[] = (
  ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'] as const
).map((valor) => ({
  valor,
  texto: PRESENTACION_IMPACTO[valor].texto,
  ayuda: PRESENTACION_IMPACTO[valor].ayuda,
  icono: PRESENTACION_IMPACTO[valor].icono,
  tono: TONO_NIVEL[valor],
}));

@Component({
  selector: 'app-seccion-impacto',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CampoFormularioComponent,
    AlertaEnLineaComponent,
    IconoComponent,
  ],
  templateUrl: './seccion-impacto.component.html',
  styleUrl: './seccion-impacto.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionImpactoComponent {
  readonly form = input.required<FormGroup<ImpactoForm>>();
  readonly areas = input<readonly AreaAfectada[]>([]);
  readonly intentado = input<boolean>(false);

  protected readonly NIVELES = NIVELES;

  protected readonly servicioEntrada = new FormControl('', { nonNullable: true });

  protected readonly areasOrdenadas = computed(() =>
    [...this.areas()].sort(
      (a, b) => Number(b.esCritica) - Number(a.esCritica) || a.nombre.localeCompare(b.nombre),
    ),
  );

  protected sugerenciaCritica(): boolean {
    const seleccionadas = this.form().controls.idsAreasAfectadas.value;
    const areasSeleccionadas = this.areas().filter((area) =>
      seleccionadas.includes(area.idArea),
    );
    return sugiereImpactoCritico(areasSeleccionadas, this.form().controls.nivel.value);
  }

  protected requiereInterrupcion(): boolean {
    return this.form().controls.requiereInterrupcion.value;
  }

  protected seleccionada(idArea: number): boolean {
    return this.form().controls.idsAreasAfectadas.value.includes(idArea);
  }

  protected alternarArea(idArea: number): void {
    const control = this.form().controls.idsAreasAfectadas;
    const actual = control.value;
    control.setValue(
      actual.includes(idArea) ? actual.filter((id) => id !== idArea) : [...actual, idArea],
    );
  }

  protected mensajeAreas(): string | null {
    if (!this.intentado()) {
      return null;
    }
    return this.form().controls.idsAreasAfectadas.value.length === 0
      ? MENSAJES_CAMBIO.V3
      : null;
  }

  protected mensajeInterrupcion(): string | null {
    if (!this.intentado()) {
      return null;
    }
    return this.form().hasError('minutosInterrupcionRequeridos')
      ? MENSAJES_CAMBIO.V7
      : null;
  }

  protected servicios(): readonly string[] {
    return this.form().controls.serviciosAfectados.value;
  }

  protected agregarServicio(evento: Event): void {
    evento.preventDefault();
    const valor = this.servicioEntrada.value.trim();
    if (!valor) {
      return;
    }
    const actual = this.form().controls.serviciosAfectados.value;
    if (!actual.includes(valor)) {
      this.form().controls.serviciosAfectados.setValue([...actual, valor]);
    }
    this.servicioEntrada.setValue('');
  }

  protected quitarServicio(valor: string): void {
    const actual = this.form().controls.serviciosAfectados.value;
    this.form().controls.serviciosAfectados.setValue(actual.filter((item) => item !== valor));
  }
}
