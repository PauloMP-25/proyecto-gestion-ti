import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  AreaAfectada,
  CambioDetalle,
  CambioFormulario,
  CambioResumen,
  EventoCambio,
  FiltroCambios,
  HorarioProgramado,
  PasoPlan,
  TransicionCambio,
} from '../modelos/cambios.model';
import { esAreaCritica } from '../utilidades/areas-criticas';
import { ACCIONES_CON_OBSERVACION, estadoDestino } from '../utilidades/flujo-cambio';
import { CambiosApi } from './cambios.api';

const NOMBRES_AREAS: readonly string[] = [
  'Emergencia',
  'UCI Adultos',
  'UCI Neonatal',
  'Centro Quirúrgico',
  'Centro Obstétrico',
  'Admisión Central',
  'Triaje',
  'Laboratorio Clínico',
  'Farmacia Central',
  'Diagnóstico por Imágenes',
  'Pediatría',
  'Hospitalización',
  'Consultorios Externos',
  'Enfermería',
  'Administración',
  'Nutrición',
];

export const AREAS_SELECCIONABLES: readonly AreaAfectada[] = NOMBRES_AREAS.map(
  (nombre, indice) => ({
    idArea: indice + 1,
    nombre,
    esCritica: esAreaCritica(nombre),
  }),
);

function areas(...nombres: string[]): AreaAfectada[] {
  return nombres.map((nombre) => {
    const encontrada = AREAS_SELECCIONABLES.find((area) => area.nombre === nombre);
    return (
      encontrada ?? {
        idArea: 0,
        nombre,
        esCritica: esAreaCritica(nombre),
      }
    );
  });
}

function paso(
  orden: number,
  descripcion: string,
  responsable: string | null,
  minutosEstimados: number | null,
): PasoPlan {
  return { orden, descripcion, responsable, minutosEstimados };
}

function evento(
  fechaIso: string,
  estadoNuevo: EventoCambio['estadoNuevo'],
  estadoAnterior: EventoCambio['estadoAnterior'],
  observacion: string | null,
  usuarioNombre = 'Ing. Roberto Ramos',
): EventoCambio {
  return { fechaIso, usuarioNombre, estadoAnterior, estadoNuevo, observacion };
}

function horario(inicioIso: string, finIso: string): HorarioProgramado {
  return { inicioIso, finIso };
}

