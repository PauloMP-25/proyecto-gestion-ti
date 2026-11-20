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
import { CatalogosStore } from '../../../../../compartido/catalogos/catalogos.store';
import {
  GradoProfesional,
  nombreVisible,
} from '../../../../../compartido/catalogos/grado-profesional.enum';
import { AreasApi } from '../../../areas/servicios/areas.api';
import { AreaResumen } from '../../../areas/modelos/areas.model';
import { PersonalStore } from '../../estado/personal.store';
import {
  PersonalItem,
  PersonalRegistroForm,
  PersonalActualizarForm,
} from '../../modelos/personal.model';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import { aplicarErroresServidor } from '../../../../../compartido/utilidades/errores-formulario';

import { SeccionDatosPersonalesComponent } from './secciones/seccion-datos-personales/seccion-datos-personales.component';
import { SeccionAsignacionAreaComponent } from './secciones/seccion-asignacion-area/seccion-asignacion-area.component';
import { SeccionCredencialesComponent } from './secciones/seccion-credenciales/seccion-credenciales.component';

@Component({
  selector: 'app-dialogo-personal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    SeccionDatosPersonalesComponent,
    SeccionAsignacionAreaComponent,
    SeccionCredencialesComponent,
  ],
  templateUrl: './dialogo-personal.component.html',
  styleUrl: './dialogo-personal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoPersonalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly catalogosStore = inject(CatalogosStore);
  private readonly areasApi = inject(AreasApi);
  private readonly personalStore = inject(PersonalStore);

  readonly personalParaEditar = input<PersonalItem | null>(null);
  readonly idAreaPreseleccionada = input<number | null>(null);

  readonly guardado = output<{
    personal: PersonalItem;
    contrasenaTemporal?: string;
  }>();
  readonly cancelado = output<void>();

  readonly areas = signal<AreaResumen[]>([]);
  readonly guardando = signal<boolean>(false);
  readonly errorGeneral = signal<string | null>(null);

  form!: FormGroup;
  readonly vistaPreviaNombre = signal<string>('');

  ngOnInit(): void {
    this.catalogosStore.cargar();
    this.areasApi.listar({ incluirInactivas: false }).subscribe({
      next: (lista) => this.areas.set(lista),
    });

    const item = this.personalParaEditar();
    const areaIdInicial = item?.idArea ?? this.idAreaPreseleccionada() ?? null;

    this.form = this.fb.group({
      grado: [item ? item.grado : GradoProfesional.SIN_GRADO, [Validators.required]],
      nombres: [item ? item.nombre : '', [Validators.required]],
      apellidos: [item ? item.apellidos : '', [Validators.required]],
      idArea: [areaIdInicial, [Validators.required]],
      correo: [item ? item.correo : '', [Validators.required, Validators.email]],
      nombreUsuario: [item ? item.nombreUsuario : ''],
      rol: [item ? item.rol : 'USUARIO_FINAL', [Validators.required]],
      generarContrasena: [true],
      contrasena: [''],
    });

    this.actualizarVistaPrevia();
  }

  onNombresApellidosChange(): void {
    this.actualizarVistaPrevia();

    if (!this.personalParaEditar()) {
      const nombres = this.form.get('nombres')?.value || '';
      const apellidos = this.form.get('apellidos')?.value || '';

      const pNombre = nombres.trim().split(/\s+/)[0] || '';
      const pApellido = apellidos.trim().split(/\s+/)[0] || '';

      if (pNombre && pApellido) {
        const usuarioSugerido = `${pNombre[0]}${pApellido}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

        if (!this.form.get('nombreUsuario')?.dirty) {
          this.form.patchValue({ nombreUsuario: usuarioSugerido });
        }

        if (!this.form.get('correo')?.dirty) {
          this.form.patchValue({ correo: `${usuarioSugerido}@hospital.gob.pe` });
        }
      }
    }
  }

  actualizarVistaPrevia(): void {
    const grado = this.form?.get('grado')?.value;
    const nombres = this.form?.get('nombres')?.value;
    const apellidos = this.form?.get('apellidos')?.value;
    this.vistaPreviaNombre.set(nombreVisible(grado, nombres, apellidos));
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorGeneral.set(null);

    const item = this.personalParaEditar();

    if (item) {
      const formAct: PersonalActualizarForm = {
        grado: this.form.value.grado,
        nombres: this.form.value.nombres,
        apellidos: this.form.value.apellidos,
        idArea: Number(this.form.value.idArea),
        rol: this.form.value.rol,
        correo: this.form.value.correo,
        nombreUsuario: this.form.value.nombreUsuario || null,
      };

      this.personalStore.actualizar(item.id, formAct).subscribe({
        next: (act) => {
          this.guardando.set(false);
          this.guardado.emit({ personal: act });
        },
        error: (err) => {
          this.guardando.set(false);
          const msj = aplicarErroresServidor(this.form, err);
          if (msj) this.errorGeneral.set(msj);
        },
      });
    } else {
      const formReg: PersonalRegistroForm = {
        grado: this.form.value.grado,
        nombres: this.form.value.nombres,
        apellidos: this.form.value.apellidos,
        idArea: Number(this.form.value.idArea),
        correo: this.form.value.correo,
        nombreUsuario: this.form.value.nombreUsuario || null,
        rol: this.form.value.rol,
        generarContrasena: !!this.form.value.generarContrasena,
        contrasena: this.form.value.contrasena || null,
      };

      this.personalStore.crear(formReg).subscribe({
        next: (creado) => {
          this.guardando.set(false);
          this.guardado.emit({
            personal: creado,
            contrasenaTemporal: creado.contrasenaTemporal,
          });
        },
        error: (err) => {
          this.guardando.set(false);
          const msj = aplicarErroresServidor(this.form, err);
          if (msj) this.errorGeneral.set(msj);
        },
      });
    }
  }

  cerrar(): void {
    this.cancelado.emit();
  }
}
