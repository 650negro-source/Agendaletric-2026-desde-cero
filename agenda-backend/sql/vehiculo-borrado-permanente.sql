USE agendaletric;

ALTER TABLE cita
    MODIFY COLUMN id_vehiculo INT NULL,
    ADD COLUMN vehiculo_placa_historial VARCHAR(20) NULL AFTER id_vehiculo,
    ADD COLUMN vehiculo_marca_historial VARCHAR(50) NULL AFTER vehiculo_placa_historial,
    ADD COLUMN vehiculo_modelo_historial VARCHAR(50) NULL AFTER vehiculo_marca_historial,
    ADD COLUMN vehiculo_anio_historial INT NULL AFTER vehiculo_modelo_historial,
    ADD COLUMN vehiculo_color_historial VARCHAR(30) NULL AFTER vehiculo_anio_historial,
    ADD COLUMN vehiculo_tipo_historial VARCHAR(30) NULL AFTER vehiculo_color_historial,
    ADD COLUMN vehiculo_energia_historial VARCHAR(30) NULL AFTER vehiculo_tipo_historial;
