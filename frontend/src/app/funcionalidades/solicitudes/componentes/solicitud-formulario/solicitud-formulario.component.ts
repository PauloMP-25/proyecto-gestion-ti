import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, computed, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Area, Categoria } from '../../../../compartido/modelos/ticket.dto';
import { Impacto, TipoTicket, Urgencia } from '../../../../compartido/modelos/impacto-urgencia.enum';
import { Ticket } from '../../../../compartido/modelos/ticket.model';
import { TicketsService } from '../../../../compartido/servicios/tickets/tickets.service';
import { ContextoAtencionApi } from '../../../portal-asistencial/servicios/contexto-atencion.api';
import {
  ContextoAtencion,
  ObjetivoFalla,
  ReportarProblemaSolicitud,
} from '../../../portal-asistencial/modelos/contexto-atencion.model';
import { PrioridadPreviaService } from '../../servicios/prioridad-previa.service';
import { ContextoEquipoComponent } from '../../../../compartido/ui/moleculas/contexto-equipo/contexto-equipo.component';
import {
  SelectorObjetivoFallaComponent,
  SeleccionObjetivo,
} from '../../../../compartido/ui/moleculas/selector-objetivo-falla/selector-objetivo-falla.component';
import { PrioridadInsigniaComponent } from '../../../../compartido/ui/atomos/prioridad-insignia/prioridad-insignia.component';
import { EsqueletoComponent } from '../../../../compartido/ui/atomos/esqueleto/esqueleto.component';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';

import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

const CLAVE_BORRADOR = 'hsmsi_borrador_ticket_v2';

export interface SintomaAsistencial {
  id: string;
  icono: string;
  titulo: string;
  subtitulo: string;
  categoriaSugerida: string;
  tipoTicket: TipoTicket;
  impactoSugerido: Impacto;
  urgenciaSugerida: Urgencia;
  asuntoSugerido: string;
}

interface BorradorTicket {
  tipo: TipoTicket;
  idCategoria: number | null;
  impacto: Impacto;
  urgencia: Urgencia;
  objetivo: ObjetivoFalla;
  idImpresora: number | null;
  idAreaManual: number | null;
  titulo: string;
  descripcion: string;
  anexoContacto: string;
  solicitanteNombre?: string;
  solicitanteCargo?: string;
  equipoInventario?: string;
  sintomaId?: string | null;
  hora: string;
}

