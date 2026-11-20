import { Component, ChangeDetectionStrategy, input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextoAtencion } from '../../../../funcionalidades/portal-asistencial/modelos/contexto-atencion.model';
import { IconoComponent } from '../../atomos/icono/icono.component';

@Component({
  selector: 'app-contexto-equipo',
  standalone: true,
  imports: [CommonModule, IconoComponent],
  templateUrl: './contexto-equipo.component.html',
  styleUrl: './contexto-equipo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextoEquipoComponent {
  readonly contexto = input.required<ContextoAtencion>();
  readonly mostrarAyudaDiferente = signal(false);

  readonly esDetectado = computed(
    () => this.contexto().estadoDeteccion === 'DETECTADO'
  );

  readonly esNoRegistrado = computed(
    () => this.contexto().estadoDeteccion === 'IP_NO_REGISTRADA' || this.contexto().estadoDeteccion === 'IP_SIN_EQUIPO'
  );

  readonly personaEnOtraArea = computed(
    () => this.contexto().personaEnOtraArea
  );

  readonly textoUbicacion = computed(() => {
    const c = this.contexto();
    const partes: string[] = [];
    if (c.area?.nombre) partes.push(c.area.nombre);
    if (c.area?.ubicacionLegible) partes.push(c.area.ubicacionLegible);
    if (c.area?.referenciaUbicacion) partes.push(c.area.referenciaUbicacion);
    return partes.join(' · ') || 'Ubicación no identificada';
  });

  readonly textoEquipo = computed(() => {
    const eq = this.contexto().equipo;
    if (!eq) return null;
    const partes: string[] = [eq.codigoInventario];
    if (eq.referenciaUbicacion) partes.push(eq.referenciaUbicacion);
    else if (eq.nombre) partes.push(eq.nombre);
    return partes.join(' · ');
  });

  alternarAyuda(): void {
    this.mostrarAyudaDiferente.update(v => !v);
  }
}