const SEMILLAS: readonly CambioDetalle[] = [
  {
    id: 1,
    codigo: 'SC-2026-0001',
    titulo: 'Actualización del firmware del switch central del Pabellón A',
    tipo: 'PROGRAMADO',
    categoria: 'RED',
    estado: 'APROBADO',
    impacto: 'CRITICO',
    areasAfectadas: ['Emergencia', 'Admisión Central', 'Laboratorio Clínico'],
    horario: horario('2026-11-28T23:00:00-05:00', '2026-11-29T01:00:00-05:00'),
    solicitante: 'Ing. Roberto Ramos',
    responsableEjecucion: 'Ing. Roberto Ramos',
    fechaRegistroIso: '2026-11-18T09:20:00-05:00',
    descripcion:
      'Actualizar el firmware del switch central que distribuye la red del Pabellón A para corregir las caídas intermitentes del enlace durante las horas de mayor demanda.',
    justificacion:
      'El firmware actual presenta reinicios espontáneos que dejan sin red a Emergencia y Admisión durante varios minutos. El proveedor recomienda la actualización para eliminar la falla.',
    equiposAfectados: ['SW-CORE-A-01', 'SW-PISO-A-02'],
    idTicketOrigen: 1204,
    evaluacion: {
      nivel: 'CRITICO',
      areasAfectadas: areas('Emergencia', 'Admisión Central', 'Laboratorio Clínico'),
      requiereInterrupcion: true,
      minutosInterrupcion: 45,
      serviciosAfectados: [
        'Registro de admisión',
        'Impresión de pulseras',
        'Consulta de resultados de laboratorio',
      ],
      pacientesPotencialmenteAfectados:
        'Pacientes en sala de espera de Emergencia y Admisión Central',
      descripcion:
        'Durante la actualización se pierde el enlace de red del pabellón. Emergencia y Admisión deben registrar en formato físico y Laboratorio entrega resultados críticos por teléfono.',
    },
    pasosImplementacion: [
      paso(1, 'Respaldar la configuración actual del switch en el servidor TFTP.', 'Ing. Roberto Ramos', 10),
      paso(2, 'Programar la intervención y avisar a las jefaturas de guardia 30 minutos antes.', 'Ing. Roberto Ramos', 5),
      paso(3, 'Cargar el nuevo firmware y reiniciar el equipo.', 'Ing. Roberto Ramos', 20),
      paso(4, 'Verificar conectividad desde 3 estaciones de Emergencia y 1 de Laboratorio.', 'Carlos Huamán', 10),
    ],
    planReversa: {
      criterioActivacion:
        'Si a los 15 minutos de reiniciado el switch las estaciones de Emergencia no obtienen dirección IP o el sistema clínico no abre.',
      pasos: [
        paso(1, 'Cargar la imagen de firmware anterior respaldada en el servidor TFTP.', 'Ing. Roberto Ramos', 10),
        paso(2, 'Restaurar la configuración guardada (respaldo del 27/11/2026).', 'Ing. Roberto Ramos', 5),
        paso(3, 'Verificar conectividad desde 3 estaciones de Emergencia y 1 de Laboratorio.', 'Carlos Huamán', 10),
      ],
      minutosEstimados: 25,
      planContinuidad:
        'Emergencia y Admisión registran pacientes en el formato físico F-ADM-03; Laboratorio entrega resultados críticos por teléfono (anexo 210). Se avisa a la jefatura de guardia 30 minutos antes.',
      responsableReversa: 'Ing. Roberto Ramos',
    },
    observacionDecision: 'Aprobado por el comité de evaluación técnica en sesión del 21/11/2026.',
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-18T09:20:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.'),
      evento('2026-11-20T15:40:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.'),
      evento('2026-11-21T10:05:00-05:00', 'APROBADO', 'EN_EVALUACION', 'Aprobado por el comité de evaluación técnica en sesión del 21/11/2026.'),
    ],
  },
  {
    id: 2,
    codigo: 'SC-2026-0002',
    titulo: 'Mantenimiento preventivo del servidor del sistema de admisión y triaje',
    tipo: 'PROGRAMADO',
    categoria: 'SERVIDOR',
    estado: 'EN_EVALUACION',
    impacto: 'ALTO',
    areasAfectadas: ['Admisión Central', 'Triaje'],
    horario: horario('2026-11-30T20:00:00-05:00', '2026-11-30T22:00:00-05:00'),
    solicitante: 'Ing. Ana Torres',
    responsableEjecucion: 'Ing. Ana Torres',
    fechaRegistroIso: '2026-11-20T11:10:00-05:00',
    descripcion:
      'Reemplazar los discos de respaldo y aplicar el mantenimiento preventivo programado al servidor que aloja el sistema de admisión y triaje.',
    justificacion:
      'Los discos actuales superan el 80 % de uso y el fabricante recomienda su reemplazo preventivo para evitar una caída del sistema de admisión.',
    equiposAfectados: ['SRV-ADM-02'],
    idTicketOrigen: 1221,
    evaluacion: {
      nivel: 'ALTO',
      areasAfectadas: areas('Admisión Central', 'Triaje'),
      requiereInterrupcion: true,
      minutosInterrupcion: 60,
      serviciosAfectados: ['Registro de admisión', 'Asignación de triaje'],
      pacientesPotencialmenteAfectados: 'Pacientes que llegan a Emergencia durante la ventana programada',
      descripcion:
        'El servidor se apaga durante el reemplazo de discos. Admisión y Triaje registran en formato físico durante la intervención.',
    },
    pasosImplementacion: [
      paso(1, 'Verificar el respaldo completo de la base de datos de admisión.', 'Ing. Ana Torres', 15),
      paso(2, 'Detener los servicios del servidor y apagar el equipo.', 'Ing. Ana Torres', 10),
      paso(3, 'Reemplazar los discos y reconstruir el arreglo redundante.', 'Ing. Ana Torres', 60),
      paso(4, 'Encender, validar el sistema de admisión y cerrar la intervención.', 'Carlos Huamán', 20),
    ],
    planReversa: {
      criterioActivacion:
        'Si el arreglo de discos no se reconstruye o el sistema de admisión no inicia a las 22:00.',
      pasos: [
        paso(1, 'Reinstalar los discos anteriores y encender el servidor.', 'Ing. Ana Torres', 20),
        paso(2, 'Restaurar el respaldo de la base de datos de admisión.', 'Ing. Ana Torres', 40),
        paso(3, 'Validar el registro de admisión desde dos estaciones.', 'Carlos Huamán', 10),
      ],
      minutosEstimados: 70,
      planContinuidad:
        'Admisión y Triaje registran en el formato físico F-ADM-03 y el personal de guardia transcribe los registros al restablecerse el sistema.',
      responsableReversa: 'Ing. Ana Torres',
    },
    observacionDecision: null,
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-20T11:10:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Ing. Ana Torres'),
      evento('2026-11-21T09:30:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.', 'Ing. Ana Torres'),
    ],
  },
  {
    id: 3,
    codigo: 'SC-2026-0003',
    titulo: 'Reemplazo de fuente de poder en estación de Diagnóstico por Imágenes',
    tipo: 'URGENTE',
    categoria: 'EQUIPO_USUARIO',
    estado: 'EN_EJECUCION',
    impacto: 'ALTO',
    areasAfectadas: ['Diagnóstico por Imágenes'],
    horario: horario('2026-11-23T10:00:00-05:00', '2026-11-23T11:00:00-05:00'),
    solicitante: 'Tec. Luis Quispe',
    responsableEjecucion: 'Tec. Luis Quispe',
    fechaRegistroIso: '2026-11-23T08:15:00-05:00',
    descripcion:
      'Sustituir la fuente de poder de la estación de trabajo que visualiza los estudios de imágenes para restablecer la atención del servicio.',
    justificacion:
      'La estación se apaga sola y el radiólogo no puede visualizar los estudios. La falla ya está afectando la atención de pacientes.',
    equiposAfectados: ['PC-IMAGENES-04'],
    idTicketOrigen: 1237,
    evaluacion: {
      nivel: 'ALTO',
      areasAfectadas: areas('Diagnóstico por Imágenes'),
      requiereInterrupcion: true,
      minutosInterrupcion: 20,
      serviciosAfectados: ['Visualización de estudios de imágenes'],
      pacientesPotencialmenteAfectados: 'Pacientes con estudios pendientes de lectura',
      descripcion:
        'La estación queda fuera de servicio durante el reemplazo. Se habilita una estación de contingencia en la sala de informes.',
    },
    pasosImplementacion: [
      paso(1, 'Trasladar una estación de contingencia a la sala de informes.', 'Tec. Luis Quispe', 10),
      paso(2, 'Apagar la estación afectada y reemplazar la fuente de poder.', 'Tec. Luis Quispe', 15),
      paso(3, 'Encender y validar el acceso al visor de imágenes.', 'Tec. Luis Quispe', 5),
    ],
    planReversa: {
      criterioActivacion:
        'Si la estación no enciende con la fuente nueva o el visor de imágenes no abre.',
      pasos: [
        paso(1, 'Volver a instalar la fuente anterior y operar con la estación de contingencia.', 'Tec. Luis Quispe', 10),
        paso(2, 'Reportar el caso para escalamiento a soporte especializado.', 'Tec. Luis Quispe', 5),
      ],
      minutosEstimados: 15,
      planContinuidad:
        'La sala de informes mantiene una estación de contingencia conectada al visor de imágenes mientras se repara el equipo.',
      responsableReversa: 'Tec. Luis Quispe',
    },
    observacionDecision: null,
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-23T08:15:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Tec. Luis Quispe'),
      evento('2026-11-23T08:25:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.', 'Tec. Luis Quispe'),
      evento('2026-11-23T08:40:00-05:00', 'APROBADO', 'EN_EVALUACION', 'Aprobación acelerada por tratarse de un cambio urgente.', 'Ing. Roberto Ramos'),
      evento('2026-11-23T08:50:00-05:00', 'EN_EJECUCION', 'APROBADO', 'Intervención iniciada.', 'Tec. Luis Quispe'),
    ],
  },
  {
    id: 4,
    codigo: 'SC-2026-0004',
    titulo: 'Instalación del nuevo controlador para impresoras de pulseras Zebra en Triaje',
    tipo: 'RUTINARIO',
    categoria: 'EQUIPO_USUARIO',
    estado: 'IMPLEMENTADO',
    impacto: 'MEDIO',
    areasAfectadas: ['Triaje', 'Emergencia'],
    horario: horario('2026-11-15T21:00:00-05:00', '2026-11-15T21:30:00-05:00'),
    solicitante: 'Carlos Huamán',
    responsableEjecucion: 'Carlos Huamán',
    fechaRegistroIso: '2026-11-12T16:00:00-05:00',
    descripcion:
      'Instalar la versión actualizada del controlador de impresoras Zebra en las estaciones de Triaje y Emergencia.',
    justificacion:
      'El controlador anterior genera impresiones borrosas en las pulseras de pacientes y obliga a repetir la impresión.',
    equiposAfectados: ['PC-TRIAJE-01', 'PC-TRIAJE-02', 'PC-EMERGENCIA-03'],
    idTicketOrigen: 1188,
    evaluacion: {
      nivel: 'MEDIO',
      areasAfectadas: areas('Triaje', 'Emergencia'),
      requiereInterrupcion: false,
      minutosInterrupcion: null,
      serviciosAfectados: ['Impresión de pulseras de pacientes'],
      pacientesPotencialmenteAfectados: null,
      descripcion:
        'La impresión se realiza desde equipos alternos mientras se actualiza cada estación, sin interrumpir la atención.',
    },
    pasosImplementacion: [
      paso(1, 'Descargar el controlador validado por el fabricante.', 'Carlos Huamán', 5),
      paso(2, 'Actualizar las tres estaciones una por una.', 'Carlos Huamán', 20),
      paso(3, 'Imprimir pulseras de prueba y verificar la legibilidad.', 'Carlos Huamán', 5),
    ],
    planReversa: {
      criterioActivacion:
        'Si las pulseras de prueba salen ilegibles o el sistema no reconoce la impresora.',
      pasos: [
        paso(1, 'Desinstalar el controlador nuevo y reinstalar la versión anterior.', 'Carlos Huamán', 10),
        paso(2, 'Imprimir una pulsera de prueba para confirmar el funcionamiento.', 'Carlos Huamán', 5),
      ],
      minutosEstimados: 15,
      planContinuidad:
        'Las estaciones de Enfermería mantienen una impresora configurada como alternativa para pulseras.',
      responsableReversa: 'Carlos Huamán',
    },
    observacionDecision: 'Aprobado por el comité de evaluación técnica.',
    resultadoImplementacion:
      'Controlador instalado en las tres estaciones. Se imprimieron seis pulseras de prueba con lectura correcta.',
    historial: [
      evento('2026-11-12T16:00:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Carlos Huamán'),
      evento('2026-11-13T10:15:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.', 'Carlos Huamán'),
      evento('2026-11-14T09:00:00-05:00', 'APROBADO', 'EN_EVALUACION', 'Aprobado por el comité de evaluación técnica.', 'Ing. Roberto Ramos'),
      evento('2026-11-15T21:00:00-05:00', 'EN_EJECUCION', 'APROBADO', 'Intervención iniciada.', 'Carlos Huamán'),
      evento('2026-11-15T21:25:00-05:00', 'IMPLEMENTADO', 'EN_EJECUCION', 'Controlador instalado en las tres estaciones. Se imprimieron seis pulseras de prueba con lectura correcta.', 'Carlos Huamán'),
    ],
  },
  {
    id: 5,
    codigo: 'SC-2026-0005',
    titulo: 'Ampliación de cobertura wifi en hospitalización de Pediatría',
    tipo: 'PROGRAMADO',
    categoria: 'RED',
    estado: 'BORRADOR',
    impacto: 'BAJO',
    areasAfectadas: ['Pediatría'],
    horario: null,
    solicitante: 'Lic. Carla Mendoza',
    responsableEjecucion: null,
    fechaRegistroIso: '2026-11-22T14:40:00-05:00',
    descripcion:
      'Instalar un punto de acceso adicional para mejorar la cobertura wifi en el ala de hospitalización de Pediatría.',
    justificacion:
      'El personal de enfermería reporta pérdida de conexión al usar las tablets de registro clínico en los extremos del ala.',
    equiposAfectados: ['AP-PEDIATRIA-01'],
    idTicketOrigen: null,
    evaluacion: {
      nivel: 'BAJO',
      areasAfectadas: areas('Pediatría'),
      requiereInterrupcion: false,
      minutosInterrupcion: null,
      serviciosAfectados: ['Registro clínico en tablets'],
      pacientesPotencialmenteAfectados: null,
      descripcion:
        'La instalación del punto de acceso no interrumpe la red existente ni la atención de pacientes.',
    },
    pasosImplementacion: [
      paso(1, 'Verificar la ubicación y la alimentación del nuevo punto de acceso.', null, 15),
      paso(2, 'Instalar y configurar el punto de acceso con la red asistencial.', null, 30),
      paso(3, 'Medir la cobertura en los extremos del ala.', null, 15),
    ],
    planReversa: {
      criterioActivacion: 'Si el nuevo punto de acceso genera interferencias en la red existente.',
      pasos: [
        paso(1, 'Desconectar y retirar el punto de acceso instalado.', null, 10),
      ],
      minutosEstimados: 10,
      planContinuidad:
        'La cobertura actual se mantiene operativa mientras se define una nueva ubicación para el equipo.',
      responsableReversa: 'Ing. Roberto Ramos',
    },
    observacionDecision: null,
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-22T14:40:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Lic. Carla Mendoza'),
    ],
  },
  {
    id: 6,
    codigo: 'SC-2026-0006',
    titulo: 'Migración del módulo de farmacia del sistema clínico a la nueva versión',
    tipo: 'PROGRAMADO',
    categoria: 'SISTEMA_CLINICO',
    estado: 'RECHAZADO',
    impacto: 'CRITICO',
    areasAfectadas: ['Farmacia Central', 'UCI Adultos'],
    horario: horario('2026-11-25T02:00:00-05:00', '2026-11-25T05:00:00-05:00'),
    solicitante: 'Lic. Carla Mendoza',
    responsableEjecucion: 'Ing. Ana Torres',
    fechaRegistroIso: '2026-11-19T17:25:00-05:00',
    descripcion:
      'Migrar el módulo de farmacia del sistema clínico a la nueva versión para habilitar la dispensación por código de barras.',
    justificacion:
      'La nueva versión reduce los errores de dispensación y permite integrar la lectura de recetas con el lector de código de barras.',
    equiposAfectados: ['SRV-HIS-01', 'PC-FARMACIA-02'],
    idTicketOrigen: 1199,
    evaluacion: {
      nivel: 'CRITICO',
      areasAfectadas: areas('Farmacia Central', 'UCI Adultos'),
      requiereInterrupcion: true,
      minutosInterrupcion: 180,
      serviciosAfectados: ['Dispensación de medicamentos', 'Prescripción desde UCI'],
      pacientesPotencialmenteAfectados: 'Pacientes hospitalizados que requieren medicación durante la madrugada',
      descripcion:
        'El módulo de farmacia queda fuera de servicio durante la migración. UCI mantiene stock crítico en el servicio y Farmacia dispensa con registros manuales.',
    },
    pasosImplementacion: [
      paso(1, 'Respaldar la base de datos del módulo de farmacia.', 'Ing. Ana Torres', 30),
      paso(2, 'Ejecutar la migración en el ambiente de producción.', 'Ing. Ana Torres', 90),
      paso(3, 'Validar la dispensación por código de barras con Farmacia.', 'Ing. Ana Torres', 30),
    ],
    planReversa: {
      criterioActivacion:
        'Si la migración no concluye a las 04:00 o la dispensación no funciona correctamente.',
      pasos: [
        paso(1, 'Restaurar el respaldo previo del módulo de farmacia.', 'Ing. Ana Torres', 45),
        paso(2, 'Validar la dispensación con el personal de Farmacia.', 'Ing. Ana Torres', 15),
      ],
      minutosEstimados: 60,
      planContinuidad:
        'Farmacia dispensa con el formato manual F-FAR-07 y UCI mantiene stock crítico en el servicio durante la intervención.',
      responsableReversa: 'Ing. Ana Torres',
    },
    observacionDecision:
      'Coincide con inventario anual de Farmacia; reprogramar en diciembre.',
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-19T17:25:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Lic. Carla Mendoza'),
      evento('2026-11-20T09:10:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.', 'Lic. Carla Mendoza'),
      evento('2026-11-21T11:30:00-05:00', 'RECHAZADO', 'EN_EVALUACION', 'Coincide con inventario anual de Farmacia; reprogramar en diciembre.', 'Ing. Roberto Ramos'),
    ],
  },
  {
    id: 7,
    codigo: 'SC-2026-0007',
    titulo: 'Renovación del certificado de seguridad del portal de resultados de laboratorio',
    tipo: 'RUTINARIO',
    categoria: 'SEGURIDAD',
    estado: 'APROBADO',
    impacto: 'MEDIO',
    areasAfectadas: ['Laboratorio Clínico'],
    horario: horario('2026-11-26T22:00:00-05:00', '2026-11-26T22:20:00-05:00'),
    solicitante: 'Ing. Ana Torres',
    responsableEjecucion: 'Ing. Ana Torres',
    fechaRegistroIso: '2026-11-17T10:00:00-05:00',
    descripcion:
      'Reemplazar el certificado de seguridad del portal de resultados de laboratorio antes de su vencimiento.',
    justificacion:
      'El certificado actual vence el 30/11/2026. Sin la renovación, el portal mostraría advertencias de seguridad a los usuarios.',
    equiposAfectados: ['SRV-LAB-WEB-01'],
    idTicketOrigen: null,
    evaluacion: {
      nivel: 'MEDIO',
      areasAfectadas: areas('Laboratorio Clínico'),
      requiereInterrupcion: true,
      minutosInterrupcion: 5,
      serviciosAfectados: ['Consulta de resultados en línea'],
      pacientesPotencialmenteAfectados: null,
      descripcion:
        'El portal se reinicia durante el reemplazo del certificado. Los resultados siguen disponibles por los canales habituales del laboratorio.',
    },
    pasosImplementacion: [
      paso(1, 'Solicitar y validar el nuevo certificado con el proveedor.', 'Ing. Ana Torres', 5),
      paso(2, 'Instalar el certificado y reiniciar el portal.', 'Ing. Ana Torres', 10),
      paso(3, 'Verificar el acceso seguro desde dos equipos.', 'Ing. Ana Torres', 5),
    ],
    planReversa: {
      criterioActivacion: 'Si el portal no inicia con el certificado nuevo o muestra errores de seguridad.',
      pasos: [
        paso(1, 'Reinstalar el certificado anterior vigente.', 'Ing. Ana Torres', 5),
        paso(2, 'Reiniciar el portal y validar el acceso.', 'Ing. Ana Torres', 5),
      ],
      minutosEstimados: 10,
      planContinuidad:
        'El laboratorio entrega resultados impresos en ventanilla mientras el portal no esté disponible.',
      responsableReversa: 'Ing. Ana Torres',
    },
    observacionDecision: 'Aprobado por el comité de evaluación técnica.',
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-17T10:00:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Ing. Ana Torres'),
      evento('2026-11-18T09:20:00-05:00', 'EN_EVALUACION', 'BORRADOR', 'Enviada al comité de evaluación técnica.', 'Ing. Ana Torres'),
      evento('2026-11-19T16:00:00-05:00', 'APROBADO', 'EN_EVALUACION', 'Aprobado por el comité de evaluación técnica.', 'Ing. Roberto Ramos'),
    ],
  },
  {
    id: 8,
    codigo: 'SC-2026-0008',
    titulo: 'Cambio de antivirus en estaciones de enfermería de Centro Quirúrgico',
    tipo: 'PROGRAMADO',
    categoria: 'SEGURIDAD',
    estado: 'BORRADOR',
    impacto: 'ALTO',
    areasAfectadas: ['Centro Quirúrgico'],
    horario: horario('2026-12-02T20:00:00-05:00', '2026-12-02T23:00:00-05:00'),
    solicitante: 'Tec. Luis Quispe',
    responsableEjecucion: 'Tec. Luis Quispe',
    fechaRegistroIso: '2026-11-22T18:30:00-05:00',
    descripcion:
      'Reemplazar la solución antivirus en las estaciones de enfermería del Centro Quirúrgico por la plataforma institucional actualizada.',
    justificacion:
      'La solución actual dejó de recibir actualizaciones de firmas y no cumple con la política de seguridad institucional.',
    equiposAfectados: ['PC-QUIRURGICO-01', 'PC-QUIRURGICO-02', 'PC-QUIRURGICO-03'],
    idTicketOrigen: null,
    evaluacion: {
      nivel: 'ALTO',
      areasAfectadas: areas('Centro Quirúrgico'),
      requiereInterrupcion: true,
      minutosInterrupcion: 45,
      serviciosAfectados: ['Registro de enfermería en sala de operaciones'],
      pacientesPotencialmenteAfectados: 'Pacientes programados en sala de operaciones durante la ventana',
      descripcion:
        'Las estaciones se reinician durante la instalación. Enfermería registra en formato físico y transcribe al restablecerse el servicio.',
    },
    pasosImplementacion: [
      paso(1, 'Validar el respaldo de la configuración de las estaciones.', 'Tec. Luis Quispe', 15),
      paso(2, 'Desinstalar la solución anterior y aplicar la plataforma institucional.', 'Tec. Luis Quispe', 90),
      paso(3, 'Reiniciar y verificar el registro de enfermería en cada estación.', 'Tec. Luis Quispe', 30),
    ],
    planReversa: {
      criterioActivacion:
        'Si las estaciones no inician el registro de enfermería o la plataforma institucional presenta errores.',
      pasos: [
        paso(1, 'Restaurar la imagen de respaldo de las estaciones afectadas.', 'Tec. Luis Quispe', 30),
        paso(2, 'Validar el registro de enfermería en cada estación.', 'Tec. Luis Quispe', 15),
      ],
      minutosEstimados: 45,
      planContinuidad:
        'Enfermería registra en el formato físico F-ENF-02 y transcribe la información al restablecerse las estaciones.',
      responsableReversa: 'Tec. Luis Quispe',
    },
    observacionDecision: null,
    resultadoImplementacion: null,
    historial: [
      evento('2026-11-22T18:30:00-05:00', 'BORRADOR', null, 'Solicitud registrada como borrador.', 'Tec. Luis Quispe'),
    ],
  },
];

