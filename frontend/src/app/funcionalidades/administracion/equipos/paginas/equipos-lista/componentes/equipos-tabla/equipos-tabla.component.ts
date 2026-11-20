import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { EquipoItem } from '../../../../modelos/equipos.model';
import { ColumnaTabla, TablaAdministracionComponent } from '../../../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { EtiquetaIpComponent } from '../../../../../../../compartido/ui/atomos/etiqueta-ip/etiqueta-ip.component';
import { obtenerEtiquetaEstadoEquipo, obtenerEtiquetaTipoEquipo } from '../../../../utilidades/etiquetas-equipo';

@Component({
  selector: 'app-equipos-tabla',
  standalone: true,
  imports: [TablaAdministracionComponent, EtiquetaIpComponent],
  templateUrl: './equipos-tabla.component.html',
  styleUrl: './equipos-tabla.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposTablaComponent {
  readonly equipos = input.required<readonly EquipoItem[] | EquipoItem[]>();
  readonly cargando = input<boolean>(false);
  readonly vacio = input<boolean>(false);

  readonly busqueda = model<string>('');

  readonly alEditar = output<EquipoItem>();
  readonly alCambiarEstado = output<EquipoItem>();
  readonly alRegistrar = output<void>();

  readonly columnas: ColumnaTabla[] = [
    { campo: 'codigoInventario', titulo: 'Código / Modelo' },
    { campo: 'tipo', titulo: 'Tipo' },
    { campo: 'nombreArea', titulo: 'Área / Ubicación' },
    { campo: 'ipVigente', titulo: 'IP estática' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'acciones', titulo: 'Acciones' },
  ];

  etiquetaTipo(tipo: string): string {
    return obtenerEtiquetaTipoEquipo(tipo);
  }

  etiquetaEstado(estado: string): string {
    return obtenerEtiquetaEstadoEquipo(estado);
  }
}
