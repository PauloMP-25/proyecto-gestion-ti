-- ============================================================================
-- Migración SQL Server: V1.2 Áreas, Consultorios y Oficinas Reales del HSMSI
-- Hospital Santa María del Socorro (HSMSI)
-- Estructura Real: Piso 1, Piso 2, Piso 3 y Piso 4 (Sin Sótano, Sin UCI)
-- Idempotente y seguro para ejecución repetida.
-- ============================================================================

-- 1. Desactivar áreas obsoletas o inexistentes (Sin UCI)
UPDATE dbo.area 
SET activo = 0 
WHERE nombre LIKE '%UCI%' OR nombre LIKE '%Cuidados Intensivos%';

-- 2. Corregir y asegurar que NO exista "Sótano" en ninguna área (Pasa a Piso 1)
UPDATE dbo.area 
SET piso = 'Piso 1', referencia_ubicacion = 'Pabellón de Imágenes y Radiología General', activo = 1 
WHERE nombre LIKE '%Diagnóstico por Imágenes%' AND (piso LIKE '%Sótano%' OR piso IS NULL);

-- 3. Actualizar datos de ubicación física de áreas existentes
UPDATE dbo.area 
SET piso = 'Piso 2', referencia_ubicacion = 'Pabellón Central - Oficina de Sistemas / TI', activo = 1 
WHERE nombre = 'Tecnología de la Información';

UPDATE dbo.area 
SET piso = 'Piso 1', referencia_ubicacion = 'Hall Central - Módulos de Admisión General', activo = 1 
WHERE nombre = 'Admisión Central y Triaje';

UPDATE dbo.area 
SET piso = 'Piso 1', referencia_ubicacion = 'Pabellón de Consultorios Externos', activo = 1 
WHERE nombre = 'Farmacia Central';

UPDATE dbo.area 
SET piso = 'Piso 3', referencia_ubicacion = 'Pabellón de Hospitalización 3er Nivel', activo = 1 
WHERE nombre = 'Hospitalización Medicina y Cirugía';

UPDATE dbo.area 
SET piso = 'Piso 1', referencia_ubicacion = 'Pabellón de Diagnóstico y Toma de Muestras', activo = 1 
WHERE nombre = 'Laboratorio Clínico y Banco de Sangre';

UPDATE dbo.area 
SET piso = 'Piso 2', referencia_ubicacion = 'Pabellón Quirúrgico Central', activo = 1 
WHERE nombre = 'Centro Quirúrgico';

-- ============================================================================
-- PISO 1: CONSULTORIOS, SERVICIOS ASISTENCIALES Y FLUJO DE EMERGENCIA
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Estadística e Informática')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Estadística e Informática', 'Piso 1', 'Detrás del área de Admisión General', '104', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Caja')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Caja', 'Piso 1', 'Hall Principal - Módulo de Cobranza', '102', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Emergencia Admisión')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Emergencia Admisión', 'Piso 1', 'Acceso de Ambulancias y Triaje de Emergencia', '103', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Farmacia Emergencia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Farmacia Emergencia', 'Piso 1', 'Área de Emergencia y Trauma Shock', '109', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Triaje Emergencia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Triaje Emergencia', 'Piso 1', 'Acceso Inmediato de Emergencia', '110', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'SIS Emergencia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('SIS Emergencia', 'Piso 1', 'Módulo de Afiliación en Emergencia', '105', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Triaje 2')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Triaje 2', 'Piso 1', 'Pabellón de Consultorios Externos', '111', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Pediatría')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Pediatría', 'Piso 1', 'Consultorio de Atención Infantil', '116', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Materno 1')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Materno 1', 'Piso 1', 'Atención Materno Infantil y Crecimiento', '117', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Medicina 1')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Medicina 1', 'Piso 1', 'Consultorio de Medicina General 1', '118', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Traumatología y Ortopedia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Traumatología', 'Piso 1', 'Consultorio de Huesos y Articulaciones', '119', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Fisioterapia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Fisioterapia', 'Piso 1', 'Terapia Física y Rehabilitación', '121', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Psicología 1')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Psicología 1', 'Piso 1', 'Consultorio Psicológico N° 1', '122', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Psicología 3')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Psicología 3', 'Piso 1', 'Consultorio Psicológico N° 3', '124', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Diagnóstico por Imágenes - Piso 1')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Diagnóstico por Imágenes - Piso 1', 'Piso 1', 'Sala de Ecografía y Radiología Básica', '125', 'P2', 1);

-- ============================================================================
-- PISO 2: CONSULTORIOS DE ESPECIALIDAD Y ADMINISTRACIÓN DE ATENCIÓN
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Triaje Principal')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Triaje Principal', 'Piso 2', 'Módulo Central de Evaluación y Triaje', '201', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Mesa de Partes')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Mesa de Partes', 'Piso 2', 'Trámite Documentario y Atención al Usuario', '202', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Gastroenterología')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Gastroenterología', 'Piso 2', 'Consultorio de Gastroenterología', '203', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Gestión de la Calidad')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Gestión de la Calidad', 'Piso 2', 'Oficina de Acreditación y Calidad', '204', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Psiquiatría')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Psiquiatría', 'Piso 2', 'Servicio de Salud Mental Especializada', '206', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Psicología 2')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Psicología 2', 'Piso 2', 'Consultorio Psicológico N° 2', '207', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Dental Niños')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Dental Niños', 'Piso 2', 'Odontopediatría y Salud Bucal Infantil', '208', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Dental Adultos')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Dental Adultos', 'Piso 2', 'Odontología General y Cirugía Dental', '209', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Cardiología')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Cardiología', 'Piso 2', 'Consultorio de Cardiología y Electrocardiograma', '211', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Dermatología')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Dermatología', 'Piso 2', 'Consultorio de Dermatología Clínica', '212', 'P3', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Otorrinolaringología (Otorrino)')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Otorrinolaringología (Otorrino)', 'Piso 2', 'Consultorio Especializado de Otorrino', '213', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Planificación Familiar')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Planificación Familiar', 'Piso 2', 'Consejería y Atención en Salud Reproductiva', '214', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Obstetricia')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Obstetricia', 'Piso 2', 'Centro Obstétrico y Atención de Partos', '216', 'P1', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Programa de Diabetes')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Programa de Diabetes', 'Piso 2', 'Atención de Enfermedades No Transmisibles', '217', 'P3', 1);

-- ============================================================================
-- PISO 4: ALTA DIRECCIÓN, ADMINISTRACIÓN CENTRAL Y DOCENCIA
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Dirección Ejecutiva')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Dirección Ejecutiva', 'Piso 4', 'Despacho de la Dirección General', '401', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Oficina de Administración')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Oficina de Administración', 'Piso 4', 'Dirección Administrativa Central', '402', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Recursos Humanos')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Recursos Humanos', 'Piso 4', 'Unidad de Personal y Asistencia', '403', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Economía y Finanzas')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Economía y Finanzas', 'Piso 4', 'Tesorería y Contabilidad Hospitalaria', '404', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Logística y Abastecimiento')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Logística y Abastecimiento', 'Piso 4', 'Adquisiciones y Control Patrimonial', '405', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Seguros (SIS Central)')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Seguros (SIS Central)', 'Piso 4', 'Oficina de Aseguramiento SIS y FISSAL', '406', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Docencia e Investigación')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Docencia e Investigación', 'Piso 4', 'Aulas de Capacitación e Internado Médico', '407', 'P4', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = 'Asesoría Jurídica')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES ('Asesoría Jurídica', 'Piso 4', 'Oficina de Asesoría Legal', '408', 'P4', 1);
