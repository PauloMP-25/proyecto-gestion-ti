import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 1. CalculadoraCompromisoAtencionTest
write_file("backend/src/test/java/com/hospital/servicedesk/operaciones/compromisos/dominio/CalculadoraCompromisoAtencionTest.java", """package com.hospital.servicedesk.operaciones.compromisos.dominio;

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
""")

# 2. NormalizadorBusquedaTest
write_file("backend/src/test/java/com/hospital/servicedesk/compartido/util/NormalizadorBusquedaTest.java", """package com.hospital.servicedesk.compartido.util;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class NormalizadorBusquedaTest {

    @Test
    void normalizarTextoConTildesYEnie() {
        String res = NormalizadorBusqueda.normalizar("  Admisión  CENTRAL de Ñandú! ");
        assertThat(res).isEqualTo("admision central de ñandú"); // or ñandu depending on regex
    }

    @Test
    void extraerTokensValidos() {
        var tokens = NormalizadorBusqueda.tokens("Impresora térmica de pulseras Zebra");
        assertThat(tokens).contains("impresora", "termica", "pulseras", "zebra");
    }
}
""")

# 3. PuntuadorGuiasTest
write_file("backend/src/test/java/com/hospital/servicedesk/administrativo/conocimiento/dominio/PuntuadorGuiasTest.java", """package com.hospital.servicedesk.administrativo.conocimiento.dominio;

import com.hospital.servicedesk.entities.ErrorConocido;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PuntuadorGuiasTest {

    @Test
    void puntuarYOrdenarGuias() {
        ErrorConocido g1 = ErrorConocido.builder()
                .idError(1)
                .titulo("Impresora Zebra")
                .descripcionProblema("Atasco de papel")
                .palabrasClave(List.of("zebra"))
                .conteoUtil(10)
                .build();

        ErrorConocido g2 = ErrorConocido.builder()
                .idError(2)
                .titulo("Sistema HIS")
                .descripcionProblema("Error de conexión impresora Zebra")
                .palabrasClave(List.of("his"))
                .conteoUtil(5)
                .build();

        List<String> tokens = List.of("zebra");
        int p1 = PuntuadorGuias.puntuar(g1, tokens);
        int p2 = PuntuadorGuias.puntuar(g2, tokens);

        assertThat(p1).isGreaterThan(p2);

        List<ErrorConocido> ordenadas = PuntuadorGuias.ordenar(List.of(g2, g1), tokens);
        assertThat(ordenadas.get(0).getIdError()).isEqualTo(1);
    }
}
""")

print("Phase 7 test files generated successfully.")
