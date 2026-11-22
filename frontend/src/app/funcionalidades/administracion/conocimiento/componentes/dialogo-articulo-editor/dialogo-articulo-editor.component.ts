import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ArticuloConocimiento } from '../../../../../compartido/modelos/articulo-conocimiento.model';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';

export interface GuardarArticuloPayload {
  titulo: string;
  categoriaId: number;
  categoriaNombre: string;
  resumen: string;
  contenidoHtml: string;
  esPublico: boolean;
  palabrasClave: string[];
  equiposCompatibles: string[];
}

@Component({
  selector: 'app-dialogo-articulo-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconoComponent],
  templateUrl: './dialogo-articulo-editor.component.html',
  styleUrls: ['./dialogo-articulo-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoArticuloEditorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly articulo = input<ArticuloConocimiento | null>(null);
  readonly guardando = input<boolean>(false);

  readonly alGuardar = output<GuardarArticuloPayload>();
  readonly alCancelar = output<void>();

  readonly categorias = [
    { id: 1, nombre: 'Sistemas e Historias Clínicas (GalenHos/HIS)' },
    { id: 2, nombre: 'Red y Conectividad Hospitalaria' },
    { id: 3, nombre: 'Impresoras y Periféricos Asistenciales' },
    { id: 4, nombre: 'Cuentas de Usuario y Accesos' },
    { id: 5, nombre: 'Equipamiento de Cómputo General' },
  ];

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
    categoriaId: [1, [Validators.required]],
    resumen: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    contenidoHtml: ['', [Validators.required, Validators.minLength(20)]],
    esPublico: [true],
    palabrasClave: [''],
    equiposCompatibles: [''],
  });

  ngOnInit(): void {
    const art = this.articulo();
    if (art) {
      this.form.patchValue({
        titulo: art.titulo,
        categoriaId: art.categoriaId,
        resumen: art.resumen,
        contenidoHtml: art.contenidoHtml,
        esPublico: art.esPublico,
        palabrasClave: art.palabrasClave ? art.palabrasClave.join(', ') : '',
        equiposCompatibles: art.equiposCompatibles ? art.equiposCompatibles.join(', ') : '',
      });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valor = this.form.getRawValue();
    const cat = this.categorias.find((c) => c.id === valor.categoriaId);

    const payload: GuardarArticuloPayload = {
      titulo: valor.titulo.trim(),
      categoriaId: valor.categoriaId,
      categoriaNombre: cat ? cat.nombre : 'General',
      resumen: valor.resumen.trim(),
      contenidoHtml: valor.contenidoHtml.trim(),
      esPublico: valor.esPublico,
      palabrasClave: valor.palabrasClave
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
      equiposCompatibles: valor.equiposCompatibles
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0),
    };

    this.alGuardar.emit(payload);
  }
}
