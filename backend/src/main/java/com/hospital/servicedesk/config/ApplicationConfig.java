package com.hospital.servicedesk.config;

import com.hospital.servicedesk.administrativo.equipos.config.PropiedadesRed;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Configuración general de beans de infraestructura y utilitarios para el backend hospitalario.
 */
@Configuration
@EnableConfigurationProperties({PropiedadesRed.class, com.hospital.servicedesk.operaciones.compromisos.config.PropiedadesCompromisoAtencion.class})
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
