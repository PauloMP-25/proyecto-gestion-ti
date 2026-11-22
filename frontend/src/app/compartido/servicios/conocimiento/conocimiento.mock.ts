import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ArticuloConocimiento } from '../../modelos/articulo-conocimiento.model';
import { ConocimientoApi, FiltrosConocimiento } from './conocimiento.api';

const ARTICULOS_INICIALES: ArticuloConocimiento[] = [
  {
    id: 1,
    titulo: 'Calibración y desatasco de impresora térmica de triaje (Zebra / Xprinter)',
    resumen: 'Procedimiento rápido para destrabar el rollo de pulseras o tickets de atención y recalibrar el sensor térmico.',
    contenidoHtml: `<p>Si la impresora térmica parpadea en color rojo o emite un pitido continuo al imprimir pulseras de pacientes en Triaje o Admisión:</p>
<ol>
  <li><strong>Apagar el equipo</strong> desde el interruptor posterior antes de manipular los rodillos.</li>
  <li>Abrir la cubierta presionando los pestillos laterales verdes y retirar con cuidado cualquier residuo de papel atascado.</li>
  <li>Verificar que el rollo térmico esté colocado en el sentido correcto (con la cara reactiva hacia el cabezal térmico).</li>
  <li>Limpiar el sensor óptico frontal con un hisopo ligeramente humedecido en alcohol isopropílico.</li>
  <li>Cerrar la tapa hasta escuchar el doble clic, encender manteniendo presionado el botón <em>FEED</em> durante 3 segundos para autocalibrar el corte.</li>
</ol>`,
    categoriaId: 1,
    categoriaNombre: 'Equipos y Periféricos',
    palabrasClave: ['impresora', 'termica', 'triaje', 'zebra', 'pulseras', 'atasco', 'papel'],
    equiposCompatibles: ['Zebra ZD220', 'Zebra GK420t', 'Xprinter XP-420B', 'Impresora Térmica Triaje'],
    esPublico: true,
    conteoUtil: 42,
    fechaActualizacion: '2026-11-15T14:30:00Z',
    sintoma: 'Luz roja parpadeante o papel atascado en ventanilla de triaje',
    causaRaiz: 'Desalineación del rollo o suciedad en el sensor óptico de separación',
    solucionTemporal: 'Retirar papel y calibrar con botón FEED',
    pasos: [
      'Apagar el equipo desde el interruptor posterior',
      'Abrir la cubierta y retirar el papel atascado sin usar tijeras de metal',
      'Comprobar la orientación correcta del rollo de pulseras',
      'Cerrar la tapa firmemente hasta escuchar ambos pestillos',
      'Encender manteniendo presionado FEED por 3 segundos para calibración automática',
    ],
  },
  {
    id: 2,
    titulo: 'Restablecimiento de conexión de red LAN en consultorios médicos',
    resumen: 'Verificación del punto de red cableado RJ45, roseta de pared y renovación de concesión DHCP.',
    contenidoHtml: `<p>En caso de que aparezca el ícono de globo terráqueo o advertencia amarilla de "Sin acceso a la red hospitalaria" en el consultorio:</p>
<ol>
  <li>Inspeccionar visualmente el cable de red gris/azul conectado entre la computadora y la roseta de pared del consultorio.</li>
  <li>Comprobar que los LEDs verde (enlace) y ámbar (actividad) en la tarjeta de red estén encendidos o parpadeando.</li>
  <li>Si los LEDs están apagados, desconectar y volver a conectar firmemente el conector RJ45 hasta oír el chasquido del seguro.</li>
  <li>Si el problema persiste, abrir la consola de comandos de Windows y ejecutar: <code>ipconfig /release</code> seguido de <code>ipconfig /renew</code>.</li>
  <li>Si aún no obtiene dirección IP del segmento asistencial (10.10.x.x), comuníquese con Mesa de Ayuda indicando el número de roseta (ej. ROS-CONS-04).</li>
</ol>`,
    categoriaId: 2,
    categoriaNombre: 'Redes y Comunicaciones',
    palabrasClave: ['red', 'cable', 'internet', 'lan', 'consultorio', 'ip', 'desconectado'],
    equiposCompatibles: ['PC Consultorio', 'Estación de Enfermería', 'Switch Piso 1', 'Roseta RJ45'],
    esPublico: true,
    conteoUtil: 38,
    fechaActualizacion: '2026-11-18T10:15:00Z',
    sintoma: 'Sin conexión a internet ni a la red interna del hospital en el consultorio',
    causaRaiz: 'Cable RJ45 flojo o concesión DHCP vencida',
    solucionTemporal: 'Reconectar cable de red y renovar IP',
    pasos: [
      'Revisar la conexión física del cable a la pared y al CPU',
      'Verificar luces verde y ámbar del puerto de red',
      'Desconectar y reinsertar con fuerza hasta asegurar la pestaña plástica',
      'Reiniciar el adaptador de red o reiniciar la estación de trabajo',
    ],
  },
  {
    id: 3,
    titulo: 'Solución a error de conexión en software hospitalario (GalenHos / HIS)',
    resumen: 'Recuperación ante bloqueo de terminal asistencial o falla de enlace al servidor de historias clínicas.',
    contenidoHtml: `<p>Si el sistema GalenHos muestra el mensaje "Error al conectar con el servidor central de historias clínicas" o la pantalla se congela al emitir una orden médica:</p>
<ol>
  <li>No fuerce el apagado del CPU con el botón de encendido para evitar corromper la sesión clínica activa.</li>
  <li>Presione <code>Ctrl + Shift + Esc</code> para abrir el Administrador de tareas, localice el proceso <em>GalenHos.exe</em> y seleccione <strong>Finalizar tarea</strong>.</li>
  <li>Espere 10 segundos y vuelva a abrir el acceso directo desde el escritorio ejecutándolo como usuario habitual.</li>
  <li>Si el sistema indica "Usuario ya conectado en otra estación": reporte el caso para que el soporte N1 libere el bloqueo de sesión en el servidor.</li>
</ol>`,
    categoriaId: 3,
    categoriaNombre: 'Sistemas y Software Asistencial',
    palabrasClave: ['galenhos', 'his', 'historias', 'clinica', 'software', 'error', 'servidor'],
    equiposCompatibles: ['Todas las estaciones asistenciales', 'Servidor de Aplicaciones HIS'],
    esPublico: true,
    conteoUtil: 55,
    fechaActualizacion: '2026-11-20T16:00:00Z',
    sintoma: 'El sistema GalenHos no inicia o se queda colgado cargando datos del paciente',
    causaRaiz: 'Sesión colgada en memoria o caída momentánea del socket del servidor',
    solucionTemporal: 'Cerrar el proceso y reiniciar el aplicativo',
    pasos: [
      'Abrir Administrador de tareas (Ctrl+Shift+Esc)',
      'Finalizar el proceso GalenHos.exe colgado',
      'Esperar 10 segundos antes de relanzar el sistema',
      'Ingresar nuevamente usuario y clave asistencial',
    ],
  },
  {
    id: 4,
    titulo: 'Desbloqueo de cuenta institucional de médico o personal asistencial',
    resumen: 'Procedimiento de seguridad para restaurar acceso tras múltiples intentos fallidos de contraseña.',
    contenidoHtml: `<p>Las cuentas institucionales se bloquean automáticamente tras 5 intentos fallidos consecutivos por directiva de seguridad del hospital:</p>
<ol>
  <li>El bloqueo temporal dura 15 minutos. Si requiere atención urgente durante la guardia médica, contacte al anexo 2100 de Mesa de Ayuda.</li>
  <li>Proporcione su número de DNI y servicio asignado (ej. Emergencia, Medicina Interna) para validar su identidad.</li>
  <li>El técnico generará una clave temporal que deberá cambiar obligatoriamente en su primer inicio de sesión.</li>
</ol>`,
    categoriaId: 4,
    categoriaNombre: 'Seguridad y Cuentas',
    palabrasClave: ['cuenta', 'bloqueo', 'contrasena', 'clave', 'medico', 'acceso', 'dni'],
    equiposCompatibles: ['Directorio Activo', 'Portal Institucional'],
    esPublico: true,
    conteoUtil: 29,
    fechaActualizacion: '2026-11-19T09:20:00Z',
    sintoma: 'Cuenta bloqueada o contraseña expirada al iniciar turno',
    causaRaiz: 'Superación de intentos fallidos de clave',
    solucionTemporal: 'Esperar 15 minutos o solicitar restablecimiento al anexo 2100',
    pasos: [
      'Esperar el lapso de desbloqueo automático de 15 minutos',
      'Si es urgente, comunicarse al anexo telefónico de Mesa de Ayuda (2100)',
      'Validar identidad con DNI y área médica de adscripción',
      'Iniciar sesión con la clave provisoria y actualizarla de inmediato',
    ],
  },
  {
    id: 5,
    titulo: 'Procedimiento técnico N1/N2: Reemplazo de Switch perimetral de piso asistencial',
    resumen: 'Guía técnica interna para técnicos y administradores ante falla total de switch de distribución de área crítica.',
    contenidoHtml: `<p><strong>DOCUMENTO INTERNO EXCLUSIVO PARA SOPORTE TI (N1 / N2)</strong></p>
<p>Ante una pérdida total de enlace de todos los consultorios de un ala médica:</p>
<ol>
  <li>Verificar alimentación eléctrica en la PDU del rack secundario de piso.</li>
  <li>Comprobar si el switch de respaldo en frío (Cisco Catalyst 2960-X de reserva) tiene cargada la VLAN hospitalaria correspondiente (VLAN 10 Médica, VLAN 20 Administrativa).</li>
  <li>Desconectar el cable troncal de fibra óptica SFP (1 Gbps) y conectarlo al puerto Gigabit 1/0/49 del switch de reemplazo.</li>
  <li>Migrar los cables de parcheo respetando el mapa de puertos etiquetado en el rack.</li>
  <li>Verificar conectividad cruzada haciendo ping continuo al gateway hospitalario <code>10.10.1.1</code>.</li>
</ol>`,
    categoriaId: 2,
    categoriaNombre: 'Redes y Comunicaciones',
    palabrasClave: ['switch', 'vlan', 'fibra', 'rack', 'cisco', 'tecnico', 'n2'],
    equiposCompatibles: ['Cisco Catalyst 2960-X', 'Rack Piso 2 Pabellón A'],
    esPublico: false, // Solo visible para soporte técnico / administradores
    conteoUtil: 14,
    fechaActualizacion: '2026-11-17T11:45:00Z',
    sintoma: 'Falla masiva de red en todo el pabellón de consultorios externos',
    causaRaiz: 'Avería de fuente de poder del switch perimetral',
    solucionTemporal: 'Migración a switch de reserva en rack',
    pasos: [
      'Inspeccionar PDU y estado de energía del rack',
      'Montar switch de contingencia precargado con VLAN asistencial',
      'Conectar uplink de fibra óptica y reubicar patch cords',
      'Confirmar retorno de señal con ping al gateway institucional',
    ],
  },
];

