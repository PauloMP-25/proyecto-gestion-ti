import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';

@Component({
  selector: 'app-ayuda-rapida-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IconoComponent],
  templateUrl: './ayuda-rapida.page.html',
  styleUrls: ['./ayuda-rapida.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AyudaRapidaPage implements OnInit {
  private ayudaApi = inject(PortalAyudaApi);

  readonly busquedaControl = new FormControl('');
  readonly articulos = signal<ArticuloResumen[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  readonly temasFrecuentes = [
    { id: 1, nombre: 'GalenHos', icono: 'desktop_windows', busqueda: 'GalenHos' },
    { id: 2, nombre: 'Lector de huella', icono: 'security', busqueda: 'huella' },
    { id: 3, nombre: 'Impresora de recetas', icono: 'print', busqueda: 'impresora' },
    { id: 4, nombre: 'Red e Internet', icono: 'wifi', busqueda: 'red' },
  ];

  ngOnInit(): void {
    this.cargarPopulares();

    this.busquedaControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((texto) => {
        const query = (texto || '').trim();
        if (query.length >= 2) {
          this.buscar(query);
        } else if (query.length === 0) {
          this.cargarPopulares();
        }
      });
  }

  cargarPopulares(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.ayudaApi.destacados().subscribe({
      next: (res) => {
        this.articulos.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  buscar(texto: string): void {
    this.cargando.set(true);
    this.error.set(false);

    this.ayudaApi.buscar(texto).subscribe({
      next: (res) => {
        this.articulos.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  seleccionarTema(temaBusqueda: string): void {
    this.busquedaControl.setValue(temaBusqueda);
  }

  limpiarBusqueda(): void {
    this.busquedaControl.setValue('');
  }
}
