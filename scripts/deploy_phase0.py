import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/auditoria/ContextoActor.java", """package com.hospital.servicedesk.compartido.auditoria;

/**
 * Quién ejecuta la operación y desde dónde. Se construye en el controlador
 * y viaja hacia la capa de aplicación para auditoría y reglas de permiso.
 */
public record ContextoActor(String correo, String rol, String ipOrigen) {

    public boolean esAdministrador() { return "ADMINISTRADOR".equalsIgnoreCase(rol); }
    public boolean esTecnico()       { return "TECNICO".equalsIgnoreCase(rol); }
    public boolean esPracticante()   { return "PRACTICANTE".equalsIgnoreCase(rol); }

    /** Personal de Informática: puede ver contenido interno. */
    public boolean esPersonalTecnico() { return esAdministrador() || esTecnico() || esPracticante(); }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/auditoria/ResolutorContextoActor.java", """package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.security.red.ResolutorIpCliente;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ResolutorContextoActor {

    private static final String PREFIJO_ROL = "ROLE_";
    private final ResolutorIpCliente resolutorIp;

    public ContextoActor resolver(Authentication autenticacion, HttpServletRequest request) {
        String correo = autenticacion != null ? autenticacion.getName() : "sistema";
        String rol = "USUARIO_FINAL";
        if (autenticacion != null) {
            rol = autenticacion.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> a.startsWith(PREFIJO_ROL))
                    .map(a -> a.substring(PREFIJO_ROL.length()))
                    .findFirst()
                    .orElse("USUARIO_FINAL");
        }
        String ip = resolutorIp != null ? resolutorIp.resolverIp(request) : "127.0.0.1";
        return new ContextoActor(correo, rol, ip);
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/auditoria/AuditoriaTicketService.java", """package com.hospital.servicedesk.compartido.auditoria;

import com.hospital.servicedesk.entities.Ticket;
import com.hospital.servicedesk.entities.Usuario;
import lombok.Builder;

public interface AuditoriaTicketService {

    void registrar(RegistroAuditoriaTicket registro);

    /** Datos de un evento auditable. `actor` null ⇒ acción del sistema. */
    @Builder
    record RegistroAuditoriaTicket(
            Ticket ticket,
            Usuario actor,
            String accion,
            String estadoAnterior,
            String estadoNuevo,
            String motivo,
            String detalle,
            String ipOrigen) {}
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/auditoria/impl/AuditoriaTicketServiceImpl.java", """package com.hospital.servicedesk.compartido.auditoria.impl;

import com.hospital.servicedesk.compartido.auditoria.AuditoriaTicketService;
import com.hospital.servicedesk.entities.HistorialTicket;
import com.hospital.servicedesk.repositories.HistorialTicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditoriaTicketServiceImpl implements AuditoriaTicketService {

    private final HistorialTicketRepository historialRepository;
    private final Clock clock;

    /** MANDATORY: la auditoría debe confirmarse o revertirse junto con el cambio que describe. */
    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(RegistroAuditoriaTicket r) {
        historialRepository.save(HistorialTicket.builder()
                .ticket(r.ticket())
                .usuario(r.actor())
                .accion(r.accion())
                .estadoAnterior(r.estadoAnterior())
                .estadoNuevo(r.estadoNuevo())
                .motivo(r.motivo())
                .detalle(r.detalle())
                .ipOrigen(r.ipOrigen())
                .fechaAccion(LocalDateTime.now(clock))
                .build());
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/persistencia/ListaCsvConverter.java", """package com.hospital.servicedesk.compartido.persistencia;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Converter
public class ListaCsvConverter implements AttributeConverter<List<String>, String> {

    @Override
    public String convertToDatabaseColumn(List<String> lista) {
        return lista == null || lista.isEmpty() ? null : String.join(",", lista);
    }

    @Override
    public List<String> convertToEntityAttribute(String csv) {
        if (csv == null || csv.isBlank()) return new ArrayList<>();
        return new ArrayList<>(Arrays.stream(csv.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList());
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/compartido/util/NormalizadorBusqueda.java", """package com.hospital.servicedesk.compartido.util;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.regex.Pattern;

/** Minúsculas + sin tildes + espacios colapsados. "Admisión  CENTRAL" → "admision central". */
public final class NormalizadorBusqueda {

    private static final Pattern DIACRITICOS = Pattern.compile("\\p{M}+");
    private static final Pattern NO_ALFANUMERICO = Pattern.compile("[^a-z0-9ñ\\- ]");

    private NormalizadorBusqueda() {}

    public static String normalizar(String texto) {
        if (texto == null) return "";
        String sinEnie = texto.replace('ñ', '\\u0001').replace('Ñ', '\\u0001');        // proteger la ñ
        String sinTildes = DIACRITICOS.matcher(Normalizer.normalize(sinEnie, Normalizer.Form.NFD)).replaceAll("");
        String minusculas = sinTildes.replace('\\u0001', 'ñ').toLowerCase(Locale.ROOT);
        return NO_ALFANUMERICO.matcher(minusculas).replaceAll(" ").trim().replaceAll("\\s+", " ");
    }

    public static String componer(String... partes) {
        return normalizar(String.join(" ", Arrays.stream(partes).filter(Objects::nonNull).toList()));
    }

    /** Palabras de 2+ letras, sin repetir. */
    public static List<String> tokens(String consulta) {
        String n = normalizar(consulta);
        return n.isEmpty() ? List.of() :
                Arrays.stream(n.split(" "))
                        .filter(s -> s.length() >= 2)
                        .distinct()
                        .toList();
    }
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/entities/HistorialTicket.java", """package com.hospital.servicedesk.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "historial_ticket")
public class HistorialTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historial")
    private Integer idHistorial;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "estado_anterior", length = 30)
    private String estadoAnterior;

    @Column(name = "estado_nuevo", length = 30)
    private String estadoNuevo;

    @Column(name = "motivo", length = 500)
    private String motivo;

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    @Column(name = "detalle", columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "fecha_accion", nullable = false, updatable = false)
    private LocalDateTime fechaAccion;
}
""")

write_file("backend/src/main/java/com/hospital/servicedesk/exceptions/GlobalExceptionHandler.java", """package com.hospital.servicedesk.exceptions;

import com.hospital.servicedesk.dtos.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private String obtenerCorrelationId() {
        String cid = org.slf4j.MDC.get(com.hospital.servicedesk.config.CorrelationIdFilter.MDC_CORRELATION_ID);
        return cid != null ? cid : "HSMSI-SYS";
    }

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> handleRecursoNoEncontrado(
            RecursoNoEncontradoException ex, HttpServletRequest request) {
        log.warn("Recurso no encontrado: {} en {}", ex.getMessage(), request.getRequestURI());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(
            ReglaNegocioException ex, HttpServletRequest request) {
        log.warn("Regla de negocio violada: {} en {}", ex.getMessage(), request.getRequestURI());
        Map<String, String> errores = ex.getCampo() != null ? Map.of(ex.getCampo(), ex.getMessage()) : null;
        return construir(HttpStatus.BAD_REQUEST, ex.getMessage(), request, errores);
    }

    @ExceptionHandler(ConflictoNegocioException.class)
    public ResponseEntity<ErrorResponse> handleConflictoNegocio(
            ConflictoNegocioException ex, HttpServletRequest request) {
        log.warn("Conflicto de negocio: {} en {}", ex.getMessage(), request.getRequestURI());
        Map<String, String> errores = ex.getCampo() != null ? Map.of(ex.getCampo(), ex.getMessage()) : null;
        return construir(HttpStatus.CONFLICT, ex.getMessage(), request, errores);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleCuerpoIlegible(
            org.springframework.http.converter.HttpMessageNotReadableException ex, HttpServletRequest request) {
        log.warn("Cuerpo de solicitud ilegible en {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return construir(HttpStatus.BAD_REQUEST,
                "Los datos enviados tienen un formato inválido o contienen un valor no permitido.", request, null);
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTipoParametro(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return construir(HttpStatus.BAD_REQUEST,
                "El valor del parámetro '" + ex.getName() + "' no es válido.", request, null);
    }

    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleConcurrencia(
            org.springframework.orm.ObjectOptimisticLockingFailureException ex, HttpServletRequest request) {
        log.warn("Conflicto de concurrencia optimista en {}", request.getRequestURI());
        return construir(HttpStatus.CONFLICT,
                "Otra persona modificó este registro mientras usted lo editaba. Recargue la información e intente nuevamente.",
                request, null);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message("Credenciales inválidas")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErrorResponse> handleDisabled(
            DisabledException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message("Usuario inactivo")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(NoAutorizadoException.class)
    public ResponseEntity<ErrorResponse> handleNoAutorizado(
            NoAutorizadoException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message("No tiene permisos para realizar esta acción")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Error de validación en los datos enviados")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .errors(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(
            ResponseStatusException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(ex.getStatusCode().value())
                .error(ex.getStatusCode().toString())
                .message(ex.getReason() != null ? ex.getReason() : "Error en la solicitud")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {
        log.error("Error interno no controlado en {}:", request.getRequestURI(), ex);
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message("Ocurrió un error interno en el servidor")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private ResponseEntity<ErrorResponse> construir(HttpStatus estado, String mensaje,
                                                    HttpServletRequest request, Map<String, String> errores) {
        ErrorResponse response = ErrorResponse.builder()
                .status(estado.value())
                .error(estado.getReasonPhrase())
                .message(mensaje)
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .errors(errores)
                .build();
        return new ResponseEntity<>(response, estado);
    }
}
""")
