package com.hospital.servicedesk.administrativo.equipos.dominio.codigo;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.TipoCI;
import com.hospital.servicedesk.repositories.ElementoConfiguracionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CodigoPorTipoYAbreviaturaAreaTest {

    @Mock
    private ElementoConfiguracionRepository repository;

    @InjectMocks
    private CodigoPorTipoYAbreviaturaArea estrategia;

    @Test
    @DisplayName("Debe sugerir PC-ADM-01 cuando no existe ningún equipo previo")
    void debeSugerirPrimerCorrelativo() {
        Area admision = Area.builder().nombre("Admisión").build();
        when(repository.existsByCodigoInventarioIgnoreCase("PC-ADM-01")).thenReturn(false);

        String codigo = estrategia.sugerir(TipoCI.COMPUTADORA, admision);
        assertThat(codigo).isEqualTo("PC-ADM-01");
    }

    @Test
    @DisplayName("Debe sugerir PC-ADM-03 cuando ya existen PC-ADM-01 y PC-ADM-02")
    void debeIncrementarCorrelativo() {
        Area admision = Area.builder().nombre("Admisión").build();
        when(repository.existsByCodigoInventarioIgnoreCase("PC-ADM-01")).thenReturn(true);
        when(repository.existsByCodigoInventarioIgnoreCase("PC-ADM-02")).thenReturn(true);
        when(repository.existsByCodigoInventarioIgnoreCase("PC-ADM-03")).thenReturn(false);

        String codigo = estrategia.sugerir(TipoCI.COMPUTADORA, admision);
        assertThat(codigo).isEqualTo("PC-ADM-03");
    }

    @Test
    @DisplayName("Debe sugerir IMP-EME-02 cuando ya existe IMP-EME-01 en Emergencia")
    void debeSugerirImpresoraEmergencia() {
        Area emergencia = Area.builder().nombre("Emergencia").build();
        when(repository.existsByCodigoInventarioIgnoreCase("IMP-EME-01")).thenReturn(true);
        when(repository.existsByCodigoInventarioIgnoreCase("IMP-EME-02")).thenReturn(false);

        String codigo = estrategia.sugerir(TipoCI.IMPRESORA, emergencia);
        assertThat(codigo).isEqualTo("IMP-EME-02");
    }
}
