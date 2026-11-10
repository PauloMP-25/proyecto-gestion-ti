import { Component, ChangeDetectionStrategy, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SolicitudesService } from '../../servicios/solicitudes.service';
import { 
  CategoriaTicket, 
  ContextoEquipoDetectado, 
  EstimacionSLA, 
  NivelImpacto, 
  NivelUrgencia, 
  NuevaSolicitudPayload, 
  SolicitudRegistradaRespuesta, 
  TipoTicket 
} from '../../modelos/solicitud.model';
import { ContextoEquipoComponent } from '../../../../compartido/ui/moleculas/contexto-equipo/contexto-equipo.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

@Component({
  selector: 'app-solicitud-formulario',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ContextoEquipoComponent, 
    IconoComponent
  ],
  templateUrl: './solicitud-formulario.component.html',
  styleUrl: './solicitud-formulario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudFormularioComponent {
  private fb = inject(FormBuilder);
  private solicitudesService = inject(SolicitudesService);

  readonly alRegistrarExitoso = output<SolicitudRegistradaRespuesta>();
  readonly alCancelar = output<void>();

  readonly categorias: CategoriaTicket[] = this.solicitudesService.categorias;

  // Estado del contexto detectado de la PC
  contextoEquipo = signal<ContextoEquipoDetectado>(
    this.solicitudesService.obtenerContextoDetectado()
  );

  tipoSeleccionado = signal<TipoTicket>('incidente');
  categoriaSeleccionadaId = signal<string>('cat-software');
  impactoSeleccionado = signal<NivelImpacto>('ALTO');
  urgenciaSeleccionada = signal<NivelUrgencia>('ALTA');

  guardando = signal<boolean>(false);

  // SLA estimado calculado reactivamente
  slaEstimado = signal<EstimacionSLA>(
    this.solicitudesService.calcularPrioridadYSla('ALTO', 'ALTA')
  );

  formulario = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(150)]],
    descripcion: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  seleccionarTipo(tipo: TipoTicket): void {
    this.tipoSeleccionado.set(tipo);
    this.recalcularSLA();
  }

  seleccionarCategoria(catId: string): void {
    this.categoriaSeleccionadaId.set(catId);
  }

  seleccionarImpacto(impacto: NivelImpacto): void {
    this.impactoSeleccionado.set(impacto);
    this.recalcularSLA();
  }

  seleccionarUrgencia(urgencia: NivelUrgencia): void {
    this.urgenciaSeleccionada.set(urgencia);
    this.recalcularSLA();
  }

  onContextoModificado(nuevoContexto: ContextoEquipoDetectado): void {
    this.contextoEquipo.set(nuevoContexto);
  }

  private recalcularSLA(): void {
    const sla = this.solicitudesService.calcularPrioridadYSla(
      this.impactoSeleccionado(),
      this.urgenciaSeleccionada()
    );
    this.slaEstimado.set(sla);
  }

  async enviar(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);

    const payload: NuevaSolicitudPayload = {
      tipo: this.tipoSeleccionado(),
      categoriaId: this.categoriaSeleccionadaId(),
      titulo: this.formulario.value.titulo!.trim(),
      descripcion: this.formulario.value.descripcion!.trim(),
      impacto: this.impactoSeleccionado(),
      urgencia: this.urgenciaSeleccionada(),
      contextoEquipo: this.contextoEquipo(),
    };

    try {
      const respuesta = await this.solicitudesService.registrarSolicitud(payload);
      this.alRegistrarExitoso.emit(respuesta);
    } catch (err) {
      console.error('Error al registrar ticket:', err);
    } finally {
      this.guardando.set(false);
    }
  }

  cancelar(): void {
    this.alCancelar.emit();
  }
}
