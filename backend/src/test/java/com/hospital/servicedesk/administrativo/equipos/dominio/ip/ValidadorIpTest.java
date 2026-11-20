package com.hospital.servicedesk.administrativo.equipos.dominio.ip;

import com.hospital.servicedesk.administrativo.equipos.config.PropiedadesRed;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class ValidadorIpTest {

    private ValidadorIp validador;

    @BeforeEach
    void setUp() {
        PropiedadesRed propiedades = new PropiedadesRed(true, true);
        List<ReglaIp> reglas = List.of(
                new ReglaIpv4Estricta(),
                new ReglaIpNoReservada(propiedades),
                new ReglaIpPrivada(propiedades)
        );
        validador = new ValidadorIp(reglas);
    }

    @ParameterizedTest(name = "IP válida institucional: {0}")
    @ValueSource(strings = {
            "192.168.10.1",
            "192.168.10.12",
            "192.168.10.21",
            "10.0.1.50",
            "172.16.5.10",
            "127.0.0.1"
    })
    @DisplayName("Debe aceptar direcciones IPv4 privadas válidas y sin ceros a la izquierda")
    void debeAceptarIpsValidas(String ip) {
        Optional<String> violacion = validador.evaluar(ip);
        assertThat(violacion).isEmpty();
    }

    @ParameterizedTest(name = "IP inválida por ceros a la izquierda: {0}")
    @ValueSource(strings = {
            "192.168.010.012",
            "192.168.10.01",
            "010.0.0.1"
    })
    @DisplayName("Debe rechazar direcciones con ceros a la izquierda")
    void debeRechazarCerosALaIzquierda(String ip) {
        Optional<String> violacion = validador.evaluar(ip);
        assertThat(violacion).isPresent();
    }

    @ParameterizedTest(name = "IP reservada o red/broadcast: {0}")
    @ValueSource(strings = {
            "0.0.0.0",
            "255.255.255.255",
            "192.168.10.0",
            "192.168.10.255",
            "224.0.0.1"
    })
    @DisplayName("Debe rechazar direcciones reservadas, multicast, red o broadcast")
    void debeRechazarDireccionesReservadas(String ip) {
        Optional<String> violacion = validador.evaluar(ip);
        assertThat(violacion).isPresent();
    }

    @ParameterizedTest(name = "IP pública rechazada en intranet hospitalaria: {0}")
    @ValueSource(strings = {
            "8.8.8.8",
            "1.1.1.1",
            "200.48.225.130"
    })
    @DisplayName("Debe rechazar IPs públicas cuando se exige direccionamiento privado")
    void debeRechazarIpsPublicas(String ip) {
        Optional<String> violacion = validador.evaluar(ip);
        assertThat(violacion).isPresent();
    }
}
