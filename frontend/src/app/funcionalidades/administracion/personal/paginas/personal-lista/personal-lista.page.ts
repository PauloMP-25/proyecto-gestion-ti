import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { PersonalStore } from '../../estado/personal.store';
import {
  PersonalItem,
} from '../../modelos/personal.model';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { PersonalTablaComponent } from './componentes/personal-tabla/personal-tabla.component';
import { PersonalFiltrosComponent } from './componentes/personal-filtros/personal-filtros.component';
import { DialogoPersonalComponent } from '../../componentes/dialogo-personal/dialogo-personal.component';
import { DialogoContrasenaTemporalComponent } from '../../componentes/dialogo-contrasena-temporal/dialogo-contrasena-temporal.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';

@Component({
  selector: 'app-personal-lista-page',
  standalone: true,
  imports: [
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    PersonalTablaComponent,
    PersonalFiltrosComponent,
    DialogoPersonalComponent,
    DialogoContrasenaTemporalComponent,
    DialogoConfirmacionComponent,
  ],
  templateUrl: './personal-lista.page.html',
  styleUrl: './personal-lista.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalListaPage implements OnInit {
  readonly store = inject(PersonalStore);
  private readonly areasApi = inject(AreasApi);

  readonly areas = signal<AreaResumen[]>([]);
  readonly busquedaTexto = signal<string>('');
  readonly filtroArea = signal<number | null>(null);
  readonly filtroRol = signal<string | null>(null);

  readonly modalPersonalAbierto = signal<boolean>(false);
  readonly personalParaEditar = signal<PersonalItem | null>(null);

  readonly usuarioClaveTemporal = signal<string>('');
  readonly claveTemporalGenerada = signal<string | null>(null);

  readonly itemParaToggle = signal<PersonalItem | null>(null);
  readonly itemParaRestablecer = signal<PersonalItem | null>(null);

  ngOnInit(): void {
    this.store.cargar();
    this.cargarAreas();
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (lista) => this.areas.set(lista),
    });
  }

  alCambiarBusqueda(texto: string): void {
    this.busquedaTexto.set(texto);
    this.store.cargar({ busqueda: texto, pagina: 0 });
  }

  alCambiarArea(idArea: number | null): void {
    this.filtroArea.set(idArea);
    this.store.cargar({ idArea, pagina: 0 });
  }

  alCambiarRol(rol: string | null): void {
    this.filtroRol.set(rol);
    this.store.cargar({ rol, pagina: 0 });
  }

  abrirModalNuevo(): void {
    this.personalParaEditar.set(null);
    this.modalPersonalAbierto.set(true);
  }

  abrirModalEditar(item: PersonalItem): void {
    this.personalParaEditar.set(item);
    this.modalPersonalAbierto.set(true);
  }

  alGuardarPersonal(resultado: {
    personal: PersonalItem;
    contrasenaTemporal?: string;
  }): void {
    this.modalPersonalAbierto.set(false);
    if (resultado.contrasenaTemporal) {
      this.usuarioClaveTemporal.set(resultado.personal.nombreUsuario ?? '');
      this.claveTemporalGenerada.set(resultado.contrasenaTemporal);
    }
  }

  confirmarToggleActivo(item: PersonalItem): void {
    this.itemParaToggle.set(item);
  }

  ejecutarToggleActivo(): void {
    const item = this.itemParaToggle();
    if (!item) return;

    this.store.toggleActivo(item.id).subscribe({
      next: () => this.itemParaToggle.set(null),
      error: () => this.itemParaToggle.set(null),
    });
  }

  confirmarRestablecer(item: PersonalItem): void {
    this.itemParaRestablecer.set(item);
  }

  ejecutarRestablecerContrasena(): void {
    const item = this.itemParaRestablecer();
    if (!item) return;

    this.store.restablecerContrasena(item.id).subscribe({
      next: (res) => {
        this.itemParaRestablecer.set(null);
        this.usuarioClaveTemporal.set(item.nombreUsuario ?? '');
        this.claveTemporalGenerada.set(res.contrasenaTemporal);
      },
      error: () => this.itemParaRestablecer.set(null),
    });
  }
}
