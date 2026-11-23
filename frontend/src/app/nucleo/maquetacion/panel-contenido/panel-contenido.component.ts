import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-panel-contenido',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './panel-contenido.component.html',
  styleUrl: './panel-contenido.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelContenidoComponent {}
