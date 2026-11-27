package com.hospital.servicedesk.operaciones.compromisos.config;

import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.Map;
import java.util.concurrent.Executor;

@Configuration
@EnableScheduling
@EnableAsync
public class ConfiguracionTareasSegundoPlano {

    public static final String EJECUTOR_NOTIFICACIONES = "ejecutorNotificaciones";

    @Bean(name = EJECUTOR_NOTIFICACIONES)
    public Executor ejecutorNotificaciones() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("NotifSLA-");
        executor.setTaskDecorator(tarea -> {
            Map<String, String> contexto = MDC.getCopyOfContextMap();
            return () -> {
                if (contexto != null) MDC.setContextMap(contexto);
                try { tarea.run(); } finally { MDC.clear(); }
            };
        });
        executor.initialize();
        return executor;
    }
}
