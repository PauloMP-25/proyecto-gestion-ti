import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextoCliente } from '../../../modelos/ticket.dto';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-contexto-equipo',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './contexto-equipo.component.html',
  styleUrl: './contexto-equipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextoEquipoComponent {
  readonly contexto = input.required<ContextoCliente>();
}