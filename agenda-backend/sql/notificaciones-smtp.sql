USE agendaletric;

ALTER TABLE usuario
    ADD COLUMN token_version INT UNSIGNED NOT NULL DEFAULT 0;

ALTER TABLE reporte_tecnico_envio
    MODIFY COLUMN estado_envio ENUM(
        'SIMULADO',
        'PENDIENTE',
        'ENVIADO',
        'FALLIDO'
    ) NOT NULL DEFAULT 'SIMULADO',
    ADD COLUMN error_detalle TEXT NULL AFTER mensaje;

CREATE TABLE IF NOT EXISTS password_reset_token (
    id_token INT NOT NULL AUTO_INCREMENT,
    id_usuario INT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_token),
    UNIQUE KEY uq_password_reset_token_hash (token_hash),
    KEY idx_password_reset_user_expiry (id_usuario, expires_at),
    CONSTRAINT fk_password_reset_token_user
        FOREIGN KEY (id_usuario)
        REFERENCES usuario(id_usuario)
        ON DELETE CASCADE
) ENGINE=InnoDB;
