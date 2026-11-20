package com.hospital.servicedesk.administrativo.equipos.dominio.codigo;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.TipoCI;

/**
 * Contrato de estrategia (Strategy Pattern - OCP) para la generación
 * y sugerencia de códigos de inventario de equipos hospitalarios.
 */
public interface EstrategiaCodigoInventario {

    /**
     * Sugiere un código de inventario libre (no registrado) para el tipo de equipo y área dados.
     *
     * @param tipo Tipo de elemento de configuración (ej. COMPUTADORA, IMPRESORA)
     * @param area Área hospitalaria de adscripción
     * @return Código sugerido en formato homogéneo (ej. "PC-ADM-03")
     */
    String sugerir(TipoCI tipo, Area area);
}
