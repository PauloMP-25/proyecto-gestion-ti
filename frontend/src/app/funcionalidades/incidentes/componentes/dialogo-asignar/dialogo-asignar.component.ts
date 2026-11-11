import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Tecnico } from '../../../../compartido/modelos/ticket.dto';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { DialogoAccesibleDirective } from '../../../../compartido/directivas/dialogo-accesible.directive';

export interface ResultadoAsignar {
  idTecnico: number;
  comentario?: string;
}

@Component({
  selector: 'app-dialogo-asignar',
  imports: [ReactiveFormsModule, DialogoAccesibleDirective],
  templateUrl: './dialogo-asignar.component.html',
  styleUrl: './dialogo-asignar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoAsignarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ticketsService = inject(TicketsService);
  private destroyRef = inject(DestroyRef);

  readonly codigo = input.required<string>();
  readonly procesando = input(false);
  readonly alConfirmar = output<ResultadoAsignar>();
  readonly alCancelar = output<void>();

  readonly tecnicos = signal<Tecnico[]>([]);

  readonly formulario = this.fb.group({
    idTecnico: this.fb.control<number | null>(null, Validators.required),
    comentario: this.fb.control('', Validators.maxLength(500)),
  });

  ngOnInit(): void {
    this.ticketsService.tecnicos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(t => this.tecnicos.set(t));
  }

  confirmar(): void {
    if (this.formulario.invalid || this.procesando()) {
      this.formulario.markAllAsTouched();
      return;
    }
    const v = this.formulario.getRawValue();
    this.alConfirmar.emit({
      idTecnico: v.idTecnico!,
      comentario: v.comentario!.trim() || undefined,
    });
  }
}