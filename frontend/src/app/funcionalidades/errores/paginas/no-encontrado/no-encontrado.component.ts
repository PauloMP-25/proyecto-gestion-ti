import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [],
  templateUrl: './no-encontrado.component.html',
  styleUrl: './no-encontrado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontradoComponent {}
