package com.hospital.servicedesk.compartido.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class NormalizadorBusquedaTest {

    @Test
    void normalizarTextoConTildesYEnie() {
        String res = NormalizadorBusqueda.normalizar("  Admisión  CENTRAL de Ñandú! ");
        assertThat(res).isEqualTo("admision central de ñandu");
    }

    @Test
    void extraerTokensValidos() {
        var tokens = NormalizadorBusqueda.tokens("Impresora térmica de pulseras Zebra");
        assertThat(tokens).contains("impresora", "termica", "pulseras", "zebra");
    }
}
