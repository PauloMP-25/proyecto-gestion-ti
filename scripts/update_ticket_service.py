path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace constructor/fields and createTicket method
new_imports = """import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;
import com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;
import com.hospital.servicedesk.operaciones.compromisos.eventos.TicketCriticoRegistradoEvento;
import org.springframework.context.ApplicationEventPublisher;
import java.time.Clock;
"""

if "PoliticaCompromisoAtencion" not in content:
    content = new_imports + content

# Inject dependencies
old_fields = """    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIP ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;"""

new_fields = """    private final TicketRepository tRepo;
    private final AreaRepository areaRepo;
    private final HistorialAsignacionIP ipRepo;
    private final HistorialTicketRepository auditRepo;
    private final UsuarioRepository userRepo;
    private final ElementoConfiguracionRepository ciRepo;
    private final PoliticaCompromisoAtencion politicaCompromiso;
    private final Clock clock;
    private final AuditoriaTicketService auditoriaTicketService;
    private final ApplicationEventPublisher eventos;"""

content = content.replace(old_fields, new_fields)

# Update createTicket date & fechaLimiteResolucion
old_ticket_build = """.fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

new_ticket_build = """.fechaCreacion(LocalDateTime.now(clock))
                .fechaLimiteResolucion(politicaCompromiso.calcularLimite(LocalDateTime.now(clock), req.getImpacto(), req.getUrgencia(), pri))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

content = content.replace(old_ticket_build, new_ticket_build)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated TicketServiceImpl")
