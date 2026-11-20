package com.hospital.servicedesk.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Configuración general de beans de infraestructura y utilitarios para el backend hospitalario.
 */
@Configuration
public class ApplicationConfig {

    /**
     * Proveedor inyectable de reloj del sistema.
     * Permite desacoplar el cálculo de tiempos de SLA y auditoría para testing determinista.
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
