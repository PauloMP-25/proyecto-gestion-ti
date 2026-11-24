-- =========================================================================================
-- MIGRACIÓN V1.3: POBLAR MATRIZ DE COMPROMISOS (SLA) Y CATEGORÍAS REALES DEL HSMSI
-- Hospital Santa María del Socorro - Ica (HSMSI)
-- =========================================================================================

SET NOCOUNT ON;

-- -----------------------------------------------------------------------------------------
-- 1. ACTUALIZAR MATRIZ DE CONFIGURACIÓN DE COMPROMISOS (SLA)
-- Tiempos exactos definidos para la atención hospitalaria del HSMSI:
-- P1 (Crítica): 10 min respuesta / 30 min resolución máxima
-- P2 (Alta):    15 min respuesta / 45 min resolución máxima
-- P3 (Media):   20 min respuesta / 50 min resolución máxima
-- P4 (Baja):    30 min respuesta / 60 min (1 hora) resolución máxima
-- -----------------------------------------------------------------------------------------

DELETE FROM dbo.configuracion_sla;

INSERT INTO dbo.configuracion_sla (impacto, urgencia, prioridad_resultante, minutos_respuesta, minutos_resolucion)
VALUES
    ('ALTO',  'ALTA',  'CRITICA', 10, 30),
    ('ALTO',  'MEDIA', 'ALTA',    15, 45),
    ('ALTO',  'BAJA',  'MEDIA',   20, 50),
    ('MEDIO', 'ALTA',  'ALTA',    15, 45),
    ('MEDIO', 'MEDIA', 'MEDIA',   20, 50),
    ('MEDIO', 'BAJA',  'BAJA',    30, 60),
    ('BAJO',  'ALTA',  'MEDIA',   20, 50),
    ('BAJO',  'MEDIA', 'BAJA',    30, 60),
    ('BAJO',  'BAJA',  'BAJA',    30, 60);

-- -----------------------------------------------------------------------------------------
-- 2. POBLAR CATEGORÍAS ASISTENCIALES Y TECNOLÓGICAS DEL HSMSI (SIN DUPLICADOS)
-- Lista directa y limpia de categorías para el formulario de tickets asistenciales.
-- Se eliminan agrupadores redundantes para evitar duplicidades al seleccionar en pantalla.
-- -----------------------------------------------------------------------------------------

DELETE FROM dbo.categoria WHERE id_categoria_padre IS NOT NULL;
DELETE FROM dbo.categoria;

INSERT INTO dbo.categoria (nombre, id_categoria_padre) VALUES
    ('HIS-MINSA',                          NULL),
    ('Sistema Galenos',                    NULL),
    ('Microsoft Office (Word / Excel)',    NULL),
    ('Navegador Web (Google Chrome)',      NULL),
    ('Conectividad a Internet',            NULL),
    ('Computadora Asistencial (PC)',       NULL),
    ('Periféricos (Teclado / Mouse)',      NULL),
    ('Proyector Multimedia (Auditorio)',   NULL),
    ('Impresora Departamental (Grande)',   NULL),
    ('Impresora Pequeña / Térmica',        NULL),
    ('Recarga o Cambio de Tóner',          NULL);