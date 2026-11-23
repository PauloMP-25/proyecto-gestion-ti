import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CampoFormularioComponent } from '../../../../compartido/ui/moleculas/campo-formulario/campo-formulario.component';
import { DialogoFormularioComponent } from '../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { PrestamosStore } from '../../estado/prestamos.store';
import { DevolverPrestamoForm, PrestamoItem } from '../../modelos/prestamos.model';

@Component({
  selector: 'app-dialogo-devolver-prestamo',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    CampoFormularioComponent,
  ],
  templateUrl: './dialogo-devolver-prestamo.component.html',
  styleUrl: './dialogo-devolver-prestamo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoDevolverPrestamoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(PrestamosStore);

  readonly prestamo = input.required<PrestamoItem>();
  readonly cerrado = output<boolean>();

  readonly estadosRetorno = [
    { valor: 'OPERATIVO', etiqueta: 'Operativo — Sin novedades técnicas', descripcion: 'Equipo en perfecto funcionamiento y completo' },
    { valor: 'CON_DANOS', etiqueta: 'Con daños o deterioro físico', descripcion: 'Requiere revisión o mantenimiento técnico' },
    { valor: 'INCOMPLETO', etiqueta: 'Incompleto — Faltan accesorios', descripcion: 'Faltó cargador, cable de red, mouse u otro periférico' },
  ];

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      estadoDevolucion: ['OPERATIVO', [Validators.required]],
      observaciones: ['', [Validators.maxLength(250)]],
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const req: DevolverPrestamoForm = {
      estadoDevolucion: val.estadoDevolucion,
      observaciones: val.observaciones?.trim() || null,
    };

    this.store.devolverEquipo(this.prestamo().id, req, () => {
      this.cerrado.emit(true);
    });
  }

  cerrar(): void {
    this.cerrado.emit(false);
  }

  obtenerError(campo: string): string | null {
    const ctrl = this.form.get(campo);
    if (!ctrl || !ctrl.touched || !ctrl.errors) return null;
    if (ctrl.errors['required']) return 'Este campo es obligatorio.';
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres.`;
    return 'Dato no válido.';
  }
}
