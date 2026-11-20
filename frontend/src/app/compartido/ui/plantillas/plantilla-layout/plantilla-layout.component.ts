import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-plantilla-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plantilla-layout.component.html',
  styleUrl: './plantilla-layout.component.scss',
})
export class PlantillaLayoutComponent {}
