package com.hospital.servicedesk.administrativo.equipos.dominio.codigo;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class AbreviadorNombreAreaTest {

    @ParameterizedTest(name = "Área \"{0}\" debe abreviarse como \"{1}\"")
    @CsvSource({
            "Admisión, ADM",
            "Emergencia, EME",
            "Farmacia, FAR",
            "Consulta Externa, CE",
            "Unidad de Cuidados Intensivos, UCI",
            "Diagnóstico por Imágenes, DI",
            "Centro Quirúrgico, CQ",
            "Hospitalización Cirugía, HC"
    })
    @DisplayName("Debe abreviar correctamente nombres de áreas hospitalarias simples y compuestas")
    void debeAbreviarCorrectamente(String nombreArea, String esperada) {
        String resultado = AbreviadorNombreArea.abreviar(nombreArea);
        assertThat(resultado).isEqualTo(esperada);
    }

    @Test
    @DisplayName("Debe manejar tildes, mayúsculas y caracteres especiales limpiamente")
    void debeManejarTildesYEspeciales() {
        assertThat(AbreviadorNombreArea.abreviar("ADMISIÓN")).isEqualTo("ADM");
        assertThat(AbreviadorNombreArea.abreviar("Pediatría")).isEqualTo("PED");
        assertThat(AbreviadorNombreArea.abreviar("Tópico de Emergencias")).isEqualTo("TE");
    }

    @Test
    @DisplayName("Debe retornar GEN ante entradas nulas o vacías")
    void debeRetornarGenAnteNuloOVacio() {
        assertThat(AbreviadorNombreArea.abreviar(null)).isEqualTo("GEN");
        assertThat(AbreviadorNombreArea.abreviar("")).isEqualTo("GEN");
        assertThat(AbreviadorNombreArea.abreviar("   ")).isEqualTo("GEN");
    }
}
