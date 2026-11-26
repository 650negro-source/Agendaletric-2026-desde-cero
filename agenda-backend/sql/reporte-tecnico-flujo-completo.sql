USE agendaletric;

ALTER TABLE reporte_tecnico
    ADD COLUMN estado_publicacion ENUM(
        'BORRADOR',
        'PUBLICADO',
        'REQUIERE_CORRECCION'
    ) NOT NULL DEFAULT 'BORRADOR',
    ADD COLUMN fecha_publicacion DATETIME NULL,
    ADD COLUMN comentario_admin TEXT NULL;

CREATE TABLE IF NOT EXISTS reporte_tecnico_archivo (
    id_archivo INT NOT NULL AUTO_INCREMENT,
    id_reporte INT NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(40) NOT NULL,
    tipo_mime ENUM('image/jpeg', 'video/mp4') NOT NULL,
    tamano_bytes BIGINT UNSIGNED NOT NULL,
    fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_archivo),
    UNIQUE KEY uq_reporte_tecnico_archivo_nombre (nombre_archivo),
    KEY idx_reporte_tecnico_archivo_reporte (id_reporte),
    CONSTRAINT fk_reporte_tecnico_archivo_reporte
        FOREIGN KEY (id_reporte)
        REFERENCES reporte_tecnico(id_reporte)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reporte_tecnico_envio (
    id_envio INT NOT NULL AUTO_INCREMENT,
    id_reporte INT NOT NULL,
    id_usuario_actor INT NOT NULL,
    id_usuario_destino INT NOT NULL,
    tipo_evento ENUM(
        'PUBLICACION_CLIENTE',
        'SOLICITUD_CORRECCION_TECNICO'
    ) NOT NULL,
    correo_destino VARCHAR(150) NOT NULL,
    telefono_destino VARCHAR(20) NULL,
    medio_envio ENUM('CORREO', 'WHATSAPP') NOT NULL DEFAULT 'CORREO',
    estado_envio ENUM('SIMULADO') NOT NULL DEFAULT 'SIMULADO',
    mensaje TEXT NOT NULL,
    fecha_envio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_envio),
    KEY idx_reporte_tecnico_envio_reporte_fecha (id_reporte, fecha_envio),
    CONSTRAINT fk_reporte_tecnico_envio_reporte
        FOREIGN KEY (id_reporte)
        REFERENCES reporte_tecnico(id_reporte)
        ON DELETE CASCADE,
    CONSTRAINT fk_reporte_tecnico_envio_actor
        FOREIGN KEY (id_usuario_actor)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT,
    CONSTRAINT fk_reporte_tecnico_envio_destino
        FOREIGN KEY (id_usuario_destino)
        REFERENCES usuario(id_usuario)
        ON DELETE RESTRICT
) ENGINE=InnoDB;
