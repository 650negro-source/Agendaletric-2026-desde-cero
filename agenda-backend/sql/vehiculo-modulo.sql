USE agendaletric;

UPDATE vehiculo
SET placa = UPPER(TRIM(placa));

ALTER TABLE vehiculo
    ADD COLUMN tipo_vehiculo
        ENUM('AUTOMOVIL', 'CAMIONETA', 'CAMION', 'OTRO') NULL
        AFTER color,
    ADD COLUMN tipo_energia
        ENUM('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO') NULL
        AFTER tipo_vehiculo,
    ADD COLUMN estado TINYINT(1) NOT NULL DEFAULT 1
        AFTER tipo_energia,
    ADD UNIQUE KEY uq_vehiculo_placa (placa);
