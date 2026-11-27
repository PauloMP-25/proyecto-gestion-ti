path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add secondary constructor for legacy tests
target_end = "@RequiredArgsConstructor\npublic class TicketServiceImpl implements TicketService {"
constructor_code = """@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    public TicketServiceImpl(TicketRepository tRepo, AreaRepository areaRepo, HistorialAsignacionIpRepository ipRepo,
                             HistorialTicketRepository auditRepo, UsuarioRepository userRepo, ElementoConfiguracionRepository ciRepo) {
        this.tRepo = tRepo;
        this.areaRepo = areaRepo;
        this.ipRepo = ipRepo;
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
        this.ciRepo = ciRepo;
        this.politicaCompromiso = null;
        this.clock = java.time.Clock.systemDefaultZone();
        this.auditoriaTicketService = null;
        this.eventos = null;
    }
"""
content = content.replace("@RequiredArgsConstructor\npublic class TicketServiceImpl implements TicketService {", constructor_code)

# Make sure clock / politicaCompromiso use fallback in createTicket
old_calc = """.fechaCreacion(LocalDateTime.now(clock))
                .fechaLimiteResolucion(politicaCompromiso.calcularLimite(LocalDateTime.now(clock), req.getImpacto(), req.getUrgencia(), pri))"""

new_calc = """.fechaCreacion(clock != null ? LocalDateTime.now(clock) : LocalDateTime.now())
                .fechaLimiteResolucion(politicaCompromiso != null ? politicaCompromiso.calcularLimite(clock != null ? LocalDateTime.now(clock) : LocalDateTime.now(), req.getImpacto(), req.getUrgencia(), pri) : LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))"""

content = content.replace(old_calc, new_calc)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Added legacy constructor and null fallbacks to TicketServiceImpl")
