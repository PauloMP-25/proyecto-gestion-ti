import os

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Wrote {path}")

# 1. MaquinaEstadosCambioTest.java
write_file("backend/src/test/java/com/hospital/servicedesk/administrativo/cambios/dominio/MaquinaEstadosCambioTest.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.AccionCambio;
import com.hospital.servicedesk.entities.EstadoCambio;
import com.hospital.servicedesk.exceptions.ConflictoNegocioException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class MaquinaEstadosCambioTest {

    private final MaquinaEstadosCambio maquina = new MaquinaEstadosCambio();

    @Test
    void accionesPermitidasDesdeBorradorParaTecnico() {
        ContextoActor ctx = new ContextoActor("tec@hsmsi.gob.pe", "TECNICO", "127.0.0.1");
        var acciones = maquina.accionesPermitidas(EstadoCambio.BORRADOR, ctx);
        assertThat(acciones).contains(AccionCambio.ENVIAR_EVALUACION, AccionCambio.CANCELAR);
    }

    @Test
    void transicionValidaPasaSinExcepcion() {
        ContextoActor ctx = new ContextoActor("tec@hsmsi.gob.pe", "TECNICO", "127.0.0.1");
        assertThatCode(() -> maquina.validarTransicion(AccionCambio.ENVIAR_EVALUACION, EstadoCambio.BORRADOR, null, ctx))
                .doesNotThrowAnyException();
    }

    @Test
    void transicionInvalidaLanzaConflicto() {
        ContextoActor ctx = new ContextoActor("admin@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> maquina.validarTransicion(AccionCambio.APROBAR, EstadoCambio.BORRADOR, null, ctx))
                .isInstanceOf(ConflictoNegocioException.class);
    }

    @Test
    void accionRequiereObservacionLanzaExcepcionSiFalta() {
        ContextoActor ctx = new ContextoActor("admin@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> maquina.validarTransicion(AccionCambio.RECHAZAR, EstadoCambio.EN_EVALUACION, "   ", ctx))
                .isInstanceOf(ConflictoNegocioException.class);
    }
}
""")

# 2. PoliticaAccesoCambiosTest.java
write_file("backend/src/test/java/com/hospital/servicedesk/administrativo/cambios/dominio/PoliticaAccesoCambiosTest.java", """package com.hospital.servicedesk.administrativo.cambios.dominio;

import com.hospital.servicedesk.compartido.auditoria.ContextoActor;
import com.hospital.servicedesk.entities.*;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import static org.assertj.core.api.Assertions.*;

class PoliticaAccesoCambiosTest {

    private final PoliticaAccesoCambios politica = new PoliticaAccesoCambios();

    @Test
    void solicitantePuedeEditarSuBorrador() {
        Usuario solicitante = Usuario.builder().idUsuario(1).correo("user@hsmsi.gob.pe").build();
        SolicitudCambio solicitud = SolicitudCambio.builder().solicitante(solicitante).estado(EstadoCambio.BORRADOR).build();

        ContextoActor ctx = new ContextoActor("user@hsmsi.gob.pe", "USUARIO_FINAL", "127.0.0.1");
        assertThatCode(() -> politica.verificarEdicion(solicitud, solicitante, ctx))
                .doesNotThrowAnyException();
    }

    @Test
    void solicitanteNoPuedeEvaluarSuPropiaSolicitudSegregacionFunciones() {
        Usuario solicitante = Usuario.builder().idUsuario(1).correo("admin.solicitante@hsmsi.gob.pe").build();
        SolicitudCambio solicitud = SolicitudCambio.builder().solicitante(solicitante).estado(EstadoCambio.EN_EVALUACION).build();

        ContextoActor ctx = new ContextoActor("admin.solicitante@hsmsi.gob.pe", "ADMINISTRADOR", "127.0.0.1");
        assertThatThrownBy(() -> politica.verificarTransicion(AccionCambio.APROBAR, solicitud, solicitante, ctx))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Quien registró la solicitud no puede evaluarla");
    }
}
""")

# 3. GeneradorCorrelativoIT.java
write_file("backend/src/test/java/com/hospital/servicedesk/compartido/correlativo/GeneradorCorrelativoIT.java", """package com.hospital.servicedesk.compartido.correlativo;

import com.hospital.servicedesk.repositories.CorrelativoDocumentoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class GeneradorCorrelativoIT {

    @Autowired
    private GeneradorCorrelativo generador;

    @Autowired
    private CorrelativoDocumentoRepository repository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
    }

    @Test
    void concurrenciaGeneracionCorrelativosSinSaltosNiDuplicados() throws InterruptedException {
        int hilos = 15;
        ExecutorService executor = Executors.newFixedThreadPool(hilos);
        CountDownLatch latch = new CountDownLatch(hilos);
        Set<String> codigosGenerados = Collections.synchronizedSet(new HashSet<>());
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);

        for (int i = 0; i < hilos; i++) {
            executor.submit(() -> {
                try {
                    String codigo = txTemplate.execute(status -> generador.siguiente("SC", 2026));
                    if (codigo != null) {
                        codigosGenerados.add(codigo);
                    }
                } finally {
                    latch.countDown();
                }
            });
        }

        boolean finished = latch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(finished).isTrue();
        assertThat(codigosGenerados).hasSize(hilos);
    }
}
""")

print("Phase 4 module 1 tests generated successfully.")
