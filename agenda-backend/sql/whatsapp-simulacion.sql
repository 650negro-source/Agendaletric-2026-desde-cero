USE agendaletric;

ALTER TABLE cliente
    ADD COLUMN preferencia_notificacion ENUM('CORREO', 'WHATSAPP')
        NOT NULL DEFAULT 'CORREO'
        AFTER telefono;

ALTER TABLE recordatorio
    MODIFY COLUMN medio_envio ENUM('CORREO', 'WHATSAPP', 'SMS') NOT NULL;

ALTER TABLE reporte_tecnico_envio
    MODIFY COLUMN medio_envio ENUM('CORREO', 'WHATSAPP') NOT NULL DEFAULT 'CORREO',
    ADD COLUMN telefono_destino VARCHAR(20) NULL AFTER correo_destino;
