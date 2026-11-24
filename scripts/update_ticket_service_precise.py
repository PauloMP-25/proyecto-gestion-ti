path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
imports = """import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import java.time.Clock;
"""
content = content.replace("package com.hospital.servicedesk.services.impl;", "package com.hospital.servicedesk.services.impl;\n\n" + imports)

# Add fields
old_fields = "    private final ElementoConfiguracionRepository ciRepo;"
new_fields = """    private final ElementoConfiguracionRepository ciRepo;
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;"""
content = content.replace(old_fields, new_fields)

# Add secondary constructor so existing unit tests don't break
old_class_dec = "@RequiredArgsConstructor\npublic class TicketServiceImpl implements TicketService {"
new_class_dec = """@RequiredArgsConstructor\npublic class TicketServiceImpl implements TicketService {

    public TicketServiceImpl(TicketRepository tRepo, AreaRepository areaRepo, HistorialAsignacionIP ipRepo,
                             HistorialTicketRepository auditRepo, UsuarioRepository userRepo, ElementoConfiguracionRepository ciRepo) {
        this.tRepo = tRepo;
        this.areaRepo = areaRepo;
        this.ipRepo = ipRepo;
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
        this.ciRepo = ciRepo;
        this.politicaCompromiso = null;
        this.clock = Clock.systemDefaultZone();
    }"""
content = content.replace(old_class_dec, new_class_dec)

# Update deadline calculation in createTicket
old_deadline = ".fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))"
new_deadline = """.fechaCreacion(clock != null ? LocalDateTime.now(clock) : LocalDateTime.now())
                .fechaLimiteResolucion(politicaCompromiso != null ? politicaCompromiso.calcularLimite(clock != null ? LocalDateTime.now(clock) : LocalDateTime.now(), req.getImpacto(), req.getUrgencia(), pri) : LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))"""

content = content.replace(old_deadline, new_deadline)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated TicketServiceImpl precisely")
