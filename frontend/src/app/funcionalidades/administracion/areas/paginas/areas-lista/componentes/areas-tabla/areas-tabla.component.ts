import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { AreaResumen } from '../../../../modelos/areas.model';
import { ColumnaTabla, TablaAdministracionComponent } from '../../../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';

@Component({
  selector: 'app-areas-tabla',
  standalone: true,
  imports: [TablaAdministracionComponent],
  templateUrl: './areas-tabla.component.html',
  styleUrl: './areas-tabla.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AreasTablaComponent {
  readonly areas = input.required<readonly AreaResumen[] | AreaResumen[]>();
  readonly cargando = input<boolean>(false);
  readonly vacio = input<boolean>(false);

  readonly busqueda = model<string>('');

  readonly alVerDetalle = output<number>();
  readonly alEditar = output<AreaResumen>();
  readonly alCambiarEstado = output<AreaResumen>();
  readonly alEliminar = output<AreaResumen>();
  readonly alRegistrar = output<void>();

  readonly columnas: readonly ColumnaTabla[] = [
    { campo: 'nombre', titulo: 'Área' },
    { campo: 'piso', titulo: 'Piso' },
    { campo: 'prioridad', titulo: 'Prioridad' },
    { campo: 'anexo', titulo: 'Anexo' },
    { campo: 'encargado', titulo: 'Encargado(a)' },
    { campo: 'equipos', titulo: 'Equipos (PC · Imp)' },
  ];
}
