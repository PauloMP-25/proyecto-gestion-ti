import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-base-conocimiento-lista',
  standalone: true,
  imports: [],
  templateUrl: './base-conocimiento-lista.component.html',
  styleUrl: './base-conocimiento-lista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseConocimientoListaComponent {}
