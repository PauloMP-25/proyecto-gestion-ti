package com.hospital.servicedesk.administrativo.equipos.dto;

public record DisponibilidadIpRespuesta(
        boolean disponible,
        String equipoActual,
        String motivo
) {
    public static DisponibilidadIpRespuesta libre() {
        return new DisponibilidadIpRespuesta(true, null, null);
    }

    public static DisponibilidadIpRespuesta ocupada(String equipoActual) {
        return new DisponibilidadIpRespuesta(false, equipoActual, "La dirección IP ya está asignada a " + equipoActual);
    }

    public static DisponibilidadIpRespuesta noValida(String motivo) {
        return new DisponibilidadIpRespuesta(false, null, motivo);
    }
}
