import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconoComponent } from '../../atomos/icono/icono.component';
import { ContextoEquipoDetectado } from '../../../../funcionalidades/solicitudes/modelos/solicitud.model';

@Component({
  selector: 'app-contexto-equipo',
  standalone: true,
  imports: [CommonModule, FormsModule, IconoComponent],
  templateUrl: './contexto-equipo.component.html',
  styleUrl: './contexto-equipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextoEquipoComponent {
  readonly contexto = input.required<ContextoEquipoDetectado>();
  readonly modoEdicionPermitido = input<boolean>(true);

  readonly alModificarContexto = output<ContextoEquipoDetectado>();

  modoEdicion = signal<boolean>(false);

  // Áreas asistenciales oficiales del Hospital Santa María del Socorro
  readonly areasHospitalarias: string[] = [
    'Emergencia Adultos & Triaje',
    'Unidad de Cuidados Intensivos (UCI)',
    'Centro Quirúrgico & Recuperación',
    'Admisión Central & Triaje',
    'Laboratorio Clínico & Sangre',
    'Farmacia Central & Dispensación',
    'Módulo de Cajas / Facturación',
    'Oficina SIS (Seguro Integral)',
    'Hospitalización Medicina Mujeres',
    'Hospitalización Cirugía Varones',
    'Consultorios Externos',
    'Dirección Ejecutiva y Administración'
  ];

  ipEditada = signal<string>('');
  hostnameEditado = signal<string>('');
  areaEditada = signal<string>('');
  anexoEditado = signal<string>('');

  activarEdicion(): void {
    const c = this.contexto();
    this.ipEditada.set(c.ip);
    this.hostnameEditado.set(c.hostname);
    this.areaEditada.set(c.area);
    this.anexoEditado.set(c.anexo);
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
  }

  guardarEdicion(): void {
    const actualizado: ContextoEquipoDetectado = {
      ip: this.ipEditada().trim() || this.contexto().ip,
      hostname: this.hostnameEditado().trim() || this.contexto().hostname,
      area: this.areaEditada() || this.contexto().area,
      anexo: this.anexoEditado().trim() || this.contexto().anexo,
      detectadoAutomatico: false,
    };
    this.alModificarContexto.emit(actualizado);
    this.modoEdicion.set(false);
  }

  restablecerAutomatico(): void {
    const original: ContextoEquipoDetectado = {
      ip: '10.20.4.15',
      hostname: 'HSP-ADM-01',
      area: 'Admisión Central & Triaje',
      anexo: '2400',
      detectadoAutomatico: true,
      activoCMDBId: 'PC-ADM-001'
    };
    this.alModificarContexto.emit(original);
    this.modoEdicion.set(false);
  }
}
