package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.services.CorreoService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class CorreoServiceImpl implements CorreoService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:mesadeayuda@hsmsi.gob.pe}")
    private String remitente;

    public CorreoServiceImpl(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    @Override
    public void enviarReporteEjecutivo(String destinatario, String nombreDestinatario, byte[] pdfAdjunto, String nombreArchivo) {
        log.info("Iniciando despacho de informe ejecutivo en PDF hacia: {}", destinatario);

        if (mailSender == null) {
            log.info("JavaMailSender no está configurado en el entorno activo (ambiente de pruebas o sin SMTP). Se registra el despacho simulado de {} bytes hacia {}",
                    pdfAdjunto != null ? pdfAdjunto.length : 0, destinatario);
            return;
        }

        try {
            MimeMessage mensaje = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setFrom(remitente);
            helper.setTo(destinatario);
            helper.setSubject("Informe Ejecutivo Oficial de Gestión TI — Mesa de Ayuda HSMSI");

            String contenidoHtml = String.format("""
                <div style="font-family: Arial, sans-serif; color: #0f172a; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background-color: #ffffff;">
                    <div style="text-align: center; border-bottom: 2px solid #701c1c; padding-bottom: 12px; margin-bottom: 20px;">
                        <h2 style="color: #701c1c; margin: 0; font-size: 18px; text-transform: uppercase;">Hospital Santa María del Socorro - Ica</h2>
                        <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">Oficina de Estadística e Informática — Mesa de Ayuda</p>
                    </div>
                    <p style="font-size: 14px; line-height: 1.5;">Estimado(a) <strong>%s</strong>,</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #334155;">
                        Se adjunta el <strong>Informe Ejecutivo Oficial de Gestión y Atención de Incidencias</strong> generado por el sistema de Mesa de Ayuda del HSMSI.
                    </p>
                    <div style="background-color: #f8fafc; border-left: 4px solid #701c1c; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569;">
                        <strong>Contenido del Informe Adjunto:</strong>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                            <li>Resumen operativo de incidencias y solicitudes atendidas.</li>
                            <li>Tasa de cumplimiento de compromisos de atención (SLA).</li>
                            <li>Distribución por nivel de prioridad de soporte hospitalario.</li>
                            <li>Servicios hospitalarios con mayor recurrencia.</li>
                            <li>Balance y control de préstamos de equipos de contingencia.</li>
                        </ul>
                    </div>
                    <p style="font-size: 13px; color: #64748b; line-height: 1.4;">
                        Para consultas o requerimientos adicionales, comuníquese con el anexo interno de la Oficina de Estadística e Informática.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
                    <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                        Este es un mensaje institucional generado automáticamente por el Sistema de Mesa de Ayuda HSMSI. Por favor, no responda a este correo.
                    </p>
                </div>
                """,
                nombreDestinatario != null && !nombreDestinatario.isBlank() ? nombreDestinatario : "Administrador(a)"
            );

            helper.setText(contenidoHtml, true);

            if (pdfAdjunto != null && pdfAdjunto.length > 0) {
                String nombreAdj = (nombreArchivo != null && !nombreArchivo.isBlank())
                        ? nombreArchivo
                        : "informe-ejecutivo-hsmsi.pdf";
                helper.addAttachment(nombreAdj, new ByteArrayResource(pdfAdjunto));
            }

            mailSender.send(mensaje);
            log.info("Correo con informe ejecutivo PDF despachado exitosamente hacia: {}", destinatario);

        } catch (Exception e) {
            log.warn("Aviso en el despacho SMTP hacia {} (servidor de correo no accesible o sin credenciales locales): {}",
                    destinatario, e.getMessage());
        }
    }
}
