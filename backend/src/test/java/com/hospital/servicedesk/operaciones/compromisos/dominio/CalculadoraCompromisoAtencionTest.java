package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.EstadoSLA;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraCompromisoAtencionTest {

    private static final LocalDateTime CREACION = LocalDateTime.of(2026, 12, 1, 10, 0);
    private static final LocalDateTime LIMITE_P1 = CREACION.plusMinutes(60);

    @ParameterizedTest(name = "a los {0} min → {1}")
    @CsvSource({
            "0,  DENTRO_TIEMPO",
            "41, DENTRO_TIEMPO",
            "42, POR_VENCER",
            "59, POR_VENCER",
            "60, VENCIDO",
            "300, VENCIDO"
    })
    void umbrales(int minutos, EstadoSLA esperado) {
        var ev = CalculadoraCompromisoAtencion.evaluar(CREACION, LIMITE_P1, CREACION.plusMinutes(minutos), 0.70);
        assertThat(ev.estado()).isEqualTo(esperado);
    }

    @Test
    void plazoMalConfiguradoNoDivideEntreCero() {
        var ev = CalculadoraCompromisoAtencion.evaluar(CREACION, CREACION, CREACION, 0.70);
        assertThat(ev.estado()).isEqualTo(EstadoSLA.VENCIDO);
    }
}
