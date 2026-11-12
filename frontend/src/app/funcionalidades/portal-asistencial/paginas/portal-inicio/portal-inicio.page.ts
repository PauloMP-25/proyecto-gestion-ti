import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { PortalSolicitudesApi } from '../../servicios/portal-solicitudes.api';
import { PortalAyudaApi } from '../../servicios/portal-ayuda.api';
import { SolicitudResumen } from '../../modelos/solicitud.model';
import { ArticuloResumen } from '../../../../compartido/modelos/articulo-conocimiento.model';
import { BannerConfirmacionComponent } from '../../componentes/banner-confirmacion/banner-confirmacion.component';
import { TarjetaSolicitudComponent } from '../../componentes/tarjeta-solicitud/tarjeta-solicitud.component';
import { AccesosAyudaComponent } from '../../componentes/accesos-ayuda/accesos-ayuda.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-portal-inicio',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BannerConfirmacionComponent,
    TarjetaSolicitudComponent,
    AccesosAyudaComponent,
    IconoComponent,
  ],
  templateUrl: './portal-inicio.page.html',
  styleUrl: './portal-inicio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortalInicioPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly solicitudesApi = inject(PortalSolicitudesApi);
  private readonly ayudaApi = inject(PortalAyudaApi);
  private readonly destroyRef = inject(DestroyRef);

  readonly usuario = this.auth.usuarioActual;

  readonly cargando = signal<boolean>(true);
  readonly porConfirmar = signal<number>(0);
  readonly solicitudesRecientes = signal<SolicitudResumen[]>([]);
  readonly guiasDestacadas = signal<ArticuloResumen[]>([]);

  readonly saludoTiempo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);

    this.solicitudesApi
      .contarPorConfirmar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conteo) => this.porConfirmar.set(conteo),
        error: () => this.porConfirmar.set(0),
      });

    this.solicitudesApi
      .listar({ filtro: 'TODAS', pagina: 0, tamano: 3 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pagina) => {
          this.solicitudesRecientes.set(pagina.contenido);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });

    this.ayudaApi
      .destacados()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (articulos) => this.guiasDestacadas.set(articulos.slice(0, 4)),
        error: () => this.guiasDestacadas.set([]),
      });
  }
}
