import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrestamosStore } from '../../estado/prestamos.store';
import { EstadoPrestamo, PrestamoItem } from '../../modelos/prestamos.model';
import { DialogoEntregarPrestamoComponent } from '../../componentes/dialogo-entregar-prestamo/dialogo-entregar-prestamo.component';
import { DialogoDevolverPrestamoComponent } from '../../componentes/dialogo-devolver-prestamo/dialogo-devolver-prestamo.component';

@Component({
  selector: 'app-prestamo-lista',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    FormsModule,
    DialogoEntregarPrestamoComponent,
    DialogoDevolverPrestamoComponent,
  ],
  templateUrl: './prestamo-lista.page.html',
  styleUrl: './prestamo-lista.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrestamoListaPage implements OnInit {
  readonly store = inject(PrestamosStore);

  readonly mostrarModalEntrega = signal<boolean>(false);
  readonly prestamoParaDevolver = signal<PrestamoItem | null>(null);
  readonly textoBusqueda = signal<string>('');

  readonly opcionesFiltroEstado: { valor: EstadoPrestamo; etiqueta: string }[] = [
    { valor: 'TODOS', etiqueta: 'Todos los registros' },
    { valor: 'VIGENTE', etiqueta: 'En préstamo activo' },
    { valor: 'VENCIDO', etiqueta: 'Plazo vencido' },
    { valor: 'DEVUELTO', etiqueta: 'Devueltos' },
  ];

  ngOnInit(): void {
    this.store.cargar();
  }

  cambiarFiltroEstado(estado: EstadoPrestamo): void {
    this.store.cargar({ estado });
  }

  alCambiarBusqueda(texto: string): void {
    this.textoBusqueda.set(texto);
    this.store.cargar({ buscar: texto });
  }

  abrirModalEntrega(): void {
    this.mostrarModalEntrega.set(true);
  }

  cerrarModalEntrega(exito: boolean): void {
    this.mostrarModalEntrega.set(false);
  }

  abrirModalDevolucion(prestamo: PrestamoItem): void {
    this.prestamoParaDevolver.set(prestamo);
  }

  cerrarModalDevolucion(exito: boolean): void {
    this.prestamoParaDevolver.set(null);
  }
}
