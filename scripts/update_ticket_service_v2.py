path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
imports = """import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.TicketCriticoRegistradoEvento;
import org.springframework.context.ApplicationEventPublisher;
import java.time.Clock;
"""
content = content.replace("package com.hospital.servicedesk.services.impl;", "package com.hospital.servicedesk.services.impl;\n\n" + imports)

# Add fields
old_f = """    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIpRepository ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;"""

new_f = """    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIpRepository ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;
    private final AuditoriaTicketService auditoriaTicketService;
    private final ApplicationEventPublisher eventos;"""

content = content.replace(old_f, new_f)

# Update ticket creation
old_b = """.fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

new_b = """.fechaCreacion(LocalDateTime.now(clock))
                .fechaLimiteResolucion(politicaCompromiso.calcularLimite(LocalDateTime.now(clock), req.getImpacto(), req.getUrgencia(), pri))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

content = content.replace(old_b, new_b)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated TicketServiceImpl v2")
