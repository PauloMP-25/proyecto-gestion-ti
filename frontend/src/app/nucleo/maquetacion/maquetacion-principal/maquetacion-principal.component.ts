import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BarraSuperiorComponent } from '../barra-superior/barra-superior.component';
import { MenuLateralComponent } from '../menu-lateral/menu-lateral.component';
import { PlantillaLayoutComponent } from '../../../compartido/ui/plantillas/plantilla-layout/plantilla-layout.component';

@Component({
  selector: 'app-maquetacion-principal',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BarraSuperiorComponent,
    MenuLateralComponent,
    PlantillaLayoutComponent,
  ],
  templateUrl: './maquetacion-principal.component.html',
  styleUrl: './maquetacion-principal.component.scss',
})
export class MaquetacionPrincipalComponent {}
