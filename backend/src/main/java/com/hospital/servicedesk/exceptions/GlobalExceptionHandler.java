package com.hospital.servicedesk.exceptions;

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
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(ConflictoNegocioException.class)
    public ResponseEntity<ErrorResponse> handleConflictoNegocio(
            ConflictoNegocioException ex, HttpServletRequest request) {
        log.warn("Conflicto de negocio: {} en {}", ex.getMessage(), request.getRequestURI());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ErrorResponse> handleReglaNegocio(
            ReglaNegocioException ex, HttpServletRequest request) {
        log.warn("Regla de negocio no satisfecha: {} en {}", ex.getMessage(), request.getRequestURI());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler({CredencialesInvalidasException.class, BadCredentialsException.class})
    public ResponseEntity<ErrorResponse> handleCredencialesInvalidas(
            Exception ex, HttpServletRequest request) {
        log.warn("Intento de autenticación fallido en {}: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message("Correo electrónico o contraseña incorrectos")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler({UsuarioInactivoException.class, DisabledException.class})
    public ResponseEntity<ErrorResponse> handleUsuarioInactivo(
            Exception ex, HttpServletRequest request) {
        log.warn("Intento de acceso de usuario inactivo en {}: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(ex.getMessage() != null ? ex.getMessage() : "El usuario se encuentra inactivo en el sistema")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(NoAutorizadoException.class)
    public ResponseEntity<ErrorResponse> handleNoAutorizado(
            NoAutorizadoException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Acceso denegado a recurso protegido: {} - IP: {}", request.getRequestURI(), request.getRemoteAddr());
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message("No cuenta con los permisos necesarios para realizar esta acción")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> validationErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            validationErrors.put(error.getField(), error.getDefaultMessage());
        }

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Error de validación en los datos ingresados")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .errors(validationErrors)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            org.springframework.dao.DataIntegrityViolationException ex, HttpServletRequest request) {
        log.warn("Violación de integridad de datos en {}: {}", request.getRequestURI(), ex.getMessage());
        String msg = "Conflicto con los datos existentes en el sistema.";
        String exMsg = ex.getMessage() != null ? ex.getMessage() : "";

        if (exMsg.contains("UX_area_nombre") || exMsg.contains("area") && exMsg.contains("nombre")) {
            msg = "Ya existe un área registrada con ese nombre.";
        } else if (exMsg.contains("UQ_ci_codigo_inventario") || exMsg.contains("codigo_inventario")) {
            msg = "Ya existe un equipo registrado con ese código de inventario.";
        } else if (exMsg.contains("UQ_usuario_nombre_usuario") || exMsg.contains("nombre_usuario")) {
            msg = "El nombre de usuario ya está en uso.";
        } else if (exMsg.contains("historial_asignacion_ip") || exMsg.contains("direccion_ip")) {
            msg = "La dirección IP ya se encuentra asignada activamente a otro equipo.";
        }

        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(msg)
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatusException(
            ResponseStatusException ex, HttpServletRequest request) {
        ErrorResponse response = ErrorResponse.builder()
                .status(ex.getStatusCode().value())
                .error(ex.getStatusCode().toString())
                .message(ex.getReason())
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, ex.getStatusCode());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllUncaughtException(
            Exception ex, HttpServletRequest request) {
        log.error("Excepción no controlada en URI {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        ErrorResponse response = ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message("Ha ocurrido un error interno en el servidor. Por favor, intente más tarde.")
                .path(request.getRequestURI())
                .correlationId(obtenerCorrelationId())
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
