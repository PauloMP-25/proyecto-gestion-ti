import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { BarraFiltrosComponent } from '../../../../../compartido/ui/organismos/barra-filtros/barra-filtros.component';
import {
  CampoFiltroComponent,
  OpcionFiltro,
} from '../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';
import { ViewportService } from '../../../../../nucleo/servicios/viewport.service';
import {
  AmbitoGuia,
  CategoriaGuia,
  ETIQUETA_AMBITO,
  FiltroGuias,
} from '../../modelos/guias.model';
import { ChipsCategoriasComponent } from '../chips-categorias/chips-categorias.component';

const OPCIONES_AMBITO: readonly OpcionFiltro<AmbitoGuia>[] = (
  ['TODOS', 'PUBLICO', 'INTERNO'] as const
).map((ambito) => ({ valor: ambito, etiqueta: ETIQUETA_AMBITO[ambito] }));

@Component({
  selector: 'app-buscador-guias',
  standalone: true,
  imports: [BarraFiltrosComponent, CampoFiltroComponent, ChipsCategoriasComponent],
  templateUrl: './buscador-guias.component.html',
  styleUrl: './buscador-guias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscadorGuiasComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly viewport = inject(ViewportService);

  readonly filtro = input.required<FiltroGuias>();
  readonly conteoPorCategoria = input.required<Record<CategoriaGuia, number>>();
  readonly hayFiltros = input<boolean>(false);
  readonly totalResultados = input<number>(0);

  readonly alBuscar = output<string>();
  readonly alSeleccionarCategoria = output<CategoriaGuia | null>();
  readonly alSeleccionarAmbito = output<AmbitoGuia>();
  readonly alLimpiar = output<void>();

  protected readonly opcionesAmbito = OPCIONES_AMBITO;

  protected readonly filtrosActivos = computed(() => {
    const filtro = this.filtro();
    return (filtro.categoria ? 1 : 0) + (filtro.ambito !== 'TODOS' ? 1 : 0);
  });

  protected seleccionarAmbito(valor: unknown): void {
    this.alSeleccionarAmbito.emit(valor as AmbitoGuia);
  }

  @HostListener('window:keydown', ['$event'])
  enfocarConAtajo(evento: KeyboardEvent): void {
    if (evento.key !== '/' || !this.viewport.esDesktop()) {
      return;
    }

    const activo = document.activeElement as HTMLElement | null;
    const escribiendo =
      activo !== null &&
      (activo.tagName === 'INPUT' ||
        activo.tagName === 'TEXTAREA' ||
        activo.tagName === 'SELECT' ||
        activo.isContentEditable);
    if (escribiendo) {
      return;
    }

    evento.preventDefault();
    this.host.nativeElement
      .querySelector<HTMLInputElement>('input[type="search"]')
      ?.focus();
  }
}
