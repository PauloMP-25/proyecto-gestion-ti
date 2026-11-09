import { Routes } from '@angular/router';
import { PanelControlComponent } from './paginas/panel-control/panel-control.component';
import { rolGuard } from '../../nucleo/guardias/rol.guard';
import { RolUsuario } from '../../nucleo/modelos/rol.enum';

export const PANEL_CONTROL_ROUTES: Routes = [
  {
    path: '',
    component: PanelControlComponent,
    canActivate: [rolGuard],
    data: {
      roles: [RolUsuario.PRACTICANTE, RolUsuario.ADMINISTRADOR]
    }
  }
];

