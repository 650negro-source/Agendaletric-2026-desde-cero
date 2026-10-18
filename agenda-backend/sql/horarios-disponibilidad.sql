USE agendaletric;

CREATE TABLE IF NOT EXISTS horario_tecnico (
    id_horario INT NOT NULL AUTO_INCREMENT,
    id_usuario_tecnico INT NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL
        COMMENT 'Convencion ISO: 1 lunes, 7 domingo',
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,

    PRIMARY KEY (id_horario),
    KEY idx_horario_tecnico_dia_hora
        (id_usuario_tecnico, dia_semana, hora_inicio, hora_fin),
    CONSTRAINT fk_horario_tecnico_usuario
        FOREIGN KEY (id_usuario_tecnico)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;
