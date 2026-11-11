import { Component, ChangeDetectionStrategy, input, output, signal, effect, OnDestroy, inject, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketResumen } from '../../../../compartido/modelos/ticket-resumen.model';
import { IconoComponent } from '../../../../compartido/ui/atomos/icono/icono.component';
import { BotonComponent } from '../../../../compartido/ui/atomos/boton/boton.component';
import { PrioridadTicket } from '../../../../compartido/modelos/prioridad.enum';
import { AuthService } from '../../../../nucleo/auth/auth.service';
import { RolUsuario } from '../../../../nucleo/modelos/rol.enum';

@Component({
  selector: 'app-reloj-ticket-activo',
  standalone: true,
  imports: [CommonModule, IconoComponent, BotonComponent],
  templateUrl: './reloj-ticket-activo.component.html',
  styleUrl: './reloj-ticket-activo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelojTicketActivoComponent implements OnDestroy {
  private authService = inject(AuthService);
  private elementRef = inject(ElementRef);

  readonly ticket = input<TicketResumen | null>(null);
  readonly ticketsDisponibles = input<TicketResumen[]>([]);

  readonly alSeleccionarOtroTicket = output<TicketResumen>();
  readonly alResolverTicket = output<TicketResumen>();
  readonly alEscalarTicket = output<TicketResumen>();

  // Rol del usuario: Solo Nivel 1 (PRACTICANTE) escala a Nivel 2
  readonly rolActual = this.authService.rolActual;
  readonly puedeEscalar = computed(() => this.rolActual() === RolUsuario.PRACTICANTE);

  // Estado del dropdown moderno de selección
  readonly selectorAbierto = signal<boolean>(false);

  // Estados del reloj
  readonly segundosTranscurridos = signal<number>(1124); // Ej: 18m 44s
  readonly pausado = signal<boolean>(false);
  readonly minutosPausadosTotal = signal<number>(0);

  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.iniciarTemporizador();

    effect(() => {
      const t = this.ticket();
      if (t) {
        // Si cambia el ticket, reiniciamos el reloj basado en el tiempo ya transcurrido
        const consumidoMin = (t.slaResolucion?.tiempoRestanteMinutos !== undefined)
          ? Math.max(0, 60 - t.slaResolucion.tiempoRestanteMinutos)
          : 15;
        this.segundosTranscurridos.set(consumidoMin * 60);
      }
    });
  }

  private iniciarTemporizador(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = setInterval(() => {
      if (!this.pausado() && this.ticket()) {
        this.segundosTranscurridos.update(s => s + 1);
      }
    }, 1000);
  }

  togglePausa(): void {
    this.pausado.update(p => !p);
    if (this.pausado()) {
      this.minutosPausadosTotal.update(m => m + 1);
    }
  }

  formatearTiempo(segundosTotales: number): string {
    const horas = Math.floor(segundosTotales / 3600);
    const minutos = Math.floor((segundosTotales % 3600) / 60);
    const segundos = segundosTotales % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');
    if (horas > 0) {
      return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
    }
    return `${pad(minutos)}:${pad(segundos)}`;
  }

  obtenerSlaRestante(ticket: TicketResumen | null): { texto: string; segundos: number; vencido: boolean } {
    const minutosBase = ticket?.slaResolucion?.tiempoRestanteMinutos ?? 60;
    const duracionTotal = Math.max(60, minutosBase + Math.floor(this.segundosTranscurridos() / 60));
    return this.calcularTiempoRestante(duracionTotal);
  }

  calcularTiempoRestante(minutosLimiteTotal: number = 60): { texto: string; segundos: number; vencido: boolean } {
    const totalSegundosLimite = minutosLimiteTotal * 60;
    const restantes = totalSegundosLimite - this.segundosTranscurridos();
    
    if (restantes <= 0) {
      return {
        texto: '-' + this.formatearTiempo(Math.abs(restantes)),
        segundos: restantes,
        vencido: true,
      };
    }
    return {
      texto: this.formatearTiempo(restantes),
      segundos: restantes,
      vencido: false,
    };
  }

  calcularPorcentajeSLA(minutosLimiteTotal: number = 60): number {
    const totalSegundos = minutosLimiteTotal * 60;
    const porcentaje = Math.round((this.segundosTranscurridos() / totalSegundos) * 100);
    return Math.min(100, Math.max(0, porcentaje));
  }

  toggleSelector(): void {
    this.selectorAbierto.update(v => !v);
  }

  cerrarSelector(): void {
    this.selectorAbierto.set(false);
  }

  seleccionarTicketDropdown(ticket: TicketResumen): void {
    this.alSeleccionarOtroTicket.emit(ticket);
    this.selectorAbierto.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickDocument(event: MouseEvent): void {
    if (this.selectorAbierto() && !this.elementRef.nativeElement.contains(event.target)) {
      this.selectorAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectorAbierto()) {
      this.selectorAbierto.set(false);
    }
  }

  onSeleccionarTicket(ticket: TicketResumen): void {
    this.alSeleccionarOtroTicket.emit(ticket);
  }

  onResolver(): void {
    const t = this.ticket();
    if (t) {
      this.alResolverTicket.emit(t);
    }
  }

  onEscalar(): void {
    const t = this.ticket();
    if (t) {
      this.alEscalarTicket.emit(t);
    }
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
