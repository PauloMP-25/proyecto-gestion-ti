import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { TarjetaComponent } from '../../../../../compartido/ui/atomos/tarjeta/tarjeta.component';
import { InsigniaComponent } from '../../../../../compartido/ui/atomos/insignia/insignia.component';
import { IconoComponent } from '../../../../../compartido/ui/atomos/icono/icono.component';
import { BotonIconoComponent } from '../../../../../compartido/ui/atomos/boton-icono/boton-icono.component';
import { ETIQUETA_AMBITO, ETIQUETA_DIFICULTAD, GuiaVista } from '../../modelos/guias.model';
import { ResaltarPipe } from '../../utilidades/resaltar.pipe';

@Component({
  selector: 'app-tarjeta-guia',
  standalone: true,
  imports: [
    DatePipe,
    TarjetaComponent,
    InsigniaComponent,
    IconoComponent,
    BotonIconoComponent,
    ResaltarPipe,
  ],
  templateUrl: './tarjeta-guia.component.html',
  styleUrl: './tarjeta-guia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaGuiaComponent {
  readonly guia = input.required<GuiaVista>();
  readonly textoBuscado = input<string>('');

  readonly alAbrir = output<number>();
  readonly alEditar = output<GuiaVista>();
  readonly alEliminar = output<GuiaVista>();

  protected readonly ETIQUETA_AMBITO = ETIQUETA_AMBITO;
  protected readonly ETIQUETA_DIFICULTAD = ETIQUETA_DIFICULTAD;

  protected readonly colorCategoria = computed(
    () => `var(${this.guia().categoria.colorToken})`,
  );

  protected readonly ambitoTexto = computed(() =>
    this.guia().esPublico ? 'Asistencial' : 'Interno',
  );

  protected editar(evento: MouseEvent): void {
    evento.stopPropagation();
    this.alEditar.emit(this.guia());
  }

  protected eliminar(evento: MouseEvent): void {
    evento.stopPropagation();
    this.alEliminar.emit(this.guia());
  }
}
