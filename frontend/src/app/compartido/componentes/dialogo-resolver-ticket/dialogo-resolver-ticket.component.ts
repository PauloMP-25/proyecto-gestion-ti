import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
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
import { ResolverTicketPayload } from '../../modelos/dialogos-acciones.model';
import {
  minimoCaracteresUtiles,
  maximoCaracteresUtiles,
  textoUtil,
} from '../../utilidades/validadores-texto';
import {
  guardarBorrador,
  leerBorrador,
  eliminarBorrador,
} from '../../utilidades/borrador-local';

@Component({
  selector: 'app-dialogo-resolver-ticket',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogoAccesibleDirective,
    IconoComponent,
  ],
  templateUrl: './dialogo-resolver-ticket.component.html',
  styleUrl: './dialogo-resolver-ticket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogoResolverTicketComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly ticketId = input<number>(0);
  readonly codigo = input.required<string>();
  readonly equipoEtiqueta = input<string | null>(null);
  readonly procesando = input<boolean>(false);
  readonly articuloSugeridoId = input<number | null>(null);

  readonly alConfirmar = output<ResolverTicketPayload>();
  /** Para retrocompatibilidad con vistas que reciben texto plano */
  readonly alConfirmarTexto = output<string>();
  readonly alCancelar = output<void>();

  readonly form = this.fb.group({
    diagnostico: ['', [minimoCaracteresUtiles(20, 600)]],
    accionRealizada: ['', [minimoCaracteresUtiles(20, 1200)]],
    insumosUtilizados: ['', [maximoCaracteresUtiles(200)]],
    tipoSolucion: ['DEFINITIVA' as 'DEFINITIVA' | 'TEMPORAL'],
    articuloConocimientoId: [null as number | null],
  });

  readonly borradorGuardadoIso = signal<string | null>(null);
  readonly borradorRecuperado = signal<boolean>(false);
  readonly confirmandoDescarte = signal<boolean>(false);

  private get claveBorrador(): string {
    return `resolver:${this.ticketId() || this.codigo()}`;
  }

  readonly conteoDiagnostico = computed(() => textoUtil(this.form.controls.diagnostico.value).length);
  readonly conteoAccion = computed(() => textoUtil(this.form.controls.accionRealizada.value).length);
  readonly conteoInsumos = computed(() => textoUtil(this.form.controls.insumosUtilizados.value).length);

  ngOnInit(): void {
    if (this.articuloSugeridoId()) {
      this.form.controls.articuloConocimientoId.setValue(this.articuloSugeridoId());
    }
    this.restaurarBorrador();
    this.iniciarAutoguardado();
  }

  private restaurarBorrador(): void {
    const guardado = leerBorrador<Partial<ResolverTicketPayload>>(this.claveBorrador);
    if (guardado?.valor) {
      this.form.patchValue(guardado.valor);
      this.form.markAsDirty();
      this.borradorGuardadoIso.set(guardado.guardadoIso);
      this.borradorRecuperado.set(true);
    }
  }

  private iniciarAutoguardado(): void {
    const intervalo = setInterval(() => {
      if (this.form.dirty && !this.procesando()) {
        const val = this.form.getRawValue();
        const guardado = guardarBorrador(this.claveBorrador, val);
        if (guardado) {
          this.borradorGuardadoIso.set(new Date().toISOString());
        }
      }
    }, 5000);

    this.destroyRef.onDestroy(() => clearInterval(intervalo));
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
    eliminarBorrador(this.claveBorrador);
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

    const val = this.form.getRawValue();
    const payload: ResolverTicketPayload = {
      diagnostico: textoUtil(val.diagnostico),
      accionRealizada: textoUtil(val.accionRealizada),
      insumosUtilizados: val.insumosUtilizados ? textoUtil(val.insumosUtilizados) : undefined,
      tipoSolucion: val.tipoSolucion,
      articuloConocimientoId: val.articuloConocimientoId ?? undefined,
    };

    eliminarBorrador(this.claveBorrador);

    // Texto consolidado para llamadas anteriores que recibían un solo string
    const textoConsolidado = `Diagnóstico: ${payload.diagnostico}. Solución: ${payload.accionRealizada}`;

    this.alConfirmar.emit(payload);
    this.alConfirmarTexto.emit(textoConsolidado);
  }
}
