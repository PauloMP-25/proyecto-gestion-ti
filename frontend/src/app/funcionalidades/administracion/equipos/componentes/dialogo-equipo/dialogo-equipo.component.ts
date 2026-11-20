import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { EquiposStore } from '../../estado/equipos.store';
import { EquiposApi } from '../../servicios/equipos.api';
import {
  EquipoFormulario,
  EquipoItem,
} from '../../modelos/equipos.model';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';
import { validadorIpDisponible } from '../../../validacion/validadores-asincronos';

import { SeccionIdentificacionComponent } from './secciones/seccion-identificacion/seccion-identificacion.component';
import { SeccionUbicacionComponent } from './secciones/seccion-ubicacion/seccion-ubicacion.component';
import { SeccionRedComponent } from './secciones/seccion-red/seccion-red.component';

@Component({
  selector: 'app-dialogo-equipo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    SeccionIdentificacionComponent,
    SeccionUbicacionComponent,
    SeccionRedComponent,
  ],
  templateUrl: './dialogo-equipo.component.html',
  styleUrl: './dialogo-equipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoEquipoComponent implements OnInit {
  equipoParaEditar = input<EquipoItem | null>(null);
  idAreaPreseleccionada = input<number | null>(null);
  tipoPreseleccionado = input<string | null>(null);

  cancelar = output<void>();
  guardado = output<EquipoItem>();

  private readonly fb = inject(FormBuilder);
  private readonly areasApi = inject(AreasApi);
  private readonly equiposApi = inject(EquiposApi);
  private readonly equiposStore = inject(EquiposStore);

  readonly areas = signal<AreaResumen[]>([]);
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly codigoEditadoManualmente = signal<boolean>(false);

  form!: FormGroup;

  ngOnInit(): void {
    const editando = this.equipoParaEditar();
    const areaInicial = editando?.idArea ?? this.idAreaPreseleccionada() ?? null;
    const tipoInicial = editando?.tipo ?? this.tipoPreseleccionado() ?? 'COMPUTADORA';

    if (editando) {
      this.codigoEditadoManualmente.set(true);
    }

    this.form = this.fb.group({
      tipo: [tipoInicial, [Validators.required]],
      idArea: [areaInicial, [Validators.required]],
      codigoInventario: [
        editando?.codigoInventario ?? '',
        [Validators.required, Validators.maxLength(20)],
      ],
      nombre: [
        editando ? `${editando.tipo} ${editando.codigoInventario}` : '',
        [Validators.required, Validators.maxLength(100)],
      ],
      referenciaUbicacion: [
        editando?.referenciaUbicacion ?? '',
        [Validators.maxLength(150)],
      ],
      ipEstatica: [
        editando?.ipVigente ?? '',
        {
          asyncValidators: [
            validadorIpDisponible(this.equiposApi, () => this.equipoParaEditar()?.id),
          ],
          updateOn: 'change',
        },
      ],
      hostname: [editando?.hostname ?? '', [Validators.maxLength(60)]],
      mac: [
        editando?.mac ?? '',
        [Validators.pattern(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)],
      ],
      marcaModelo: [editando?.marcaModelo ?? '', [Validators.maxLength(100)]],
    });

    this.cargarAreas();

    if (!editando && areaInicial) {
      this.solicitarSugerenciaCodigo(tipoInicial, areaInicial);
    }
  }

  private cargarAreas(): void {
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (areas) => {
        this.areas.set(areas);
      },
    });
  }

  onTipoOAreaChange(): void {
    if (this.codigoEditadoManualmente()) {
      return;
    }

    const tipo = this.form.get('tipo')?.value;
    const idArea = this.form.get('idArea')?.value;

    if (tipo && idArea) {
      this.solicitarSugerenciaCodigo(tipo, idArea);
    }
  }

  onCodigoInput(): void {
    const control = this.form.get('codigoInventario');
    if (control?.value) {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
      this.codigoEditadoManualmente.set(true);
    }
  }

  private solicitarSugerenciaCodigo(tipo: string, idArea: number): void {
    this.equiposStore.sugerirCodigo(tipo, idArea).subscribe({
      next: (codigo) => {
        if (!this.codigoEditadoManualmente()) {
          this.form.get('codigoInventario')?.setValue(codigo);
          if (!this.form.get('nombre')?.value) {
            const nombreSugerido =
              tipo === 'COMPUTADORA'
                ? `Computadora ${codigo}`
                : tipo === 'IMPRESORA'
                ? `Impresora ${codigo}`
                : `Equipo ${codigo}`;
            this.form.get('nombre')?.setValue(nombreSugerido);
          }
        }
      },
    });
  }

  guardar(): void {
    this.errorGeneral.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const v = this.form.getRawValue();

    const formulario: EquipoFormulario = {
      tipo: v.tipo,
      idArea: Number(v.idArea),
      codigoInventario: v.codigoInventario.trim().toUpperCase(),
      marcaModelo: v.marcaModelo || null,
      referenciaUbicacion: v.referenciaUbicacion || null,
      ipEstatica: v.ipEstatica || null,
      hostname: v.hostname || null,
      mac: v.mac || null,
    };

    const editando = this.equipoParaEditar();
    const accion$ = editando
      ? this.equiposStore.actualizar(editando.id, formulario)
      : this.equiposStore.crear(formulario);

    accion$.subscribe({
      next: (guardado) => {
        this.guardando.set(false);
        this.guardado.emit(guardado);
      },
      error: (err) => {
        this.guardando.set(false);
        const msj = aplicarErroresServidor(this.form, err);
        if (msj) {
          this.errorGeneral.set(msj);
        }
      },
    });
  }

  cerrar(): void {
    this.cancelar.emit();
  }
}
