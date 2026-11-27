package com.hospital.servicedesk.operaciones.compromisos.dominio;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.ConfiguracionSlaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class PoliticaCompromisoAtencionTest {

    @Mock
    private ConfiguracionSlaRepository configuracionSlaRepository;

    private PoliticaCompromisoAtencion politica;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        politica = new PoliticaCompromisoAtencion(configuracionSlaRepository);
    }

    @Test
    void calcularLimiteConConfiguracionExistente() {
        LocalDateTime inicio = LocalDateTime.of(2026, 11, 26, 10, 0);
        ConfiguracionSLA sla = ConfiguracionSLA.builder()
                .impacto(Impacto.ALTO.name())
                .urgencia(Urgencia.ALTA.name())
                .minutosResolucion(90)
                .build();

        when(configuracionSlaRepository.findByImpactoAndUrgencia(Impacto.ALTO.name(), Urgencia.ALTA.name()))
                .thenReturn(Optional.of(sla));

        LocalDateTime limite = politica.calcularLimite(inicio, Impacto.ALTO, Urgencia.ALTA, Prioridad.CRITICA);
        assertThat(limite).isEqualTo(inicio.plusMinutes(90));
    }

    @Test
    void calcularLimiteConDefectoCuandoNoExisteConfiguracion() {
        LocalDateTime inicio = LocalDateTime.of(2026, 11, 26, 23, 30); // Cerca de medianoche
        when(configuracionSlaRepository.findByImpactoAndUrgencia(Impacto.BAJO.name(), Urgencia.BAJA.name()))
                .thenReturn(Optional.empty());

        LocalDateTime limite = politica.calcularLimite(inicio, Impacto.BAJO, Urgencia.BAJA, Prioridad.BAJA);
        assertThat(limite).isEqualTo(inicio.plusMinutes(1440)); // BAJA por defecto = 1440 min (24h)
    }
}
