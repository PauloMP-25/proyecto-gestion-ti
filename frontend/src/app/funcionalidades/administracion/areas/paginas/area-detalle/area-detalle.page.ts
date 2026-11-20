import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AreasStore } from '../../estado/areas.store';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BarraPestanasComponent, Pestana } from '../../../../../compartido/ui/moleculas/barra-pestanas/barra-pestanas.component';
import { FichaAreaComponent } from './componentes/ficha-area/ficha-area.component';
import { AreaPersonalAsignadoComponent } from './componentes/area-personal-asignado/area-personal-asignado.component';
import { AreaEquiposAsignadosComponent } from './componentes/area-equipos-asignados/area-equipos-asignados.component';
import { DialogoAreaComponent } from '../../componentes/dialogo-area/dialogo-area.component';
import { DialogoPersonalComponent } from '../../../personal/componentes/dialogo-personal/dialogo-personal.component';
import { DialogoEquipoComponent } from '../../../equipos/componentes/dialogo-equipo/dialogo-equipo.component';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { PersonalApi } from '../../../personal/servicios/personal.api';
import { PersonalItem } from '../../../personal/modelos/personal.model';

@Component({
  selector: 'app-area-detalle-page',
  standalone: true,
  imports: [
    FormsModule,
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BarraPestanasComponent,
    FichaAreaComponent,
    AreaPersonalAsignadoComponent,
    AreaEquiposAsignadosComponent,
    DialogoAreaComponent,
    DialogoPersonalComponent,
    DialogoEquipoComponent,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  templateUrl: './area-detalle.page.html',
  styleUrl: './area-detalle.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreaDetallePage implements OnInit {
  readonly store = inject(AreasStore);
  private readonly route = inject(ActivatedRoute);
  private readonly personalApi = inject(PersonalApi);

  readonly pestanaActiva = signal<string>('personal');

  readonly modalEditarAbierto = signal<boolean>(false);
  readonly modalPersonalAbierto = signal<boolean>(false);
  readonly modalEquipoAbierto = signal<boolean>(false);
  readonly tipoEquipoParaCrear = signal<string>('COMPUTADORA');

  readonly modalReasignarAbierto = signal<boolean>(false);
  readonly personalParaReasignar = signal<PersonalItem[]>([]);
  readonly idColaboradorParaReasignar = signal<number | null>(null);
  readonly reasignando = signal<boolean>(false);

  readonly pestanas = computed<Pestana[]>(() => [
    {
      id: 'personal',
      etiqueta: 'Personal adscrito',
      icono: 'group',
      conteo: this.store.personal().length,
    },
    {
      id: 'computadoras',
      etiqueta: 'Computadoras',
      icono: 'computer',
      conteo: this.store.computadoras().length,
    },
    {
      id: 'impresoras',
      etiqueta: 'Impresoras de red',
      icono: 'print',
      conteo: this.store.impresoras().length,
    },
  ]);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      if (!isNaN(id)) {
        this.store.obtenerDetalle(id);
      }
    }
  }

  abrirModalEditar(): void {
    this.modalEditarAbierto.set(true);
  }

  abrirModalRegistrarPersonal(): void {
    this.modalPersonalAbierto.set(true);
  }

  alGuardarPersonal(idArea: number): void {
    this.modalPersonalAbierto.set(false);
    this.store.obtenerDetalle(idArea);
  }

  abrirModalRegistrarEquipo(tipo: string): void {
    this.tipoEquipoParaCrear.set(tipo);
    this.modalEquipoAbierto.set(true);
  }

  alGuardarEquipo(idArea: number): void {
    this.modalEquipoAbierto.set(false);
    this.store.obtenerDetalle(idArea);
  }

  abrirModalReasignarPersonal(idAreaActual: number): void {
    this.idColaboradorParaReasignar.set(null);
    this.reasignando.set(false);
    this.personalApi.listar({}).subscribe({
      next: (pag) => {
        const deOtrasAreas = pag.contenido.filter(
          (p) => p.activo && p.idArea !== idAreaActual
        );
        this.personalParaReasignar.set(deOtrasAreas);
        this.modalReasignarAbierto.set(true);
      },
    });
  }

  cerrarModalReasignar(): void {
    this.modalReasignarAbierto.set(false);
    this.idColaboradorParaReasignar.set(null);
  }

  confirmarReasignacion(idAreaActual: number): void {
    const idUsuario = this.idColaboradorParaReasignar();
    if (!idUsuario) return;

    this.reasignando.set(true);
    this.store.reasignarPersonal(idAreaActual, idUsuario).subscribe({
      next: () => {
        this.reasignando.set(false);
        this.cerrarModalReasignar();
      },
      error: () => {
        this.reasignando.set(false);
      },
    });
  }
}