interface ErrorMock {
  readonly status: number;
  readonly error: { readonly mensaje: string; readonly campo?: string };
}

function error(status: number, mensaje: string, campo?: string): ErrorMock {
  return { status, error: { mensaje, campo } };
}

function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function aResumen(cambio: CambioDetalle): CambioResumen {
  const {
    id,
    codigo,
    titulo,
    tipo,
    categoria,
    estado,
    impacto,
    areasAfectadas,
    horario: horarioProgramado,
    solicitante,
    responsableEjecucion,
    fechaRegistroIso,
  } = cambio;
  return {
    id,
    codigo,
    titulo,
    tipo,
    categoria,
    estado,
    impacto,
    areasAfectadas,
    horario: horarioProgramado,
    solicitante,
    responsableEjecucion,
    fechaRegistroIso,
  };
}

@Injectable()
export class CambiosMock extends CambiosApi {
  private cambios: CambioDetalle[] = structuredClone(SEMILLAS) as CambioDetalle[];
  private readonly areas = structuredClone(AREAS_SELECCIONABLES) as AreaAfectada[];
  private readonly usuarioActual = 'Jefatura de Informática';

  listar(filtro?: Partial<FiltroCambios>): Observable<CambioResumen[]> {
    let resultado = [...this.cambios];

    if (filtro?.estado) {
      resultado = resultado.filter((cambio) => cambio.estado === filtro.estado);
    }
    if (filtro?.impacto) {
      resultado = resultado.filter((cambio) => cambio.impacto === filtro.impacto);
    }
    if (filtro?.tipo) {
      resultado = resultado.filter((cambio) => cambio.tipo === filtro.tipo);
    }
    if (filtro?.texto?.trim()) {
      const consulta = normalizar(filtro.texto);
      resultado = resultado.filter((cambio) =>
        [
          cambio.codigo,
          cambio.titulo,
          cambio.solicitante,
          cambio.responsableEjecucion ?? '',
          ...cambio.areasAfectadas,
        ].some((valor) => normalizar(valor).includes(consulta)),
      );
    }

    return of(resultado.map(aResumen)).pipe(delay(400));
  }

