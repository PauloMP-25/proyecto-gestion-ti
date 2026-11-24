import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  ArticuloConocimiento,
  NivelDificultad,
} from '../../../../../compartido/modelos/articulo-conocimiento.model';
import { DialogoFormularioComponent } from '../../../../../compartido/ui/organismos/dialogo-formulario/dialogo-formulario.component';
import {
  BarraPestanasComponent,
  Pestana,
} from '../../../../../compartido/ui/moleculas/barra-pestanas/barra-pestanas.component';
import { BotonComponent } from '../../../../../compartido/ui/atomos/boton/boton.component';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { GuiaVista } from '../../modelos/guias.model';
import { CATEGORIAS_GUIA, categoriaPorId } from '../../utilidades/categorias-guia';
import { DetalleGuiaComponent } from '../detalle-guia/detalle-guia.component';

export interface GuardarArticuloPayload {
  titulo: string;
  categoriaId: number;
  categoriaNombre: string;
  resumen: string;
  contenidoHtml: string;
  sintoma: string;
  causaRaiz: string | null;
  solucionTemporal: string;
  pasos: string[];
  precauciones: string[];
  nivelDificultad: NivelDificultad;
  minutosEstimados: number;
  requiereTecnico: boolean;
  esPublico: boolean;
  palabrasClave: string[];
  equiposCompatibles: string[];
}

const PESTANAS_EDITOR: readonly Pestana[] = [
  { id: 'formulario', etiqueta: 'Formulario', icono: 'edit_note' },
  { id: 'vista-previa', etiqueta: 'Vista previa', icono: 'preview' },
];

const ENTIDADES_HTML: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (caracter) => ENTIDADES_HTML[caracter] ?? caracter);
}

function construirContenidoHtml(pasos: readonly string[]): string {
  const items = pasos.map((paso) => `<li>${escaparHtml(paso)}</li>`).join('');
  return `<ol>${items}</ol>`;
}

function separarEtiquetas(texto: string): string[] {
  return texto
    .split(',')
    .map((valor) => valor.trim())
    .filter((valor) => valor.length > 0);
}

