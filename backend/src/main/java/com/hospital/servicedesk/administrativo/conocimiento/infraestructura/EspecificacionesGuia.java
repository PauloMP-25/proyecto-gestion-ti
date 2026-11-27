package com.hospital.servicedesk.administrativo.conocimiento.infraestructura;

import com.hospital.servicedesk.compartido.util.NormalizadorBusqueda;
import com.hospital.servicedesk.entities.AmbitoGuia;
import com.hospital.servicedesk.entities.ErrorConocido;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public final class EspecificacionesGuia {

    private EspecificacionesGuia() {}

    public static Specification<ErrorConocido> publicasOAccesoTotal(boolean soloPublicas, AmbitoGuia ambitoActor) {
        return (root, query, cb) -> {
            if (soloPublicas) {
                return cb.and(
                        cb.isTrue(root.get("publicado")),
                        cb.equal(root.get("ambito"), AmbitoGuia.PUBLICO_ASISTENCIAL)
                );
            }
            if (ambitoActor == AmbitoGuia.PUBLICO_ASISTENCIAL) {
                return cb.and(
                        cb.isTrue(root.get("publicado")),
                        cb.equal(root.get("ambito"), AmbitoGuia.PUBLICO_ASISTENCIAL)
                );
            }
            return cb.isTrue(root.get("publicado"));
        };
    }

    public static Specification<ErrorConocido> porCategoria(Integer categoriaId) {
        return (root, query, cb) -> categoriaId == null ? null : cb.equal(root.get("categoria"), com.hospital.servicedesk.entities.CategoriaGuia.desdeId(categoriaId));
    }

    public static Specification<ErrorConocido> porAmbito(AmbitoGuia ambito) {
        return (root, query, cb) -> ambito == null ? null : cb.equal(root.get("ambito"), ambito);
    }

    public static Specification<ErrorConocido> porTokens(List<String> tokens) {
        return (root, query, cb) -> {
            if (tokens == null || tokens.isEmpty()) return cb.conjunction();
            var predicates = tokens.stream()
                    .map(t -> cb.like(root.get("textoBusqueda"), "%" + NormalizadorBusqueda.normalizar(t) + "%"))
                    .toList();
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }
}
