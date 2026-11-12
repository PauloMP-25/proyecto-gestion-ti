import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { ArticuloDetalle } from '../../../../compartido/modelos/articulo-conocimiento.model';

@Component({
  selector: 'app-ayuda-articulo-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IconoComponent],
  templateUrl: './ayuda-articulo.page.html',
  styleUrls: ['./ayuda-articulo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AyudaArticuloPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ayudaApi = inject(PortalAyudaApi);

  readonly cargando = signal(true);
  readonly articulo = signal<ArticuloDetalle | null>(null);
  readonly noEncontrado = signal(false);
  readonly resueltoPorGuia = signal(false);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('articuloId');
    const id = idParam ? parseInt(idParam, 10) : NaN;

    if (isNaN(id)) {
      this.cargando.set(false);
      this.noEncontrado.set(true);
      return;
    }

    this.cargarArticulo(id);
  }

  cargarArticulo(id: number): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);

    this.ayudaApi.obtener(id).subscribe({
      next: (data) => {
        this.articulo.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.articulo.set(null);
        this.noEncontrado.set(true);
        this.cargando.set(false);
      },
    });
  }

  marcarComoUtil(): void {
    this.resueltoPorGuia.set(true);
  }

  reportarProblema(): void {
    const art = this.articulo();
    if (art) {
      this.router.navigate(['/solicitudes/nuevo'], {
        queryParams: {
          categoria: art.categoriaId,
          origen: 'ayuda',
          articulo: art.id,
        },
      });
    } else {
      this.router.navigate(['/solicitudes/nuevo']);
    }
  }
}
