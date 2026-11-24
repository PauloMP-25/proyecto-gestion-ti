import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChipFiltroComponent } from '../../../../../compartido/ui/atomos/chip-filtro/chip-filtro.component';
import { CategoriaGuia } from '../../modelos/guias.model';
import { CATEGORIAS_GUIA } from '../../utilidades/categorias-guia';

@Component({
  selector: 'app-chips-categorias',
  standalone: true,
  imports: [ChipFiltroComponent],
  templateUrl: './chips-categorias.component.html',
  styleUrl: './chips-categorias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChipsCategoriasComponent {
  readonly conteo = input.required<Record<CategoriaGuia, number>>();
  readonly activa = input<CategoriaGuia | null>(null);

  readonly alSeleccionar = output<CategoriaGuia | null>();

  protected readonly CATEGORIAS_GUIA = CATEGORIAS_GUIA;

  protected readonly total = computed(() =>
    CATEGORIAS_GUIA.reduce((suma, categoria) => suma + this.conteo()[categoria.clave], 0),
  );

  protected conteoCategoria(categoria: CategoriaGuia): number {
    return this.conteo()[categoria];
  }
}