@Injectable()
export class ConocimientoMock extends ConocimientoApi {
  private articulos: ArticuloConocimiento[] = [...ARTICULOS_INICIALES];

  listar(filtros?: FiltrosConocimiento): Observable<ArticuloConocimiento[]> {
    let resultado = [...this.articulos];

    if (filtros?.soloPublicos) {
      resultado = resultado.filter((a) => a.esPublico);
    }

    if (filtros?.categoriaId) {
      resultado = resultado.filter((a) => a.categoriaId === filtros.categoriaId);
    }

    if (filtros?.texto && filtros.texto.trim()) {
      const q = filtros.texto.toLowerCase().trim();
      resultado = resultado.filter(
        (a) =>
          a.titulo.toLowerCase().includes(q) ||
          a.resumen.toLowerCase().includes(q) ||
          a.categoriaNombre.toLowerCase().includes(q) ||
          a.palabrasClave.some((p) => p.toLowerCase().includes(q)) ||
          a.equiposCompatibles.some((e) => e.toLowerCase().includes(q)),
      );
    }

    // Ordenar: primero los más consultados / útiles
    resultado.sort((a, b) => b.conteoUtil - a.conteoUtil);

    return of(resultado).pipe(delay(100));
  }

  obtenerPorId(id: number): Observable<ArticuloConocimiento> {
    const art = this.articulos.find((a) => a.id === id);
    if (!art) {
      return throwError(() => new Error(`Artículo de conocimiento ${id} no encontrado`));
    }
    return of({ ...art }).pipe(delay(80));
  }

