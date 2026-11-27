package com.hospital.servicedesk.seguridad;

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
