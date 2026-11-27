package com.hospital.servicedesk.compartido.correlativo;

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
