import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-incidente-crear',
  standalone: true,
  imports: [],
  templateUrl: './incidente-crear.component.html',
  styleUrl: './incidente-crear.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncidenteCrearComponent {}
