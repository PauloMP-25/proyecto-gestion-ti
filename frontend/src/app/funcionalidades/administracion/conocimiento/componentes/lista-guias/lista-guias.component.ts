import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EsqueletoComponent } from '../../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { EstadoVacioComponent } from '../../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { GuiaVista } from '../../modelos/guias.model';
import { TarjetaGuiaComponent } from '../tarjeta-guia/tarjeta-guia.component';

@Component({
  selector: 'app-lista-guias',
  standalone: true,
  imports: [
    EsqueletoComponent,
    AlertaEnLineaComponent,
    EstadoVacioComponent,
    BotonComponent,
    TarjetaGuiaComponent,
  ],
  templateUrl: './lista-guias.component.html',
  styleUrl: './lista-guias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaGuiasComponent {
  readonly guias = input.required<readonly GuiaVista[]>();
  readonly cargando = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly textoBuscado = input<string>('');

  readonly alAbrir = output<number>();
  readonly alEditar = output<GuiaVista>();
  readonly alEliminar = output<GuiaVista>();
  readonly alReintentar = output<void>();
  readonly alLimpiar = output<void>();
}
