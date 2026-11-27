-- =============================================================================
-- Migración V1_3: Módulo 1 — Solicitudes de Cambio Técnico y Correlativo
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Correlativo ---------------------------------------------------------------
IF OBJECT_ID('dbo.correlativo_documento', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.correlativo_documento (
        clave  VARCHAR(30) NOT NULL CONSTRAINT PK_correlativo_documento PRIMARY KEY,
        ultimo INT         NOT NULL
    );
    -- Semilla inicial para el año actual
    INSERT INTO dbo.correlativo_documento (clave, ultimo) VALUES ('SC-2026', 0);
END;

-- 2. Solicitud de Cambio -------------------------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.solicitud_cambio (
        id_solicitud_cambio   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_solicitud_cambio PRIMARY KEY,
        codigo                VARCHAR(20)       NOT NULL CONSTRAINT UQ_solicitud_cambio_codigo UNIQUE,
        titulo                NVARCHAR(120)     NOT NULL,
        tipo                  VARCHAR(20)       NOT NULL,
        categoria             VARCHAR(30)       NOT NULL,
        descripcion           NVARCHAR(MAX)     NOT NULL,
        justificacion         NVARCHAR(MAX)     NOT NULL,
        impacto               VARCHAR(20)       NOT NULL,
        riesgo                VARCHAR(20)       NOT NULL,
        requiere_interrupcion BIT               NOT NULL,
        minutos_interrupcion  INT               NULL,
        pacientes_afectados   NVARCHAR(500)     NULL,
        descripcion_impacto   NVARCHAR(2000)    NOT NULL,
        criterio_reversa      NVARCHAR(500)     NOT NULL,
        minutos_reversa       INT               NOT NULL,
        plan_continuidad      NVARCHAR(1000)    NULL,
        responsable_reversa   NVARCHAR(120)     NOT NULL,
        responsable_ejecucion NVARCHAR(120)     NULL,
        horario_inicio        DATETIME2(0)      NULL,
        horario_fin           DATETIME2(0)      NULL,
        fecha_inicio_real     DATETIME2(0)      NULL,
        fecha_fin_real        DATETIME2(0)      NULL,
        id_ticket_origen      INT               NULL,
        id_solicitante        INT               NOT NULL,
        id_aprobador          INT               NULL,
        fecha_decision        DATETIME2(0)      NULL,
        observacion_decision  NVARCHAR(1000)    NULL,
        resultado_implementacion NVARCHAR(2000) NULL,
        estado                VARCHAR(20)       NOT NULL,
        texto_busqueda        NVARCHAR(1000)    NOT NULL,
        fecha_registro        DATETIME2(0)      NOT NULL,
        fecha_actualizacion   DATETIME2(0)      NOT NULL,
        version               BIGINT            NOT NULL CONSTRAINT DF_sc_version DEFAULT (0),
        CONSTRAINT FK_sc_ticket_origen FOREIGN KEY (id_ticket_origen) REFERENCES dbo.ticket(id_ticket),
        CONSTRAINT FK_sc_solicitante FOREIGN KEY (id_solicitante) REFERENCES dbo.usuario(id_usuario),
        CONSTRAINT FK_sc_aprobador FOREIGN KEY (id_aprobador) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_sc_estado_fecha ON dbo.solicitud_cambio (estado, fecha_registro DESC);
END;

-- 3. Tablas relacionales y colecciones ----------------------------------------
IF OBJECT_ID('dbo.solicitud_cambio_area', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_area (
        id_solicitud_cambio INT NOT NULL,
        id_area             INT NOT NULL,
        CONSTRAINT PK_solicitud_cambio_area PRIMARY KEY (id_solicitud_cambio, id_area),
        CONSTRAINT FK_sca_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_sca_area FOREIGN KEY (id_area) REFERENCES dbo.area(id_area)
    );

IF OBJECT_ID('dbo.solicitud_cambio_servicio', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_servicio (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        nombre_servicio     NVARCHAR(150) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_servicio PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scs_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_equipo', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_equipo (
        id_solicitud_cambio INT         NOT NULL,
        orden               INT         NOT NULL,
        codigo_inventario   VARCHAR(30) NOT NULL,
        CONSTRAINT PK_solicitud_cambio_equipo PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_sce_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_implementacion', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_implementacion (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_impl PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpi_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.solicitud_cambio_paso_reversa', 'U') IS NULL
    CREATE TABLE dbo.solicitud_cambio_paso_reversa (
        id_solicitud_cambio INT           NOT NULL,
        orden               INT           NOT NULL,
        descripcion         NVARCHAR(500) NOT NULL,
        responsable         NVARCHAR(120) NULL,
        minutos_estimados   INT           NULL,
        CONSTRAINT PK_sc_paso_rev PRIMARY KEY (id_solicitud_cambio, orden),
        CONSTRAINT FK_scpr_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE
    );

-- 4. Historial -----------------------------------------------------------------
IF OBJECT_ID('dbo.historial_solicitud_cambio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.historial_solicitud_cambio (
        id_historial_cambio INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_historial_solicitud_cambio PRIMARY KEY,
        id_solicitud_cambio INT            NOT NULL,
        id_usuario          INT            NOT NULL,
        accion              VARCHAR(30)    NOT NULL,
        estado_anterior     VARCHAR(20)    NULL,
        estado_nuevo        VARCHAR(20)    NOT NULL,
        observacion         NVARCHAR(1000) NULL,
        ip_origen           VARCHAR(45)    NULL,
        fecha               DATETIME2(0)   NOT NULL,
        CONSTRAINT FK_hsc_solicitud FOREIGN KEY (id_solicitud_cambio)
            REFERENCES dbo.solicitud_cambio(id_solicitud_cambio) ON DELETE CASCADE,
        CONSTRAINT FK_hsc_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_hsc_solicitud ON dbo.historial_solicitud_cambio (id_solicitud_cambio, fecha);
END;

COMMIT TRANSACTION;