  obtener(id: number): Observable<CambioDetalle> {
    const cambio = this.cambios.find((item) => item.id === id);
    if (!cambio) {
      return throwError(() => error(404, 'La solicitud de cambio no existe.'));
    }
    return of(structuredClone(cambio) as CambioDetalle).pipe(delay(400));
  }

  crear(formulario: CambioFormulario): Observable<CambioDetalle> {
    const ahora = new Date().toISOString();
    const nuevo: CambioDetalle = {
      id: Math.max(0, ...this.cambios.map((cambio) => cambio.id)) + 1,
      codigo: this.siguienteCodigo(),
      titulo: formulario.titulo,
      tipo: formulario.tipo,
      categoria: formulario.categoria,
      estado: 'BORRADOR',
      impacto: formulario.evaluacion.nivel,
      areasAfectadas: this.nombresDeAreas(formulario.evaluacion.idsAreasAfectadas),
      horario: formulario.horario,
      solicitante: this.usuarioActual,
      responsableEjecucion: formulario.responsableEjecucion,
      fechaRegistroIso: ahora,
      descripcion: formulario.descripcion,
      justificacion: formulario.justificacion,
      equiposAfectados: formulario.equiposAfectados,
      idTicketOrigen: formulario.idTicketOrigen,
      evaluacion: {
        nivel: formulario.evaluacion.nivel,
        areasAfectadas: this.areasDe(formulario.evaluacion.idsAreasAfectadas),
        requiereInterrupcion: formulario.evaluacion.requiereInterrupcion,
        minutosInterrupcion: formulario.evaluacion.minutosInterrupcion,
        serviciosAfectados: formulario.evaluacion.serviciosAfectados,
        pacientesPotencialmenteAfectados:
          formulario.evaluacion.pacientesPotencialmenteAfectados,
        descripcion: formulario.evaluacion.descripcion,
      },
      pasosImplementacion: this.conOrden(formulario.pasosImplementacion),
      planReversa: {
        criterioActivacion: formulario.planReversa.criterioActivacion,
        pasos: this.conOrden(formulario.planReversa.pasos),
        minutosEstimados: formulario.planReversa.minutosEstimados,
        planContinuidad: formulario.planReversa.planContinuidad,
        responsableReversa: formulario.planReversa.responsableReversa,
      },
      observacionDecision: null,
      resultadoImplementacion: null,
      historial: [
        {
          fechaIso: ahora,
          usuarioNombre: this.usuarioActual,
          estadoAnterior: null,
          estadoNuevo: 'BORRADOR',
          observacion: 'Solicitud registrada como borrador.',
        },
      ],
    };

    this.cambios = [nuevo, ...this.cambios];
    return of(structuredClone(nuevo) as CambioDetalle).pipe(delay(400));
  }

