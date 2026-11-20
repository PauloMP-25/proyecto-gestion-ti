import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incidente-formulario',
  standalone: true,
  imports: [],
  templateUrl: './incidente-formulario.component.html',
  styleUrl: './incidente-formulario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteFormularioComponent {}
