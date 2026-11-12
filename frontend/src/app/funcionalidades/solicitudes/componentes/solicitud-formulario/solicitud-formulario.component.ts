import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Categoria, ContextoCliente, CrearTicketDto } from '../../../../compartido/modelos/ticket.dto';
import { Impacto, TipoTicket, Urgencia } from '../../../../compartido/modelos/impacto-urgencia.enum';
import { Ticket } from '../../../../compartido/modelos/ticket.model';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { ContextoClienteService } from '../../../../nucleo/servicios/contexto-cliente.service';
import { PrioridadPreviaService } from '../../servicios/prioridad-previa.service';
import { ContextoEquipoComponent } from '../../../../compartido/ui/moleculas/contexto-equipo/contexto-equipo.component';
import { PrioridadInsigniaComponent } from '../../../../compartido/ui/atomos/prioridad-insignia/prioridad-insignia.component';
import { EsqueletoComponent } from '../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

const CLAVE_BORRADOR = 'hsmsi_borrador_ticket';

interface BorradorTicket {
  tipo: TipoTicket;
  idCategoria: number | null;
  impacto: Impacto;
  urgencia: Urgencia;
  titulo: string;
  descripcion: string;
  anexoContacto: string;
  hora: string;
}

@Component({
  selector: 'app-solicitud-formulario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContextoEquipoComponent,
    PrioridadInsigniaComponent,
    EsqueletoComponent,
    IconoComponent,
  ],
  templateUrl: './solicitud-formulario.component.html',
  styleUrl: './solicitud-formulario.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitudFormularioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ticketsService = inject(TicketsService);
  private contextoService = inject(ContextoClienteService);
  private prioridadPrevia = inject(PrioridadPreviaService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  readonly alRegistrarExitoso = output<Ticket>();
  readonly alCancelar = output<void>();

  readonly tipo = signal<TipoTicket>('INCIDENTE');
  readonly impacto = signal<Impacto>('ALTO');
  readonly urgencia = signal<Urgencia>('ALTA');
  readonly contexto = signal<ContextoCliente | null>(null);
  readonly categorias = signal<Categoria[]>([]);
  readonly guardando = signal(false);
  readonly horaBorrador = signal<string | null>(null);

  readonly previa = computed(() => this.prioridadPrevia.calcular(this.impacto(), this.urgencia()));

  readonly formulario = this.fb.group({
    idCategoria: this.fb.control<number | null>(null, Validators.required),
    titulo: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    descripcion: this.fb.control('', [Validators.required, Validators.minLength(15), Validators.maxLength(2000)]),
    anexoContacto: this.fb.control('', Validators.maxLength(10)),
  });

  private ultimoBorrador = '';

  constructor() {
    const intervalo = setInterval(() => this.guardarBorrador(), 5000);
    this.destroyRef.onDestroy(() => clearInterval(intervalo));
  }

  ngOnInit(): void {
    this.restaurarBorrador();

    const catParam = this.route.snapshot.queryParamMap.get('categoria');
    const catIdUrl = catParam ? parseInt(catParam, 10) : null;

    this.contextoService.obtener().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(c => {
      this.contexto.set(c);
      if (!this.formulario.controls.anexoContacto.value && c.anexo) {
        this.formulario.controls.anexoContacto.setValue(c.anexo);
      }
    });

    this.ticketsService.categorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(lista => {
      this.categorias.set(lista);
      if (catIdUrl && !isNaN(catIdUrl) && lista.some(c => c.id === catIdUrl)) {
        this.formulario.controls.idCategoria.setValue(catIdUrl);
      } else if (this.formulario.controls.idCategoria.value == null && lista.length > 0) {
        this.formulario.controls.idCategoria.setValue(lista[0].id);
      }
    });
  }

  seleccionarTipo(tipo: TipoTicket): void {
    this.tipo.set(tipo);
  }

  seleccionarImpacto(impacto: Impacto): void {
    this.impacto.set(impacto);
  }

  seleccionarUrgencia(urgencia: Urgencia): void {
    this.urgencia.set(urgencia);
  }

  enviar(): void {
    if (this.guardando()) return;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const valores = this.formulario.getRawValue();
    const dto: CrearTicketDto = {
      tipo: this.tipo(),
      idCategoria: valores.idCategoria!,
      impacto: this.impacto(),
      urgencia: this.urgencia(),
      titulo: valores.titulo!.trim(),
      descripcion: valores.descripcion!.trim(),
      anexoContacto: valores.anexoContacto!.trim() || undefined,
    };
    this.ticketsService.crear(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ticket => {
        localStorage.removeItem(CLAVE_BORRADOR);
        this.alRegistrarExitoso.emit(ticket);
      },
      error: () => this.guardando.set(false),
    });
  }

  cancelar(): void {
    this.alCancelar.emit();
  }

  private snapshot(): BorradorTicket {
    const v = this.formulario.getRawValue();
    return {
      tipo: this.tipo(),
      idCategoria: v.idCategoria,
      impacto: this.impacto(),
      urgencia: this.urgencia(),
      titulo: v.titulo ?? '',
      descripcion: v.descripcion ?? '',
      anexoContacto: v.anexoContacto ?? '',
      hora: '',
    };
  }

  private guardarBorrador(): void {
    if (this.guardando()) return;
    const borrador = this.snapshot();
    const hayContenido = borrador.titulo.trim() !== '' || borrador.descripcion.trim() !== '';
    const serializado = JSON.stringify({ ...borrador, hora: '' });
    if (!hayContenido || serializado === this.ultimoBorrador) return;
    borrador.hora = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
    this.ultimoBorrador = serializado;
    this.horaBorrador.set(borrador.hora);
  }

  private restaurarBorrador(): void {
    const crudo = localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return;
    try {
      const b: BorradorTicket = JSON.parse(crudo);
      this.tipo.set(b.tipo);
      this.impacto.set(b.impacto);
      this.urgencia.set(b.urgencia);
      this.formulario.patchValue({
        idCategoria: b.idCategoria,
        titulo: b.titulo,
        descripcion: b.descripcion,
        anexoContacto: b.anexoContacto,
      });
      this.ultimoBorrador = JSON.stringify({ ...b, hora: '' });
      this.horaBorrador.set(b.hora);
    } catch {
      localStorage.removeItem(CLAVE_BORRADOR);
    }
  }
}