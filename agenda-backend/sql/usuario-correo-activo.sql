USE agendaletric;

ALTER TABLE usuario
    DROP INDEX correo,
    ADD COLUMN correo_activo VARCHAR(150)
        GENERATED ALWAYS AS (
            CASE WHEN deleted_at IS NULL THEN correo ELSE NULL END
        ) STORED,
    ADD UNIQUE KEY uq_usuario_correo_activo (correo_activo);
