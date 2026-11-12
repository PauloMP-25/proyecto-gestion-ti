import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogoAccesibleDirective } from '../../directivas/dialogo-accesible.directive';
import { IconoComponent } from '../../ui/atomos/icono/icono.component';
import { EscalarTicketPayload } from '../../modelos/dialogos-acciones.model';
import {
  minimoCaracteresUtiles,
  textoUtil,
} from '../../utilidades/validadores-texto';

@Component({
  selector: 'app-dialogo-escalar-ticket',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogoAccesibleDirective,
    IconoComponent,
  ],
  templateUrl: './dialogo-escalar-ticket.component.html',
  styleUrl: './dialogo-escalar-ticket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoEscalarTicketComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly ticketId = input<number>(0);
  readonly codigo = input.required<string>();
  readonly titulo = input<string>('');
  readonly procesando = input<boolean>(false);

  readonly alConfirmar = output<EscalarTicketPayload>();
  readonly alConfirmarTexto = output<string>();
  readonly alCancelar = output<void>();

  readonly form = this.fb.group({
    motivo: ['', [minimoCaracteresUtiles(20, 300)]],
  });

  readonly confirmandoDescarte = signal<boolean>(false);

  readonly sugerencias = [
    'Servidor / base de datos',
    'Red troncal hospitalaria',
    'Proveedor de internet',
    'Falla física de hardware',
  ];

  readonly conteoMotivo = computed(() => textoUtil(this.form.controls.motivo.value).length);

  aplicarSugerencia(sugerencia: string): void {
    const actual = this.form.controls.motivo.value.trim();
    if (!actual) {
      this.form.controls.motivo.setValue(`Falla diagnosticada en ${sugerencia}. Se realizaron pruebas iniciales y se descarta problema local.`);
    } else {
      this.form.controls.motivo.setValue(`${actual} (Causa probable: ${sugerencia}).`);
    }
    this.form.markAsDirty();
  }

  intentarCerrar(): void {
    if (this.procesando()) return;

    if (this.form.dirty) {
      this.confirmandoDescarte.set(true);
    } else {
      this.alCancelar.emit();
    }
  }

  confirmarDescarte(): void {
    this.confirmandoDescarte.set(false);
    this.alCancelar.emit();
  }

  cancelarDescarte(): void {
    this.confirmandoDescarte.set(false);
  }

  enviar(): void {
    if (this.form.invalid || this.procesando()) {
      this.form.markAllAsTouched();
      return;
    }

    const motivoSaneado = textoUtil(this.form.controls.motivo.value);
    const payload: EscalarTicketPayload = {
      motivo: motivoSaneado,
    };

    this.alConfirmar.emit(payload);
    this.alConfirmarTexto.emit(motivoSaneado);
  }
}
