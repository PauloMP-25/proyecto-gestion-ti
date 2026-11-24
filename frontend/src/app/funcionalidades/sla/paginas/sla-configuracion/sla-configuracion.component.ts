import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../../nucleo/config/api-endpoints';
import { SlaService } from '../../servicios/sla.service';
import { ReglaSlaConfiguracion, ConfiguracionKpiItem, AreaPrioridadItem } from '../../modelos/sla.model';

export type TipoPestanaConfig = 'compromisos' | 'metas' | 'areas';

export interface CeldaMatriz {
  impacto: 'Alto' | 'Medio' | 'Bajo';
  urgencia: 'Alta' | 'Media' | 'Baja';
  prioridad: 'P1' | 'P2' | 'P3' | 'P4';
  nombre: string;
}

export interface OpcionPrioridad {
  codigo: 'P1' | 'P2' | 'P3' | 'P4';
  etiqueta: string;
  badgeClase: string;
  descripcion: string;
}

@Component({
  selector: 'app-sla-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconoComponent, BotonComponent],
  templateUrl: './sla-configuracion.component.html',
  styleUrl: './sla-configuracion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlaConfiguracionComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly slaService = inject(SlaService);

  // Control de Pestaña Activa
  readonly pestanaActiva = signal<TipoPestanaConfig>('compromisos');

  // Estado de mensajes y guardado
  readonly guardadoExitoso = signal<boolean>(false);
  readonly mensajeFeedback = signal<string>('');
  readonly guardandoPrioridadId = signal<number | null>(null);
  readonly guardandoKpiCodigo = signal<string | null>(null);
  readonly guardandoVisibilidadCodigo = signal<string | null>(null);

  // Control de cambios pendientes (Dirty State) para alertar antes de salir
  readonly cambiosPendientesMetas = signal<boolean>(false);
  readonly modalCambiosPendientesAbierto = signal<boolean>(false);
  readonly pestanaDestinoPendiente = signal<TipoPestanaConfig | null>(null);
  readonly accionSalidaPendiente = signal<'panel' | 'pestana' | null>(null);

  // Filtros de Áreas
  readonly busquedaArea = signal<string>('');
  readonly filtroPrioridad = signal<string>('TODAS');

  // Opciones de prioridades asistenciales
  readonly opcionesPrioridad: readonly OpcionPrioridad[] = [
    {
      codigo: 'P1',
      etiqueta: 'P1 · Crítica',
      badgeClase: 'tag--p1-critica',
      descripcion: 'Soporte vital inmediato (Shock Trauma, UCI, Centro Quirúrgico)',
    },
    {
      codigo: 'P2',
      etiqueta: 'P2 · Alta',
      badgeClase: 'tag--p2-alta',
      descripcion: 'Servicios de atención prioritaria (Emergencia, Farmacia, Triaje)',
    },
    {
      codigo: 'P3',
      etiqueta: 'P3 · Media',
      badgeClase: 'tag--p3-media',
      descripcion: 'Atención general y ambulatoria (Consultorios, Enfermería)',
    },
    {
      codigo: 'P4',
      etiqueta: 'P4 · Baja',
      badgeClase: 'tag--p4-baja',
      descripcion: 'Áreas administrativas y soporte general sin atención directa a pacientes',
    },
  ];

  // Matriz 3x3 Impacto x Urgencia hospitalaria
  readonly matriz: CeldaMatriz[][] = [
    [
      { impacto: 'Alto', urgencia: 'Alta', prioridad: 'P1', nombre: 'Crítica (STAT)' },
      { impacto: 'Alto', urgencia: 'Media', prioridad: 'P2', nombre: 'Alta' },
      { impacto: 'Alto', urgencia: 'Baja', prioridad: 'P3', nombre: 'Media' },
    ],
    [
      { impacto: 'Medio', urgencia: 'Alta', prioridad: 'P2', nombre: 'Alta' },
      { impacto: 'Medio', urgencia: 'Media', prioridad: 'P3', nombre: 'Media' },
      { impacto: 'Medio', urgencia: 'Baja', prioridad: 'P4', nombre: 'Baja' },
    ],
    [
      { impacto: 'Bajo', urgencia: 'Alta', prioridad: 'P3', nombre: 'Media' },
      { impacto: 'Bajo', urgencia: 'Media', prioridad: 'P4', nombre: 'Baja' },
      { impacto: 'Bajo', urgencia: 'Baja', prioridad: 'P4', nombre: 'Baja' },
    ],
  ];

  // Acuerdos de Compromiso de Atención
  readonly reglasSLA: ReglaSlaConfiguracion[] = JSON.parse(JSON.stringify(this.slaService.reglasSla()));

  // Metas dinámicas de KPIs
  metasKPI: ConfiguracionKpiItem[] = JSON.parse(JSON.stringify(this.slaService.metasKpis()));

  // Áreas filtradas reactivamente
  readonly areasFiltradas = computed(() => {
    const todas = this.slaService.areasPrioridad();
    const query = this.busquedaArea().trim().toLowerCase();
    const filtroPrio = this.filtroPrioridad();

    return todas.filter((area) => {
      const coincideTexto =
        !query ||
        area.nombre.toLowerCase().includes(query) ||
        (area.anexo && area.anexo.toLowerCase().includes(query));

      const coincidePrio =
        filtroPrio === 'TODAS' ||
        (area.prioridadDefecto || 'P3').toUpperCase() === filtroPrio.toUpperCase();

      return coincideTexto && coincidePrio;
    });
  });

  // Conteo de áreas por prioridad
  readonly conteoPorPrioridad = computed(() => {
    const areas = this.slaService.areasPrioridad();
    return {
      total: areas.length,
      p1: areas.filter((a) => (a.prioridadDefecto || 'P3') === 'P1').length,
      p2: areas.filter((a) => (a.prioridadDefecto || 'P3') === 'P2').length,
      p3: areas.filter((a) => (a.prioridadDefecto || 'P3') === 'P3').length,
      p4: areas.filter((a) => (a.prioridadDefecto || 'P3') === 'P4').length,
    };
  });

  ngOnInit(): void {
    this.slaService.cargarAreas();
    this.cargarMetasDesdeBD();
  }

  cargarMetasDesdeBD(): void {
    this.http.get<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion).subscribe({
      next: (remotas) => {
        if (Array.isArray(remotas) && remotas.length > 0) {
          this.metasKPI = remotas;
          this.slaService.metasKpis.set(remotas);
        }
      },
      error: () => {},
    });
  }

  kpisActivosConteo(): number {
    return this.metasKPI.filter((k) => k.activo !== false).length;
  }

  alCambiarVisibilidad(kpi: ConfiguracionKpiItem): void {
    this.guardandoVisibilidadCodigo.set(kpi.codigo);
    this.http.put<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion, this.metasKPI).subscribe({
      next: (guardados) => {
        if (Array.isArray(guardados) && guardados.length > 0) {
          this.metasKPI = guardados;
          this.slaService.metasKpis.set(guardados);
        }
        this.guardandoVisibilidadCodigo.set(null);
        const estado = kpi.activo !== false ? 'activado (se mostrará en el Panel)' : 'desactivado (oculto en el Panel)';
        this.mostrarExito(`${kpi.codigo} · ${kpi.titulo}: ${estado}. Sincronizado en la Base de Datos.`);
      },
      error: () => {
        this.guardandoVisibilidadCodigo.set(null);
        this.slaService.actualizarMetasKpi(this.metasKPI);
        this.mostrarExito(`Visibilidad de ${kpi.codigo} actualizada localmente.`);
      },
    });
  }

  toggleTodosKpis(activar: boolean): void {
    this.metasKPI.forEach((k) => (k.activo = activar));
    this.guardarConfiguracionMetas(
      activar
        ? 'Todos los 8 indicadores activados y guardados en la BD (visibles en Panel de Control).'
        : 'Todos los indicadores desmarcados y guardados en la BD (ocultados del Panel de Control).'
    );
  }

  onCambioMetaNumerica(): void {
    this.cambiosPendientesMetas.set(true);
  }

  seleccionarPestana(pestana: TipoPestanaConfig): void {
    if (this.cambiosPendientesMetas()) {
      this.pestanaDestinoPendiente.set(pestana);
      this.accionSalidaPendiente.set('pestana');
      this.modalCambiosPendientesAbierto.set(true);
      return;
    }
    this.pestanaActiva.set(pestana);
  }

  volverAlPanel(): void {
    if (this.cambiosPendientesMetas()) {
      this.accionSalidaPendiente.set('panel');
      this.modalCambiosPendientesAbierto.set(true);
      return;
    }
    this.router.navigate(['/panel-control']);
  }

  confirmarGuardarYSalir(): void {
    this.modalCambiosPendientesAbierto.set(false);
    this.guardarConfiguracionMetas();
    this.ejecutarSalidaPendiente();
  }

  descartarYSalir(): void {
    this.modalCambiosPendientesAbierto.set(false);
    this.cambiosPendientesMetas.set(false);
    this.cargarMetasDesdeBD();
    this.ejecutarSalidaPendiente();
  }

  cancelarSalida(): void {
    this.modalCambiosPendientesAbierto.set(false);
    this.pestanaDestinoPendiente.set(null);
    this.accionSalidaPendiente.set(null);
  }

  private ejecutarSalidaPendiente(): void {
    const accion = this.accionSalidaPendiente();
    const pestana = this.pestanaDestinoPendiente();
    this.accionSalidaPendiente.set(null);
    this.pestanaDestinoPendiente.set(null);

    if (accion === 'panel') {
      this.router.navigate(['/panel-control']);
    } else if (accion === 'pestana' && pestana) {
      this.pestanaActiva.set(pestana);
    }
  }

  guardarConfiguracionCompromisos(): void {
    this.slaService.actualizarReglasSla(this.reglasSLA);
    this.mostrarExito('Parámetros de compromisos de atención y tiempos máximos actualizados correctamente.');
  }

  guardarConfiguracionMetas(mensajeCustom?: string): void {
    this.http.put<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion, this.metasKPI).subscribe({
      next: (guardados) => {
        if (Array.isArray(guardados) && guardados.length > 0) {
          this.metasKPI = guardados;
          this.slaService.metasKpis.set(guardados);
        }
        this.cambiosPendientesMetas.set(false);
        this.mostrarExito(mensajeCustom || 'Metas de KPIs actualizadas y sincronizadas con la base de datos y el Panel de Control.');
      },
      error: () => {
        this.cambiosPendientesMetas.set(false);
        this.slaService.actualizarMetasKpi(this.metasKPI);
        this.mostrarExito(mensajeCustom || 'Metas dinámicas actualizadas correctamente.');
      },
    });
  }

  actualizarMetaIndividual(kpi: ConfiguracionKpiItem): void {
    this.guardandoKpiCodigo.set(kpi.codigo);
    this.http.put<ConfiguracionKpiItem[]>(API_ENDPOINTS.kpis.configuracion, this.metasKPI).subscribe({
      next: (guardados) => {
        if (Array.isArray(guardados) && guardados.length > 0) {
          this.metasKPI = guardados;
          this.slaService.metasKpis.set(guardados);
        }
        this.guardandoKpiCodigo.set(null);
        this.cambiosPendientesMetas.set(false);
        this.mostrarExito(`Meta de ${kpi.codigo} (${kpi.titulo}) actualizada a ${kpi.metaValor} ${kpi.unidad} con éxito en la base de datos.`);
      },
      error: () => {
        this.guardandoKpiCodigo.set(null);
        this.cambiosPendientesMetas.set(false);
        this.slaService.actualizarMetasKpi(this.metasKPI);
        this.mostrarExito(`Meta de ${kpi.codigo} actualizada localmente.`);
      },
    });
  }

  actualizarPrioridadArea(area: AreaPrioridadItem, nuevaPrioridad: string): void {
    if (area.prioridadDefecto === nuevaPrioridad) {
      return;
    }

    this.guardandoPrioridadId.set(area.id);
    this.slaService.actualizarPrioridadArea(area.id, nuevaPrioridad).subscribe({
      next: () => {
        area.prioridadDefecto = nuevaPrioridad;
        this.guardandoPrioridadId.set(null);
        this.mostrarExito(`Prioridad de "${area.nombre}" actualizada a ${nuevaPrioridad} con éxito.`);
      },
      error: () => {
        this.guardandoPrioridadId.set(null);
      },
    });
  }

  limpiarBusqueda(): void {
    this.busquedaArea.set('');
    this.filtroPrioridad.set('TODAS');
  }

  private mostrarExito(mensaje: string): void {
    this.mensajeFeedback.set(mensaje);
    this.guardadoExitoso.set(true);
    setTimeout(() => {
      this.guardadoExitoso.set(false);
      this.mensajeFeedback.set('');
    }, 4500);
  }
}
