import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquiposStore } from '../../estado/equipos.store';
import { EquipoItem } from '../../modelos/equipos.model';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import {
  ColumnaTabla,
  TablaAdministracionComponent,
} from '../../../../../compartido/ui/organismos/tabla-administracion/tabla-administracion.component';
import { EtiquetaIpComponent } from '../../../../../compartido/ui/atomos/etiqueta-ip/etiqueta-ip.component';
import { DialogoEquipoComponent } from '../../componentes/dialogo-equipo/dialogo-equipo.component';
import { DialogoConfirmacionComponent } from '../../../../../compartido/ui/organismos/dialogo-confirmacion/dialogo-confirmacion.component';
import { CmdbService } from '../../../../cmdb/servicios/cmdb.service';
import { SubredCmdb, DireccionIp } from '../../../../cmdb/modelos/direccion-ip.model';

export type PestanaInventario = 'equipos' | 'red';

@Component({
  selector: 'app-equipos-lista-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TablaAdministracionComponent,
    EtiquetaIpComponent,
    DialogoEquipoComponent,
    DialogoConfirmacionComponent,
  ],
  template: `
    <div class="pagina-equipos">
      <header class="pagina-equipos__cabecera">
        <div class="titular-bloque">
          <div class="titular-con-icono">
            <span class="material-symbols-outlined icono-titular" aria-hidden="true">devices</span>
            <h1 class="pagina-equipos__titulo">Inventario de equipos y red</h1>
          </div>
          <p class="pagina-equipos__subtitulo">
            Hospital Santa María del Socorro · Equipamiento hospitalario, direccionamiento IP y trazabilidad por subredes.
          </p>
        </div>
        <button
          type="button"
          class="btn-nuevo"
          (click)="abrirModalNuevo()"
          aria-label="Registrar nuevo equipo hospitalario"
        >
          <span class="icono-btn" aria-hidden="true">add_to_queue</span>
          <span>Registrar equipo</span>
        </button>
      </header>

      <!-- PESTAÑAS PRINCIPALES DE NAVEGACIÓN -->
      <nav class="pestanas-nav" aria-label="Secciones de Inventario y Red">
        <button
          type="button"
          class="pestana-btn"
          [class.pestana-btn--activa]="pestanaActiva() === 'equipos'"
          (click)="cambiarPestana('equipos')"
          aria-label="Ver inventario de equipos hospitalarios"
        >
          <span class="material-symbols-outlined pestana-icono" aria-hidden="true">devices</span>
          <span>Equipos hospitalarios</span>
          <span class="pestana-conteo">{{ store.total() }}</span>
        </button>

        <button
          type="button"
          class="pestana-btn"
          [class.pestana-btn--activa]="pestanaActiva() === 'red'"
          (click)="cambiarPestana('red')"
          aria-label="Ver matriz de subredes e IPs"
        >
          <span class="material-symbols-outlined pestana-icono" aria-hidden="true">hub</span>
          <span>Matriz de subredes e IPs</span>
          <span class="pestana-conteo pestana-conteo--destacado">{{ subredes().length }} VLANs</span>
        </button>
      </nav>

      <!-- AVISO TEMPORAL DE COPIADO DE IP -->
      @if (ipCopiada(); as ipTexto) {
        <div class="alerta-copiado" role="status" aria-live="polite">
          <span class="material-symbols-outlined" aria-hidden="true">check_circle</span>
          <span>Dirección IP <strong>{{ ipTexto }}</strong> copiada al portapapeles</span>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 1: INVENTARIO DE EQUIPOS (TABLA FÁCIL Y CLARA)  -->
      <!-- ======================================================== -->
      @if (pestanaActiva() === 'equipos') {
        <app-tabla-administracion
          [columnas]="columnas"
          tituloAccesible="Listado de computadoras e impresoras del hospital"
          [cargando]="store.cargando()"
          [vacio]="store.vacio()"
          mensajeVacio="No se encontraron equipos registrados con los filtros aplicados."
          placeholderBusqueda="Buscar por código, IP, área o ubicación..."
          [busqueda]="busquedaTexto()"
          (busquedaChange)="alCambiarBusqueda($event)"
        >
          <div filtros class="filtros-equipos">
            <select
              class="select-filtro"
              [ngModel]="filtroArea()"
              (ngModelChange)="alCambiarArea($event)"
              aria-label="Filtrar por área hospitalaria"
            >
              <option [ngValue]="null">Todas las áreas</option>
              @for (a of areas(); track a.id) {
                <option [ngValue]="a.id">{{ a.nombre }}</option>
              }
            </select>

            <select
              class="select-filtro"
              [ngModel]="filtroTipo()"
              (ngModelChange)="alCambiarTipo($event)"
              aria-label="Filtrar por tipo de equipo"
            >
              <option [ngValue]="null">Todos los tipos</option>
              <option value="COMPUTADORA">Computadoras</option>
              <option value="IMPRESORA">Impresoras</option>
              <option value="OTRO">Otros</option>
            </select>

            <label class="filtro-checkbox">
              <input
                type="checkbox"
                [ngModel]="filtroSinIp()"
                (ngModelChange)="alCambiarSinIp($event)"
              />
              <span>Sin IP asignada</span>
            </label>
          </div>

          <button
            accion-vacio
            type="button"
            class="btn-nuevo btn-nuevo--sm"
            (click)="abrirModalNuevo()"
          >
            <span class="icono-btn" aria-hidden="true">add_to_queue</span>
            <span>Registrar equipo</span>
          </button>

          <ng-template #celdaPersonalizada let-columna="columna" let-item="item">
            @if (columna.campo === 'codigoInventario') {
              <div class="celda-codigo">
                <span class="codigo-texto">{{ item.codigoInventario }}</span>
                @if (item.marcaModelo) {
                  <span class="modelo-texto">{{ item.marcaModelo }}</span>
                }
              </div>
            } @else if (columna.campo === 'tipo') {
              <span class="insignia-tipo" [class]="'insignia-tipo--' + item.tipo.toLowerCase()">
                {{ obtenerEtiquetaTipo(item.tipo) }}
              </span>
            } @else if (columna.campo === 'nombreArea') {
              <div class="celda-ubicacion">
                <span class="area-texto">{{ item.nombreArea }}</span>
                @if (item.referenciaUbicacion) {
                  <span class="referencia-texto">{{ item.referenciaUbicacion }}</span>
                }
              </div>
            } @else if (columna.campo === 'ipVigente') {
              @if (item.ipVigente) {
                <app-etiqueta-ip [ip]="item.ipVigente"></app-etiqueta-ip>
              } @else {
                <span class="sin-ip" aria-label="Sin IP asignada">Sin IP</span>
              }
            } @else if (columna.campo === 'estado') {
              <span
                class="insignia-estado"
                [class.insignia-estado--activo]="item.activo && item.estado === 'EN_SERVICIO'"
                [class.insignia-estado--mantenimiento]="item.estado === 'EN_MANTENIMIENTO'"
                [class.insignia-estado--inactivo]="item.estado === 'DE_BAJA' || !item.activo"
              >
                {{ obtenerEtiquetaEstado(item.estado) }}
              </span>
            } @else if (columna.campo === 'acciones') {
              <div class="celda-acciones">
                <button
                  type="button"
                  class="btn-accion"
                  (click)="abrirModalEditar(item)"
                  [attr.aria-label]="'Editar equipo ' + item.codigoInventario"
                  title="Editar equipo"
                >
                  <span class="material-symbols-outlined" aria-hidden="true">edit</span>
                </button>

                <button
                  type="button"
                  class="btn-accion"
                  (click)="solicitarCambioEstado(item)"
                  [attr.aria-label]="
                    item.estado === 'EN_SERVICIO'
                      ? 'Poner en mantenimiento a ' + item.codigoInventario
                      : 'Poner en servicio a ' + item.codigoInventario
                  "
                  [title]="
                    item.estado === 'EN_SERVICIO'
                      ? 'Poner en mantenimiento'
                      : 'Poner en servicio'
                  "
                >
                  <span class="material-symbols-outlined" aria-hidden="true">
                    {{ item.estado === 'EN_SERVICIO' ? 'build' : 'check_circle' }}
                  </span>
                </button>
              </div>
            }
          </ng-template>
        </app-tabla-administracion>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 2: MATRIZ DE RED Y SUBREDES IP                   -->
      <!-- ======================================================== -->
      @if (pestanaActiva() === 'red') {
        <section class="seccion-matriz-ip" aria-label="Matriz de subredes hospitalarias">
          <!-- SELECTOR DE VLANS -->
          <div class="selector-vlans">
            <h2 class="selector-vlans__titulo">
              <span class="material-symbols-outlined" aria-hidden="true">account_tree</span>
              Plan de Direccionamiento Hospitalario por Subredes (VLANs)
            </h2>

            <div class="vlan-cards-grid">
              @for (sub of subredes(); track sub.vlanId) {
                <button
                  type="button"
                  class="vlan-card"
                  [class.vlan-card--activa]="sub.vlanId === vlanSeleccionadaId()"
                  (click)="seleccionarVlan(sub.vlanId)"
                >
                  <div class="vlan-card__header">
                    <span class="vlan-tag" [style.border-color]="sub.colorIdentificador" [style.color]="sub.colorIdentificador">
                      VLAN {{ sub.vlanId }}
                    </span>
                    <span class="vlan-segmento">{{ sub.segmento }}</span>
                  </div>
                  <h3 class="vlan-card__nombre">{{ sub.nombre }}</h3>
                  <div class="vlan-card__metricas">
                    <span><strong>{{ sub.ipsOcupadas }}</strong> ocupadas</span>
                    <span><strong>{{ sub.ipsDisponibles }}</strong> libres</span>
                  </div>
                </button>
              }
            </div>
          </div>

          <!-- DETALLE DE LA SUBRED SELECCIONADA -->
          @if (subredActiva(); as sub) {
            <div class="panel-subred-detalle">
              <div class="subred-info-barra">
                <div class="subred-info-item">
                  <span class="subred-info-label">Subred Activa:</span>
                  <strong class="subred-info-val">{{ sub.nombre }}</strong>
                </div>
                <div class="subred-info-item">
                  <span class="subred-info-label">Segmento:</span>
                  <span class="subred-info-val mono">{{ sub.segmento }}</span>
                </div>
                <div class="subred-info-item">
                  <span class="subred-info-label">Gateway:</span>
                  <span class="subred-info-val mono">{{ sub.gateway }}</span>
                </div>
                <div class="subred-info-item">
                  <span class="subred-info-label">Máscara:</span>
                  <span class="subred-info-val mono">{{ sub.mascara }}</span>
                </div>
              </div>

              <!-- BARRA DE UTILIZACIÓN DE LA SUBRED -->
              @let porcOcupado = (sub.ipsOcupadas / sub.totalIps) * 100;
              @let porcReservado = (sub.ipsReservadas / sub.totalIps) * 100;
              <div class="barra-ocupacion-container">
                <div class="barra-ocupacion-header">
                  <span>Utilización de la Subred ({{ sub.ipsOcupadas }} de {{ sub.totalIps }} IPs asignadas)</span>
                  <span><strong>{{ (porcOcupado).toFixed(1) }}%</strong> en uso</span>
                </div>
                <div class="barra-ocupacion-pista">
                  <div class="porc-ocupadas" [style.width.%]="porcOcupado" title="IPs Asignadas a Activos"></div>
                  <div class="porc-reservadas" [style.width.%]="porcReservado" title="IPs Reservadas de Infraestructura"></div>
                </div>
              </div>

              <!-- LEYENDA INTERACTIVA DE ESTADOS DE IP -->
              <div class="leyenda-matriz">
                <div class="leyenda-item">
                  <span class="leyenda-muestra muestra--libre"></span>
                  <span><strong>Disponible:</strong> Libre para asignación</span>
                </div>
                <div class="leyenda-item">
                  <span class="leyenda-muestra muestra--ocupada"></span>
                  <span><strong>Ocupada:</strong> Asignada a Computadora, Impresora o Servidor</span>
                </div>
                <div class="leyenda-item">
                  <span class="leyenda-muestra muestra--reservada"></span>
                  <span><strong>Reservada:</strong> Gateway, DNS y Enlaces</span>
                </div>
              </div>

              <!-- CUADRÍCULA DE DIRECCIONES IP -->
              <div class="cuadricula-ips">
                @for (nodo of matrizIpsActual(); track nodo.ip) {
                  <button
                    type="button"
                    class="nodo-ip"
                    [class.nodo-ip--libre]="nodo.estado === 'DISPONIBLE'"
                    [class.nodo-ip--ocupado]="nodo.estado === 'OCUPADA'"
                    [class.nodo-ip--reservado]="nodo.estado === 'RESERVADA'"
                    [class.nodo-ip--seleccionado]="ipSeleccionadaParaDetalle()?.ip === nodo.ip"
                    (click)="seleccionarIp(nodo)"
                    [attr.aria-label]="'IP ' + nodo.ip + ' ' + nodo.estado"
                  >
                    <span class="nodo-ip__octeto">.{{ nodo.octetoFinal }}</span>
                    <span class="nodo-ip__icono">
                      <span class="material-symbols-outlined" style="font-size: 1rem;">
                        {{ nodo.estado === 'OCUPADA' ? (nodo.activoAsignado?.tipo === 'IMPRESORA' ? 'print' : (nodo.activoAsignado?.tipo === 'SERVIDOR' ? 'dns' : (nodo.activoAsignado?.tipo === 'RED' ? 'router' : 'computer'))) : (nodo.estado === 'RESERVADA' ? 'lock' : 'check') }}
                      </span>
                    </span>
                  </button>
                }
              </div>

              <!-- PANEL DETALLE NODO IP SELECCIONADO -->
              @if (ipSeleccionadaParaDetalle(); as ipDetalle) {
                <div class="drawer-detalle-ip">
                  <div class="drawer-header">
                    <div class="drawer-titulo">
                      <span class="material-symbols-outlined" aria-hidden="true">lan</span>
                      <strong>Detalle de IP: {{ ipDetalle.ip }}</strong>
                    </div>
                    <button type="button" class="btn-cerrar-drawer" (click)="ipSeleccionadaParaDetalle.set(null)" aria-label="Cerrar detalle">
                      <span class="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                  </div>

                  <div class="drawer-cuerpo">
                    <div class="drawer-grid">
                      <div class="drawer-item">
                        <span class="drawer-label">Estado de conexión:</span>
                        <span
                          class="insignia-estado"
                          [class.insignia-estado--activo]="ipDetalle.estado === 'DISPONIBLE'"
                          [class.insignia-estado--mantenimiento]="ipDetalle.estado === 'OCUPADA'"
                          [class.insignia-estado--inactivo]="ipDetalle.estado === 'RESERVADA'"
                        >
                          {{ ipDetalle.estado }}
                        </span>
                      </div>
                      <div class="drawer-item">
                        <span class="drawer-label">VLAN:</span>
                        <span>{{ ipDetalle.vlanNombre }}</span>
                      </div>

                      @if (ipDetalle.estado === 'OCUPADA' && ipDetalle.activoAsignado; as act) {
                        <div class="drawer-item">
                          <span class="drawer-label">Equipo asignado:</span>
                          <strong>{{ act.nombre }}</strong> ({{ act.codigoPatrimonial }})
                        </div>
                        <div class="drawer-item">
                          <span class="drawer-label">Área hospitalaria:</span>
                          <span>{{ act.areaNombre }}</span>
                        </div>
                        <div class="drawer-item">
                          <span class="drawer-label">Hostname:</span>
                          <span class="mono">{{ act.hostname }}</span>
                        </div>
                      } @else if (ipDetalle.estado === 'RESERVADA') {
                        <div class="drawer-item">
                          <span class="drawer-label">Propósito de reserva:</span>
                          <span>{{ ipDetalle.descripcionUso || 'Infraestructura de red del hospital' }}</span>
                        </div>
                      }
                    </div>

                    <div class="drawer-acciones">
                      <button type="button" class="btn-drawer btn-drawer--copiar" (click)="copiarIp(ipDetalle.ip)">
                        <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>
                        <span>Copiar dirección IP</span>
                      </button>

                      @if (ipDetalle.estado === 'DISPONIBLE') {
                        <button type="button" class="btn-drawer btn-drawer--asignar" (click)="abrirModalNuevo()">
                          <span class="material-symbols-outlined" aria-hidden="true">add_to_queue</span>
                          <span>Asignar a nuevo equipo</span>
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </section>
      }

      @if (modalAbierto()) {
        <app-dialogo-equipo
          [equipoParaEditar]="equipoSeleccionado()"
          (cancelar)="cerrarModal()"
          (guardado)="alGuardarEquipo($event)"
        ></app-dialogo-equipo>
      }

      @if (confirmacionEstadoAbierta()) {
        <app-dialogo-confirmacion
          [titulo]="
            equipoParaConfirmar()?.estado === 'EN_SERVICIO'
              ? '¿Poner equipo en mantenimiento?'
              : '¿Poner equipo en servicio?'
          "
          [mensaje]="
            'Se cambiará el estado operativo de ' +
            equipoParaConfirmar()?.codigoInventario +
            '.'
          "
          [textoConfirmar]="
            equipoParaConfirmar()?.estado === 'EN_SERVICIO'
              ? 'Poner en mantenimiento'
              : 'Poner en servicio'
          "
          (confirmar)="confirmarCambioEstado()"
          (cancelar)="cerrarConfirmacionEstado()"
        ></app-dialogo-confirmacion>
      }
    </div>
  `,
  styles: [
    `
      .pagina-equipos {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-6);
        padding: var(--espacio-6);
        max-width: 80rem;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }

      .pagina-equipos__cabecera {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-4);

        @media (min-width: 640px) {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
        }
      }

      .titular-con-icono {
        display: flex;
        align-items: center;
        gap: var(--espacio-3);
        margin-bottom: var(--espacio-1);
      }

      .icono-titular {
        font-size: 2rem;
        color: var(--color-brand-primary);
      }

      .pagina-equipos__titulo {
        font-size: var(--tipo-titulo-lg-size);
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0;
      }

      .pagina-equipos__subtitulo {
        font-size: var(--tipo-cuerpo-md-size);
        color: var(--color-text-muted);
        margin: 0;
      }

      /* PESTAÑAS DE NAVEGACIÓN */
      .pestanas-nav {
        display: flex;
        gap: var(--espacio-2);
        border-bottom: 2px solid var(--color-border-subtle);
        padding-bottom: 0;
        overflow-x: auto;
      }

      .pestana-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-3) var(--espacio-4);
        background: transparent;
        border: none;
        border-bottom: 3px solid transparent;
        font-size: var(--tipo-cuerpo-md-size);
        font-weight: 600;
        color: var(--color-text-muted);
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: -2px;
        white-space: nowrap;

        &:hover {
          color: var(--color-text-primary);
        }

        &--activa {
          color: var(--color-brand-primary);
          border-bottom-color: var(--color-brand-primary);
        }
      }

      .pestana-icono {
        font-size: 1.25rem;
      }

      .pestana-conteo {
        display: inline-flex;
        align-items: center;
        padding: 2px var(--espacio-2);
        background-color: var(--color-surface-sunken);
        color: var(--color-text-secondary);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 700;
        border-radius: var(--radius-full);

        &--destacado {
          background-color: var(--color-brand-muted);
          color: var(--color-brand-primary);
        }
      }

      .alerta-copiado {
        display: inline-flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-2) var(--espacio-4);
        background-color: var(--color-success-subtle);
        color: var(--color-success-text);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-md);
        font-size: var(--tipo-cuerpo-sm-size);
      }

      .btn-nuevo {
        display: inline-flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-2) var(--espacio-4);
        background-color: var(--color-brand-primary);
        color: var(--color-text-inverse);
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--tipo-cuerpo-sm-size);
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s ease;
        white-space: nowrap;

        &:hover {
          background-color: var(--color-brand-secondary);
        }

        &--sm {
          font-size: var(--tipo-cuerpo-xs-size);
          padding: var(--espacio-1) var(--espacio-3);
        }
      }

      .icono-btn {
        font-family: 'Material Symbols Outlined';
        font-size: 1.25rem;
      }

      .filtros-equipos {
        display: flex;
        flex-wrap: wrap;
        gap: var(--espacio-3);
        align-items: center;
      }

      .select-filtro {
        padding: var(--espacio-2) var(--espacio-3);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        background-color: var(--color-surface-card);
        color: var(--color-text-primary);
        font-size: var(--tipo-cuerpo-sm-size);

        &:focus {
          outline: none;
          border-color: var(--color-brand-primary);
        }
      }

      .filtro-checkbox {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
        font-size: var(--tipo-cuerpo-sm-size);
        color: var(--color-text-secondary);
        cursor: pointer;
        user-select: none;
      }

      .celda-codigo {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-1);
      }

      .codigo-texto {
        font-family: var(--fuente-mono, monospace);
        font-weight: 700;
        color: var(--color-text-primary);
      }

      .modelo-texto {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
      }

      .insignia-tipo {
        display: inline-block;
        padding: 2px var(--espacio-2);
        border-radius: var(--radius-full);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 600;

        &--computadora {
          background-color: var(--color-brand-muted);
          color: var(--color-brand-primary);
        }

        &--impresora {
          background-color: var(--color-surface-hover);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-subtle);
        }

        &--otro {
          background-color: var(--color-surface-subtle);
          color: var(--color-text-muted);
        }
      }

      .celda-ubicacion {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-1);
      }

      .area-texto {
        font-weight: 500;
        color: var(--color-text-primary);
      }

      .referencia-texto {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
      }

      .sin-ip {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
        font-style: italic;
      }

      .insignia-estado {
        display: inline-flex;
        align-items: center;
        padding: 2px var(--espacio-2);
        border-radius: var(--radius-full);
        font-size: var(--tipo-cuerpo-xs-size);
        font-weight: 600;

        &--activo {
          background-color: var(--color-success-subtle);
          color: var(--color-success-text);
        }

        &--mantenimiento {
          background-color: var(--color-warning-subtle);
          color: var(--color-warning-text);
        }

        &--inactivo {
          background-color: var(--color-danger-subtle);
          color: var(--color-danger-text);
        }
      }

      .celda-acciones {
        display: flex;
        gap: var(--espacio-1);
      }

      .btn-accion {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        padding: var(--espacio-1);
        border-radius: var(--radius-sm);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;

        &:hover {
          background-color: var(--color-surface-hover);
          color: var(--color-text-primary);
        }
      }

      /* ======================================================== */
      /* SECCIÓN MATRIZ DE SUBREDES E IPS                         */
      /* ======================================================== */
      .seccion-matriz-ip {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-5);
      }

      .selector-vlans {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-3);

        &__titulo {
          display: flex;
          align-items: center;
          gap: var(--espacio-2);
          font-size: var(--tipo-titulo-sm-size, 1.125rem);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
        }
      }

      .vlan-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: var(--espacio-3);
      }

      .vlan-card {
        background: var(--color-surface-card);
        border: 2px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        padding: var(--espacio-4);
        text-align: left;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: var(--espacio-2);

        &:hover {
          border-color: var(--color-brand-primary);
          transform: translateY(-2px);
        }

        &--activa {
          border-color: var(--color-brand-primary);
          background: var(--color-surface-card);
          box-shadow: var(--shadow-sm);
        }

        &__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .vlan-tag {
          font-size: var(--tipo-cuerpo-xs-size);
          font-weight: 800;
          padding: 2px var(--espacio-2);
          border-radius: var(--radius-sm);
          border: 1px solid;
        }

        .vlan-segmento {
          font-family: var(--fuente-mono, monospace);
          font-size: var(--tipo-cuerpo-xs-size);
          color: var(--color-text-secondary);
        }

        &__nombre {
          font-size: var(--tipo-cuerpo-sm-size);
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0;
          line-height: 1.3;
        }

        &__metricas {
          display: flex;
          justify-content: space-between;
          font-size: var(--tipo-cuerpo-xs-size);
          color: var(--color-text-secondary);
          border-top: 1px dashed var(--color-border-subtle);
          padding-top: var(--espacio-2);
        }
      }

      .panel-subred-detalle {
        background: var(--color-surface-card);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        padding: var(--espacio-5);
        display: flex;
        flex-direction: column;
        gap: var(--espacio-4);
        box-shadow: var(--shadow-sm);
      }

      .subred-info-barra {
        display: flex;
        flex-wrap: wrap;
        gap: var(--espacio-4);
        padding-bottom: var(--espacio-3);
        border-bottom: 1px solid var(--color-border-subtle);

        .subred-info-item {
          display: flex;
          align-items: center;
          gap: var(--espacio-1);
          font-size: var(--tipo-cuerpo-sm-size);
        }

        .subred-info-label {
          color: var(--color-text-secondary);
          font-weight: 500;
        }

        .subred-info-val {
          color: var(--color-text-primary);
          font-weight: 700;

          &.mono {
            font-family: var(--fuente-mono, monospace);
          }
        }
      }

      .barra-ocupacion-container {
        display: flex;
        flex-direction: column;
        gap: var(--espacio-1);

        .barra-ocupacion-header {
          display: flex;
          justify-content: space-between;
          font-size: var(--tipo-cuerpo-xs-size);
          font-weight: 600;
          color: var(--color-text-secondary);
        }

        .barra-ocupacion-pista {
          height: 10px;
          background: var(--color-surface-sunken);
          border-radius: var(--radius-full);
          overflow: hidden;
          display: flex;
        }

        .porc-ocupadas {
          background: var(--color-brand-primary);
          transition: width 0.3s ease;
        }

        .porc-reservadas {
          background: var(--color-warning-border, #d97706);
          transition: width 0.3s ease;
        }
      }

      .leyenda-matriz {
        display: flex;
        flex-wrap: wrap;
        gap: var(--espacio-4);
        padding: var(--espacio-2) var(--espacio-3);
        background: var(--color-surface-sunken);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border-subtle);

        .leyenda-item {
          display: flex;
          align-items: center;
          gap: var(--espacio-2);
          font-size: var(--tipo-cuerpo-xs-size);
          color: var(--color-text-secondary);
        }

        .leyenda-muestra {
          width: 14px;
          height: 14px;
          border-radius: var(--radius-xs);
          border: 1px solid;

          &.muestra--libre {
            background: var(--color-success-subtle);
            border-color: var(--color-success-border, #16a34a);
          }

          &.muestra--ocupada {
            background: var(--color-brand-muted);
            border-color: var(--color-brand-primary);
          }

          &.muestra--reservada {
            background: var(--color-warning-subtle);
            border-color: var(--color-warning-border, #d97706);
          }
        }
      }

      .cuadricula-ips {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
        gap: var(--espacio-2);
        padding: var(--espacio-2) 0;
      }

      .nodo-ip {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        padding: var(--espacio-2) 4px;
        border-radius: var(--radius-md);
        border: 1px solid;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
        background: transparent;

        &__octeto {
          font-family: var(--fuente-mono, monospace);
          font-size: var(--tipo-cuerpo-xs-size);
          font-weight: 700;
        }

        &__icono {
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-sm);
        }

        &--libre {
          background: var(--color-success-subtle);
          border-color: var(--color-success-border, #16a34a);
          color: var(--color-success-text);

          &:hover {
            filter: brightness(0.95);
          }
        }

        &--ocupado {
          background: var(--color-brand-muted);
          border-color: var(--color-brand-primary);
          color: var(--color-brand-primary);

          &:hover {
            filter: brightness(0.95);
          }
        }

        &--reservado {
          background: var(--color-warning-subtle);
          border-color: var(--color-warning-border, #d97706);
          color: var(--color-warning-text);
        }

        &--seleccionado {
          outline: 2px solid var(--color-brand-primary);
          outline-offset: 2px;
        }
      }

      /* DETALLE DE IP SELECCIONADA */
      .drawer-detalle-ip {
        background: var(--color-surface-sunken);
        border: 1px solid var(--color-border-subtle);
        border-radius: var(--radius-lg);
        padding: var(--espacio-4);
        display: flex;
        flex-direction: column;
        gap: var(--espacio-3);
      }

      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--color-border-subtle);
        padding-bottom: var(--espacio-2);
      }

      .drawer-titulo {
        display: flex;
        align-items: center;
        gap: var(--espacio-2);
        color: var(--color-text-primary);
        font-size: var(--tipo-cuerpo-md-size);
      }

      .btn-cerrar-drawer {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: var(--espacio-1);

        &:hover {
          color: var(--color-text-primary);
        }
      }

      .drawer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--espacio-3);
      }

      .drawer-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: var(--tipo-cuerpo-sm-size);
        color: var(--color-text-primary);

        .mono {
          font-family: var(--fuente-mono, monospace);
        }
      }

      .drawer-label {
        font-size: var(--tipo-cuerpo-xs-size);
        color: var(--color-text-muted);
        font-weight: 600;
        text-transform: uppercase;
      }

      .drawer-acciones {
        display: flex;
        gap: var(--espacio-2);
        padding-top: var(--espacio-2);
        flex-wrap: wrap;
      }

      .btn-drawer {
        display: inline-flex;
        align-items: center;
        gap: var(--espacio-2);
        padding: var(--espacio-2) var(--espacio-3);
        border-radius: var(--radius-md);
        font-size: var(--tipo-cuerpo-sm-size);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &--copiar {
          background: var(--color-surface-card);
          border: 1px solid var(--color-border-subtle);
          color: var(--color-text-primary);

          &:hover {
            background: var(--color-surface-hover);
          }
        }

        &--asignar {
          background: var(--color-brand-primary);
          border: 1px solid var(--color-brand-primary);
          color: var(--color-text-inverse);

          &:hover {
            background: var(--color-brand-secondary);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquiposListaPage implements OnInit {
  readonly store = inject(EquiposStore);
  private readonly areasApi = inject(AreasApi);
  private readonly cmdbService = inject(CmdbService);

  readonly pestanaActiva = signal<PestanaInventario>('equipos');

  // Datos para pestaña 1: Equipos
  readonly areas = signal<AreaResumen[]>([]);
  readonly busquedaTexto = signal<string>('');
  readonly filtroArea = signal<number | null>(null);
  readonly filtroTipo = signal<string | null>(null);
  readonly filtroSinIp = signal<boolean>(false);

  readonly modalAbierto = signal<boolean>(false);
  readonly equipoSeleccionado = signal<EquipoItem | null>(null);

  readonly confirmacionEstadoAbierta = signal<boolean>(false);
  readonly equipoParaConfirmar = signal<EquipoItem | null>(null);

  // Datos para pestaña 2: Matriz de Red e IPs
  readonly subredes = this.cmdbService.subredes;
  readonly vlanSeleccionadaId = signal<number>(10);
  readonly ipSeleccionadaParaDetalle = signal<DireccionIp | null>(null);
  readonly ipCopiada = signal<string | null>(null);

  readonly subredActiva = computed<SubredCmdb | undefined>(() =>
    this.subredes().find((s) => s.vlanId === this.vlanSeleccionadaId())
  );

  readonly matrizIpsActual = computed<DireccionIp[]>(() =>
    this.cmdbService.obtenerMatrizIps(this.vlanSeleccionadaId())
  );

  readonly columnas: ColumnaTabla[] = [
    { campo: 'codigoInventario', titulo: 'Código / Modelo' },
    { campo: 'tipo', titulo: 'Tipo' },
    { campo: 'nombreArea', titulo: 'Área / Ubicación' },
    { campo: 'ipVigente', titulo: 'IP estática' },
    { campo: 'estado', titulo: 'Estado' },
    { campo: 'acciones', titulo: 'Acciones' },
  ];

  ngOnInit(): void {
    this.store.cargar();
    this.cargarAreas();
  }

  cambiarPestana(pestana: PestanaInventario): void {
    this.pestanaActiva.set(pestana);
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (areas) => this.areas.set(areas),
    });
  }

  alCambiarBusqueda(texto: string): void {
    this.busquedaTexto.set(texto);
    this.store.cargar({ buscar: texto, pagina: 0 });
  }

  alCambiarArea(idArea: number | null): void {
    this.filtroArea.set(idArea);
    this.store.cargar({ idArea, pagina: 0 });
  }

  alCambiarTipo(tipo: string | null): void {
    this.filtroTipo.set(tipo);
    this.store.cargar({ tipo, pagina: 0 });
  }

  alCambiarSinIp(sinIp: boolean): void {
    this.filtroSinIp.set(sinIp);
    this.store.cargar({ sinIp: sinIp || undefined, pagina: 0 });
  }

  abrirModalNuevo(): void {
    this.equipoSeleccionado.set(null);
    this.modalAbierto.set(true);
  }

  abrirModalEditar(equipo: EquipoItem): void {
    this.equipoSeleccionado.set(equipo);
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.equipoSeleccionado.set(null);
  }

  alGuardarEquipo(_guardado: EquipoItem): void {
    this.cerrarModal();
  }

  solicitarCambioEstado(equipo: EquipoItem): void {
    this.equipoParaConfirmar.set(equipo);
    this.confirmacionEstadoAbierta.set(true);
  }

  confirmarCambioEstado(): void {
    const eq = this.equipoParaConfirmar();
    if (!eq) return;

    const nuevoEstado =
      eq.estado === 'EN_SERVICIO' ? 'EN_MANTENIMIENTO' : 'EN_SERVICIO';

    this.store.cambiarEstado(eq.id, nuevoEstado).subscribe({
      next: () => this.cerrarConfirmacionEstado(),
      error: () => this.cerrarConfirmacionEstado(),
    });
  }

  cerrarConfirmacionEstado(): void {
    this.confirmacionEstadoAbierta.set(false);
    this.equipoParaConfirmar.set(null);
  }

  // Métodos de la pestaña de red
  seleccionarVlan(vlanId: number): void {
    this.vlanSeleccionadaId.set(vlanId);
    this.ipSeleccionadaParaDetalle.set(null);
  }

  seleccionarIp(nodo: DireccionIp): void {
    if (this.ipSeleccionadaParaDetalle()?.ip === nodo.ip) {
      this.ipSeleccionadaParaDetalle.set(null);
    } else {
      this.ipSeleccionadaParaDetalle.set(nodo);
    }
  }

  copiarIp(ip: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(ip);
    }
    this.ipCopiada.set(ip);
    setTimeout(() => this.ipCopiada.set(null), 3000);
  }

  obtenerEtiquetaTipo(tipo: string): string {
    switch (tipo) {
      case 'COMPUTADORA':
        return 'Computadora';
      case 'IMPRESORA':
        return 'Impresora';
      default:
        return 'Equipo';
    }
  }

  obtenerEtiquetaEstado(estado: string): string {
    switch (estado) {
      case 'EN_SERVICIO':
        return 'En servicio';
      case 'EN_MANTENIMIENTO':
        return 'En mantenimiento';
      case 'DE_BAJA':
        return 'De baja';
      default:
        return estado;
    }
  }
}
