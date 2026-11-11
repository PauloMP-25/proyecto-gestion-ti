import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmdbService } from '../../servicios/cmdb.service';
import { ActivoCmdb } from '../../modelos/activo-cmdb.model';
import { TipoActivo, EstadoActivo, CriticidadActivo } from '../../modelos/tipo-activo.enum';
import { DireccionIp, SubredCmdb } from '../../modelos/direccion-ip.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { ActivoFormularioModalComponent } from '../../componentes/activo-formulario-modal/activo-formulario-modal.component';

export type PestanaCmdb = 'INVENTARIO' | 'MATRIZ_IP';

@Component({
  selector: 'app-cmdb-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconoComponent,
    BotonComponent,
    ActivoFormularioModalComponent,
  ],
  templateUrl: './cmdb-lista.component.html',
  styleUrl: './cmdb-lista.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmdbListaComponent {
  private cmdbService = inject(CmdbService);

  // Pestaña activa
  readonly pestanaActiva = signal<PestanaCmdb>('INVENTARIO');

  // Datos del servicio
  readonly activos = this.cmdbService.activos;
  readonly subredes = this.cmdbService.subredes;
  readonly totalActivos = this.cmdbService.totalActivos;
  readonly totalComputadoras = this.cmdbService.totalComputadoras;
  readonly totalImpresoras = this.cmdbService.totalImpresoras;
  readonly totalServidoresYRed = this.cmdbService.totalServidoresYRed;
  readonly porcentajeOperativos = this.cmdbService.porcentajeOperativos;

  // Filtros del inventario
  readonly busquedaTexto = signal<string>('');
  readonly filtroTipo = signal<string>('TODOS');
  readonly filtroEstado = signal<string>('TODOS');
  readonly filtroCriticidad = signal<string>('TODOS');

  // Matriz de IPs
  readonly vlanSeleccionadaId = signal<number>(10);
  readonly ipSeleccionadaParaDetalle = signal<DireccionIp | null>(null);

  // Subred activa actual
  readonly subredActiva = computed<SubredCmdb | undefined>(() =>
    this.subredes().find(s => s.vlanId === this.vlanSeleccionadaId())
  );

  // Matriz generada para la subred actual
  readonly matrizIpsActual = computed<DireccionIp[]>(() =>
    this.cmdbService.obtenerMatrizIps(this.vlanSeleccionadaId())
  );

  // Modal de formulario
  readonly modalAbierto = signal<boolean>(false);
  readonly activoEnEdicion = signal<ActivoCmdb | null>(null);
  readonly ipPreseleccionada = signal<string | null>(null);
  readonly vlanPreseleccionada = signal<number | null>(null);

  // Mensaje de notificación temporal de copiado
  readonly ipCopiada = signal<string | null>(null);

  // Activos filtrados dinámicamente
  readonly activosFiltrados = computed<ActivoCmdb[]>(() => {
    const texto = this.busquedaTexto().toLowerCase().trim();
    const tipo = this.filtroTipo();
    const estado = this.filtroEstado();
    const criticidad = this.filtroCriticidad();

    return this.activos().filter(a => {
      const coincideTexto =
        !texto ||
        a.codigoPatrimonial.toLowerCase().includes(texto) ||
        a.nombre.toLowerCase().includes(texto) ||
        a.ip.toLowerCase().includes(texto) ||
        a.hostname.toLowerCase().includes(texto) ||
        a.areaNombre.toLowerCase().includes(texto) ||
        a.marca.toLowerCase().includes(texto) ||
        (a.responsableAsignado && a.responsableAsignado.toLowerCase().includes(texto));

      const coincideTipo = tipo === 'TODOS' || a.tipo === tipo;
      const coincideEstado = estado === 'TODOS' || a.estado === estado;
      const coincideCriticidad = criticidad === 'TODOS' || a.criticidad === criticidad;

      return coincideTexto && coincideTipo && coincideEstado && coincideCriticidad;
    });
  });

  cambiarPestana(pestana: PestanaCmdb): void {
    this.pestanaActiva.set(pestana);
  }

  seleccionarVlan(vlanId: number): void {
    this.vlanSeleccionadaId.set(vlanId);
    this.ipSeleccionadaParaDetalle.set(null);
  }

  seleccionarIp(ipData: DireccionIp): void {
    if (ipData.estado === 'OCUPADA' || ipData.estado === 'RESERVADA') {
      this.ipSeleccionadaParaDetalle.set(ipData);
    } else if (ipData.estado === 'DISPONIBLE') {
      this.abrirModalNuevo(ipData.ip, ipData.vlanId);
    }
  }

  cerrarDetalleIp(): void {
    this.ipSeleccionadaParaDetalle.set(null);
  }

  abrirModalNuevo(ipSugerida?: string, vlanSugerida?: number): void {
    this.activoEnEdicion.set(null);
    this.ipPreseleccionada.set(ipSugerida ?? null);
    this.vlanPreseleccionada.set(vlanSugerida ?? null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(activo: ActivoCmdb): void {
    this.activoEnEdicion.set(activo);
    this.ipPreseleccionada.set(null);
    this.vlanPreseleccionada.set(null);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.activoEnEdicion.set(null);
    this.ipPreseleccionada.set(null);
    this.vlanPreseleccionada.set(null);
  }

  guardarActivo(datos: Omit<ActivoCmdb, 'id' | 'fechaRegistro'>): void {
    const editando = this.activoEnEdicion();
    if (editando) {
      this.cmdbService.actualizarActivo(editando.id, datos);
    } else {
      this.cmdbService.registrarActivo(datos);
    }
    this.cerrarModal();
  }

  toggleEstadoActivo(activo: ActivoCmdb): void {
    const nuevoEstado =
      activo.estado === EstadoActivo.ACTIVO
        ? EstadoActivo.EN_MANTENIMIENTO
        : EstadoActivo.ACTIVO;
    this.cmdbService.cambiarEstadoActivo(activo.id, nuevoEstado);
  }

  copiarIp(ip: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    navigator.clipboard?.writeText(ip);
    this.ipCopiada.set(ip);
    setTimeout(() => {
      this.ipCopiada.set(null);
    }, 2000);
  }

  obtenerIconoTipo(tipo: TipoActivo): string {
    switch (tipo) {
      case TipoActivo.COMPUTADORA:
        return 'computer';
      case TipoActivo.IMPRESORA:
        return 'print';
      case TipoActivo.SERVIDOR:
        return 'dns';
      case TipoActivo.RED:
        return 'router';
      case TipoActivo.BIOMEDICO:
        return 'medical_services';
      default:
        return 'devices';
    }
  }
}
