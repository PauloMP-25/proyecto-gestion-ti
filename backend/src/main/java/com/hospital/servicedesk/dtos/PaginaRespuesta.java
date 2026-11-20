package com.hospital.servicedesk.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.domain.Page;

import java.util.Collections;
import java.util.List;
import java.util.function.Function;

/**
 * DTO genérico e inmutable para respuestas paginadas del backend hospitalario.
 * Alineado exactamente con el contrato Pagina<T> de la Mesa de Ayuda en Angular.
 *
 * @param <T> Tipo de elemento contenido en la página.
 */
public record PaginaRespuesta<T>(
        @JsonProperty("contenido") List<T> contenido,
        @JsonProperty("pagina") int pagina,
        @JsonProperty("tamano") int tamano,
        @JsonProperty("totalElementos") long totalElementos,
        @JsonProperty("totalPaginas") int totalPaginas,
        @JsonProperty("primera") boolean primera,
        @JsonProperty("ultima") boolean ultima
) {

    public static <T> PaginaRespuesta<T> from(Page<T> page) {
        return new PaginaRespuesta<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    public static <T, R> PaginaRespuesta<R> from(Page<T> page, Function<T, R> mapper) {
        List<R> mappedContent = page.getContent().stream().map(mapper).toList();
        return new PaginaRespuesta<>(
                mappedContent,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    public static <T> PaginaRespuesta<T> of(List<T> allItems, int pagina, int tamano) {
        if (allItems == null || allItems.isEmpty()) {
            return new PaginaRespuesta<>(Collections.emptyList(), 0, tamano, 0, 0, true, true);
        }
        if (tamano <= 0) tamano = 10;
        if (pagina < 0) pagina = 0;

        int totalElementos = allItems.size();
        int totalPaginas = (int) Math.ceil((double) totalElementos / tamano);
        int fromIndex = Math.min(pagina * tamano, totalElementos);
        int toIndex = Math.min(fromIndex + tamano, totalElementos);

        List<T> sublist = allItems.subList(fromIndex, toIndex);
        boolean primera = (pagina == 0);
        boolean ultima = (pagina >= totalPaginas - 1);

        return new PaginaRespuesta<>(sublist, pagina, tamano, totalElementos, totalPaginas, primera, ultima);
    }
}
