import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { MarcaHospitalComponent } from '../../../../../compartido/ui/moleculas/marca-hospital/marca-hospital.component';

@Component({
  selector: 'app-cabecera-menu-movil',
  standalone: true,
  imports: [BotonIconoComponent, MarcaHospitalComponent],
  templateUrl: './cabecera-menu-movil.component.html',
  styleUrl: './cabecera-menu-movil.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraMenuMovilComponent {
  readonly alCerrar = output<void>();
}
