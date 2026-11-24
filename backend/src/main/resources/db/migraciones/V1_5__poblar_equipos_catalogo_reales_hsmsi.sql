-- =========================================================================================
-- MIGRACIÓN V1.5: POBLAR EQUIPOS DEL CATÁLOGO REAL DEL HSMSI
-- Hospital Santa María del Socorro - Ica (HSMSI)
-- =========================================================================================

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET NOCOUNT ON;

-- -----------------------------------------------------------------------------------------
-- 1. REGISTRAR ÁREA DE AUDITORIO PRINCIPAL (SI NO EXISTE)
-- -----------------------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Auditorio Principal')
BEGIN
    INSERT INTO dbo.area (nombre, anexo, piso, prioridad_defecto, referencia_ubicacion, activo)
    VALUES ('Auditorio Principal', '150', 'Piso 2', 'P4', 'Piso 2 - Pabellón Central frente a Dirección', 1);
END;

DECLARE @id_auditorio INT = (SELECT TOP 1 id_area FROM dbo.area WHERE nombre = 'Auditorio Principal');

-- -----------------------------------------------------------------------------------------
-- 2. CORREGIR EQUIPOS PREVIOS CON INVENTARIO OBSOLETO (UCI / LAPTOPS)
-- -----------------------------------------------------------------------------------------
UPDATE dbo.elemento_configuracion
SET id_area = 1008, -- Reubicar a Centro Quirúrgico
    nombre = 'Monitor Multiparámetro Quirófano',
    estado = 'ACTIVO'
WHERE id_ci = 4;

UPDATE dbo.elemento_configuracion
SET nombre = 'Estación de Trabajo Farmacia Central (PC)',
    marca_modelo = 'HP ProDesk 400 G6 MT'
WHERE id_ci = 9;

-- -----------------------------------------------------------------------------------------
-- 3. INSERTAR EQUIPOS HOSPITALARIOS REALES (PCs, IMPRESORAS DE RED, PROYECTORES)
-- Respetando: computadoras de escritorio (sin laptops), impresoras grandes y térmicas,
-- y exactamente 2 proyectores en el Auditorio Principal.
-- -----------------------------------------------------------------------------------------

-- A. PISO 1: SERVICIOS CRÍTICOS Y ASISTENCIALES

-- Emergencia Admisión (Área 1011)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-101')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-101', 'PC Asistencial Admisión Emergencia 01', 'COMPUTADORA', 'Lenovo ThinkCentre M70s', 'ACTIVO', 1011, 'Ventanilla 01 de Emergencia', 'PC-EMG-ADM01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-101')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-101', 'Impresora Térmica Tickets Emergencia', 'IMPRESORA', 'Epson TM-T20III Red', 'ACTIVO', 1011, 'Ventanilla 01 de Emergencia', 'PRN-EMG-TIC01', SYSDATETIME());

-- Triaje Emergencia (Área 1031)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-102')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-102', 'PC Estación Triaje Emergencia', 'COMPUTADORA', 'HP ProDesk 400 G7 SFF', 'ACTIVO', 1031, 'Módulo de Triaje Adultos', 'PC-EMG-TRI01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-102')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-102', 'Impresora Térmica Pulseras y Citas Triaje', 'IMPRESORA', 'Zebra ZD220 Red', 'ACTIVO', 1031, 'Escritorio de Triaje', 'PRN-EMG-TRI01', SYSDATETIME());

-- Farmacia Emergencia (Área 1012)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-103')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-103', 'PC Dispensación Farmacia Emergencia', 'COMPUTADORA', 'Lenovo ThinkCentre Neo 50s', 'ACTIVO', 1012, 'Mostrador de Farmacia Emergencia', 'PC-FAR-EMG01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-103')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-103', 'Impresora Térmica Recetas Farmacia Emergencia', 'IMPRESORA', 'Epson TM-T88VI Red', 'ACTIVO', 1012, 'Despacho de Medicamentos', 'PRN-FAR-REC01', SYSDATETIME());

-- SIS Emergencia (Área 1032)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-104')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-104', 'PC Validación FUA SIS Emergencia', 'COMPUTADORA', 'Dell OptiPlex 3080 SFF', 'ACTIVO', 1032, 'Módulo de Afiliación SIS', 'PC-SIS-EMG01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-104')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-104', 'Impresora Departamental Láser SIS', 'IMPRESORA', 'HP LaserJet Pro M404dn', 'ACTIVO', 1032, 'Oficina SIS Emergencia', 'PRN-SIS-LAS01', SYSDATETIME());

