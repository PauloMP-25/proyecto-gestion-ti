import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { PersonalItem } from '../../../../modelos/personal.model';
import { ColumnaTabla, TablaAdministracionComponent } from '../../../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { InsigniaGradoComponent } from '../../../../../../../compartido/ui/atomos/insignia-grado/insignia-grado.component';

@Component({
  selector: 'app-personal-tabla',
  standalone: true,
  imports: [TablaAdministracionComponent, InsigniaGradoComponent],
  templateUrl: './personal-tabla.component.html',
  styleUrl: './personal-tabla.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalTablaComponent {
  readonly personal = input.required<readonly PersonalItem[] | PersonalItem[]>();
  readonly cargando = input<boolean>(false);
  readonly vacio = input<boolean>(false);

  readonly busqueda = model<string>('');

  readonly alEditar = output<PersonalItem>();
  readonly alRestablecer = output<PersonalItem>();
  readonly alToggleActivo = output<PersonalItem>();
  readonly alRegistrar = output<void>();

  readonly columnas: readonly ColumnaTabla[] = [
    { campo: 'nombreVisible', titulo: 'Colaborador(a)' },
    { campo: 'nombreArea', titulo: 'Área hospitalaria' },
    { campo: 'nombreUsuario', titulo: 'Usuario' },
    { campo: 'correo', titulo: 'Correo' },
    { campo: 'rol', titulo: 'Perfil' },
    { campo: 'estado', titulo: 'Estado de cuenta' },
  ];
}
