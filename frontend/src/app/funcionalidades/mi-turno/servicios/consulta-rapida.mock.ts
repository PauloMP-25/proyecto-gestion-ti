import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivoResumen } from '../../../compartido/modelos/activo-resumen.model';
import { ArticuloResumen, ArticuloDetalle } from '../../../compartido/modelos/articulo-conocimiento.model';
import { TipoActivo } from '../../cmdb/modelos/tipo-activo.enum';
import { conLatencia } from '../../../compartido/utilidades/mock-util';
import { ConsultaRapidaApi } from './consulta-rapida.api';

@Injectable()
export class ConsultaRapidaMock extends ConsultaRapidaApi {
  private activos: ActivoResumen[] = [
    {
      id: 1,
      nombre: 'Computadora Triaje Emergencia',
      tipo: TipoActivo.COMPUTADORA,
      estado: 'ACTIVO',
      hostname: 'HSP-EMG-PC01',
      ip: '10.20.30.15',
      areaId: 1,
      areaNombre: 'Triaje Emergencia',
      fallasUltimos90Dias: 2,
      enPrestamo: false,
    },
    {
      id: 2,
      nombre: 'Servidor Local GalenHos Emergencia',
      tipo: TipoActivo.SERVIDOR,
      estado: 'ACTIVO',
      hostname: 'HSP-EMG-SRV01',
      ip: '10.20.30.10',
      areaId: 1,
      areaNombre: 'Emergencia General',
      fallasUltimos90Dias: 1,
      enPrestamo: false,
    },
    {
      id: 3,
      nombre: 'Impresora Térmica Recetas Farmacia',
      tipo: TipoActivo.IMPRESORA,
      estado: 'ACTIVO',
      hostname: 'HSP-FAR-IMP02',
      ip: '10.20.30.55',
      areaId: 2,
      areaNombre: 'Farmacia Central',
      fallasUltimos90Dias: 4,
      enPrestamo: false,
    },
    {
      id: 4,
      nombre: 'Monitor Multiparámetro Cama 04 UCI',
      tipo: TipoActivo.OTRO,
      estado: 'ACTIVO',
      hostname: 'HSP-UCI-MON04',
      ip: '10.20.40.14',
      areaId: 3,
      areaNombre: 'UCI Adultos',
      fallasUltimos90Dias: 1,
      enPrestamo: true,
    },
    {
      id: 5,
      nombre: 'Computadora Consultorio Externo 12',
      tipo: TipoActivo.COMPUTADORA,
      estado: 'ACTIVO',
      hostname: 'HSP-CXT-PC12',
      ip: '10.20.30.82',
      areaId: 4,
      areaNombre: 'Consultorios Externos',
      fallasUltimos90Dias: 3,
      enPrestamo: false,
    },
    {
      id: 6,
      nombre: 'Switch Troncal Rack Piso 2',
      tipo: TipoActivo.SWITCH,
      estado: 'MANTENIMIENTO',
      hostname: 'HSP-SW-P02',
      ip: '10.20.10.12',
      areaId: 6,
      areaNombre: 'Hospitalización 2do Piso',
      fallasUltimos90Dias: 2,
      enPrestamo: false,
    },
    {
      id: 7,
      nombre: 'Computadora Admisión General 03',
      tipo: TipoActivo.COMPUTADORA,
      estado: 'ACTIVO',
      hostname: 'HSP-ADM-PC03',
      ip: '10.20.30.22',
      areaId: 7,
      areaNombre: 'Admisión General',
      fallasUltimos90Dias: 0,
      enPrestamo: false,
    },
  ];

