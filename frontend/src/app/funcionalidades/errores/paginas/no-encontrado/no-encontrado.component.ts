import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { rutaInicioPorRol } from '../../../../nucleo/auth/ruta-inicio';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [CommonModule, RouterModule, BotonComponent, IconoComponent],
  templateUrl: './no-encontrado.component.html',
  styleUrl: './no-encontrado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEncontradoComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);

  volver(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      const ruta = rutaInicioPorRol(this.authService.rolActual());
      this.router.navigateByUrl(ruta);
    }
  }

  irAlInicio(): void {
    const ruta = rutaInicioPorRol(this.authService.rolActual());
    this.router.navigateByUrl(ruta);
  }
}
