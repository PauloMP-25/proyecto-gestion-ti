import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
  effect,
} from '@angular/core';
import { EquiposStore } from '../../estado/equipos.store';
import { EquipoItem } from '../../modelos/equipos.model';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BarraPestanasComponent, Pestana } from '../../../../../compartido/ui/moleculas/barra-pestanas/barra-pestanas.component';
import { EquiposTablaComponent } from './componentes/equipos-tabla/equipos-tabla.component';
import { EquiposFiltrosComponent } from './componentes/equipos-filtros/equipos-filtros.component';
import { MapaRedComponent } from '../../componentes/mapa-red/mapa-red.component';
import { DialogoEquipoComponent } from '../../componentes/dialogo-equipo/dialogo-equipo.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

export type PestanaInventario = 'equipos' | 'red';

@Component({
  selector: 'app-equipos-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BarraPestanasComponent,
    EquiposTablaComponent,
    EquiposFiltrosComponent,
    MapaRedComponent,
    DialogoEquipoComponent,
    DialogoConfirmacionComponent,
  ],
  templateUrl: './equipos-lista.page.html',
  styleUrl: './equipos-lista.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposListaPage implements OnInit {
  readonly store = inject(EquiposStore);
  private readonly areasApi = inject(AreasApi);

  readonly pestanaActiva = signal<string>('equipos');

  // Filtros
  readonly areas = signal<AreaResumen[]>([]);
  readonly busquedaTexto = signal<string>('');
  readonly filtroArea = signal<number | null>(null);
  readonly filtroTipo = signal<string | null>(null);
  readonly filtroSinIp = signal<boolean>(false);
  readonly filtroAreaRed = signal<number | null>(null);

  // Modales
  readonly modalAbierto = signal<boolean>(false);
  readonly equipoSeleccionado = signal<EquipoItem | null>(null);
  readonly confirmacionEstadoAbierta = signal<boolean>(false);
  readonly equipoParaConfirmar = signal<EquipoItem | null>(null);

  readonly conteoIps = computed(() =>
    this.store.equipos().filter((eq) => !!eq.ipVigente).length
  );

  readonly pestanas = computed<Pestana[]>(() => [
    {
      id: 'equipos',
      etiqueta: 'Equipos hospitalarios',
      icono: 'devices',
      conteo: this.store.total(),
    },
    {
      id: 'red',
      etiqueta: 'Mapa de red por áreas',
      icono: 'lan',
      conteo: `${this.conteoIps()} con IP`,
      conteoDestacado: true,
    },
  ]);

  constructor() {
    // Sincronizar filtros reactivamente
    effect(() => {
      const buscar = this.busquedaTexto();
      const idArea = this.filtroArea();
      const tipo = this.filtroTipo();
      const sinIp = this.filtroSinIp() || undefined;

      this.store.cargar({
        buscar,
        idArea,
        tipo,
        sinIp,
        pagina: 0,
      });
    });
  }

  ngOnInit(): void {
    this.cargarAreas();
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (areas) => this.areas.set(areas),
    });
  }

  abrirModalNuevo(): void {
    this.equipoSeleccionado.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(equipo: EquipoItem): void {
    this.equipoSeleccionado.set(equipo);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.equipoSeleccionado.set(null);
  }

  alGuardarEquipo(_guardado: EquipoItem): void {
    this.cerrarModal();
  }

  solicitarCambioEstado(equipo: EquipoItem): void {
    this.equipoParaConfirmar.set(equipo);
    this.confirmacionEstadoAbierta.set(true);
  }

  confirmarCambioEstado(): void {
    const eq = this.equipoParaConfirmar();
    if (!eq) return;

    const nuevoEstado =
      eq.estado === 'EN_SERVICIO' ? 'EN_MANTENIMIENTO' : 'EN_SERVICIO';

    this.store.cambiarEstado(eq.id, nuevoEstado).subscribe({
      next: () => this.cerrarConfirmacionEstado(),
      error: () => this.cerrarConfirmacionEstado(),
    });
  }

  cerrarConfirmacionEstado(): void {
    this.confirmacionEstadoAbierta.set(false);
    this.equipoParaConfirmar.set(null);
  }
}