  actualizar(id: number, formulario: CambioFormulario): Observable<CambioDetalle> {
    const indice = this.cambios.findIndex((cambio) => cambio.id === id);
    if (indice === -1) {
      return throwError(() => error(404, 'La solicitud de cambio no existe.'));
    }
    const actual = this.cambios[indice];
    if (actual.estado !== 'BORRADOR') {
      return throwError(() =>
        error(409, 'Solo se puede editar una solicitud en borrador.', 'estado'),
      );
    }

    const actualizado: CambioDetalle = {
      ...actual,
      titulo: formulario.titulo,
      tipo: formulario.tipo,
      categoria: formulario.categoria,
      impacto: formulario.evaluacion.nivel,
      areasAfectadas: this.nombresDeAreas(formulario.evaluacion.idsAreasAfectadas),
      horario: formulario.horario,
      responsableEjecucion: formulario.responsableEjecucion,
      descripcion: formulario.descripcion,
      justificacion: formulario.justificacion,
      equiposAfectados: formulario.equiposAfectados,
      idTicketOrigen: formulario.idTicketOrigen,
      evaluacion: {
        nivel: formulario.evaluacion.nivel,
        areasAfectadas: this.areasDe(formulario.evaluacion.idsAreasAfectadas),
        requiereInterrupcion: formulario.evaluacion.requiereInterrupcion,
        minutosInterrupcion: formulario.evaluacion.minutosInterrupcion,
        serviciosAfectados: formulario.evaluacion.serviciosAfectados,
        pacientesPotencialmenteAfectados:
          formulario.evaluacion.pacientesPotencialmenteAfectados,
        descripcion: formulario.evaluacion.descripcion,
      },
      pasosImplementacion: this.conOrden(formulario.pasosImplementacion),
      planReversa: {
        criterioActivacion: formulario.planReversa.criterioActivacion,
        pasos: this.conOrden(formulario.planReversa.pasos),
        minutosEstimados: formulario.planReversa.minutosEstimados,
        planContinuidad: formulario.planReversa.planContinuidad,
        responsableReversa: formulario.planReversa.responsableReversa,
      },
    };

    this.cambios = this.cambios.map((cambio) => (cambio.id === id ? actualizado : cambio));
    return of(structuredClone(actualizado) as CambioDetalle).pipe(delay(400));
  }

