-- =============================================================================
-- Migración V1_6: Semillas de áreas, equipos, red y guías del KEDB
-- Base de datos: SQL Server
-- =============================================================================

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- 0. Áreas adicionales ---------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Farmacia Central')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Farmacia Central', N'Piso 1', N'Pabellón de Consultorios Externos', '105', 'P2', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.area WHERE nombre = N'Admisión Central y Triaje')
    INSERT INTO dbo.area (nombre, piso, referencia_ubicacion, anexo, prioridad_defecto, activo)
    VALUES (N'Admisión Central y Triaje', N'Piso 1', N'Hall Central - Módulos de Admisión General', '101', 'P1', 1);

-- 1. Catálogo de equipos semilla -----------------------------------------------
-- (Insertados si no existen por código de inventario)
IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'PC-ADM-01')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo, marca, modelo, numero_serie, estado, id_area, fecha_adquisicion, observaciones)
    VALUES ('PC-ADM-01', N'PC Admisión módulo 1', 'COMPUTADORA', N'Lenovo', N'ThinkCentre M70q', N'SN-LNV-001', 'ACTIVO', 
            (SELECT TOP 1 id_area FROM dbo.area WHERE nombre = N'Admisión Central y Triaje'), GETDATE(), N'Semilla V1_6');

IF NOT EXISTS (SELECT 1 FROM dbo.elemento_configuracion WHERE codigo_inventario = 'IMP-ADM-01')
    INSERT INTO dbo.elemento_configuracion (codigo_inventario, nombre, tipo, marca, modelo, numero_serie, estado, id_area, fecha_adquisicion, observaciones)
    VALUES ('IMP-ADM-01', N'Impresora de pulseras Admisión', 'IMPRESORA', N'Zebra', N'ZD510-HC', N'SN-ZBR-001', 'ACTIVO', 
            (SELECT TOP 1 id_area FROM dbo.area WHERE nombre = N'Admisión Central y Triaje'), GETDATE(), N'Semilla V1_6');

-- 2. Guías iniciales del KEDB --------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.error_conocido WHERE titulo LIKE '%Zebra%')
    INSERT INTO dbo.error_conocido (titulo, descripcion_problema, solucion_trabajo, publicado, fecha_creacion, categoria, ambito, sintoma, causa_raiz, nivel_dificultad, minutos_estimados, requiere_tecnico, palabras_clave, equipos_compatibles, fecha_actualizacion, texto_busqueda)
    VALUES (
        N'Impresora Zebra ZD510-HC no imprime pulseras de identificación',
        N'La impresora parpadea en rojo y no expulsa la pulsera al intentar emitir admisión.',
        N'1. Verifique que el rollo de pulseras térmicas esté correctamente alineado en el sensor.
2. Reinicie el servicio de cola de impresión en Windows.
3. Calibre el sensor manteniendo presionado el botón de alimentación hasta que parpadee 2 veces.',
        1, GETDATE(), 'IMPRESORAS_TERMICAS', 'PUBLICO_ASISTENCIAL',
        N'Luz roja intermitente y atasco de pulseras', N'Sensor óptico descalibrado o rollo mal colocado',
        'BASICO', 10, 0, 'zebra,pulseras,admision,impresora', 'IMP-ADM-01,ZD510', GETDATE(),
        'impresora zebra zd510 hc no imprime pulseras de identificacion luz roja intermitente sensor'
    );

IF NOT EXISTS (SELECT 1 FROM dbo.error_conocido WHERE titulo LIKE '%HIS%')
    INSERT INTO dbo.error_conocido (titulo, descripcion_problema, solucion_trabajo, publicado, fecha_creacion, categoria, ambito, sintoma, causa_raiz, nivel_dificultad, minutos_estimados, requiere_tecnico, palabras_clave, equipos_compatibles, fecha_actualizacion, texto_busqueda)
    VALUES (
        N'Error de conexión con la base de datos central del HIS en admisiones',
        N'Pantalla en blanco o mensaje "Timeout de conexión con el servidor HIS" al buscar pacientes.',
        N'1. Compruebe el estado del cable de red UTP en el switch del rack local.
2. Verifique la IP estática del equipo.
3. Ejecute ping al servidor central 10.20.1.100.',
        1, GETDATE(), 'SISTEMA_CLINICO', 'INTERNO_TECNICO',
        N'Timeout de conexion HIS', N'Corte temporal de red o caída del servicio de base de datos',
        'INTERMEDIO', 15, 1, 'his,conexion,red,base,datos', 'PC-ADM-01,SWITCH-CORE', GETDATE(),
        'error de conexion con la base de datos central del his en admisiones timeout'
    );

COMMIT TRANSACTION;
