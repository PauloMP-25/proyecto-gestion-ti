import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PlantillaPaginaComponent } from '../../../../../compartido/ui/plantillas/plantilla-pagina/plantilla-pagina.component';
import { CabeceraPaginaComponent } from '../../../../../compartido/ui/moleculas/cabecera-pagina/cabecera-pagina.component';
import { BarraFiltrosComponent } from '../../../../../compartido/ui/organismos/barra-filtros/barra-filtros.component';
import {
  CampoFiltroComponent,
  OpcionFiltro,
} from '../../../../../compartido/ui/moleculas/campo-filtro/campo-filtro.component';
import { EsqueletoComponent } from '../../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { AlertaEnLineaComponent } from '../../../../../compartido/ui/moleculas/alerta-en-linea/alerta-en-linea.component';
import { EstadoVacioComponent } from '../../../../../compartido/ui/moleculas/estado-vacio/estado-vacio.component';
import { InsigniaComponent } from '../../../../../compartido/ui/atomos/insignia/insignia.component';
import { TarjetaComponent } from '../../../../../compartido/ui/atomos/tarjeta/tarjeta.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { CambiosStore } from '../../estado/cambios.store';
import {
  ESTADOS_CAMBIO,
  EstadoCambio,
  ImpactoAsistencial,
  TipoCambio,
} from '../../modelos/cambios.model';
import {
  PRESENTACION_ESTADO,
  PRESENTACION_IMPACTO,
  PRESENTACION_TIPO,
} from '../../utilidades/etiquetas-cambio';

const IMPACTOS: readonly ImpactoAsistencial[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];
const TIPOS: readonly TipoCambio[] = ['RUTINARIO', 'PROGRAMADO', 'URGENTE'];

@Component({
  selector: 'app-cambios-lista-page',
  standalone: true,
  imports: [
    DatePipe,
    PlantillaPaginaComponent,
    CabeceraPaginaComponent,
    BarraFiltrosComponent,
    CampoFiltroComponent,
    EsqueletoComponent,
    AlertaEnLineaComponent,
    EstadoVacioComponent,
    InsigniaComponent,
    TarjetaComponent,
    BotonComponent,
  ],
  templateUrl: './cambios-lista.page.html',
  styleUrls: ['./cambios-lista.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CambiosListaPage implements OnInit {
  readonly store = inject(CambiosStore);

  protected readonly PRESENTACION_ESTADO = PRESENTACION_ESTADO;
  protected readonly PRESENTACION_IMPACTO = PRESENTACION_IMPACTO;
  protected readonly PRESENTACION_TIPO = PRESENTACION_TIPO;

  readonly opcionesEstado: readonly OpcionFiltro[] = ESTADOS_CAMBIO.map((estado) => ({
    valor: estado,
    etiqueta: PRESENTACION_ESTADO[estado].texto,
  }));

  readonly opcionesImpacto: readonly OpcionFiltro[] = IMPACTOS.map((impacto) => ({
    valor: impacto,
    etiqueta: PRESENTACION_IMPACTO[impacto].texto,
  }));

  readonly opcionesTipo: readonly OpcionFiltro[] = TIPOS.map((tipo) => ({
    valor: tipo,
    etiqueta: PRESENTACION_TIPO[tipo].texto,
  }));

  ngOnInit(): void {
    this.store.cargar();
    this.store.cargarAreas();
  }

  cambiarEstado(valor: unknown): void {
    this.store.actualizarFiltro({ estado: valor as EstadoCambio | null });
  }

  cambiarImpacto(valor: unknown): void {
    this.store.actualizarFiltro({ impacto: valor as ImpactoAsistencial | null });
  }

  cambiarTipo(valor: unknown): void {
    this.store.actualizarFiltro({ tipo: valor as TipoCambio | null });
  }
}
