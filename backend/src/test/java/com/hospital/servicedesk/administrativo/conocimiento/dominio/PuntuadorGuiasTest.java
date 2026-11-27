package com.hospital.servicedesk.administrativo.conocimiento.dominio;

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
