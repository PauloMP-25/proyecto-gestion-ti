
package com.hospital.servicedesk;

import com.hospital.servicedesk.entities.*;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@SpringBootTest
public class ApiContractTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private AreaRepository areaRepository;

    private MockMvc mockMvc;
    private Integer testTicketId;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();
        if (areaRepository.count() == 0) {
            areaRepository.save(Area.builder().nombre("TI Hospital").build());
        }
        Area area = areaRepository.findAll().get(0);
        Ticket t = ticketRepository.save(Ticket.builder()
                .tipo(TipoTicket.INCIDENTE)
                .asunto("Ticket de prueba")
                .descripcion("Descripción de prueba")
                .impacto(Impacto.MEDIO)
                .urgencia(Urgencia.MEDIA)
                .prioridad(Prioridad.MEDIA)
                .estado(EstadoTicket.ABIERTO)
                .area(area)
                .build());
        testTicketId = t.getIdTicket();
    }

    @Test
    public void testAuthLoginExists() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testAuthMeExists() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testContextoClienteExists() throws Exception {
        mockMvc.perform(get("/api/tickets/contexto-cliente"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testTicketsEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/tickets"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/tickets/mis-tickets"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/tickets/" + testTicketId))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/tickets/" + testTicketId + "/historial"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/asignar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/tomar"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/iniciar"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/escalar")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/resolver")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/cerrar"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/reabrir")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/conformidad"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(post("/api/tickets/" + testTicketId + "/encuesta")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(put("/api/tickets/" + testTicketId + "/equipo"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testCatalogosEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/usuarios/tecnicos"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/categorias"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/areas"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testKedbEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/kedb"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testCmdbAndIpEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/equipos"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/direcciones-ip"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testPrestamosEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/prestamos"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/prestamos/vencidos"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }

    @Test
    public void testUsuariosAndIndicadoresEndpointsExist() throws Exception {
        mockMvc.perform(get("/api/usuarios"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/indicadores/kpis"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));

        mockMvc.perform(get("/api/indicadores/tickets-por-area"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(404, result.getResponse().getStatus()));
    }
}

