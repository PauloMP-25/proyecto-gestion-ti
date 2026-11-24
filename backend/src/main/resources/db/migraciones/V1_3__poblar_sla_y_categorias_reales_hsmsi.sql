-- =========================================================================================
-- MIGRACIÓN V1.3: POBLAR MATRIZ DE COMPROMISOS (SLA) Y CATEGORÍAS REALES DEL HSMSI
-- Hospital Santa María del Socorro - Ica (HSMSI)
-- =========================================================================================

SET NOCOUNT ON;

-- -----------------------------------------------------------------------------------------
-- 1. POBLAR MATRIZ DE CONFIGURACIÓN DE COMPROMISOS (SLA)
-- Tiempos de respuesta definidos según la realidad asistencial y operativa del HSMSI:
-- P1 (Crítica): 15 min respuesta (rango 10-20 min) / 120 min resolución
-- P2 (Alta):    25 min respuesta (rango 15-30 min) / 240 min resolución
-- P3 (Media):   35 min respuesta (rango 20-40 min) / 480 min resolución
-- P4 (Baja):    45 min respuesta (rango 30-50 min) / 1440 min resolución
-- -----------------------------------------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM dbo.configuracion_sla)
BEGIN
    INSERT INTO dbo.configuracion_sla (impacto, urgencia, prioridad_resultante, minutos_respuesta, minutos_resolucion)
    VALUES
        ('ALTO',  'ALTA',  'CRITICA', 15, 120),
        ('ALTO',  'MEDIA', 'ALTA',    25, 240),
        ('ALTO',  'BAJA',  'MEDIA',   35, 480),
        ('MEDIO', 'ALTA',  'ALTA',    25, 240),
        ('MEDIO', 'MEDIA', 'MEDIA',   35, 480),
        ('MEDIO', 'BAJA',  'BAJA',    45, 1440),
        ('BAJO',  'ALTA',  'MEDIA',   35, 480),
        ('BAJO',  'MEDIA', 'BAJA',    45, 1440),
        ('BAJO',  'BAJA',  'BAJA',    45, 1440);
END;

-- -----------------------------------------------------------------------------------------
-- 2. POBLAR CATEGORÍAS ASISTENCIALES Y TECNOLÓGICAS DEL HSMSI
-- Estructura jerárquica padre-hijo basada en los sistemas y recursos reales del hospital
-- -----------------------------------------------------------------------------------------

IF NOT EXISTS (SELECT 1 FROM dbo.categoria)
BEGIN
    -- Categorías Padre (Nivel 1)
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Sistemas Asistenciales y de Gestión', NULL);
    DECLARE @id_sistemas INT = SCOPE_IDENTITY();

    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Ofimática y Conectividad Web', NULL);
    DECLARE @id_ofimatica INT = SCOPE_IDENTITY();

    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Equipos de Cómputo y Periféricos', NULL);
    DECLARE @id_equipos INT = SCOPE_IDENTITY();

    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Impresión y Suministros', NULL);
    DECLARE @id_impresion INT = SCOPE_IDENTITY();

    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Infraestructura de Red y Servidores', NULL);
    DECLARE @id_redes INT = SCOPE_IDENTITY();

    -- Subcategorías Hijas (Nivel 2)
    -- De Sistemas Asistenciales
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('HIS-MINSA', @id_sistemas);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Sistema Galenos', @id_sistemas);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Historia Clínica Electrónica / SIS', @id_sistemas);

    -- De Ofimática y Conectividad
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Microsoft Office (Word / Excel)', @id_ofimatica);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Navegador Web (Google Chrome)', @id_ofimatica);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Acceso y Conectividad a Internet', @id_ofimatica);

    -- De Equipos y Periféricos
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Computadoras Asistenciales y Laptops', @id_equipos);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Periféricos (Teclado, Mouse, Lector)', @id_equipos);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Proyectores Multimedia (Auditorio y Salas)', @id_equipos);

    -- De Impresión y Suministros
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Impresoras Departamentales de Red', @id_impresion);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Impresoras Térmicas (Recetas / Citas / Triaje)', @id_impresion);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Reemplazo de Tóner y Consumibles', @id_impresion);

    -- De Infraestructura y Redes
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Servidores y Centro de Datos', @id_redes);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Switches y Distribución de Red', @id_redes);
    INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES ('Puntos de Red y Cableado Estructurado', @id_redes);
END;
