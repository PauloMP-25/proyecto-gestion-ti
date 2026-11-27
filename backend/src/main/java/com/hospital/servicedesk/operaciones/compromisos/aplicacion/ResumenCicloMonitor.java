package com.hospital.servicedesk.operaciones.compromisos.aplicacion;

import java.time.Duration;
import java.time.LocalDateTime;

public record ResumenCicloMonitor(LocalDateTime inicio, Duration duracion, int evaluados,
                                  int pasaronARiesgo, int vencieron, int errores) {}
