import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { ContextoAtencionApi } from '../servicios/contexto-atencion.api';
import {
  ContextoAtencion,
  ObjetivoFalla,
  ReportarProblemaSolicitud,
} from '../modelos/contexto-atencion.model';
import { Ticket } from '../../../compartido/modelos/ticket.model';
import { TipoTicket, Impacto, Urgencia } from '../../../compartido/modelos/impacto-urgencia.enum';

@Injectable({ providedIn: 'root' })
export class ReporteProblemaStore {
  private readonly api = inject(ContextoAtencionApi);

  readonly contexto = signal<ContextoAtencion | null>(null);
  readonly cargandoContexto = signal(false);
  readonly errorContexto = signal<string | null>(null);

  readonly objetivo = signal<ObjetivoFalla>('EQUIPO_ACTUAL');
  readonly idImpresora = signal<number | null>(null);
  readonly idAreaManual = signal<number | null>(null);

  readonly enviando = signal(false);
  readonly errorEnvio = signal<string | null>(null);

  readonly tieneEquipoDetectado = computed(
    () => this.contexto()?.estadoDeteccion === 'DETECTADO' && !!this.contexto()?.equipo
  );

  readonly impresorasDisponibles = computed(
    () => this.contexto()?.impresorasArea ?? []
  );

  readonly esPersonaEnOtraArea = computed(
    () => !!this.contexto()?.personaEnOtraArea
  );

  cargarContexto(): void {
    if (this.cargandoContexto()) return;
    this.cargandoContexto.set(true);
    this.errorContexto.set(null);

    this.api.obtenerContexto().subscribe({
      next: ctx => {
        this.contexto.set(ctx);
        this.cargandoContexto.set(false);

        // Si no se detectó equipo, por defecto seleccionar OTRO
        if (ctx.estadoDeteccion !== 'DETECTADO') {
          this.objetivo.set('OTRO');
          if (ctx.persona?.areaAdscrita?.id) {
            this.idAreaManual.set(ctx.persona.areaAdscrita.id);
          }
        } else {
          this.objetivo.set('EQUIPO_ACTUAL');
        }
      },
      error: err => {
        this.errorContexto.set('No fue posible detectar la ubicación de la red.');
        this.cargandoContexto.set(false);
        this.objetivo.set('OTRO');
      },
    });
  }

  seleccionarObjetivo(obj: ObjetivoFalla, idImpresora?: number | null): void {
    this.objetivo.set(obj);
    if (obj === 'IMPRESORA_AREA') {
      this.idImpresora.set(idImpresora ?? null);
    } else {
      this.idImpresora.set(null);
    }
  }

  seleccionarAreaManual(idArea: number | null): void {
    this.idAreaManual.set(idArea);
  }

  enviarReporte(datos: {
    tipo: TipoTicket;
    asunto: string;
    descripcion: string;
    impacto: Impacto;
    urgencia: Urgencia;
  }): Observable<Ticket> {
    this.enviando.set(true);
    this.errorEnvio.set(null);

    const solicitud: ReportarProblemaSolicitud = {
      tipo: datos.tipo,
      asunto: datos.asunto,
      descripcion: datos.descripcion,
      impacto: datos.impacto,
      urgencia: datos.urgencia,
      objetivo: this.objetivo(),
      idImpresora: this.idImpresora(),
      idAreaManual: this.idAreaManual(),
    };

    return this.api.reportarProblema(solicitud).pipe(
      tap(() => {
        this.enviando.set(false);
      }),
      catchError(err => {
        this.enviando.set(false);
        this.errorEnvio.set(err?.error?.message ?? 'No fue posible registrar el incidente.');
        return throwError(() => err);
      })
    );
  }
}
