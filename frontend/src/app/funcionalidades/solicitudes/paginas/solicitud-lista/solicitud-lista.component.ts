import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-solicitud-lista',
  standalone: true,
  imports: [],
  templateUrl: './solicitud-lista.component.html',
  styleUrl: './solicitud-lista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudListaComponent {}
