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
import { ConocimientoApi } from '../../../../compartido/servicios/conocimiento/conocimiento.api';
import { ArticuloConocimiento } from '../../../../compartido/modelos/articulo-conocimiento.model';

@Component({
  selector: 'app-ayuda-articulo-page',
  standalone: true,
  imports: [CommonModule, RouterModule, IconoComponent],
  templateUrl: './ayuda-articulo.page.html',
  styleUrls: ['./ayuda-articulo.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AyudaArticuloPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly conocimientoApi = inject(ConocimientoApi);

  readonly cargando = signal(true);
  readonly articulo = signal<ArticuloConocimiento | null>(null);
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

    this.conocimientoApi.obtenerPorId(id).subscribe({
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
    const art = this.articulo();
    if (art) {
      this.conocimientoApi.votarUtil(art.id, true).subscribe();
      this.articulo.update((prev) =>
        prev ? { ...prev, conteoUtil: prev.conteoUtil + 1 } : null
      );
    }
    this.resueltoPorGuia.set(true);
  }

  reportarProblema(): void {
    const art = this.articulo();
    if (art) {
      this.conocimientoApi.votarUtil(art.id, false).subscribe();
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

