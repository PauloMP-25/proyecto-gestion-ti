-- =========================================================================================
-- MIGRACIÓN V1.4: POBLAR USUARIOS ASISTENCIALES Y EQUIPO DE SOPORTE DEL HSMSI
-- Hospital Santa María del Socorro - Ica (HSMSI)
-- =========================================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

-- -----------------------------------------------------------------------------------------
-- Hashes BCrypt correspondientes:
-- hospital123    -> 0x2432612431302471524A527563494B45707346496238463166463456656F5A597A33703452367858422E6D7A724D6B6D636C484A45686A796B64564F
-- admin123       -> 0x2432612431302454786838383259593235324347753457544B6C515275775548776E39466C33672F70797645416465366837683630693369614E6F61
-- practicante123 -> 0x2432612431302451475A56396D48365652765148516C3937344A6D454F416838316E3653303168725344654B3541433665384D75362F4B5637387075
-- -----------------------------------------------------------------------------------------

DECLARE @hash_hospital    VARBINARY(MAX) = 0x2432612431302471524A527563494B45707346496238463166463456656F5A597A33703452367858422E6D7A724D6B6D636C484A45686A796B64564F;
DECLARE @hash_admin       VARBINARY(MAX) = 0x2432612431302454786838383259593235324347753457544B6C515275775548776E39466C33672F70797645416465366837683630693369614E6F61;
DECLARE @hash_practicante VARBINARY(MAX) = 0x2432612431302451475A56396D48365652765148516C3937344A6D454F416838316E3653303168725344654B3541433665384D75362F4B5637387075;

-- -----------------------------------------------------------------------------------------
-- 1. ACTUALIZAR O INSERTAR EQUIPO DE INFORMÁTICA Y SOPORTE (ÁREA 1: Tecnología de la Información)
-- 2 Ingenieros/Administradores + 2 Practicantes (sin jerarquía artificial de soporte)
-- -----------------------------------------------------------------------------------------

-- Ingeniero 1 (admin actual)
IF EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'admin')
BEGIN
    UPDATE dbo.usuario 
    SET contrasena_hash = @hash_admin,
        rol = 'ADMINISTRADOR',
        id_area = 1,
        nombres = 'Paulo',
        apellidos = 'Mendoza Pérez',
        correo = 'pmendoza@hsmsi.gob.pe',
        activo = 1
    WHERE nombre_usuario = 'admin';
END
ELSE
BEGIN
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, nivel_soporte, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('admin', 'Paulo', 'Mendoza Pérez', 'pmendoza@hsmsi.gob.pe', @hash_admin, 'ADMINISTRADOR', NULL, 1, 1, SYSDATETIME(), 0, 0);
END;

-- Ingeniero 2 (Administrador)
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'ing.fabrizio')
BEGIN
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, nivel_soporte, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('ing.fabrizio', 'Fabrizio', 'Ramos Silva', 'framos@hsmsi.gob.pe', @hash_admin, 'ADMINISTRADOR', NULL, 1, 1, SYSDATETIME(), 0, 0);
END;

-- Practicante 1
IF EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'practicante')
BEGIN
    UPDATE dbo.usuario 
    SET contrasena_hash = @hash_practicante,
        rol = 'PRACTICANTE',
        id_area = 1,
        nombres = 'Carlos',
        apellidos = 'Huamán Soto',
        correo = 'chuaman@hsmsi.gob.pe',
        activo = 1
    WHERE nombre_usuario = 'practicante';
END
ELSE
BEGIN
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, nivel_soporte, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('practicante', 'Carlos', 'Huamán Soto', 'chuaman@hsmsi.gob.pe', @hash_practicante, 'PRACTICANTE', NULL, 1, 1, SYSDATETIME(), 0, 0);
END;

-- Practicante 2
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'practicante2')
BEGIN
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, nivel_soporte, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('practicante2', 'Luis', 'Alva Vega', 'lalva@hsmsi.gob.pe', @hash_practicante, 'PRACTICANTE', NULL, 1, 1, SYSDATETIME(), 0, 0);
END;

