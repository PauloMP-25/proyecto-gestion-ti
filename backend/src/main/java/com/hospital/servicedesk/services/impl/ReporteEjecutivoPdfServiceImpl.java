package com.hospital.servicedesk.services.impl;

import com.hospital.servicedesk.entities.Area;
import com.hospital.servicedesk.entities.EstadoSLA;
import com.hospital.servicedesk.entities.EstadoTicket;
import com.hospital.servicedesk.entities.PrestamoEquipo;
import com.hospital.servicedesk.entities.Prioridad;
import com.hospital.servicedesk.entities.Ticket;
import com.hospital.servicedesk.repositories.AreaRepository;
import com.hospital.servicedesk.repositories.PrestamoEquipoRepository;
import com.hospital.servicedesk.repositories.TicketRepository;
import com.hospital.servicedesk.services.ReporteEjecutivoPdfService;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteEjecutivoPdfServiceImpl implements ReporteEjecutivoPdfService {

    private final TicketRepository ticketRepository;
    private final PrestamoEquipoRepository prestamoEquipoRepository;
    private final AreaRepository areaRepository;

    private static final Color COLOR_GUINDA = new Color(112, 28, 28);
    private static final Color COLOR_SLATE = new Color(15, 23, 42);
    private static final Color COLOR_FONDO_TABLA = new Color(248, 250, 252);
    private static final Color COLOR_BORDE = new Color(226, 232, 240);
    private static final Color COLOR_VERDE = new Color(27, 94, 32);

    @Override
    public byte[] generarReporteEjecutivoPdf(LocalDateTime fechaInicio, LocalDateTime fechaFin, String username) {
        Document document = new Document(PageSize.A4, 36, 36, 40, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // 1. Encabezado Institucional
            agregarEncabezado(document, username);

            // 2. Consulta y filtrado de datos
            List<Ticket> tickets = ticketRepository.findAll();
            if (fechaInicio != null) {
                tickets = tickets.stream().filter(t -> t.getFechaCreacion() != null && !t.getFechaCreacion().isBefore(fechaInicio)).collect(Collectors.toList());
            }
            if (fechaFin != null) {
                tickets = tickets.stream().filter(t -> t.getFechaCreacion() != null && !t.getFechaCreacion().isAfter(fechaFin)).collect(Collectors.toList());
            }

            List<PrestamoEquipo> prestamos = prestamoEquipoRepository.findAllConRelaciones();

            // 3. Resumen Ejecutivo (KPIs)
            agregarResumenKpis(document, tickets);

            // 4. Tabla de Prioridad de Soporte (P1 a P4)
            agregarTablaPrioridades(document, tickets);

            // 5. Top Áreas Hospitalarias con Mayor Demanda
            agregarTablaAreas(document, tickets);

            // 6. Préstamos de Equipos y Contingencias
            agregarSeccionPrestamos(document, prestamos);

            // 7. Pie y Firma
            agregarPieFirma(document);

            document.close();
        } catch (Exception e) {
            log.error("Error al generar reporte ejecutivo en PDF", e);
            throw new RuntimeException("Error en la compilación y renderizado del reporte ejecutivo PDF", e);
        }

        return out.toByteArray();
    }

    private void agregarEncabezado(Document doc, String username) throws DocumentException {
        Font fontInstitucion = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_GUINDA);
        Font fontSubtitulo = FontFactory.getFont(FontFactory.HELVETICA, 10, COLOR_SLATE);
        Font fontMeta = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

        Paragraph pInst = new Paragraph("HOSPITAL SANTA MARÍA DEL SOCORRO - ICA", fontInstitucion);
        pInst.setAlignment(Element.ALIGN_CENTER);
        doc.add(pInst);

        Paragraph pDep = new Paragraph("OFICINA DE ESTADÍSTICA E INFORMÁTICA — MESA DE AYUDA Y SOPORTE", fontSubtitulo);
        pDep.setAlignment(Element.ALIGN_CENTER);
        doc.add(pDep);

        Paragraph pTitulo = new Paragraph("INFORME EJECUTIVO DE GESTIÓN Y ATENCIÓN DE INCIDENCIAS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, COLOR_SLATE));
        pTitulo.setAlignment(Element.ALIGN_CENTER);
        pTitulo.setSpacingBefore(8);
        pTitulo.setSpacingAfter(10);
        doc.add(pTitulo);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String fechaActual = LocalDateTime.now().format(dtf);

        PdfPTable metaTable = new PdfPTable(2);
        metaTable.setWidthPercentage(100);
        metaTable.setSpacingAfter(15);

        PdfPCell c1 = new PdfPCell(new Phrase("Fecha de emisión: " + fechaActual, fontMeta));
        c1.setBorder(Rectangle.NO_BORDER);
        metaTable.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase("Generado por: " + (username != null ? username : "Jefatura de Informática"), fontMeta));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        metaTable.addCell(c2);

        doc.add(metaTable);
    }

    private void agregarResumenKpis(Document doc, List<Ticket> tickets) throws DocumentException {
        long total = tickets.size();
        long resueltos = tickets.stream().filter(t -> EstadoTicket.RESUELTO.equals(t.getEstado()) || EstadoTicket.CERRADO.equals(t.getEstado())).count();
        long enAtencion = tickets.stream().filter(t -> EstadoTicket.EN_PROGRESO.equals(t.getEstado()) || EstadoTicket.ESCALADO.equals(t.getEstado())).count();
        long pendientes = tickets.stream().filter(t -> EstadoTicket.ABIERTO.equals(t.getEstado())).count();
        long cumplidosSla = tickets.stream().filter(t -> EstadoSLA.DENTRO_TIEMPO.equals(t.getEstadoSla())).count();

        double porcentajeCumplimiento = total > 0 ? ((double) cumplidosSla / total) * 100.0 : 100.0;

        Paragraph secTitulo = new Paragraph("1. RESUMEN EJECUTIVO DE OPERACIONES", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_GUINDA));
        secTitulo.setSpacingAfter(6);
        doc.add(secTitulo);

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);

        agregarKpiCelda(kpiTable, "Total Solicitudes", String.valueOf(total));
        agregarKpiCelda(kpiTable, "Tickets Resueltos", String.valueOf(resueltos));
        agregarKpiCelda(kpiTable, "En Atención / Pendientes", (enAtencion + pendientes) + "");
        agregarKpiCelda(kpiTable, "Cumplimiento (SLA)", String.format("%.1f%%", porcentajeCumplimiento));

        doc.add(kpiTable);
    }

    private void agregarKpiCelda(PdfPTable table, String etiqueta, String valor) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_FONDO_TABLA);
        cell.setBorderColor(COLOR_BORDE);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pValor = new Paragraph(valor, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_GUINDA));
        pValor.setAlignment(Element.ALIGN_CENTER);
        Paragraph pEtiq = new Paragraph(etiqueta, FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_SLATE));
        pEtiq.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(pValor);
        cell.addElement(pEtiq);
        table.addCell(cell);
    }

    private void agregarTablaPrioridades(Document doc, List<Ticket> tickets) throws DocumentException {
        Paragraph secTitulo = new Paragraph("2. RENDIMIENTO POR NIVEL DE PRIORIDAD DE SOPORTE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_GUINDA));
        secTitulo.setSpacingAfter(6);
        doc.add(secTitulo);

        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{30, 20, 25, 25});
        table.setSpacingAfter(15);

        agregarCabeceraTabla(table, "Prioridad", "Solicitudes", "Resueltos", "Cumplimiento SLA");

        Prioridad[] prioridades = {Prioridad.CRITICA, Prioridad.ALTA, Prioridad.MEDIA, Prioridad.BAJA};
        String[] nombres = {"P1 — Crítico", "P2 — Alto", "P3 — Medio", "P4 — Bajo"};

        for (int i = 0; i < prioridades.length; i++) {
            Prioridad p = prioridades[i];
            List<Ticket> porPrioridad = tickets.stream().filter(t -> p.equals(t.getPrioridad())).collect(Collectors.toList());
            long cant = porPrioridad.size();
            long res = porPrioridad.stream().filter(t -> EstadoTicket.RESUELTO.equals(t.getEstado()) || EstadoTicket.CERRADO.equals(t.getEstado())).count();
            long aTiempo = porPrioridad.stream().filter(t -> EstadoSLA.DENTRO_TIEMPO.equals(t.getEstadoSla())).count();
            double pct = cant > 0 ? ((double) aTiempo / cant) * 100.0 : 100.0;

            agregarFilaTabla(table, nombres[i], String.valueOf(cant), String.valueOf(res), String.format("%.1f%%", pct));
        }

        doc.add(table);
    }

    private void agregarTablaAreas(Document doc, List<Ticket> tickets) throws DocumentException {
        Paragraph secTitulo = new Paragraph("3. SERVICIOS HOSPITALARIOS CON MAYOR INCIDENCIA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_GUINDA));
        secTitulo.setSpacingAfter(6);
        doc.add(secTitulo);

        Map<String, Long> conteoPorArea = new HashMap<>();
        for (Ticket t : tickets) {
            String areaNombre = t.getArea() != null ? t.getArea().getNombre() : "Área no especificada";
            conteoPorArea.put(areaNombre, conteoPorArea.getOrDefault(areaNombre, 0L) + 1);
        }

        List<Map.Entry<String, Long>> topAreas = conteoPorArea.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toList());

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{50, 25, 25});
        table.setSpacingAfter(15);

        agregarCabeceraTabla(table, "Área Hospitalaria / Servicio", "N° Incidentes", "% del Total");

        long total = tickets.size();
        if (topAreas.isEmpty()) {
            agregarFilaTabla(table, "Sin registros de incidencias", "0", "0.0%");
        } else {
            for (Map.Entry<String, Long> entry : topAreas) {
                double pct = total > 0 ? ((double) entry.getValue() / total) * 100.0 : 0.0;
                agregarFilaTabla(table, entry.getKey(), String.valueOf(entry.getValue()), String.format("%.1f%%", pct));
            }
        }

        doc.add(table);
    }

    private void agregarSeccionPrestamos(Document doc, List<PrestamoEquipo> prestamos) throws DocumentException {
        Paragraph secTitulo = new Paragraph("4. EQUIPOS DE CONTINGENCIA Y CONTINUIDAD ASISTENCIAL", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, COLOR_GUINDA));
        secTitulo.setSpacingAfter(6);
        doc.add(secTitulo);

        long totalPrestamos = prestamos.size();
        long vigentes = prestamos.stream().filter(p -> p.getFechaDevolucion() == null).count();
        long devueltos = prestamos.stream().filter(p -> p.getFechaDevolucion() != null).count();

        PdfPTable table = new PdfPTable(3);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{34, 33, 33});
        table.setSpacingAfter(20);

        agregarCabeceraTabla(table, "Total Entregas", "En Préstamo Activo", "Devueltos a Stock");
        agregarFilaTabla(table, String.valueOf(totalPrestamos), String.valueOf(vigentes), String.valueOf(devueltos));

        doc.add(table);
    }

    private void agregarPieFirma(Document doc) throws DocumentException {
        Paragraph aviso = new Paragraph("Este documento constituye un informe oficial emitido por la Mesa de Ayuda del Hospital Santa María del Socorro.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY));
        aviso.setAlignment(Element.ALIGN_CENTER);
        aviso.setSpacingBefore(20);
        aviso.setSpacingAfter(35);
        doc.add(aviso);

        PdfPTable firmaTable = new PdfPTable(1);
        firmaTable.setWidthPercentage(50);
        firmaTable.setHorizontalAlignment(Element.ALIGN_CENTER);

        PdfPCell cFirma = new PdfPCell();
        cFirma.setBorder(Rectangle.TOP);
        cFirma.setBorderColor(COLOR_SLATE);
        cFirma.setHorizontalAlignment(Element.ALIGN_CENTER);
        cFirma.setPaddingTop(5);

        Paragraph p1 = new Paragraph("JEFE DE LA OFICINA DE ESTADÍSTICA E INFORMÁTICA", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_SLATE));
        p1.setAlignment(Element.ALIGN_CENTER);
        Paragraph p2 = new Paragraph("Hospital Santa María del Socorro - Ica", FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_SLATE));
        p2.setAlignment(Element.ALIGN_CENTER);

        cFirma.addElement(p1);
        cFirma.addElement(p2);
        firmaTable.addCell(cFirma);

        doc.add(firmaTable);
    }

    private void agregarCabeceraTabla(PdfPTable table, String... titulos) {
        Font fontCabecera = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
        for (String titulo : titulos) {
            PdfPCell c = new PdfPCell(new Phrase(titulo, fontCabecera));
            c.setBackgroundColor(COLOR_GUINDA);
            c.setBorderColor(COLOR_GUINDA);
            c.setPadding(6);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(c);
        }
    }

    private void agregarFilaTabla(PdfPTable table, String... valores) {
        Font fontCelda = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_SLATE);
        for (String valor : valores) {
            PdfPCell c = new PdfPCell(new Phrase(valor, fontCelda));
            c.setBorderColor(COLOR_BORDE);
            c.setPadding(5);
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(c);
        }
    }
}
