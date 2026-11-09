import { Component, ChangeDetectionStrategy, input, signal, ElementRef, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KpiIndicador } from '../../../../funcionalidades/panel-control/modelos/kpi.model';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-kpi-tarjeta',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './kpi-tarjeta.component.html',
  styleUrl: './kpi-tarjeta.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiTarjetaComponent {
  private elementRef = inject(ElementRef);

  readonly kpi = input.required<KpiIndicador>();
  readonly mostrarFormula = signal<boolean>(false);

  toggleFormula(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.mostrarFormula.update(v => !v);
  }

  cerrarFormula(): void {
    this.mostrarFormula.set(false);
  }

  // Cierra automáticamente el popover si el usuario hace click en cualquier otra parte de la pantalla
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.mostrarFormula() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.mostrarFormula.set(false);
    }
  }

  // Cierra con la tecla Escape
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mostrarFormula()) {
      this.mostrarFormula.set(false);
    }
  }
}
