package com.hospital.servicedesk.compartido.correlativo;

import com.hospital.servicedesk.entities.CorrelativoDocumento;
import com.hospital.servicedesk.repositories.CorrelativoDocumentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class GeneradorCorrelativo {

    private final CorrelativoDocumentoRepository repository;

    @Transactional(propagation = Propagation.MANDATORY)
    public String siguiente(String prefijo, int anio) {
        String clave = prefijo + "-" + anio;
        CorrelativoDocumento contador = repository.bloquear(clave)
                .orElseGet(() -> repository.saveAndFlush(new CorrelativoDocumento(clave, 0)));
        contador.setUltimo(contador.getUltimo() + 1);
        return "%s-%d-%04d".formatted(prefijo, anio, contador.getUltimo());
    }
}
