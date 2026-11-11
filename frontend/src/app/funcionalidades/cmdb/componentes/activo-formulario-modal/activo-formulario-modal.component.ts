import { Component, ChangeDetectionStrategy, input, output, inject, signal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivoCmdb } from '../../modelos/activo-cmdb.model';
import { TipoActivo, EstadoActivo, CriticidadActivo } from '../../modelos/tipo-activo.enum';
import { CmdbService } from '../../servicios/cmdb.service';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';

@Component({
  selector: 'app-activo-formulario-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconoComponent, BotonComponent],
  templateUrl: './activo-formulario-modal.component.html',
  styleUrl: './activo-formulario-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivoFormularioModalComponent {
  private fb = inject(FormBuilder);
  private cmdbService = inject(CmdbService);

  readonly activoEditar = input<ActivoCmdb | null>(null);
  readonly ipPreseleccionada = input<string | null>(null);
  readonly vlanPreseleccionada = input<number | null>(null);

  readonly alGuardar = output<Omit<ActivoCmdb, 'id' | 'fechaRegistro'>>();
  readonly alCerrar = output<void>();

  readonly subredes = this.cmdbService.subredes;
  readonly ipsDisponibles = signal<string[]>([]);

  readonly tiposActivo = Object.values(TipoActivo);
  readonly criticidades = Object.values(CriticidadActivo);
  readonly estados = Object.values(EstadoActivo);

  readonly areasHospitalarias = [
    { id: 1, nombre: 'Emergencia y Cuidados Críticos' },
    { id: 2, nombre: 'Consulta Externa y Especialidades' },
    { id: 3, nombre: 'Unidad de Cuidados Intensivos (UCI)' },
    { id: 4, nombre: 'Diagnóstico por Imágenes / Radiología' },
    { id: 5, nombre: 'Farmacia Hospitalaria' },
    { id: 6, nombre: 'Tecnología y Sistemas (Data Center)' },
    { id: 7, nombre: 'Laboratorio Clínico y Banco de Sangre' },
    { id: 8, nombre: 'Hospitalización y Cirugía' },
  ];

  formulario = this.fb.group({
    codigoPatrimonial: ['', [Validators.required, Validators.minLength(4)]],
    nombre: ['', [Validators.required, Validators.minLength(5)]],
    tipo: [TipoActivo.COMPUTADORA, Validators.required],
    marca: ['', Validators.required],
    modelo: ['', Validators.required],
    numeroSerie: ['', Validators.required],
    idArea: [1, Validators.required],
    ubicacionDetalle: [''],
    vlanId: [10, Validators.required],
    ip: ['', [Validators.required, Validators.pattern(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)]],
    mac: ['', [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)]],
    hostname: ['', [Validators.required, Validators.minLength(3)]],
    sistemaOperativo: [''],
    criticidad: [CriticidadActivo.ALTA, Validators.required],
    estado: [EstadoActivo.ACTIVO, Validators.required],
    responsableAsignado: [''],
    observaciones: [''],
  });

  constructor() {
    // Sincronizar formulario si es edición o si viene IP preseleccionada
    effect(() => {
      const editar = this.activoEditar();
      const ipPre = this.ipPreseleccionada();
      const vlanPre = this.vlanPreseleccionada();

      if (editar) {
        this.formulario.patchValue({
          codigoPatrimonial: editar.codigoPatrimonial,
          nombre: editar.nombre,
          tipo: editar.tipo,
          marca: editar.marca,
          modelo: editar.modelo,
          numeroSerie: editar.numeroSerie,
          idArea: editar.idArea,
          ubicacionDetalle: editar.ubicacionDetalle ?? '',
          vlanId: editar.vlanId,
          ip: editar.ip,
          mac: editar.mac,
          hostname: editar.hostname,
          sistemaOperativo: editar.sistemaOperativo ?? '',
          criticidad: editar.criticidad,
          estado: editar.estado,
          responsableAsignado: editar.responsableAsignado ?? '',
          observaciones: editar.observaciones ?? '',
        });
        this.actualizarIpsDisponibles(editar.vlanId);
      } else {
        const vlan = vlanPre ?? 10;
        this.formulario.patchValue({
          vlanId: vlan,
          ip: ipPre ?? '',
          codigoPatrimonial: 'ACT-' + Math.floor(1000 + Math.random() * 9000),
        });
        this.actualizarIpsDisponibles(vlan);
      }
    });

    // Cambiar lista de IPs sugeridas cuando el usuario cambia la VLAN en el selector
    this.formulario.get('vlanId')?.valueChanges.subscribe(vlanId => {
      if (vlanId) {
        this.actualizarIpsDisponibles(Number(vlanId));
      }
    });
  }

  private actualizarIpsDisponibles(vlanId: number): void {
    const ips = this.cmdbService.obtenerIpsDisponibles(vlanId);
    this.ipsDisponibles.set(ips);
  }

  seleccionarIpSugerida(ip: string): void {
    this.formulario.patchValue({ ip });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const val = this.formulario.getRawValue();
    const areaSeleccionada = this.areasHospitalarias.find(a => a.id === Number(val.idArea));

    const datosActivo: Omit<ActivoCmdb, 'id' | 'fechaRegistro'> = {
      codigoPatrimonial: val.codigoPatrimonial!,
      nombre: val.nombre!,
      tipo: val.tipo as TipoActivo,
      marca: val.marca!,
      modelo: val.modelo!,
      numeroSerie: val.numeroSerie!,
      idArea: Number(val.idArea!),
      areaNombre: areaSeleccionada ? areaSeleccionada.nombre : 'Área General',
      ubicacionDetalle: val.ubicacionDetalle ?? undefined,
      vlanId: Number(val.vlanId!),
      ip: val.ip!,
      mac: val.mac ?? '',
      hostname: val.hostname!,
      sistemaOperativo: val.sistemaOperativo ?? undefined,
      criticidad: val.criticidad as CriticidadActivo,
      estado: val.estado as EstadoActivo,
      responsableAsignado: val.responsableAsignado ?? undefined,
      observaciones: val.observaciones ?? undefined,
    };

    this.alGuardar.emit(datosActivo);
  }

  cerrar(): void {
    this.alCerrar.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cerrar();
  }
}
