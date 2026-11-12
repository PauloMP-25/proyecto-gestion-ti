import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  ArticuloResumen,
  ArticuloDetalle,
} from '../../../compartido/modelos/articulo-conocimiento.model';
import { PortalAyudaApi } from './portal-ayuda.api';

@Injectable()
export class PortalAyudaMock extends PortalAyudaApi {
  private latenciaMs = 150;

  private articulos: ArticuloDetalle[] = [
    {
      id: 1,
      titulo: 'No puedo ingresar al sistema GalenHos',
      categoriaId: 1,
      categoriaNombre: 'Software Asistencial / GalenHos',
      sintoma: 'Aparece ventana con mensaje de error de conexión o credenciales inválidas.',
      causaRaiz: 'Servicio local desactualizado o bloqueo preventivo de cuenta por intentos erróneos.',
      solucionTemporal: 'Cierre todas las ventanas auxiliares de GalenHos y verifique que la tecla Bloq Mayús esté apagada. Si persiste, reinicie el equipo.',
      pasos: [
        'Cierre todas las pestañas y ventanas abiertas de GalenHos en la barra de tareas.',
        'Verifique que la luz de Bloq Mayús (Caps Lock) en su teclado esté apagada.',
        'Ingrese su usuario institucional (primera letra del nombre + apellido).',
        'Si el error indica "Conexión rechazada", revise que el cable de red azul detrás del CPU esté firmemente conectado.',
        'Si tras estos pasos no ingresa, reporte el problema para que el equipo técnico desbloquee su acceso.',
      ],
    },
    {
      id: 2,
      titulo: 'Lector de huella no reconoce al personal médico',
      categoriaId: 2,
      categoriaNombre: 'Hardware / Biometría',
      sintoma: 'El lector óptico parpadea en rojo o no emite el pitido de confirmación.',
      causaRaiz: 'Suciedad en el cristal óptico del sensor o desconexión del cable USB.',
      solucionTemporal: 'Limpie la superficie del sensor con un paño seco y coloque el dedo centrado con presión moderada.',
      pasos: [
        'Limpie suavemente la superficie de vidrio del lector con un paño de microfibra seco.',
        'Asegúrese de que el dedo no tenga alcohol en gel húmedo o grasa.',
        'Coloque la yema del dedo índice derecho bien centrada sobre el sensor, ejerciendo una presión suave y uniforme.',
        'Verifique que la luz azul del lector esté encendida de forma continua.',
        'Si no enciende ninguna luz, desconecte el cable USB posterior y conéctelo en otro puerto.',
      ],
    },
    {
      id: 3,
      titulo: 'Impresora de recetas no imprime o se atasca el papel',
      categoriaId: 3,
      categoriaNombre: 'Hardware / Periféricos',
      sintoma: 'La luz indicadora parpadea en naranja o los tickets salen en blanco.',
      causaRaiz: 'Rollo de papel térmico mal colocado o compuerta superior entreabierta.',
      solucionTemporal: 'Abra la compuerta superior, retire el papel arrugado y vuelva a colocar el rollo con la cara térmica hacia arriba.',
      pasos: [
        'Presione la palanca lateral para abrir la cubierta de la impresora.',
        'Retire cualquier trozo de papel atascado tirando suavemente hacia afuera.',
        'Coloque el rollo de papel térmico verificando que el papel salga desde la parte inferior hacia el frente.',
        'Deje sobresalir unos 3 centímetros de papel y cierre la compuerta firmemente hasta escuchar un "click".',
        'Presione el botón de avance (Feed) para comprobar que el papel avance de manera recta.',
      ],
    },
    {
      id: 4,
      titulo: 'Sin conexión a internet o red interna hospitalaria',
      categoriaId: 4,
      categoriaNombre: 'Redes y Telecomunicaciones',
      sintoma: 'Ícono del mundo con cruz roja en la barra de tareas; no cargan sistemas internos.',
      causaRaiz: 'Cable de red desconectado o dirección IP desconfigurada.',
      solucionTemporal: 'Revise la conexión física del cable de red en la parte posterior del computador y en la roseta de pared.',
      pasos: [
        'Ubique el cable de red (generalmente azul o gris) en la parte posterior de la computadora.',
        'Verifique que el conector tenga la lengüeta plástica asegurada y que los foquitos verde/amarillo del puerto parpadeen.',
        'Siga el cable hasta la toma de pared y confirme que no esté pisado o desconectado.',
        'Espere 10 segundos para que la tarjeta de red renueve la dirección IP asignada.',
      ],
    },
  ];

  buscar(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    const q = (texto || '').toLowerCase().trim();
    let lista = this.articulos.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      categoriaId: a.categoriaId,
      categoriaNombre: a.categoriaNombre,
      sintoma: a.sintoma,
    }));

    if (categoriaId) {
      lista = lista.filter((a) => a.categoriaId === categoriaId);
    }
    if (q) {
      lista = lista.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.sintoma.toLowerCase().includes(q) ||
          a.categoriaNombre.toLowerCase().includes(q)
      );
    }

    return of(lista).pipe(delay(this.latenciaMs));
  }

  destacados(): Observable<ArticuloResumen[]> {
    const res = this.articulos.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      categoriaId: a.categoriaId,
      categoriaNombre: a.categoriaNombre,
      sintoma: a.sintoma,
    }));
    return of(res).pipe(delay(this.latenciaMs));
  }

  obtener(id: number): Observable<ArticuloDetalle> {
    const encontrado = this.articulos.find((a) => a.id === id);
    if (!encontrado) {
      return throwError(() => new Error('Guía de ayuda no encontrada'));
    }
    return of({ ...encontrado }).pipe(delay(this.latenciaMs));
  }
}
