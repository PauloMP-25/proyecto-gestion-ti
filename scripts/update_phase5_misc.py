import os

# 1. Update TicketRepository
ticket_repo_path = "backend/src/main/java/com/hospital/servicedesk/repositories/TicketRepository.java"
ticket_repo_content = """package com.hospital.servicedesk.repositories;

import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.EstadoTicket;
import com.hospital.servicedesk.entities.Ticket;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Integer> {
    List<Ticket> findByEstado(String estado);
    List<Ticket> findByAreaIdArea(Integer idArea);

    @Query(\"""
            select t.idTicket from Ticket t
            where t.estado in :activos
              and t.fechaLimiteResolucion is not null
              and (t.estadoSla is null or t.estadoSla <> :vencido)
              and t.idTicket > :despuesDe
            order by t.idTicket asc
            \"\"\")
    List<Integer> idsParaMonitoreo(@Param("activos") Collection<EstadoTicket> activos,
                                   @Param("vencido") EstadoSLA vencido,
                                   @Param("despuesDe") Integer despuesDe,
                                   Pageable lote);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(\"""
            update Ticket t set t.estadoSla = :nuevo
            where t.idTicket = :id and t.estadoSla = :anterior and t.estado in :activos
            \"\"\")
    int avanzarEstadoCompromiso(@Param("id") Integer id,
                                @Param("anterior") EstadoSLA anterior,
                                @Param("nuevo") EstadoSLA nuevo,
                                @Param("activos") Collection<EstadoTicket> activos);

    @EntityGraph(attributePaths = {"area", "tecnicoAsignado"})
    Optional<Ticket> findConAreaYTecnicoByIdTicket(Integer idTicket);
}
"""
with open(ticket_repo_path, "w", encoding="utf-8") as f:
    f.write(ticket_repo_content)
print("Updated TicketRepository")

# 2. Update CorreoService
correo_svc_path = "backend/src/main/java/com/hospital/servicedesk/services/CorreoService.java"
correo_svc_content = """package com.hospital.servicedesk.services;

public interface CorreoService {
    void enviarReporteEjecutivo(String destinatario, String nombreDestinatario, byte[] pdfAdjunto, String nombreArchivo);
    void enviarAlerta(String destinatario, String asunto, String contenidoHtml);
}
"""
with open(correo_svc_path, "w", encoding="utf-8") as f:
    f.write(correo_svc_content)
print("Updated CorreoService")

# 3. Update CorreoServiceImpl
correo_impl_path = "backend/src/main/java/com/hospital/servicedesk/services/impl/CorreoServiceImpl.java"
with open(correo_impl_path, "r", encoding="utf-8") as f:
    correo_impl_content = f.read()

alerta_method = """    @Override
    public void enviarAlerta(String destinatario, String asunto, String contenidoHtml) {
        log.info("Iniciando despacho de alerta SLA hacia: {}", destinatario);
        if (mailSender == null) {
            log.info("JavaMailSender no configurado. Alerta omitida para {}", destinatario);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(remitente);
            helper.setTo(destinatario);
            helper.setSubject(asunto);
            helper.setText(contenidoHtml, true);
            mailSender.send(message);
            log.info("Alerta SLA enviada exitosamente a {}", destinatario);
        } catch (Exception e) {
            log.error("Error enviando alerta SLA a {}: {}", destinatario, e.getMessage(), e);
        }
    }
}
"""
if "enviarAlerta" not in correo_impl_content:
    # insert before last brace
    idx = correo_impl_content.rfind('}')
    correo_impl_content = correo_impl_content[:idx] + "\n" + alerta_method
    with open(correo_impl_path, "w", encoding="utf-8") as f:
        f.write(correo_impl_content)
    print("Updated CorreoServiceImpl")

# 4. Update ApplicationConfig
app_cfg_path = "backend/src/main/java/com/hospital/servicedesk/config/ApplicationConfig.java"
with open(app_cfg_path, "r", encoding="utf-8") as f:
    app_cfg_content = f.read()

if "EnableConfigurationProperties" not in app_cfg_content:
    app_cfg_content = app_cfg_content.replace(
        "@Configuration",
        "@Configuration\n@org.springframework.boot.context.properties.EnableConfigurationProperties(com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion.class)"
    )
    with open(app_cfg_path, "w", encoding="utf-8") as f:
        f.write(app_cfg_content)
    print("Updated ApplicationConfig")

# 5. Update application.properties
props_path = "backend/src/main/resources/application.properties"
with open(props_path, "r", encoding="utf-8") as f:
    props = f.read()
if "servicedesk.compromisos" not in props:
    props += "\n\n# Compromisos de Atencion\nservicedesk.zona-horaria=America/Lima\nservicedesk.compromisos.monitor-habilitado=true\nservicedesk.compromisos.intervalo-ms=60000\nservicedesk.compromisos.retraso-inicial-ms=30000\nservicedesk.compromisos.umbral-riesgo=0.70\nservicedesk.compromisos.tamano-lote=200\n"
    with open(props_path, "w", encoding="utf-8") as f:
        f.write(props)
    print("Updated application.properties")

# 6. Update test application.properties
test_props_path = "backend/src/test/resources/application.properties"
os.makedirs(os.path.dirname(test_props_path), exist_ok=True)
test_props = ""
if os.path.exists(test_props_path):
    with open(test_props_path, "r", encoding="utf-8") as f:
        test_props = f.read()
if "servicedesk.compromisos.monitor-habilitado" not in test_props:
    test_props += "\nservicedesk.compromisos.monitor-habilitado=false\nservicedesk.semillas.personal.habilitado=false\n"
    with open(test_props_path, "w", encoding="utf-8") as f:
        f.write(test_props)
    print("Updated test application.properties")