  destacados(): Observable<ArticuloConocimiento[]> {
    const publicos = this.articulos
      .filter((a) => a.esPublico)
      .sort((a, b) => b.conteoUtil - a.conteoUtil)
      .slice(0, 4);
    return of(publicos).pipe(delay(80));
  }

  votarUtil(id: number, esUtil: boolean): Observable<void> {
    const art = this.articulos.find((a) => a.id === id);
    if (art && esUtil) {
      art.conteoUtil += 1;
    }
    return of(undefined).pipe(delay(50));
  }

  crear(payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    const maxId = this.articulos.reduce((max, a) => Math.max(max, a.id), 0);
    const nuevo: ArticuloConocimiento = {
      id: maxId + 1,
      titulo: payload.titulo || 'Nueva guía técnica',
      resumen: payload.resumen || '',
      contenidoHtml: payload.contenidoHtml || '',
      categoriaId: payload.categoriaId || 1,
      categoriaNombre: payload.categoriaNombre || 'General',
      palabrasClave: payload.palabrasClave || [],
      equiposCompatibles: payload.equiposCompatibles || [],
      esPublico: payload.esPublico ?? true,
      conteoUtil: 0,
      fechaActualizacion: new Date().toISOString(),
      sintoma: payload.resumen,
      solucionTemporal: payload.contenidoHtml,
      pasos: payload.pasos || [payload.contenidoHtml || ''],
    };
    this.articulos.unshift(nuevo);
    return of({ ...nuevo }).pipe(delay(120));
  }

  actualizar(id: number, payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    const idx = this.articulos.findIndex((a) => a.id === id);
    if (idx === -1) {
      return throwError(() => new Error(`Artículo ${id} no existe`));
    }
    const existente = this.articulos[idx];
    const actualizado: ArticuloConocimiento = {
      ...existente,
      ...payload,
      id,
      fechaActualizacion: new Date().toISOString(),
    };
    this.articulos[idx] = actualizado;
    return of({ ...actualizado }).pipe(delay(120));
  }

  eliminar(id: number): Observable<void> {
    this.articulos = this.articulos.filter((a) => a.id !== id);
    return of(undefined).pipe(delay(100));
  }
}
