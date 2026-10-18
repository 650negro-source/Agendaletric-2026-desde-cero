USE agendaletric;

CREATE TABLE IF NOT EXISTS cita (
    id_cita INT NOT NULL AUTO_INCREMENT,
    codigo_asignacion CHAR(36) NOT NULL,
    id_cliente INT NOT NULL,
    id_vehiculo INT NOT NULL,
    id_usuario_tecnico INT NOT NULL,
    fecha_programada DATE NOT NULL,
    hora_programada TIME NOT NULL,
    estado ENUM(
        'BORRADOR',
        'PROGRAMADA',
        'VALIDADA',
        'EN_PROCESO',
        'ATENDIDA',
        'CANCELADA'
    ) NOT NULL DEFAULT 'PROGRAMADA',
    descripcion_averia TEXT NOT NULL,
    observaciones TEXT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    fecha_hora_activa DATETIME
        GENERATED ALWAYS AS (
            CASE
                WHEN estado IN ('BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO')
                THEN TIMESTAMP(fecha_programada, hora_programada)
                ELSE NULL
            END
        ) STORED,
    cliente_cita_activa INT
        GENERATED ALWAYS AS (
            CASE
                WHEN estado IN ('BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO')
                THEN id_cliente
                ELSE NULL
            END
        ) STORED,

    PRIMARY KEY (id_cita),
    UNIQUE KEY uq_cita_codigo_asignacion (codigo_asignacion),
    UNIQUE KEY uq_cita_tecnico_hora_activa (id_usuario_tecnico, fecha_hora_activa),
    UNIQUE KEY uq_cita_cliente_activa (cliente_cita_activa),
    KEY idx_cita_fecha_hora_estado (fecha_programada, hora_programada, estado),
    KEY idx_cita_vehiculo (id_vehiculo),
    CONSTRAINT fk_agendaletric_cita_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON DELETE RESTRICT,
    CONSTRAINT fk_agendaletric_cita_vehiculo
        FOREIGN KEY (id_vehiculo)
        REFERENCES vehiculo(id_vehiculo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_agendaletric_cita_tecnico
        FOREIGN KEY (id_usuario_tecnico)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cita_historial (
    id_historial INT NOT NULL AUTO_INCREMENT,
    id_cita INT NOT NULL,
    id_usuario_actor INT NOT NULL,
    accion VARCHAR(30) NOT NULL,
    estado_anterior VARCHAR(20) NULL,
    estado_nuevo VARCHAR(20) NULL,
    detalle TEXT NULL,
    fecha_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id_historial),
    KEY idx_historial_cita_fecha (id_cita, fecha_evento),
    CONSTRAINT fk_agendaletric_historial_cita
        FOREIGN KEY (id_cita)
        REFERENCES cita(id_cita)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_agendaletric_historial_usuario
        FOREIGN KEY (id_usuario_actor)
        REFERENCES usuario(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recordatorio (
    id_recordatorio INT NOT NULL AUTO_INCREMENT,
    id_cita INT NOT NULL,
    medio_envio ENUM('CORREO', 'SMS') NOT NULL,
    fecha_programada DATETIME NOT NULL,
    fecha_envio DATETIME NULL,
    mensaje TEXT NOT NULL,
    estado_envio ENUM('PENDIENTE', 'SIMULADO', 'CANCELADO', 'ENVIADO', 'FALLIDO')
        NOT NULL DEFAULT 'PENDIENTE',

    PRIMARY KEY (id_recordatorio),
    KEY idx_recordatorio_cita (id_cita),
    KEY idx_recordatorio_estado_fecha (estado_envio, fecha_programada),
    CONSTRAINT fk_agendaletric_recordatorio_cita
        FOREIGN KEY (id_cita)
        REFERENCES cita(id_cita)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;
