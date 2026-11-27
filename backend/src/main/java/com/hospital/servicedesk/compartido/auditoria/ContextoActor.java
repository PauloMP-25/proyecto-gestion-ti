package com.hospital.servicedesk.compartido.auditoria;

/**
 * Quién ejecuta la operación y desde dónde. Se construye en el controlador
 * y viaja hacia la capa de aplicación para auditoría y reglas de permiso.
 */
public record ContextoActor(String correo, String rol, String ipOrigen) {

    public boolean esAdministrador() { return "ADMINISTRADOR".equalsIgnoreCase(rol); }
    public boolean esTecnico()       { return "TECNICO".equalsIgnoreCase(rol); }
    public boolean esPracticante()   { return "PRACTICANTE".equalsIgnoreCase(rol); }

    /** Personal de Informática: puede ver contenido interno. */
    public boolean esPersonalTecnico() { return esAdministrador() || esTecnico() || esPracticante(); }
}