@Component({
  selector: 'app-dialogo-articulo-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DialogoFormularioComponent,
    BarraPestanasComponent,
    BotonComponent,
    BotonIconoComponent,
    DetalleGuiaComponent,
  ],
  templateUrl: './dialogo-articulo-editor.component.html',
  styleUrl: './dialogo-articulo-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoArticuloEditorComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly articulo = input<ArticuloConocimiento | null>(null);
  readonly guardando = input<boolean>(false);

  readonly alGuardar = output<GuardarArticuloPayload>();
  readonly alCancelar = output<void>();

  protected readonly CATEGORIAS_GUIA = CATEGORIAS_GUIA;
  protected readonly PESTANAS = PESTANAS_EDITOR;
  protected readonly pestanaActiva = signal('formulario');
  protected readonly intentado = signal(false);

  private contenidoHtmlOriginal = '';

  protected readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(150)]],
    categoriaId: [1, [Validators.required]],
    sintoma: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(300)]],
    causaRaiz: ['', [Validators.maxLength(300)]],
    solucionTemporal: ['', [Validators.maxLength(300)]],
    nivelDificultad: this.fb.control<NivelDificultad>('BASICO'),
    minutosEstimados: [5, [Validators.required, Validators.min(1), Validators.max(240)]],
    requiereTecnico: [false],
    esPublico: [true],
    palabrasClave: [''],
    equiposCompatibles: [''],
    pasos: this.fb.array<FormControl<string>>([this.crearControlPaso('')]),
    precauciones: this.fb.array<FormControl<string>>([]),
  });

  private readonly valorFormulario = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  protected readonly titulo = computed(() =>
    this.articulo() ? 'Editar guía del Centro de Soluciones' : 'Nueva guía del Centro de Soluciones',
  );

  protected readonly requierePrecauciones = computed(() => {
    const valor = this.valorFormulario();
    return (
      valor.esPublico &&
      !valor.requiereTecnico &&
      !valor.precauciones.some((precaucion) => precaucion.trim().length >= 5)
    );
  });

  protected readonly vistaPrevia = computed<GuiaVista>(() => {
    const valor = this.valorFormulario();
    const categoria = categoriaPorId(valor.categoriaId);
    const pasos = valor.pasos.map((paso) => paso.trim()).filter((paso) => paso.length > 0);
    const precauciones = valor.precauciones
      .map((precaucion) => precaucion.trim())
      .filter((precaucion) => precaucion.length > 0);

    return {
      id: this.articulo()?.id ?? 0,
      titulo: valor.titulo,
      resumen: valor.sintoma,
      contenidoHtml: this.contenidoHtmlOriginal || construirContenidoHtml(pasos),
      categoriaId: categoria.id,
      categoriaNombre: categoria.etiqueta,
      palabrasClave: separarEtiquetas(valor.palabrasClave),
      equiposCompatibles: separarEtiquetas(valor.equiposCompatibles),
      esPublico: valor.esPublico,
      conteoUtil: this.articulo()?.conteoUtil ?? 0,
      fechaActualizacion: this.articulo()?.fechaActualizacion ?? new Date().toISOString(),
      sintoma: valor.sintoma,
      causaRaiz: valor.causaRaiz.trim() || null,
      solucionTemporal: valor.solucionTemporal,
      pasos,
      precauciones,
      nivelDificultad: valor.nivelDificultad,
      minutosEstimados: valor.minutosEstimados,
      requiereTecnico: valor.requiereTecnico,
      autorNombre: this.articulo()?.autorNombre ?? 'Equipo de soporte',
      categoria,
    };
  });

  protected get pasos(): FormArray<FormControl<string>> {
    return this.form.controls.pasos;
  }

  protected get precauciones(): FormArray<FormControl<string>> {
    return this.form.controls.precauciones;
  }

  ngOnInit(): void {
    const articulo = this.articulo();
    if (!articulo) {
      return;
    }

    this.contenidoHtmlOriginal = articulo.contenidoHtml;
    this.form.patchValue({
      titulo: articulo.titulo,
      categoriaId: articulo.categoriaId,
      sintoma: articulo.sintoma ?? articulo.resumen,
      causaRaiz: articulo.causaRaiz ?? '',
      solucionTemporal: articulo.solucionTemporal ?? '',
      nivelDificultad: articulo.nivelDificultad ?? 'BASICO',
      minutosEstimados: articulo.minutosEstimados ?? 5,
      requiereTecnico: articulo.requiereTecnico ?? false,
      esPublico: articulo.esPublico,
      palabrasClave: articulo.palabrasClave.join(', '),
      equiposCompatibles: articulo.equiposCompatibles.join(', '),
    });

    this.reemplazarPasos(articulo.pasos ?? []);
    this.reemplazarPrecauciones(articulo.precauciones ?? []);
  }

  protected agregarPaso(): void {
    this.pasos.push(this.crearControlPaso(''));
  }

  protected quitarPaso(indice: number): void {
    if (this.pasos.length > 1) {
      this.pasos.removeAt(indice);
    }
  }

  protected moverPaso(indice: number, direccion: -1 | 1): void {
    const destino = indice + direccion;
    if (destino < 0 || destino >= this.pasos.length) {
      return;
    }
    const actual = this.pasos.at(indice);
    this.pasos.setControl(indice, this.pasos.at(destino));
    this.pasos.setControl(destino, actual);
  }

  protected agregarPrecaucion(): void {
    this.precauciones.push(this.crearControlPrecaucion(''));
  }

  protected quitarPrecaucion(indice: number): void {
    this.precauciones.removeAt(indice);
  }

  protected guardar(): void {
    this.intentado.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.pestanaActiva.set('formulario');
      return;
    }

    if (this.requierePrecauciones()) {
      this.precauciones.markAsTouched();
      this.pestanaActiva.set('formulario');
      return;
    }

    const valor = this.form.getRawValue();
    const categoria = categoriaPorId(valor.categoriaId);
    const pasos = valor.pasos.map((paso) => paso.trim()).filter((paso) => paso.length > 0);
    const precauciones = valor.precauciones
      .map((precaucion) => precaucion.trim())
      .filter((precaucion) => precaucion.length > 0);

    this.alGuardar.emit({
      titulo: valor.titulo.trim(),
      categoriaId: categoria.id,
      categoriaNombre: categoria.etiqueta,
      resumen: valor.sintoma.trim(),
      contenidoHtml: this.contenidoHtmlOriginal || construirContenidoHtml(pasos),
      sintoma: valor.sintoma.trim(),
      causaRaiz: valor.causaRaiz.trim() || null,
      solucionTemporal: valor.solucionTemporal.trim(),
      pasos,
      precauciones,
      nivelDificultad: valor.nivelDificultad,
      minutosEstimados: valor.minutosEstimados,
      requiereTecnico: valor.requiereTecnico,
      esPublico: valor.esPublico,
      palabrasClave: separarEtiquetas(valor.palabrasClave),
      equiposCompatibles: separarEtiquetas(valor.equiposCompatibles),
    });
  }

  private crearControlPaso(valor: string): FormControl<string> {
    return this.fb.control(valor, [Validators.required, Validators.minLength(5)]);
  }

  private crearControlPrecaucion(valor: string): FormControl<string> {
    return this.fb.control(valor, [Validators.minLength(5)]);
  }

  private reemplazarPasos(valores: readonly string[]): void {
    this.pasos.clear();
    for (const valor of valores.length > 0 ? valores : ['']) {
      this.pasos.push(this.crearControlPaso(valor));
    }
  }

  private reemplazarPrecauciones(valores: readonly string[]): void {
    this.precauciones.clear();
    for (const valor of valores) {
      this.precauciones.push(this.crearControlPrecaucion(valor));
    }
  }
}