@Component({
  selector: 'app-solicitud-formulario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContextoEquipoComponent,
    SelectorObjetivoFallaComponent,
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
  private contextoApi = inject(ContextoAtencionApi);
  private prioridadPrevia = inject(PrioridadPreviaService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  readonly alRegistrarExitoso = output<Ticket>();
  readonly alCancelar = output<void>();

  readonly esUsuarioFinal = computed(
    () => this.authService.rolActual() === RolUsuario.USUARIO_FINAL
  );

  readonly esTecnico = computed(
    () =>
      this.authService.rolActual() === RolUsuario.PRACTICANTE ||
      this.authService.rolActual() === RolUsuario.ADMINISTRADOR
  );

  readonly sintomasAsistenciales: SintomaAsistencial[] = [
    {
      id: 'galenhos',
      icono: 'desktop_windows',
      titulo: 'GalenHos / Historia Clínica',
      subtitulo: 'Sistema lento, bloqueado o error al guardar atención médica',
      categoriaSugerida: 'GalenHos',
      tipoTicket: 'INCIDENTE',
      impactoSugerido: 'ALTO',
      urgenciaSugerida: 'ALTA',
      asuntoSugerido: 'Falla o lentitud en sistema GalenHos / Historia Clínica',
    },
    {
      id: 'impresora',
      icono: 'print',
      titulo: 'Impresora de Recetas / Tickets',
      subtitulo: 'Atasco de papel, no imprime o desconectada en ventanilla o consultorio',
      categoriaSugerida: 'Impresora',
      tipoTicket: 'INCIDENTE',
      impactoSugerido: 'MEDIO',
      urgenciaSugerida: 'ALTA',
      asuntoSugerido: 'Impresora no imprime recetas o tickets de atención',
    },
    {
      id: 'red',
      icono: 'wifi_off',
      titulo: 'Sin Red / Internet',
      subtitulo: 'Cable desconectado o sin acceso a red interna hospitalaria',
      categoriaSugerida: 'Red',
      tipoTicket: 'INCIDENTE',
      impactoSugerido: 'MEDIO',
      urgenciaSugerida: 'ALTA',
      asuntoSugerido: 'Sin conexión a la red interna hospitalaria',
    },
    {
      id: 'usuario',
      icono: 'lock_reset',
      titulo: 'Usuario o Clave Bloqueada',
      subtitulo: 'Desbloqueo de cuenta institucional o restablecimiento de contraseña',
      categoriaSugerida: 'Cuentas',
      tipoTicket: 'SOLICITUD',
      impactoSugerido: 'BAJO',
      urgenciaSugerida: 'MEDIA',
      asuntoSugerido: 'Desbloqueo o restablecimiento de acceso de usuario',
    },
    {
      id: 'equipo',
      icono: 'computer',
      titulo: 'Computadora / Monitor',
      subtitulo: 'No enciende, pantalla azul o periférico averiado',
      categoriaSugerida: 'Hardware',
      tipoTicket: 'INCIDENTE',
      impactoSugerido: 'BAJO',
      urgenciaSugerida: 'MEDIA',
      asuntoSugerido: 'Computadora o monitor no responde en consultorio',
    },
    {
      id: 'otro',
      icono: 'help_outline',
      titulo: 'Otro Inconveniente',
      subtitulo: 'Escriba libremente los detalles de su necesidad',
      categoriaSugerida: 'General',
      tipoTicket: 'INCIDENTE',
      impactoSugerido: 'BAJO',
      urgenciaSugerida: 'BAJA',
      asuntoSugerido: '',
    },
  ];

  readonly sintomaSeleccionadoId = signal<string | null>(null);

  readonly tipo = signal<TipoTicket>('INCIDENTE');
  readonly impacto = signal<Impacto>('ALTO');
  readonly urgencia = signal<Urgencia>('ALTA');
  readonly contexto = signal<ContextoAtencion | null>(null);
  readonly objetivo = signal<ObjetivoFalla>('EQUIPO_ACTUAL');
  readonly idImpresora = signal<number | null>(null);
  readonly idAreaManual = signal<number | null>(null);

  readonly categorias = signal<Categoria[]>([]);
  readonly areas = signal<Area[]>([]);
  readonly guardando = signal(false);
  readonly errorServidor = signal<string | null>(null);
  readonly horaBorrador = signal<string | null>(null);

  readonly previa = computed(() => this.prioridadPrevia.calcular(this.impacto(), this.urgencia()));

  readonly esNoDetectado = computed(() => {
    const c = this.contexto();
    return c != null && c.estadoDeteccion !== 'DETECTADO';
  });

  readonly formulario = this.fb.group({
    idCategoria: this.fb.control<number | null>(null),
    idAreaManual: this.fb.control<number | null>(null),
    titulo: this.fb.control('', [Validators.required, Validators.maxLength(150)]),
    descripcion: this.fb.control('', [Validators.required, Validators.minLength(15), Validators.maxLength(2000)]),
    anexoContacto: this.fb.control('', Validators.maxLength(10)),
    solicitanteNombre: this.fb.control('', Validators.maxLength(100)),
    solicitanteCargo: this.fb.control('', Validators.maxLength(80)),
    equipoInventario: this.fb.control('', Validators.maxLength(50)),
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

    this.contextoApi
      .obtenerContexto()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: c => {
          this.contexto.set(c);

          if (c.estadoDeteccion !== 'DETECTADO') {
            this.objetivo.set('OTRO');
            if (c.persona?.areaAdscrita?.id && !this.formulario.controls.idAreaManual.value) {
              this.formulario.controls.idAreaManual.setValue(c.persona.areaAdscrita.id);
              this.idAreaManual.set(c.persona.areaAdscrita.id);
            }
          }

          if (!this.formulario.controls.anexoContacto.value && c.area?.anexo) {
            this.formulario.controls.anexoContacto.setValue(c.area.anexo);
          }
        },
        error: () => {
          this.objetivo.set('OTRO');
        },
      });

    this.ticketsService
      .areas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lista => {
        this.areas.set(lista);
      });

    this.ticketsService
      .categorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(lista => {
        this.categorias.set(lista);
        if (catIdUrl && !isNaN(catIdUrl) && lista.some(c => c.id === catIdUrl)) {
          this.formulario.controls.idCategoria.setValue(catIdUrl);
        } else if (this.formulario.controls.idCategoria.value == null && lista.length > 0) {
          this.formulario.controls.idCategoria.setValue(lista[0].id);
        }
      });

    this.formulario.controls.idAreaManual.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => this.idAreaManual.set(val));
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

  seleccionarSintoma(sintoma: SintomaAsistencial): void {
    this.sintomaSeleccionadoId.set(sintoma.id);
    this.tipo.set(sintoma.tipoTicket);
    this.impacto.set(sintoma.impactoSugerido);
    this.urgencia.set(sintoma.urgenciaSugerida);

    if (sintoma.id === 'impresora') {
      this.objetivo.set('IMPRESORA_AREA');
    } else if (sintoma.id === 'equipo') {
      this.objetivo.set('EQUIPO_ACTUAL');
    }

    const catEncontrada = this.categorias().find((c) =>
      c.nombre.toLowerCase().includes(sintoma.categoriaSugerida.toLowerCase())
    );
    if (catEncontrada) {
      this.formulario.controls.idCategoria.setValue(catEncontrada.id);
    }

    const tituloActual = this.formulario.controls.titulo.value?.trim() || '';
    if (!tituloActual || this.sintomasAsistenciales.some((s) => s.asuntoSugerido === tituloActual)) {
      if (sintoma.asuntoSugerido) {
        this.formulario.controls.titulo.setValue(sintoma.asuntoSugerido);
      }
    }
  }

  alCambiarObjetivo(seleccion: SeleccionObjetivo): void {
    this.objetivo.set(seleccion.objetivo);
    this.idImpresora.set(seleccion.idImpresora ?? null);
  }

  enviar(): void {
    if (this.guardando()) return;
    this.errorServidor.set(null);

    if (this.esTecnico() && !this.formulario.controls.solicitanteNombre.value?.trim()) {
      this.formulario.controls.solicitanteNombre.setErrors({ required: true });
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const valores = this.formulario.getRawValue();

    let descripcionFinal = valores.descripcion!.trim();
    if (this.esTecnico() && valores.solicitanteNombre?.trim()) {
      const cargo = valores.solicitanteCargo?.trim() ? ` (${valores.solicitanteCargo.trim()})` : '';
      const equipo = valores.equipoInventario?.trim() ? `\n[EQUIPO AFECTADO / CMDB: ${valores.equipoInventario.trim()}]` : '';
      descripcionFinal = `[REGISTRADO PARA: ${valores.solicitanteNombre.trim()}${cargo}]${equipo}\n\n${descripcionFinal}`;
    }

    const solicitud: ReportarProblemaSolicitud = {
      tipo: this.tipo(),
      asunto: valores.titulo!.trim(),
      descripcion: descripcionFinal,
      impacto: this.impacto(),
      urgencia: this.urgencia(),
      objetivo: this.objetivo(),
      idImpresora: this.idImpresora(),
      idAreaManual: this.esNoDetectado() ? valores.idAreaManual : null,
    };

    this.contextoApi
      .reportarProblema(solicitud)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ticket => {
          localStorage.removeItem(CLAVE_BORRADOR);
          this.alRegistrarExitoso.emit(ticket);
        },
        error: err => {
          this.guardando.set(false);
          const msg =
            err?.error?.message ??
            err?.message ??
            'Ocurrió un error al registrar el ticket. Por favor intente nuevamente.';
          this.errorServidor.set(msg);
        },
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
      objetivo: this.objetivo(),
      idImpresora: this.idImpresora(),
      idAreaManual: v.idAreaManual,
      titulo: v.titulo ?? '',
      descripcion: v.descripcion ?? '',
      anexoContacto: v.anexoContacto ?? '',
      solicitanteNombre: v.solicitanteNombre ?? '',
      solicitanteCargo: v.solicitanteCargo ?? '',
      equipoInventario: v.equipoInventario ?? '',
      sintomaId: this.sintomaSeleccionadoId(),
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
      if (b.objetivo) this.objetivo.set(b.objetivo);
      if (b.idImpresora) this.idImpresora.set(b.idImpresora);
      if (b.sintomaId) this.sintomaSeleccionadoId.set(b.sintomaId);
      this.formulario.patchValue({
        idCategoria: b.idCategoria,
        idAreaManual: b.idAreaManual,
        titulo: b.titulo,
        descripcion: b.descripcion,
        anexoContacto: b.anexoContacto,
        solicitanteNombre: b.solicitanteNombre ?? '',
        solicitanteCargo: b.solicitanteCargo ?? '',
        equipoInventario: b.equipoInventario ?? '',
      });
      this.ultimoBorrador = JSON.stringify({ ...b, hora: '' });
      this.horaBorrador.set(b.hora);
    } catch {
      localStorage.removeItem(CLAVE_BORRADOR);
    }
  }
}