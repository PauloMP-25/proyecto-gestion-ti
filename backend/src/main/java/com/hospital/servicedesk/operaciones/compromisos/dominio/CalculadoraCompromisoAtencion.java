package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.EstadoSLA;

import java.time.Duration;
import java.time.LocalDateTime;

public final class CalculadoraCompromisoAtencion {

    private CalculadoraCompromisoAtencion() {}

    public record EvaluacionCompromiso(EstadoSLA estado, double fraccionConsumida, Duration restante) {}

    public static EvaluacionCompromiso evaluar(LocalDateTime inicio, LocalDateTime limite,
                                               LocalDateTime ahora, double umbralRiesgo) {
        long total = Math.max(Duration.between(inicio, limite).toSeconds(), 1);
        long transcurrido = Math.max(Duration.between(inicio, ahora).toSeconds(), 0);
        double fraccion = (double) transcurrido / total;

        EstadoSLA estado = !ahora.isBefore(limite) ? EstadoSLA.VENCIDO
                : fraccion >= umbralRiesgo ? EstadoSLA.POR_VENCER
                : EstadoSLA.DENTRO_TIEMPO;

        Duration restante = Duration.between(ahora, limite);
        return new EvaluacionCompromiso(estado, fraccion, restante);
    }
}
