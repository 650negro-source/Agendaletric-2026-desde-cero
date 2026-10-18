USE agendaletric;

CREATE TABLE IF NOT EXISTS cliente (
    id_cliente INT NOT NULL AUTO_INCREMENT,
    documento_identidad VARCHAR(50) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion VARCHAR(150) NULL,
    id_usuario INT NOT NULL,
    estado TINYINT NOT NULL DEFAULT 1,
    deleted_at DATETIME NULL,
    documento_identidad_activo VARCHAR(50)
        GENERATED ALWAYS AS (
            CASE WHEN deleted_at IS NULL THEN documento_identidad ELSE NULL END
        ) STORED,

    PRIMARY KEY (id_cliente),
    UNIQUE KEY uq_cliente_documento_identidad_activo (documento_identidad_activo),
    UNIQUE KEY uq_cliente_usuario (id_usuario),
    KEY idx_cliente_estado_deleted (estado, deleted_at),
    CONSTRAINT fk_cliente_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;
