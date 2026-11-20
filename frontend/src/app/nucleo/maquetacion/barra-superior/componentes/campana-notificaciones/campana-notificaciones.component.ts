import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';

export interface NotificacionResumen {
  id: string;
  titulo: string;
  mensaje: string;
  tiempo: string;
  urgencia?: 'baja' | 'media' | 'alta' | 'critica';
  leida?: boolean;
}

@Component({
  selector: 'app-campana-notificaciones',
  standalone: true,
  imports: [CommonModule, BotonIconoComponent],
  templateUrl: './campana-notificaciones.component.html',
  styleUrl: './campana-notificaciones.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampanaNotificacionesComponent {
  private elementRef = inject(ElementRef);

  readonly conteo = input<number>(0);
  readonly notificaciones = input<readonly NotificacionResumen[]>([]);

  readonly alAbrir = output<void>();
  readonly alSeleccionar = output<NotificacionResumen>();

  readonly abierto = signal<boolean>(false);

  readonly textoBadge = computed(() => {
    const total = this.conteo();
    if (total <= 0) return '';
    return total > 99 ? '99+' : String(total);
  });

  alternarPanel(): void {
    const nuevo = !this.abierto();
    this.abierto.set(nuevo);
    if (nuevo) {
      this.alAbrir.emit();
    }
  }

  cerrarPanel(): void {
    this.abierto.set(false);
  }

  seleccionar(item: NotificacionResumen): void {
    this.alSeleccionar.emit(item);
    this.cerrarPanel();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.cerrarPanel();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrarPanel();
  }
}
