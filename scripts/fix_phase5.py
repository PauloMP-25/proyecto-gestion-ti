# 1. Fix PoliticaCompromisoAtencion.java
pol_path = "backend/src/main/java/com/hospital/servicedesk/operaciones/compromisos/dominio/PoliticaCompromisoAtencion.java"
with open(pol_path, "r", encoding="utf-8") as f:
    pol_content = f.read()

pol_content = pol_content.replace(
    "configuracionSlaRepository.findByImpactoAndUrgencia(impacto, urgencia)",
    "configuracionSlaRepository.findByImpactoAndUrgencia(impacto.name(), urgencia.name())"
)
with open(pol_path, "w", encoding="utf-8") as f:
    f.write(pol_content)
print("Fixed PoliticaCompromisoAtencion")

# 2. Update TicketServiceImpl cleanly
ticket_svc_path = "backend/src/main/java/com/hospital/servicedesk/services/impl/TicketServiceImpl.java"
with open(ticket_svc_path, "r", encoding="utf-8") as f:
    svc_content = f.read()

if "PoliticaCompromisoAtencion" not in svc_content:
    # Add imports
    svc_content = svc_content.replace(
        "package com.hospital.servicedesk.services.impl;",
        "package com.hospital.servicedesk.services.impl;\n\nimport com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;\nimport com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService.RegistroAuditoriaTicket;\nimport com.hospital.servicedesk.operaciones.compromisos.dominio.PoliticaCompromisoAtencion;\nimport com.hospital.servicedesk.operaciones.compromisos.eventos.TicketCriticoRegistradoEvento;\nimport org.springframework.context.ApplicationEventPublisher;\nimport java.time.Clock;"
    )
    # Add fields
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

    svc_content = svc_content.replace(old_fields, new_fields)

    # Update ticket build
    old_build = """.fechaLimiteResolucion(LocalDateTime.now().plusHours(pri == Prioridad.CRITICA ? 2 : 8))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

    new_build = """.fechaCreacion(LocalDateTime.now(clock))
                .fechaLimiteResolucion(politicaCompromiso.calcularLimite(LocalDateTime.now(clock), req.getImpacto(), req.getUrgencia(), pri))
                .estadoSla(EstadoSLA.DENTRO_TIEMPO)
                .build();"""

    svc_content = svc_content.replace(old_build, new_build)

    with open(ticket_svc_path, "w", encoding="utf-8") as f:
        f.write(svc_content)
    print("Updated TicketServiceImpl with SLA calculation")

