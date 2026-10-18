USE agendaletric;

CREATE TABLE IF NOT EXISTS reporte_tecnico (
    id_reporte INT NOT NULL AUTO_INCREMENT,
    id_cita INT NOT NULL,
    fecha_reporte DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    diagnostico TEXT NOT NULL,
    procedimiento_realizado TEXT NOT NULL,
    observaciones TEXT NULL,

    PRIMARY KEY (id_reporte),
    UNIQUE KEY uq_reporte_tecnico_cita (id_cita),
    CONSTRAINT fk_agendaletric_reporte_tecnico_cita
        FOREIGN KEY (id_cita)
        REFERENCES cita(id_cita)
        ON DELETE CASCADE
) ENGINE=InnoDB;
