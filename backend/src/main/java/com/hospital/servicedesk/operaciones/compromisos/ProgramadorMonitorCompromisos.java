package com.hospital.servicedesk.operaciones.compromisos;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "servicedesk.compromisos.monitor-habilitado", havingValue = "true", matchIfMissing = true)
public class ProgramadorMonitorCompromisos {

    private final EvaluadorCompromisosAtencion evaluador;

    @Scheduled(fixedRateString = "${servicedesk.compromisos.intervalo-ms:60000}",
            initialDelayString = "${servicedesk.compromisos.retraso-inicial-ms:30000}")
    public void programarEvaluacion() {
        try {
            evaluador.ejecutarCiclo();
        } catch (Exception e) {
            log.error("Error en ciclo automático del monitor de compromisos: {}", e.getMessage(), e);
        }
    }
}
