package com.hospital.servicedesk.administrativo.equipos.dominio.codigo;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Estrategia por defecto de codificación de inventario hospitalario.
 * Formato: {TIPO}-{ABREV_AREA}-{CORRELATIVO}
 * Ejemplo: PC-ADM-01, PC-ADM-02, IMP-ADM-01, IMP-EME-01.
 */
@Component
public class CodigoPorTipoYAbreviaturaArea implements EstrategiaCodigoInventario {

    private static final Map<TipoCI, String> PREFIJOS_TIPO = Map.of(
            TipoCI.COMPUTADORA, "PC",
            TipoCI.IMPRESORA, "IMP"
    );

    private final ElementoConfiguracionRepository repository;

    public CodigoPorTipoYAbreviaturaArea(ElementoConfiguracionRepository repository) {
        this.repository = repository;
    }

    @Override
    public String sugerir(TipoCI tipo, Area area) {
        String prefijoTipo = PREFIJOS_TIPO.getOrDefault(tipo, "EQ");
        String abrevArea = (area != null && area.getNombre() != null)
                ? AbreviadorNombreArea.abreviar(area.getNombre())
                : "GEN";

        String base = prefijoTipo + "-" + abrevArea;

        // Buscar el primer correlativo disponible que no colisione con el inventario existente
        for (int i = 1; i <= 999; i++) {
            String formato = (i < 100) ? "%s-%02d" : "%s-%d";
            String candidato = String.format(formato, base, i);
            if (!repository.existsByCodigoInventarioIgnoreCase(candidato)) {
                return candidato;
            }
        }

        return base + "-999";
    }
}