  transicionar(id: number, transicion: TransicionCambio): Observable<CambioDetalle> {
    const indice = this.cambios.findIndex((cambio) => cambio.id === id);
    if (indice === -1) {
      return throwError(() => error(404, 'La solicitud de cambio no existe.'));
    }
    const actual = this.cambios[indice];
    const destino = estadoDestino(actual.estado, transicion.accion);
    if (!destino) {
      return throwError(() =>
        error(409, 'La acción no es válida para el estado actual de la solicitud.', 'accion'),
      );
    }

    const observacion = transicion.observacion?.trim() ?? '';
    if (ACCIONES_CON_OBSERVACION.includes(transicion.accion) && !observacion) {
      return throwError(() =>
        error(409, 'Debe registrar una observación para esta acción.', 'observacion'),
      );
    }

    const actualizado: CambioDetalle = {
      ...actual,
      estado: destino,
      observacionDecision:
        transicion.accion === 'APROBAR' || transicion.accion === 'RECHAZAR'
          ? observacion || null
          : actual.observacionDecision,
      resultadoImplementacion:
        transicion.accion === 'MARCAR_IMPLEMENTADO'
          ? observacion
          : actual.resultadoImplementacion,
      historial: [
        ...actual.historial,
        {
          fechaIso: new Date().toISOString(),
          usuarioNombre: this.usuarioActual,
          estadoAnterior: actual.estado,
          estadoNuevo: destino,
          observacion: observacion || null,
        },
      ],
    };

    this.cambios = this.cambios.map((cambio) => (cambio.id === id ? actualizado : cambio));
    return of(structuredClone(actualizado) as CambioDetalle).pipe(delay(400));
  }

