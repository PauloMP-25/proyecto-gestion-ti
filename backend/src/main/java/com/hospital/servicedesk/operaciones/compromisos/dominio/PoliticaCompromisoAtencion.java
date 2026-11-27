package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.ConfiguracionSlaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class PoliticaCompromisoAtencion {

    static final Map<Prioridad, Integer> MINUTOS_POR_DEFECTO = Map.of(
            Prioridad.CRITICA, 60, Prioridad.ALTA, 120, Prioridad.MEDIA, 480, Prioridad.BAJA, 1440);

    private final ConfiguracionSlaRepository configuracionSlaRepository;

    public LocalDateTime calcularLimite(LocalDateTime inicio, Impacto impacto, Urgencia urgencia, Prioridad prioridad) {
        int minutos = configuracionSlaRepository.findByImpactoAndUrgencia(impacto.name(), urgencia.name())
                .map(ConfiguracionSLA::getMinutosResolucion)
                .orElseGet(() -> MINUTOS_POR_DEFECTO.getOrDefault(prioridad, 480));
        return inicio.plusMinutes(minutos);
    }

    public static String etiquetaPrioridad(Prioridad p) {
        return switch (p) {
            case CRITICA -> "P1 · Crítica";
            case ALTA -> "P2 · Alta";
            case MEDIA -> "P3 · Media";
            case BAJA -> "P4 · Baja";
        };
    }
}
