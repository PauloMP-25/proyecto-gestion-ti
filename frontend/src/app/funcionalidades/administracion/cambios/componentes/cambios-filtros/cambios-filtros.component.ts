import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  CampoFiltroComponent,
  OpcionFiltro,
} from '../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';
import {
  ESTADOS_CAMBIO,
  EstadoCambio,
  FiltroCambios,
  ImpactoAsistencial,
  TipoCambio,
} from '../../modelos/cambios.model';
import {
  PRESENTACION_ESTADO,
  PRESENTACION_IMPACTO,
  PRESENTACION_TIPO,
} from '../../utilidades/etiquetas-cambio';

const IMPACTOS: readonly ImpactoAsistencial[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];
const TIPOS: readonly TipoCambio[] = ['RUTINARIO', 'PROGRAMADO', 'URGENTE'];

const OPCIONES_ESTADO: readonly OpcionFiltro[] = ESTADOS_CAMBIO.map((estado) => ({
  valor: estado,
  etiqueta: PRESENTACION_ESTADO[estado].texto,
}));

const OPCIONES_IMPACTO: readonly OpcionFiltro[] = IMPACTOS.map((impacto) => ({
  valor: impacto,
  etiqueta: PRESENTACION_IMPACTO[impacto].texto,
}));

const OPCIONES_TIPO: readonly OpcionFiltro[] = TIPOS.map((tipo) => ({
  valor: tipo,
  etiqueta: PRESENTACION_TIPO[tipo].texto,
}));

@Component({
  selector: 'app-cambios-filtros',
  standalone: true,
  imports: [CampoFiltroComponent],
  templateUrl: './cambios-filtros.component.html',
  styleUrl: './cambios-filtros.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosFiltrosComponent {
  readonly filtro = input.required<FiltroCambios>();

  readonly alCambiar = output<Partial<FiltroCambios>>();

  protected readonly OPCIONES_ESTADO = OPCIONES_ESTADO;
  protected readonly OPCIONES_IMPACTO = OPCIONES_IMPACTO;
  protected readonly OPCIONES_TIPO = OPCIONES_TIPO;

  cambiarEstado(valor: unknown): void {
    this.alCambiar.emit({ estado: valor as EstadoCambio | null });
  }

  cambiarImpacto(valor: unknown): void {
    this.alCambiar.emit({ impacto: valor as ImpactoAsistencial | null });
  }

  cambiarTipo(valor: unknown): void {
    this.alCambiar.emit({ tipo: valor as TipoCambio | null });
  }
}
