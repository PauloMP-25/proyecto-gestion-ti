import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ArticuloConocimiento } from '../../modelos/articulo-conocimiento.model';
import { ConocimientoApi, FiltrosConocimiento } from './conocimiento.api';

const NOMBRE_CATEGORIA: Record<number, string> = {
  1: 'Sistema clínico (HIS)',
  2: 'Impresoras de etiquetas y térmicas',
  3: 'Redes y conectividad',
  4: 'Hardware y periféricos',
  5: 'Software asistencial',
};

const ARTICULOS_INICIALES: ArticuloConocimiento[] = [
  {
    id: 1,
    titulo: 'El sistema clínico muestra «sesión expirada» al registrar una admisión',
    resumen:
      'Cómo renovar la sesión del sistema clínico sin perder los datos que ya se estaban registrando.',
    contenidoHtml: '',
    categoriaId: 1,
    categoriaNombre: NOMBRE_CATEGORIA[1],
    palabrasClave: ['sesion', 'expirada', 'admision', 'his', 'sistema', 'clinico', 'logout'],
    equiposCompatibles: ['Estación de Admisión', 'Estación de Enfermería'],
    esPublico: true,
    conteoUtil: 48,
    fechaActualizacion: '2026-11-21T08:30:00Z',
    sintoma:
      'El sistema clínico cierra la sesión o muestra «sesión expirada» justo cuando se está registrando un paciente.',
    causaRaiz:
      'La sesión se mantuvo abierta sin actividad por más del tiempo permitido o la estación cambió de red.',
    solucionTemporal:
      'Registre los datos del paciente en la ficha de papel y vuelva a ingresarlos cuando restablezca la sesión.',
    pasos: [
      'Anote los datos del paciente que ya había ingresado antes de que apareciera el mensaje.',
      'Cierre el mensaje con el botón Aceptar; no cierre el navegador ni apague la computadora.',
      'Vuelva a iniciar sesión con su usuario y clave institucional.',
      'Reabra el registro de la admisión y complete los datos que faltaban.',
    ],
    precauciones: [
      'Nunca comparta su clave con un compañero para «seguir trabajando»: cada registro queda a nombre de quien inició sesión.',
      'Si el mensaje reaparece en menos de cinco minutos, repórtelo a Mesa de Ayuda: puede ser una falla del enlace con el servidor.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 3,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 2,
    titulo: 'Liberar una historia clínica bloqueada por otro usuario',
    resumen:
      'Procedimiento técnico para liberar un expediente tomado por una sesión anterior en otra estación.',
    contenidoHtml: '',
    categoriaId: 1,
    categoriaNombre: NOMBRE_CATEGORIA[1],
    palabrasClave: ['historia', 'bloqueada', 'expediente', 'usuario', 'clinica', 'sesion', 'liberar'],
    equiposCompatibles: ['Servidor de Aplicaciones HIS'],
    esPublico: false,
    conteoUtil: 12,
    fechaActualizacion: '2026-11-18T16:10:00Z',
    sintoma:
      'El sistema indica que la historia clínica está siendo editada por otro usuario o por una sesión anterior.',
    causaRaiz:
      'Una sesión anterior no se cerró correctamente y dejó el expediente tomado en el servidor.',
    solucionTemporal: 'Trabaje en modo consulta mientras se libera el expediente.',
    pasos: [
      'Identifique el número de historia y el usuario que aparece en el mensaje de bloqueo.',
      'Verifique en la consola de administración del sistema clínico si la sesión del usuario sigue activa.',
      'Confirme con el área que el usuario no está editando el expediente en ese momento.',
      'Libere el bloqueo del expediente desde la consola de administración.',
      'Pida al usuario que vuelva a abrir la historia y confirme que puede editarla.',
    ],
    precauciones: [
      'No libere un expediente sin confirmar antes con el área: podría descartar cambios que otro usuario está registrando.',
      'Registre en el ticket el número de historia y el usuario liberado para dejar trazabilidad.',
    ],
    nivelDificultad: 'AVANZADO',
    minutosEstimados: 10,
    requiereTecnico: true,
    autorNombre: 'Soporte de Aplicaciones',
  },
  {
    id: 3,
    titulo: 'Calibración y desatasco de impresora de pulseras de triaje (Zebra / Xprinter)',
    resumen:
      'Procedimiento rápido para destrabar el rollo de pulseras o tickets de atención y recalibrar el sensor térmico.',
    contenidoHtml: '',
    categoriaId: 2,
    categoriaNombre: NOMBRE_CATEGORIA[2],
    palabrasClave: ['impresora', 'termica', 'triaje', 'zebra', 'pulseras', 'atasco', 'papel'],
    equiposCompatibles: ['Zebra ZD220', 'Zebra GK420t', 'Xprinter XP-420B'],
    esPublico: true,
    conteoUtil: 42,
    fechaActualizacion: '2026-11-15T14:30:00Z',
    sintoma: 'Luz roja parpadeante o papel atascado en la ventanilla de triaje.',
    causaRaiz: 'Desalineación del rollo o suciedad en el sensor óptico de separación.',
    solucionTemporal: 'Retire el papel atascado y recalibre con el botón FEED.',
    pasos: [
      'Apague la impresora desde el interruptor posterior antes de manipular los rodillos.',
      'Abra la cubierta presionando los pestillos laterales y retire con cuidado el papel atascado.',
      'Verifique que el rollo esté colocado con la cara reactiva hacia el cabezal térmico.',
      'Limpie el sensor óptico frontal con un hisopo ligeramente humedecido en alcohol isopropílico.',
      'Cierre la tapa hasta escuchar el doble clic y encienda manteniendo presionado FEED durante 3 segundos.',
    ],
    precauciones: [
      'Apague siempre la impresora antes de tocar los rodillos: el cabezal térmico se calienta y puede quemar.',
      'No use objetos metálicos para retirar el papel atascado.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 4,
    titulo: 'Etiquetas de tubos de laboratorio impresas cortadas o desplazadas',
    resumen: 'Ajuste del sensor y del tamaño de etiqueta en la impresora térmica de toma de muestras.',
    contenidoHtml: '',
    categoriaId: 2,
    categoriaNombre: NOMBRE_CATEGORIA[2],
    palabrasClave: ['etiqueta', 'tubo', 'laboratorio', 'muestra', 'cortada', 'zebra'],
    equiposCompatibles: ['Zebra ZD220', 'Zebra GK420t'],
    esPublico: true,
    conteoUtil: 27,
    fechaActualizacion: '2026-11-20T09:00:00Z',
    sintoma: 'El código de barras sale cortado o fuera de la etiqueta del tubo.',
    causaRaiz:
      'El sensor de separación no detecta el espacio entre etiquetas tras cambiar de rollo.',
    solucionTemporal: 'Rotule a mano con el número de orden y avise a Laboratorio.',
    pasos: [
      'Verifique que el rollo instalado sea el de etiquetas de tubo (25 × 50 mm) y no el de pulseras.',
      'Abra la tapa y asegúrese de que las guías laterales toquen el borde del rollo sin apretarlo.',
      'Cierre la tapa y mantenga presionado el botón FEED hasta que la luz parpadee dos veces; suelte.',
      'La impresora avanzará algunas etiquetas en blanco: es la calibración automática.',
      'Imprima una etiqueta de prueba desde el sistema clínico y verifique que el lector la reconozca.',
    ],
    precauciones: [
      'Nunca pegue en un tubo una etiqueta que no pueda leerse: puede causar un error de identificación del paciente.',
      'No use objetos metálicos para retirar etiquetas pegadas en el cabezal.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 5,
    titulo: 'Reinstalar el controlador de impresora térmica en estación de Admisión',
    resumen:
      'Reinstalación del controlador y del puerto de la impresora de pulseras cuando la estación no la reconoce.',
    contenidoHtml: '',
    categoriaId: 2,
    categoriaNombre: NOMBRE_CATEGORIA[2],
    palabrasClave: ['controlador', 'driver', 'impresora', 'admision', 'reinstalar', 'puerto'],
    equiposCompatibles: ['PC Admisión', 'Zebra ZD220'],
    esPublico: false,
    conteoUtil: 9,
    fechaActualizacion: '2026-11-17T12:20:00Z',
    sintoma:
      'La estación no reconoce la impresora de pulseras o envía los trabajos a una cola equivocada.',
    causaRaiz:
      'Controlador desactualizado o puerto de la impresora cambiado tras una actualización del sistema.',
    solucionTemporal: 'Imprima las pulseras desde otra estación de Admisión mientras se reinstala.',
    pasos: [
      'Desinstale la impresora y su controlador desde Administración de dispositivos.',
      'Descargue el controlador autorizado desde el repositorio institucional de software.',
      'Instale el controlador y agregue la impresora seleccionando el puerto correcto.',
      'Imprima la página de prueba y una pulsera de prueba desde el sistema clínico.',
      'Verifique que la pulsera impresa sea legible para el lector de triaje.',
    ],
    precauciones: [
      'Use solo el controlador del repositorio institucional: versiones descargadas de internet pueden dañar el cabezal.',
      'No retire el rollo de pulseras durante la instalación para evitar atascos.',
    ],
    nivelDificultad: 'INTERMEDIO',
    minutosEstimados: 15,
    requiereTecnico: true,
    autorNombre: 'Soporte de Campo',
  },
  {
    id: 6,
    titulo: 'Restablecer la conexión de red cableada en consultorios',
    resumen: 'Verificación del punto de red, la roseta de pared y la renovación de la dirección de red.',
    contenidoHtml: '',
    categoriaId: 3,
    categoriaNombre: NOMBRE_CATEGORIA[3],
    palabrasClave: ['red', 'cable', 'lan', 'consultorio', 'ip', 'desconectado', 'roseta'],
    equiposCompatibles: ['PC Consultorio', 'Roseta RJ45', 'Switch de piso'],
    esPublico: true,
    conteoUtil: 38,
    fechaActualizacion: '2026-11-18T10:15:00Z',
    sintoma: 'El consultorio aparece sin acceso a la red del hospital.',
    causaRaiz: 'Cable de red flojo o dirección de red vencida.',
    solucionTemporal: 'Reconecte el cable de red y renueve la dirección.',
    pasos: [
      'Revise que el cable de red esté conectado a la roseta de pared y a la computadora.',
      'Compruebe que las luces del puerto de red estén encendidas o parpadeando.',
      'Desconecte y vuelva a conectar el cable hasta escuchar el chasquido del seguro.',
      'Reinicie el adaptador de red o reinicie la computadora.',
      'Si el problema continúa, comuníquese con Mesa de Ayuda indicando el número de roseta.',
    ],
    precauciones: [
      'No desconecte cables de otros consultorios para probar: puede dejar sin red a un área en atención.',
      'No tire del cable para desconectarlo; presione el seguro del conector.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 7,
    titulo: 'La tablet de enfermería no se conecta al wifi asistencial',
    resumen:
      'Reconexión de la tablet de enfermería a la red wifi del hospital cuando pierde el acceso.',
    contenidoHtml: '',
    categoriaId: 3,
    categoriaNombre: NOMBRE_CATEGORIA[3],
    palabrasClave: ['tablet', 'wifi', 'enfermeria', 'inalambrica', 'conexion', 'red'],
    equiposCompatibles: ['Tablet de Enfermería', 'Punto de acceso wifi'],
    esPublico: true,
    conteoUtil: 21,
    fechaActualizacion: '2026-11-19T11:05:00Z',
    sintoma:
      'La tablet muestra «sin conexión» o no carga las historias durante el recorrido de sala.',
    causaRaiz:
      'La tablet olvidó la red wifi del hospital o se alejó de la cobertura del punto de acceso.',
    solucionTemporal: 'Registre la información en papel y actualícela cuando recupere la conexión.',
    pasos: [
      'Verifique que el wifi de la tablet esté encendido.',
      'Seleccione la red wifi del hospital y vuelva a conectarse.',
      'Si solicita clave, use la clave vigente entregada por Mesa de Ayuda.',
      'Acérquese a la zona de cobertura del punto de acceso del área.',
      'Pruebe abrir una historia para confirmar la conexión.',
    ],
    precauciones: [
      'No intente conectarse a redes wifi que no pertenezcan al hospital.',
      'No anote la clave del wifi en lugares visibles del área.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 8,
    titulo: 'Diagnóstico de puerto de switch sin enlace (piso y gabinete)',
    resumen:
      'Guía técnica para identificar un puerto de switch sin enlace antes de escalar a Soporte de Redes.',
    contenidoHtml: '',
    categoriaId: 3,
    categoriaNombre: NOMBRE_CATEGORIA[3],
    palabrasClave: ['switch', 'puerto', 'enlace', 'gabinete', 'piso', 'red', 'vlan'],
    equiposCompatibles: ['Switch de piso', 'Gabinete de comunicaciones'],
    esPublico: false,
    conteoUtil: 7,
    fechaActualizacion: '2026-11-16T15:40:00Z',
    sintoma:
      'Una o varias estaciones de un mismo sector quedan sin red y el puerto del switch no muestra enlace.',
    causaRaiz:
      'Puerto del switch deshabilitado, cable de parcheo dañado o módulo del gabinete sin alimentación.',
    solucionTemporal: 'Reubique las estaciones en puertos contiguos mientras se repara el puerto.',
    pasos: [
      'Identifique en la etiqueta del rack el gabinete, el switch y el número de puerto afectado.',
      'Compruebe que el switch tenga alimentación y que la luz de estado general esté normal.',
      'Revise si el puerto afectado muestra alguna luz o si está completamente apagado.',
      'Pruebe el cable de parcheo en un puerto contiguo para descartar el cable.',
      'Si el puerto sigue sin enlace, registre el caso y escale a Soporte de Redes.',
    ],
    precauciones: [
      'No desconecte cables troncales ni de fibra del gabinete sin autorización de Soporte de Redes.',
      'Registre cada cambio de puerto para que el mapa de conexiones siga siendo confiable.',
    ],
    nivelDificultad: 'AVANZADO',
    minutosEstimados: 20,
    requiereTecnico: true,
    autorNombre: 'Soporte de Redes',
  },
  {
    id: 9,
    titulo: 'El lector de código de barras de Farmacia no lee las recetas',
    resumen:
      'Limpieza y verificación del lector de código de barras de Farmacia cuando deja de reconocer las recetas.',
    contenidoHtml: '',
    categoriaId: 4,
    categoriaNombre: NOMBRE_CATEGORIA[4],
    palabrasClave: ['lector', 'codigo', 'barras', 'farmacia', 'receta', 'scanner'],
    equiposCompatibles: ['Lector de código de barras USB', 'PC Farmacia'],
    esPublico: true,
    conteoUtil: 18,
    fechaActualizacion: '2026-11-20T14:45:00Z',
    sintoma: 'El lector emite el haz de luz pero la receta no aparece en el sistema.',
    causaRaiz: 'Ventana del lector sucia o cables del lector flojos.',
    solucionTemporal: 'Digite el código de la receta manualmente mientras se restablece el lector.',
    pasos: [
      'Limpie la ventana del lector con un paño de microfibra seco.',
      'Revise que el cable del lector esté bien conectado a la computadora.',
      'Desconecte y vuelva a conectar el lector al puerto USB.',
      'Pruebe leer una receta de prueba y confirme que el código aparece en pantalla.',
    ],
    precauciones: [
      'No use alcohol ni líquidos directamente sobre la ventana del lector.',
      'Si el lector no responde tras reconectarlo, no lo abra: repórtelo a Mesa de Ayuda.',
    ],
    nivelDificultad: 'INTERMEDIO',
    minutosEstimados: 10,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 10,
    titulo: 'Monitor sin señal en estación de enfermería',
    resumen: 'Verificación de cables y encendido del monitor cuando aparece el mensaje «sin señal».',
    contenidoHtml: '',
    categoriaId: 4,
    categoriaNombre: NOMBRE_CATEGORIA[4],
    palabrasClave: ['monitor', 'pantalla', 'senal', 'enfermeria', 'cable', 'video'],
    equiposCompatibles: ['Monitor de estación', 'PC de Enfermería'],
    esPublico: true,
    conteoUtil: 33,
    fechaActualizacion: '2026-11-21T07:20:00Z',
    sintoma: 'El monitor muestra «sin señal» aunque la computadora parece encendida.',
    causaRaiz: 'Cable de video flojo o la computadora entró en suspensión.',
    solucionTemporal: 'Use el monitor de la estación contigua mientras se restablece la señal.',
    pasos: [
      'Verifique que el monitor y la computadora estén encendidos.',
      'Presione una tecla o mueva el mouse para sacar la computadora de suspensión.',
      'Revise que el cable de video esté conectado firmemente en ambos extremos.',
      'Compruebe que el monitor esté en la entrada de video correcta.',
      'Si el monitor sigue sin señal, reporte el caso a Mesa de Ayuda.',
    ],
    precauciones: [
      'No mueva la computadora ni el monitor de su lugar: están fijados para evitar caídas.',
      'No desconecte el cable de alimentación de la estación durante la atención de pacientes.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
  {
    id: 11,
    titulo: 'El visor de imágenes de Rayos X no abre los estudios',
    resumen: 'Verificación del visor de imágenes y del acceso al repositorio de estudios de Rayos X.',
    contenidoHtml: '',
    categoriaId: 5,
    categoriaNombre: NOMBRE_CATEGORIA[5],
    palabrasClave: ['visor', 'imagenes', 'rayos', 'estudios', 'radiologia', 'dicom'],
    equiposCompatibles: ['PC de Radiología', 'Servidor de imágenes'],
    esPublico: false,
    conteoUtil: 11,
    fechaActualizacion: '2026-11-19T17:30:00Z',
    sintoma: 'El visor abre vacío o muestra un error al cargar los estudios del paciente.',
    causaRaiz:
      'Configuración del visor desactualizada o acceso al repositorio de estudios interrumpido.',
    solucionTemporal:
      'Solicite el estudio impreso al área de Radiología mientras se restablece el visor.',
    pasos: [
      'Cierre el visor y vuelva a abrirlo.',
      'Verifique que la estación tenga acceso a la red del hospital.',
      'Compruebe en la configuración del visor que la dirección del repositorio de estudios sea la vigente.',
      'Actualice la configuración del visor con los valores entregados por Soporte de Aplicaciones.',
      'Abra un estudio de prueba para confirmar que carga correctamente.',
    ],
    precauciones: [
      'No cambie direcciones ni credenciales del visor sin la configuración autorizada.',
      'No descargue los estudios a la computadora personal ni a dispositivos externos.',
    ],
    nivelDificultad: 'INTERMEDIO',
    minutosEstimados: 10,
    requiereTecnico: true,
    autorNombre: 'Soporte de Aplicaciones',
  },
  {
    id: 12,
    titulo: 'Restablecer la contraseña de correo institucional',
    resumen: 'Cómo restablecer la contraseña del correo institucional cuando se olvidó o expiró.',
    contenidoHtml: '',
    categoriaId: 5,
    categoriaNombre: NOMBRE_CATEGORIA[5],
    palabrasClave: ['correo', 'contrasena', 'clave', 'institucional', 'cuenta', 'restablecer'],
    equiposCompatibles: ['Portal Institucional', 'Directorio Activo'],
    esPublico: true,
    conteoUtil: 25,
    fechaActualizacion: '2026-11-22T09:10:00Z',
    sintoma: 'El correo institucional rechaza la contraseña o indica que expiró.',
    causaRaiz: 'La contraseña expiró por política de seguridad o se olvidó.',
    solucionTemporal: 'Use el teléfono del área para comunicarse mientras recupera el acceso.',
    pasos: [
      'Ingrese al portal institucional y seleccione la opción de restablecer contraseña.',
      'Valide su identidad con su número de documento y su correo de recuperación.',
      'Defina una contraseña nueva que cumpla la política de seguridad del hospital.',
      'Inicie sesión en el correo con la contraseña nueva.',
    ],
    precauciones: [
      'No comparta la contraseña nueva ni la anote en lugares visibles.',
      'Si no recibe el mensaje de recuperación, comuníquese con Mesa de Ayuda: no cree cuentas alternativas.',
    ],
    nivelDificultad: 'BASICO',
    minutosEstimados: 5,
    requiereTecnico: false,
    autorNombre: 'Mesa de Ayuda',
  },
];

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function articuloCompleto(
  base: Partial<ArticuloConocimiento>,
  id: number,
): ArticuloConocimiento {
  const categoriaId = base.categoriaId ?? 1;
  return {
    id,
    titulo: (base.titulo ?? '').trim(),
    resumen: (base.resumen ?? '').trim(),
    contenidoHtml: base.contenidoHtml ?? '',
    categoriaId,
    categoriaNombre: NOMBRE_CATEGORIA[categoriaId] ?? NOMBRE_CATEGORIA[1],
    palabrasClave: base.palabrasClave ?? [],
    equiposCompatibles: base.equiposCompatibles ?? [],
    esPublico: base.esPublico ?? true,
    conteoUtil: base.conteoUtil ?? 0,
    fechaActualizacion: base.fechaActualizacion ?? new Date().toISOString(),
    sintoma: base.sintoma,
    causaRaiz: base.causaRaiz ?? null,
    solucionTemporal: base.solucionTemporal,
    pasos: base.pasos ?? [],
    precauciones: base.precauciones ?? [],
    nivelDificultad: base.nivelDificultad ?? 'BASICO',
    minutosEstimados: base.minutosEstimados ?? 5,
    requiereTecnico: base.requiereTecnico ?? false,
    autorNombre: base.autorNombre ?? 'Mesa de Ayuda',
  };
}

@Injectable()
export class ConocimientoMock extends ConocimientoApi {
  private articulos: ArticuloConocimiento[] = ARTICULOS_INICIALES.map((a) => ({ ...a }));

  listar(filtros?: FiltrosConocimiento): Observable<ArticuloConocimiento[]> {
    let resultado = [...this.articulos];

    if (filtros?.soloPublicos) {
      resultado = resultado.filter((a) => a.esPublico);
    }

    if (filtros?.categoriaId) {
      resultado = resultado.filter((a) => a.categoriaId === filtros.categoriaId);
    }

    const texto = filtros?.texto ? normalizar(filtros.texto) : '';
    if (texto) {
      resultado = resultado.filter((a) =>
        [
          a.titulo,
          a.resumen,
          a.categoriaNombre,
          a.sintoma ?? '',
          a.causaRaiz ?? '',
          ...a.palabrasClave,
          ...a.equiposCompatibles,
        ].some((campo) => normalizar(campo).includes(texto)),
      );
    }

    resultado.sort((a, b) => b.conteoUtil - a.conteoUtil);

    return of(structuredClone(resultado)).pipe(delay(400));
  }

  obtenerPorId(id: number): Observable<ArticuloConocimiento> {
    const art = this.articulos.find((a) => a.id === id);
    if (!art) {
      return throwError(() => new Error(`Artículo de conocimiento ${id} no encontrado`));
    }
    return of(structuredClone(art)).pipe(delay(400));
  }

  destacados(): Observable<ArticuloConocimiento[]> {
    const publicos = this.articulos
      .filter((a) => a.esPublico)
      .sort((a, b) => b.conteoUtil - a.conteoUtil)
      .slice(0, 4);
    return of(structuredClone(publicos)).pipe(delay(400));
  }

  votarUtil(id: number, esUtil: boolean): Observable<void> {
    const art = this.articulos.find((a) => a.id === id);
    if (art && esUtil) {
      art.conteoUtil += 1;
    }
    return of(undefined).pipe(delay(400));
  }

  crear(payload: Partial<ArticuloConocimiento>): Observable<ArticuloConocimiento> {
    const maxId = this.articulos.reduce((max, a) => Math.max(max, a.id), 0);
    const nuevo = articuloCompleto(
      { ...payload, fechaActualizacion: new Date().toISOString() },
      maxId + 1,
    );
    this.articulos.unshift(nuevo);
    return of(structuredClone(nuevo)).pipe(delay(400));
  }

  actualizar(
    id: number,
    payload: Partial<ArticuloConocimiento>,
  ): Observable<ArticuloConocimiento> {
    const idx = this.articulos.findIndex((a) => a.id === id);
    if (idx === -1) {
      return throwError(() => new Error(`Artículo ${id} no existe`));
    }
    const actualizado = articuloCompleto(
      {
        ...this.articulos[idx],
        ...payload,
        fechaActualizacion: new Date().toISOString(),
      },
      id,
    );
    this.articulos[idx] = actualizado;
    return of(structuredClone(actualizado)).pipe(delay(400));
  }

  eliminar(id: number): Observable<void> {
    this.articulos = this.articulos.filter((a) => a.id !== id);
    return of(undefined).pipe(delay(400));
  }
}
