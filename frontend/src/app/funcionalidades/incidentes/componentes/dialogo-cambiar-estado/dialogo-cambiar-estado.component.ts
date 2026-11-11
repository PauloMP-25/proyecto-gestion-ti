import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AccionEstado } from '../../../../compartido/servicios/tickets/tickets.service';
import { DialogoAccesibleDirective } from '../../../../compartido/directivas/dialogo-accesible.directive';

const CONFIG = {
  iniciar: {
    titulo: 'Iniciar atención',
    descripcion: 'El ticket pasará a estado En atención.',
    etiqueta: 'Comentario (opcional)',
    confirmar: 'Iniciar',
  },
  cerrar: {
    titulo: 'Cerrar ticket',
    descripcion: 'Cierre el ticket con la conformidad del usuario.',
    etiqueta: 'Comentario (opcional)',
    confirmar: 'Cerrar',
  },
  reabrir: {
    titulo: 'Reabrir ticket',
    descripcion: 'Indique por qué la solución no fue conforme.',
    etiqueta: 'Motivo de reapertura *',
    confirmar: 'Reabrir',
  },
} as const;

@Component({
  selector: 'app-dialogo-cambiar-estado',
  imports: [ReactiveFormsModule, DialogoAccesibleDirective],
  templateUrl: './dialogo-cambiar-estado.component.html',
  styleUrl: './dialogo-cambiar-estado.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoCambiarEstadoComponent implements OnInit {
  private fb = inject(FormBuilder);

  readonly accion = input.required<AccionEstado>();
  readonly codigo = input.required<string>();
  readonly procesando = input(false);
  readonly alConfirmar = output<string | undefined>();
  readonly alCancelar = output<void>();

  readonly config = computed(() => CONFIG[this.accion()]);
  readonly esReabrir = computed(() => this.accion() === 'reabrir');

  readonly formulario = this.fb.group({
    texto: this.fb.control('', Validators.maxLength(500)),
  });

  ngOnInit(): void {
    if (this.esReabrir()) {
      this.formulario.controls.texto.setValidators([
        Validators.required, Validators.minLength(10), Validators.maxLength(500),
      ]);
      this.formulario.controls.texto.updateValueAndValidity();
    }
  }

  confirmar(): void {
    if (this.formulario.invalid || this.procesando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.alConfirmar.emit(this.formulario.getRawValue().texto!.trim() || undefined);
  }
}