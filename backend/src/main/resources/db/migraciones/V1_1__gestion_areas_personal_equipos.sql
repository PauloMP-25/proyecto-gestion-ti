-- ============================================================================
-- Migración SQL Server: V1.1 Gestión de Áreas Hospitalarias, Personal y Equipos
-- Hospital Santa María del Socorro (HSMSI)
-- Idempotente y seguro para ejecución repetida.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Actualización de tabla [area]
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.area', 'piso') IS NULL
BEGIN
    ALTER TABLE dbo.area ADD piso VARCHAR(30) NULL;
END;

IF COL_LENGTH('dbo.area', 'referencia_ubicacion') IS NULL
BEGIN
    ALTER TABLE dbo.area ADD referencia_ubicacion VARCHAR(150) NULL;
END;

IF COL_LENGTH('dbo.area', 'anexo') IS NULL
BEGIN
    ALTER TABLE dbo.area ADD anexo VARCHAR(20) NULL;
END;

IF COL_LENGTH('dbo.area', 'id_encargado') IS NULL
BEGIN
    ALTER TABLE dbo.area ADD id_encargado INT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_area_encargado')
    BEGIN
        ALTER TABLE dbo.area ADD CONSTRAINT FK_area_encargado
            FOREIGN KEY (id_encargado) REFERENCES dbo.usuario(id_usuario);
    END;
END;

IF COL_LENGTH('dbo.area', 'activo') IS NULL
BEGIN
    ALTER TABLE dbo.area ADD activo BIT NOT NULL CONSTRAINT DF_area_activo DEFAULT 1;
END;

-- Eliminar columnas obsoletas si existieran
IF COL_LENGTH('dbo.area', 'codigo') IS NOT NULL
BEGIN
    ALTER TABLE dbo.area DROP COLUMN codigo;
END;

IF COL_LENGTH('dbo.area', 'pabellon') IS NOT NULL
BEGIN
    ALTER TABLE dbo.area DROP COLUMN pabellon;
END;

IF COL_LENGTH('dbo.area', 'segmento_red') IS NOT NULL
BEGIN
    ALTER TABLE dbo.area DROP COLUMN segmento_red;
END;

-- ----------------------------------------------------------------------------
-- 2. Actualización de tabla [usuario]
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.usuario', 'grado_profesional') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD grado_profesional VARCHAR(20) NULL CONSTRAINT DF_usuario_grado DEFAULT 'SIN_GRADO';
END;

IF COL_LENGTH('dbo.usuario', 'nombre_usuario') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD nombre_usuario VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_usuario_nombre_usuario' AND object_id = OBJECT_ID('dbo.usuario'))
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_usuario_nombre_usuario
            ON dbo.usuario(nombre_usuario)
            WHERE nombre_usuario IS NOT NULL;
    END;
END;

IF COL_LENGTH('dbo.usuario', 'debe_cambiar_contrasena') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD debe_cambiar_contrasena BIT NOT NULL CONSTRAINT DF_usuario_debe_cambiar DEFAULT 0;
END;

IF COL_LENGTH('dbo.usuario', 'intentos_fallidos') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD intentos_fallidos INT NOT NULL CONSTRAINT DF_usuario_intentos DEFAULT 0;
END;

IF COL_LENGTH('dbo.usuario', 'bloqueado_hasta') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD bloqueado_hasta DATETIME2(0) NULL;
END;

IF COL_LENGTH('dbo.usuario', 'ultimo_acceso') IS NULL
BEGIN
    ALTER TABLE dbo.usuario ADD ultimo_acceso DATETIME2(0) NULL;
END;

-- ----------------------------------------------------------------------------
-- 3. Actualización de tabla [elemento_configuracion]
-- ----------------------------------------------------------------------------
IF COL_LENGTH('dbo.elemento_configuracion', 'codigo_inventario') IS NULL
BEGIN
    ALTER TABLE dbo.elemento_configuracion ADD codigo_inventario VARCHAR(30) NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_ci_codigo_inventario' AND object_id = OBJECT_ID('dbo.elemento_configuracion'))
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_ci_codigo_inventario
            ON dbo.elemento_configuracion(codigo_inventario)
            WHERE codigo_inventario IS NOT NULL;
    END;
END;

IF COL_LENGTH('dbo.elemento_configuracion', 'marca_modelo') IS NULL
BEGIN
    ALTER TABLE dbo.elemento_configuracion ADD marca_modelo VARCHAR(100) NULL;
END;

IF COL_LENGTH('dbo.elemento_configuracion', 'referencia_ubicacion') IS NULL
BEGIN
    ALTER TABLE dbo.elemento_configuracion ADD referencia_ubicacion VARCHAR(150) NULL;
END;
