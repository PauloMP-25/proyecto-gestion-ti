import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 1. EspecificacionesGuiaIT.java
write_file("backend/src/test/java/com/hospital/servicedesk/administrativo/conocimiento/EspecificacionesGuiaIT.java", """package com.hospital.servicedesk.administrativo.conocimiento;

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
""")

# 2. AutorizacionModulosMockMvcIT.java
write_file("backend/src/test/java/com/hospital/servicedesk/seguridad/AutorizacionModulosMockMvcIT.java", """package com.hospital.servicedesk.seguridad;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class AutorizacionModulosMockMvcIT {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void sinAutenticacionModulo3RetornaUnauthorizedOForbidden() throws Exception {
        mockMvc.perform(post("/api/admin/compromisos-atencion/evaluar"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "tecnico@hsmsi.gob.pe", roles = {"TECNICO"})
    void tecnicoNoPuedeEvaluarMonitorCompromisosRetornaForbidden() throws Exception {
        mockMvc.perform(post("/api/admin/compromisos-atencion/evaluar"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@hsmsi.gob.pe", roles = {"ADMINISTRADOR"})
    void administradorPuedeEvaluarMonitorCompromisosRetornaOk() throws Exception {
        mockMvc.perform(post("/api/admin/compromisos-atencion/evaluar"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "usuario@hsmsi.gob.pe", roles = {"USUARIO_FINAL"})
    void usuarioFinalNoPuedeListarSolicitudesCambioRetornaForbidden() throws Exception {
        mockMvc.perform(get("/api/solicitudes-cambio"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "tec@hsmsi.gob.pe", roles = {"TECNICO"})
    void tecnicoPuedeListarSolicitudesCambioRetornaOk() throws Exception {
        mockMvc.perform(get("/api/solicitudes-cambio"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "asistencial@hsmsi.gob.pe", roles = {"USUARIO_FINAL"})
    void usuarioFinalPuedeConsultarConocimientoPublicoRetornaOk() throws Exception {
        mockMvc.perform(get("/api/conocimiento").param("soloPublicas", "true"))
                .andExpect(status().isOk());
    }
}
""")

print("Phase 5 integration and MockMvc tests generated successfully.")
