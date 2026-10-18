USE agendaletric;

CREATE TABLE IF NOT EXISTS tipo_averia (
    id_tipo_averia INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1,

    PRIMARY KEY (id_tipo_averia),
    UNIQUE KEY uq_tipo_averia_nombre (nombre)
) ENGINE=InnoDB;

ALTER TABLE cita
    ADD COLUMN id_tipo_averia INT NULL,
    ADD COLUMN tipo_averia_nombre VARCHAR(100) NULL,
    ADD KEY idx_cita_tipo_averia (id_tipo_averia),
    ADD CONSTRAINT fk_agendaletric_cita_tipo_averia
        FOREIGN KEY (id_tipo_averia)
        REFERENCES tipo_averia(id_tipo_averia)
        ON DELETE RESTRICT;
