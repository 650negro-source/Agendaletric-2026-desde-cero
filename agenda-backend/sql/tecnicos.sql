USE agendaletric;

CREATE TABLE IF NOT EXISTS tecnico (
    id_usuario INT NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    telefono VARCHAR(30) NOT NULL,

    PRIMARY KEY (id_usuario),
    CONSTRAINT fk_agendaletric_tecnico_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
