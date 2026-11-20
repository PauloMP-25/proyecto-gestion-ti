import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../../atomos/avatar/avatar.component';
import { UsuarioSesion } from '../../../../nucleo/modelos/usuario-sesion.model';

@Component({
  selector: 'app-usuario-perfil-menu',
  standalone: true,
  imports: [AvatarComponent],
  templateUrl: './usuario-perfil-menu.component.html',
  styleUrl: './usuario-perfil-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioPerfilMenuComponent {
  private elementRef = inject(ElementRef);

  readonly usuario = input<UsuarioSesion | null | undefined>(null);

  readonly alCerrarSesion = output<void>();
  readonly alCambiarContrasena = output<void>();
  // Alias de compatibilidad
  readonly cerrarSesion = this.alCerrarSesion;

  readonly abierto = signal(false);

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  cerrarSesionAccion(): void {
    this.abierto.set(false);
    this.alCerrarSesion.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar();
  }
}
