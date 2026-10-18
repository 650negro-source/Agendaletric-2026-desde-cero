USE agendaletric;

CREATE TABLE IF NOT EXISTS tipo_servicio (
    id_tipo_servicio INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estado TINYINT NOT NULL DEFAULT 1,
    requiere_detalle TINYINT NOT NULL DEFAULT 0,

    PRIMARY KEY (id_tipo_servicio),
    UNIQUE KEY uq_tipo_servicio_nombre (nombre)
) ENGINE=InnoDB;

INSERT INTO tipo_servicio (nombre, descripcion, requiere_detalle)
VALUES
    ('Mantenimiento preventivo', 'Revisión preventiva del sistema eléctrico y electrónico del vehículo.', 0),
    ('Revisión del sistema eléctrico', 'Diagnóstico de componentes y circuitos eléctricos.', 0),
    ('Revisión del sistema electrónico', 'Diagnóstico de componentes y sistemas electrónicos.', 0),
    ('Reparación de alternador', 'Revisión y reparación del sistema de carga y alternador.', 0),
    ('Reparación del sistema de arranque', 'Revisión y reparación del motor y sistema de arranque.', 0),
    ('Revisión de batería', 'Comprobación del estado y funcionamiento de la batería.', 0),
    ('Cambio de batería', 'Reemplazo de la batería del vehículo.', 0),
    ('Cambio de bombillería', 'Revisión y reemplazo de bombillas del vehículo.', 0),
    ('Revisión de sensores', 'Diagnóstico de sensores y sus conexiones.', 0),
    ('Instalación de componentes eléctricos o electrónicos', 'Instalación de componentes eléctricos o electrónicos solicitados.', 0),
    ('Otro servicio', 'El cliente debe especificar el servicio que necesita.', 1);

ALTER TABLE cita
    ADD COLUMN id_tipo_servicio INT NULL,
    ADD COLUMN tipo_servicio_nombre VARCHAR(100) NULL,
    ADD COLUMN detalle_servicio TEXT NULL,
    ADD KEY idx_cita_tipo_servicio (id_tipo_servicio),
    ADD CONSTRAINT fk_agendaletric_cita_tipo_servicio
        FOREIGN KEY (id_tipo_servicio)
        REFERENCES tipo_servicio(id_tipo_servicio)
        ON DELETE RESTRICT;
