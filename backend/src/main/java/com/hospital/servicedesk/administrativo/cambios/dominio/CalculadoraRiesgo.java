package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.entities.ImpactoAsistencial;
import com.hospital.servicedesk.entities.NivelRiesgo;
import com.hospital.servicedesk.entities.TipoCambio;
import org.springframework.stereotype.Component;

@Component
public class CalculadoraRiesgo {

    public NivelRiesgo calcular(TipoCambio tipo, ImpactoAsistencial impacto, boolean requiereInterrupcion, int numAreas) {
        if (tipo == TipoCambio.URGENTE || impacto == ImpactoAsistencial.CRITICO || (requiereInterrupcion && numAreas >= 3)) {
            return NivelRiesgo.ALTO;
        }
        if (tipo == TipoCambio.PROGRAMADO || impacto == ImpactoAsistencial.ALTO || (requiereInterrupcion && numAreas >= 2)) {
            return NivelRiesgo.MEDIO;
        }
        return NivelRiesgo.BAJO;
    }
}
