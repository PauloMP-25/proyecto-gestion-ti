import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral.component';

@Component({
  selector: 'app-maquetacion-principal',
  imports: [RouterOutlet, MenuLateralComponent],
  templateUrl: './maquetacion-principal.component.html',
  styleUrl: './maquetacion-principal.component.scss',
})
export class MaquetacionPrincipalComponent {

}
