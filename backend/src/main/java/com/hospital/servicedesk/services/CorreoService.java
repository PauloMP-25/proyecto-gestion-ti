package com.hospital.servicedesk.services;

public interface CorreoService {
    void enviarReporteEjecutivo(String destinatario, String nombreDestinatario, byte[] pdfAdjunto, String nombreArchivo);
    void enviarAlerta(String destinatario, String asunto, String contenidoHtml);
}
