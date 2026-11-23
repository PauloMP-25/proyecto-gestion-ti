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
import { AreaDetalle, AreaFormulario, PISOS_HOSPITALARIOS, PRIORIDADES_AREA } from '../../modelos/areas.model';
import { AreasStore } from '../../estado/areas.store';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { CampoFormularioComponent } from '../../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';

import { PersonalApi } from '../../../personal/servicios/personal.api';
import { PersonalItem } from '../../../personal/modelos/personal.model';

@Component({
  selector: 'app-dialogo-area',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  templateUrl: './dialogo-area.component.html',
  styleUrl: './dialogo-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoAreaComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(AreasStore);
  private readonly personalApi = inject(PersonalApi);

  readonly areaParaEditar = input<AreaDetalle | null>(null);
  readonly cerrado = output<boolean>();

  readonly pisos = PISOS_HOSPITALARIOS;
  readonly prioridades = PRIORIDADES_AREA;
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);
  readonly personalDisponible = signal<PersonalItem[]>([]);

  form!: FormGroup;

  ngOnInit(): void {
    this.personalApi.listar({}).subscribe({
      next: (pag) => this.personalDisponible.set(pag.contenido),
    });

    const area = this.areaParaEditar();
    this.form = this.fb.group({
      nombre: [
        area ? area.nombre : '',
        [Validators.required, Validators.maxLength(80)],
      ],
      piso: [area ? area.piso : null],
      referenciaUbicacion: [
        area ? area.referenciaUbicacion : '',
        [Validators.maxLength(150)],
      ],
      anexo: [
        area ? area.anexo : '',
        [Validators.maxLength(20), Validators.pattern(/^[0-9]*$/)],
      ],
      idEncargado: [area?.encargado ? area.encargado.id : null],
      prioridadDefecto: [area?.prioridadDefecto || 'P3'],
    });
  }

  obtenerError(campo: string): string | null {
    const control = this.form.get(campo);
    if (!control || !control.touched || !control.errors) return null;

    if (control.errors['servidor']) {
      return control.errors['servidor'];
    }
    if (control.errors['required']) {
      return 'Este campo es obligatorio.';
    }
    if (control.errors['maxlength']) {
      const max = control.errors['maxlength'].requiredLength;
      return `No puede superar ${max} caracteres.`;
    }
    if (control.errors['pattern']) {
      return 'Solo se admiten dígitos numéricos.';
    }
    return 'Dato no válido.';
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const valorForm: AreaFormulario = {
      nombre: this.form.value.nombre,
      piso: this.form.value.piso,
      referenciaUbicacion: this.form.value.referenciaUbicacion,
      anexo: this.form.value.anexo,
      idEncargado: this.form.value.idEncargado,
      prioridadDefecto: this.form.value.prioridadDefecto || 'P3',
    };

    const areaActual = this.areaParaEditar();
    const accion$ = areaActual
      ? this.store.actualizar(areaActual.id, valorForm)
      : this.store.crear(valorForm);

    accion$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrado.emit(true);
      },
      error: (err) => {
        this.guardando.set(false);
        const msj = aplicarErroresServidor(this.form, err);
        if (msj && !this.form.get('nombre')?.hasError('servidor')) {
          this.errorGeneral.set(msj);
        }
      },
    });
  }

  cerrar(): void {
    this.cerrado.emit(false);
  }
}
