-- =============================================================================
-- Migración V1_4: Módulo 2 — Centro de Soluciones y Guías (KEDB)
-- Base de datos: SQL Server
-- =============================================================================

BEGIN TRANSACTION;

-- 1. Ampliación de la tabla existente error_conocido ---------------------------
IF COL_LENGTH('dbo.error_conocido', 'categoria') IS NULL
    ALTER TABLE dbo.error_conocido ADD categoria VARCHAR(30) NOT NULL CONSTRAINT DF_ec_categoria DEFAULT ('SOFTWARE_ASISTENCIAL');

IF COL_LENGTH('dbo.error_conocido', 'ambito') IS NULL
    ALTER TABLE dbo.error_conocido ADD ambito VARCHAR(30) NOT NULL CONSTRAINT DF_ec_ambito DEFAULT ('PUBLICO_ASISTENCIAL');

IF COL_LENGTH('dbo.error_conocido', 'sintoma') IS NULL
    ALTER TABLE dbo.error_conocido ADD sintoma NVARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'causa_raiz') IS NULL
    ALTER TABLE dbo.error_conocido ADD causa_raiz NVARCHAR(1000) NULL;

IF COL_LENGTH('dbo.error_conocido', 'nivel_dificultad') IS NULL
    ALTER TABLE dbo.error_conocido ADD nivel_dificultad VARCHAR(20) NOT NULL CONSTRAINT DF_ec_dificultad DEFAULT ('BASICO');

IF COL_LENGTH('dbo.error_conocido', 'minutos_estimados') IS NULL
    ALTER TABLE dbo.error_conocido ADD minutos_estimados INT NULL;

IF COL_LENGTH('dbo.error_conocido', 'requiere_tecnico') IS NULL
    ALTER TABLE dbo.error_conocido ADD requiere_tecnico BIT NOT NULL CONSTRAINT DF_ec_req_tec DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'palabras_clave') IS NULL
    ALTER TABLE dbo.error_conocido ADD palabras_clave VARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'equipos_compatibles') IS NULL
    ALTER TABLE dbo.error_conocido ADD equipos_compatibles VARCHAR(500) NULL;

IF COL_LENGTH('dbo.error_conocido', 'conteo_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_util INT NOT NULL CONSTRAINT DF_ec_c_util DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'conteo_no_util') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_no_util INT NOT NULL CONSTRAINT DF_ec_c_noutil DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'conteo_visitas') IS NULL
    ALTER TABLE dbo.error_conocido ADD conteo_visitas INT NOT NULL CONSTRAINT DF_ec_c_visitas DEFAULT (0);

IF COL_LENGTH('dbo.error_conocido', 'id_autor') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD id_autor INT NULL;
    ALTER TABLE dbo.error_conocido ADD CONSTRAINT FK_ec_autor FOREIGN KEY (id_autor) REFERENCES dbo.usuario(id_usuario);
END;

IF COL_LENGTH('dbo.error_conocido', 'fecha_actualizacion') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD fecha_actualizacion DATETIME2(0) NOT NULL CONSTRAINT DF_ec_f_act DEFAULT (GETDATE());
END;

IF COL_LENGTH('dbo.error_conocido', 'texto_busqueda') IS NULL
BEGIN
    ALTER TABLE dbo.error_conocido ADD texto_busqueda NVARCHAR(1000) NOT NULL CONSTRAINT DF_ec_t_busq DEFAULT ('');
END;

-- 2. Nuevas tablas secundarias de guías ----------------------------------------
IF OBJECT_ID('dbo.guia_precaucion', 'U') IS NULL
    CREATE TABLE dbo.guia_precaucion (
        id_error   INT           NOT NULL,
        orden      INT           NOT NULL,
        precaucion NVARCHAR(300) NOT NULL,
        CONSTRAINT PK_guia_precaucion PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_gp_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_paso', 'U') IS NULL
    CREATE TABLE dbo.guia_paso (
        id_error    INT           NOT NULL,
        orden       INT           NOT NULL,
        descripcion NVARCHAR(500) NOT NULL,
        advertencia NVARCHAR(300) NULL,
        CONSTRAINT PK_guia_paso PRIMARY KEY (id_error, orden),
        CONSTRAINT FK_gpaso_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE
    );

IF OBJECT_ID('dbo.guia_voto', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.guia_voto (
        id_voto    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_guia_voto PRIMARY KEY,
        id_error   INT               NOT NULL,
        id_usuario INT               NOT NULL,
        es_util    BIT               NOT NULL,
        fecha      DATETIME2(0)      NOT NULL,
        CONSTRAINT UQ_guia_voto_usuario UNIQUE (id_error, id_usuario),
        CONSTRAINT FK_gv_error FOREIGN KEY (id_error) REFERENCES dbo.error_conocido(id_error) ON DELETE CASCADE,
        CONSTRAINT FK_gv_usuario FOREIGN KEY (id_usuario) REFERENCES dbo.usuario(id_usuario)
    );
    CREATE INDEX IX_gv_error ON dbo.guia_voto (id_error);
END;

COMMIT TRANSACTION;
