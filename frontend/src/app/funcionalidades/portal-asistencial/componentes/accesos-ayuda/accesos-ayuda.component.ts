import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-accesos-ayuda',
  standalone: true,
  imports: [CommonModule, RouterLink, IconoComponent],
  templateUrl: './accesos-ayuda.component.html',
  styleUrl: './accesos-ayuda.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccesosAyudaComponent {
  readonly articulos = input<ArticuloResumen[]>([]);

  iconoPorTitulo(titulo: string): string {
    const t = titulo.toLowerCase();
    if (t.includes('galenhos') || t.includes('sistema')) return 'desktop_windows';
    if (t.includes('huella') || t.includes('biometr')) return 'fingerprint';
    if (t.includes('impresora') || t.includes('receta')) return 'print';
    if (t.includes('red') || t.includes('internet')) return 'wifi';
    return 'help_outline';
  }
}
