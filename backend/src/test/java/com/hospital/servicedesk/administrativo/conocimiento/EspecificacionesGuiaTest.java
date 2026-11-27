package com.hospital.servicedesk.administrativo.conocimiento;

import com.hospital.servicedesk.administrativo.conocimiento.infraestructura.EspecificacionesGuia;
import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.ErrorConocidoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class EspecificacionesGuiaIT {

    @Autowired
    private ErrorConocidoRepository errorConocidoRepository;

    @BeforeEach
    void setUp() {
        errorConocidoRepository.deleteAll();

        errorConocidoRepository.save(ErrorConocido.builder()
                .titulo("Impresora térmica Zebra")
                .descripcionProblema("Atasco de papel en admisión")
                .solucionTrabajo("Realinear rollo")
                .publicado(true)
                .ambito(AmbitoGuia.PUBLICO_ASISTENCIAL)
                .categoria(CategoriaGuia.IMPRESORAS_TERMICAS)
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .textoBusqueda("impresora termica zebra atasco de papel en admision")
                .build());

        errorConocidoRepository.save(ErrorConocido.builder()
                .titulo("Configuración red HIS interna")
                .descripcionProblema("Caída de servidor de base de datos")
                .solucionTrabajo("Reiniciar switch core")
                .publicado(true)
                .ambito(AmbitoGuia.INTERNO_TECNICO)
                .categoria(CategoriaGuia.REDES)
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .textoBusqueda("configuracion red his interna caida de servidor de base de datos")
                .build());
    }

    @Test
    void filtrarPorAmbitoPublicoExcluyeInternas() {
        Specification<ErrorConocido> spec = EspecificacionesGuia.publicasOAccesoTotal(true, AmbitoGuia.PUBLICO_ASISTENCIAL);
        List<ErrorConocido> resultados = errorConocidoRepository.findAll(spec);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).getTitulo()).contains("Zebra");
    }

    @Test
    void filtrarPorTokensYTextoNormalizado() {
        Specification<ErrorConocido> spec = EspecificacionesGuia.publicasOAccesoTotal(false, AmbitoGuia.INTERNO_TECNICO)
                .and(EspecificacionesGuia.porTokens(List.of("zebra")));
        List<ErrorConocido> resultados = errorConocidoRepository.findAll(spec);

        assertThat(resultados).hasSize(1);
        assertThat(resultados.get(0).getTitulo()).contains("Zebra");
    }
}
