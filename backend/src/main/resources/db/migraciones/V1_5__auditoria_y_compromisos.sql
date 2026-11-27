-- =============================================================================
-- Migración V1_5: Auditoría ampliada y Monitor de Compromisos de Atención (SLA)
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Ampliación de historial_ticket (Fase 0/5) ----------------------------------
IF COL_LENGTH('dbo.historial_ticket', 'estado_anterior') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_anterior VARCHAR(30) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'estado_nuevo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD estado_nuevo VARCHAR(30) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'motivo') IS NULL
    ALTER TABLE dbo.historial_ticket ADD motivo NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.historial_ticket', 'ip_origen') IS NULL
    ALTER TABLE dbo.historial_ticket ADD ip_origen VARCHAR(45) NULL;

-- 2. Normalización de estado_sla en tickets activos ----------------------------
UPDATE dbo.ticket
SET estado_sla = 'DENTRO_TIEMPO'
WHERE estado_sla IS NULL AND estado IN ('ABIERTO', 'EN_PROGRESO', 'ESCALADO');

-- 3. Índices optimizados para el monitor ---------------------------------------
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ticket_monitor_sla' AND object_id = OBJECT_ID('dbo.ticket'))
    CREATE NONCLUSTERED INDEX IX_ticket_monitor_sla
    ON dbo.ticket (estado, fecha_limite_resolucion)
    INCLUDE (estado_sla, fecha_creacion);

COMMIT TRANSACTION;