  eliminar(id: number): Observable<void> {
    const cambio = this.cambios.find((item) => item.id === id);
    if (!cambio) {
      return throwError(() => error(404, 'La solicitud de cambio no existe.'));
    }
    if (cambio.estado !== 'BORRADOR') {
      return throwError(() =>
        error(409, 'Solo se puede eliminar una solicitud en borrador.', 'estado'),
      );
    }
    this.cambios = this.cambios.filter((item) => item.id !== id);
    return of(undefined).pipe(delay(400));
  }

  listarAreasSeleccionables(): Observable<AreaAfectada[]> {
    return of(structuredClone(this.areas) as AreaAfectada[]).pipe(delay(400));
  }

  private siguienteCodigo(): string {
    const anio = new Date().getFullYear();
    const prefijo = `SC-${anio}-`;
    const mayor = this.cambios
      .filter((cambio) => cambio.codigo.startsWith(prefijo))
      .reduce(
        (maximo, cambio) =>
          Math.max(maximo, Number.parseInt(cambio.codigo.slice(prefijo.length), 10) || 0),
        0,
      );
    return `${prefijo}${String(mayor + 1).padStart(4, '0')}`;
  }

  private areasDe(ids: readonly number[]): AreaAfectada[] {
    return ids
      .map((id) => this.areas.find((area) => area.idArea === id))
      .filter((area): area is AreaAfectada => Boolean(area));
  }

  private nombresDeAreas(ids: readonly number[]): string[] {
    return this.areasDe(ids).map((area) => area.nombre);
  }

  private conOrden(
    pasos: readonly Omit<PasoPlan, 'orden'>[],
  ): PasoPlan[] {
    return pasos.map((pasoPlan, indice) => ({ ...pasoPlan, orden: indice + 1 }));
  }
}
