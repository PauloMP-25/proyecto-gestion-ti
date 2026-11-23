package com.hospital.servicedesk.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro de diagnóstico y correlación estructurada (MDC) para trazabilidad hospitalaria.
 * Inyecta un identificador único por petición, registra la latencia y contextualiza
 * los logs de auditoría, reportería y mantenimiento de la Mesa de Ayuda HSMSI.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    public static final String MDC_CORRELATION_ID = "correlationId";
    public static final String MDC_USUARIO = "usuario";
    public static final String MDC_IP = "ipRemota";
    public static final String MDC_METODO = "metodo";
    public static final String MDC_URI = "uri";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long inicio = System.currentTimeMillis();

        String correlationId = request.getHeader(CORRELATION_ID_HEADER);
        if (correlationId == null || correlationId.trim().isEmpty()) {
            correlationId = "HSMSI-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        String ipRemota = obtenerIpCliente(request);
        String metodo = request.getMethod();
        String uri = request.getRequestURI();

        MDC.put(MDC_CORRELATION_ID, correlationId);
        MDC.put(MDC_IP, ipRemota);
        MDC.put(MDC_METODO, metodo);
        MDC.put(MDC_URI, uri);
        MDC.put(MDC_USUARIO, "ANONIMO");

        response.setHeader(CORRELATION_ID_HEADER, correlationId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            // Enriquecer con el usuario autenticado tras procesar la seguridad
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                MDC.put(MDC_USUARIO, auth.getName());
            }

            long duracion = System.currentTimeMillis() - inicio;
            int status = response.getStatus();

            // Evitar saturar logs con peticiones estáticas o preflights OPTIONS
            if (!"OPTIONS".equalsIgnoreCase(metodo) && !uri.contains("/actuator/health")) {
                if (status >= 500) {
                    log.error("HTTP {} {} finalizado con error crítico [{}] en {} ms - Usuario: {}",
                            metodo, uri, status, duracion, MDC.get(MDC_USUARIO));
                } else if (status >= 400) {
                    log.warn("HTTP {} {} rechazado [{}] en {} ms - Usuario: {}",
                            metodo, uri, status, duracion, MDC.get(MDC_USUARIO));
                } else {
                    log.info("HTTP {} {} procesado exitosamente [{}] en {} ms - Usuario: {}",
                            metodo, uri, status, duracion, MDC.get(MDC_USUARIO));
                }
            }

            MDC.clear();
        }
    }

    private String obtenerIpCliente(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
