USE agendaletric;

ALTER TABLE tipo_servicio
    ADD COLUMN duracion_minutos INT NULL
        AFTER requiere_detalle;

ALTER TABLE cita
    ADD COLUMN duracion_minutos INT NULL
        AFTER hora_programada;