-- Consultorios Piso 1 (Pediatría 1014, Materno 1015, Medicina 1016, Traumatología 1033)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-105')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-105', 'PC Consultorio Pediatría', 'COMPUTADORA', 'Lenovo ThinkCentre M70s', 'ACTIVO', 1014, 'Escritorio Médico Pediatría', 'PC-CON-PED01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-106')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-106', 'PC Consultorio Materno Perinatal', 'COMPUTADORA', 'Lenovo ThinkCentre M70s', 'ACTIVO', 1015, 'Escritorio Médico Materno', 'PC-CON-MAT01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-107')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-107', 'PC Consultorio Medicina General 01', 'COMPUTADORA', 'HP ProDesk 400 G7 SFF', 'ACTIVO', 1016, 'Escritorio Médico Medicina', 'PC-CON-MED01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-108')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-108', 'PC Consultorio Traumatología', 'COMPUTADORA', 'HP ProDesk 400 G6 MT', 'ACTIVO', 1033, 'Escritorio Médico Traumatología', 'PC-CON-TRM01', SYSDATETIME());

-- Admisión Central y Triaje (Área 2)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-105')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-105', 'Impresora Departamental Admisión Central', 'IMPRESORA', 'Kyocera ECOSYS P3155dn', 'ACTIVO', 2, 'Isla de Admisión y Citas', 'PRN-ADM-DEP01', SYSDATETIME());

-- Laboratorio Clínico (Área 1005)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-109')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-109', 'PC Recepción y Validación Laboratorio', 'COMPUTADORA', 'Dell OptiPlex 3070 SFF', 'ACTIVO', 1005, 'Mesa de Toma de Muestras', 'PC-LAB-REC01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-106')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-106', 'Impresora Departamental Resultados Laboratorio', 'IMPRESORA', 'Brother HL-L6400DW Red', 'ACTIVO', 1005, 'Área de Entrega de Resultados', 'PRN-LAB-RES01', SYSDATETIME());

-- Caja Central (Área 1010)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-110')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-110', 'PC Ventanilla Recaudación y Caja 01', 'COMPUTADORA', 'Lenovo ThinkCentre Neo 50s', 'ACTIVO', 1010, 'Ventanilla Central de Caja', 'PC-CAJ-REC01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-107')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-107', 'Impresora Térmica Boletas y Comprobantes Caja', 'IMPRESORA', 'Epson TM-T20III Red', 'ACTIVO', 1010, 'Mostrador de Caja', 'PRN-CAJ-BOL01', SYSDATETIME());


-- B. PISO 2: CONSULTORIOS, ESPECIALIDADES Y AUDITORIO

-- Triaje Principal Piso 2 (Área 1021)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-201')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-201', 'PC Triaje Principal Piso 2', 'COMPUTADORA', 'HP ProDesk 400 G7 SFF', 'ACTIVO', 1021, 'Módulo Central de Triaje Piso 2', 'PC-TRI-P2-01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-201')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-201', 'Impresora Térmica Citas y Fichas Piso 2', 'IMPRESORA', 'Epson TM-T20III Red', 'ACTIVO', 1021, 'Ventanilla Triaje Piso 2', 'PRN-TRI-P2-01', SYSDATETIME());

-- Cardiología (Área 1026)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-202')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-202', 'PC Consultorio Cardiología', 'COMPUTADORA', 'Lenovo ThinkCentre M70s', 'ACTIVO', 1026, 'Escritorio Médico Cardiología', 'PC-CON-CAR01', SYSDATETIME());

-- Odontología / Dental Adultos (Área 1025)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-203')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-203', 'PC Consultorio Odontología Adultos', 'COMPUTADORA', 'HP ProDesk 400 G6 MT', 'ACTIVO', 1025, 'Unidad Dental 01', 'PC-CON-DEN01', SYSDATETIME());

-- Centro Quirúrgico (Área 1008)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-204')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-204', 'PC Programación Quirúrgica', 'COMPUTADORA', 'Dell OptiPlex 5090 SFF', 'ACTIVO', 1008, 'Estar Médico Quirófano', 'PC-QUI-PRO01', SYSDATETIME());

-- Mesa de Partes (Área 1034)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PC-205')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PC-205', 'PC Ventanilla Mesa de Partes', 'COMPUTADORA', 'HP ProDesk 400 G7 SFF', 'ACTIVO', 1034, 'Ventanilla Trámite Documentario', 'PC-MDP-VEN01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PRN-202')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PRN-202', 'Impresora Departamental Multifuncional Mesa de Partes', 'IMPRESORA', 'Kyocera ECOSYS M3655idn', 'ACTIVO', 1034, 'Mostrador de Mesa de Partes', 'PRN-MDP-MUL01', SYSDATETIME());

-- AUDITORIO PRINCIPAL: EXACTAMENTE LOS 2 PROYECTORES MULTIMEDIA
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PROY-001')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PROY-001', 'Proyector Multimedia Principal Auditorio', 'OTRO', 'Epson PowerLite L630U Láser', 'ACTIVO', @id_auditorio, 'Techo Central del Auditorio Principal', 'PROY-AUD-01', SYSDATETIME());

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'HSMSI-PROY-002')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo_ci, marca_modelo, estado, id_area, referencia_ubicacion, hostname, fecha_registro)
    VALUES ('HSMSI-PROY-002', 'Proyector Multimedia Retorno Auditorio', 'OTRO', 'BenQ MW560 DLP 4000L', 'ACTIVO', @id_auditorio, 'Lateral Izquierdo Escenario Auditorio', 'PROY-AUD-02', SYSDATETIME());
