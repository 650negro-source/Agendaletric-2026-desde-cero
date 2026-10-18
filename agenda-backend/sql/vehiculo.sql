USE agendaletric;

CREATE TABLE IF NOT EXISTS vehiculo (
    id_vehiculo INT NOT NULL AUTO_INCREMENT,
    placa VARCHAR(20) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    anio INT NOT NULL,
    color VARCHAR(30) NOT NULL,
    id_cliente INT NOT NULL,

    PRIMARY KEY (id_vehiculo),
    KEY idx_vehiculo_cliente (id_cliente),
    CONSTRAINT fk_vehiculo_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente(id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;