-- -----------------------------------------------------------------------------------------
-- 2. INSERTAR PERSONAL ASISTENCIAL (USUARIO_FINAL) DISTRIBUIDO EN ÁREAS REALES
-- Contraseña para todos: hospital123
-- -----------------------------------------------------------------------------------------

-- Actualizar usuario 'medico' existente
IF EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'medico')
BEGIN
    UPDATE dbo.usuario 
    SET contrasena_hash = @hash_hospital,
        id_area = 1011, -- Emergencia Admisión
        rol = 'USUARIO_FINAL',
        activo = 1
    WHERE nombre_usuario = 'medico';
END;

-- Lista de usuarios asistenciales por área (Piso 1, 2 y 4)
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dr.emergencia')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dr.emergencia', 'Marcos', 'Quispe Gutiérrez', 'mquispe@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1011, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'lic.triaje.emg')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('lic.triaje.emg', 'Carmen', 'Torres Morales', 'ctorres@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1031, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'farm.emergencia')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('farm.emergencia', 'José', 'Díaz Peña', 'jdiaz@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1012, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'sis.emergencia')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('sis.emergencia', 'Elena', 'Ramos Benavides', 'eramos@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1032, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dra.pediatria')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dra.pediatria', 'Ana', 'Flores Córdova', 'aflores@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1014, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'obst.materno')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('obst.materno', 'Juana', 'Pérez Rojas', 'jperez@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1015, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dr.medicina1')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dr.medicina1', 'Roberto', 'Sánchez Luján', 'rsanchez@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1016, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dr.traumato')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dr.traumato', 'Walter', 'Cueva Meza', 'wcueva@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1033, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'lic.admision')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('lic.admision', 'Patricia', 'Gómez Castro', 'pgomez@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 2, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'qf.farmacia.cen')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('qf.farmacia.cen', 'Manuel', 'Castro Vilca', 'mcastro@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1002, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'lic.laboratorio')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('lic.laboratorio', 'Javier', 'Ortiz Palomino', 'jortiz@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1005, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'cajera.central')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('cajera.central', 'Mónica', 'Vega Ríos', 'mvega@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1010, 1, SYSDATETIME(), 0, 0);

-- Piso 2: Consultorios Externos y Especialidades
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'lic.triaje.p2')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('lic.triaje.p2', 'Gloria', 'Solís Napa', 'gsolis@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1021, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dr.cardiologia')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dr.cardiologia', 'Alberto', 'Zevallos Ramos', 'azevallos@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1026, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'cd.dental')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('cd.dental', 'Raúl', 'Palacios Barrientos', 'rpalacios@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1025, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dr.quirofano')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dr.quirofano', 'Gabriel', 'Morales Chauca', 'gmorales@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1008, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'mesa.partes')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('mesa.partes', 'Rocío', 'Huaccachi Gómez', 'rhuaccachi@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1034, 1, SYSDATETIME(), 0, 0);

-- Piso 4: Administrativos
IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'dir.ejecutiva')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('dir.ejecutiva', 'Jorge', 'Huamán Guillén', 'jhuaman@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1039, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'adm.hospital')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('adm.hospital', 'Claudia', 'Villanueva Paz', 'cvillanueva@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1040, 1, SYSDATETIME(), 0, 0);

IF NOT EXISTS (SELECT 1 FROM dbo.usuario WHERE nombre_usuario = 'jefe.logistica')
    INSERT INTO dbo.usuario (nombre_usuario, nombres, apellidos, correo, contrasena_hash, rol, id_area, activo, fecha_creacion, debe_cambiar_contrasena, intentos_fallidos)
    VALUES ('jefe.logistica', 'Daniel', 'Castillo Prado', 'dcastillo@hsmsi.gob.pe', @hash_hospital, 'USUARIO_FINAL', 1043, 1, SYSDATETIME(), 0, 0);