  private articulos: ArticuloDetalle[] = [
    {
      id: 201,
      titulo: 'Restablecer conexión y servicio local GalenHos',
      categoriaId: 1,
      categoriaNombre: 'Sistemas Hospitalarios',
      sintoma: 'Error "No se puede establecer conexión con el servidor de base de datos" o pantalla congelada al abrir GalenHos.',
      causaRaiz: 'Servicio "GalenHosHostService" detenido o socket TCP 1433 bloqueado tras microcorte de energía.',
      solucionTemporal: 'Reiniciar el servicio de enlace en el equipo cliente o reconectar la unidad de red mapeada.',
      pasos: [
        'Cerrar todas las ventanas abiertas de GalenHos en el equipo.',
        'Presionar Win + R, escribir "services.msc" y buscar el servicio "GalenHos Agent".',
        'Hacer clic derecho y seleccionar "Reiniciar".',
        'Verificar conectividad al servidor ejecutando "ping 10.20.30.10" en consola.',
        'Abrir nuevamente GalenHos e intentar el inicio de sesión con las credenciales del médico.',
      ],
    },
    {
      id: 202,
      titulo: 'Desbloqueo y calibración de lector biométrico de huella digital',
      categoriaId: 2,
      categoriaNombre: 'Hardware / Periféricos',
      sintoma: 'Lector DigitalPersona parpadea en rojo constante y no captura huellas en el sistema de recetas.',
      causaRaiz: 'Suciedad en el prisma óptico o suspensión USB por ahorro de energía de Windows.',
      solucionTemporal: 'Limpieza con paño seco antiestático y desconectar/reconectar el puerto USB frontal.',
      pasos: [
        'Desconectar el lector biométrico del puerto USB.',
        'Limpiar suavemente el sensor con paño de microfibra seco.',
        'Conectar el lector en un puerto USB posterior directo de la placa madre.',
        'En Administrador de Dispositivos, desmarcar "Permitir que el equipo apague este dispositivo para ahorrar energía" en controladores USB.',
        'Comprobar la luz azul fija de sensor listo y probar lectura con el médico.',
      ],
    },
    {
      id: 203,
      titulo: 'Atasco o atasco de spooler en impresora térmica de recetas',
      categoriaId: 2,
      categoriaNombre: 'Hardware / Impresoras',
      sintoma: 'La luz de "Error" parpadea en naranja y los tickets de recetas se quedan en cola sin imprimir.',
      causaRaiz: 'Sensor de tapa abierto o cola de impresión bloqueada con documentos huérfanos.',
      solucionTemporal: 'Vaciar la cola de impresión y reiniciar el servicio Spooler de Windows.',
      pasos: [
        'Abrir la tapa de la impresora térmica, retirar el rollo y verificar que no queden fragmentos de papel trabados en la guillotina.',
        'Colocar el rollo asegurando que el papel salga por la parte inferior.',
        'Cerrar la tapa firmemente hasta escuchar el chasquido.',
        'Ejecutar en símbolo del sistema: "net stop spooler && net start spooler".',
        'Imprimir una página de prueba desde las propiedades de la impresora.',
      ],
    },
    {
      id: 204,
      titulo: 'Restablecimiento de acceso y credenciales SIS / GalenHos',
      categoriaId: 3,
      categoriaNombre: 'Cuentas y Accesos',
      sintoma: 'Mensaje "Cuenta bloqueada temporalmente por superar el número de intentos fallidos".',
      causaRaiz: 'Caducidad de contraseña cada 45 días o tecleo incorrecto de contraseña con teclado numérico desactivado.',
      solucionTemporal: 'Desbloqueo manual en Active Directory / consola de usuarios hospitalarios.',
      pasos: [
        'Validar la identidad del personal solicitante (DNI y área asignada).',
        'Abrir la consola de administración de usuarios y buscar por DNI o apellido.',
        'Marcar la casilla "Desbloquear cuenta" y restablecer contraseña temporal "Hsmsi2026*".',
        'Indicar al usuario que ingrese y cambie la contraseña en su primer inicio de sesión.',
      ],
    },
  ];

  buscarActivos(texto: string): Observable<ActivoResumen[]> {
    return conLatencia(() => {
      const term = (texto || '').trim().toLowerCase();
      if (!term) return structuredClone(this.activos);
      return structuredClone(
        this.activos.filter(a =>
          a.nombre.toLowerCase().includes(term) ||
          (a.hostname && a.hostname.toLowerCase().includes(term)) ||
          (a.ip && a.ip.includes(term)) ||
          a.areaNombre.toLowerCase().includes(term)
        )
      );
    });
  }

  buscarArticulos(texto: string, categoriaId?: number): Observable<ArticuloResumen[]> {
    return conLatencia(() => {
      const term = (texto || '').trim().toLowerCase();
      let res = this.articulos;
      if (categoriaId) {
        res = res.filter(a => a.categoriaId === categoriaId);
      }
      if (term) {
        res = res.filter(a =>
          a.titulo.toLowerCase().includes(term) ||
          a.sintoma.toLowerCase().includes(term) ||
          a.categoriaNombre.toLowerCase().includes(term)
        );
      }
      return structuredClone(
        res.map(a => ({
          id: a.id,
          titulo: a.titulo,
          categoriaId: a.categoriaId,
          categoriaNombre: a.categoriaNombre,
          sintoma: a.sintoma,
        }))
      );
    });
  }

  obtenerArticulo(id: number): Observable<ArticuloDetalle> {
    return conLatencia(() => {
      const art = this.articulos.find(a => a.id === id);
      if (!art) {
        throw new HttpErrorResponse({ status: 404, statusText: 'Guía no encontrada' });
      }
      return structuredClone(art);
    });
  }

  sugerirArticulos(categoriaId: number): Observable<ArticuloResumen[]> {
    return conLatencia(() => {
      const sugerencias = this.articulos.filter(a => a.categoriaId === categoriaId);
      const lista = sugerencias.length > 0 ? sugerencias : this.articulos.slice(0, 3);
      return structuredClone(
        lista.map(a => ({
          id: a.id,
          titulo: a.titulo,
          categoriaId: a.categoriaId,
          categoriaNombre: a.categoriaNombre,
          sintoma: a.sintoma,
        }))
      );
    });
  }
}
