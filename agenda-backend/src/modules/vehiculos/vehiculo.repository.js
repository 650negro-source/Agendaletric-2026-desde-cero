const pool = require("../../config/database");

async function findClienteById(idCliente) {
  const [rows] = await pool.execute(
    `SELECT id_cliente
     FROM cliente
     WHERE id_cliente = ?
       AND estado = 1
       AND deleted_at IS NULL`,
    [idCliente]
  );

  return rows[0];
}

async function findClienteByUserId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT id_cliente
     FROM cliente
     WHERE id_usuario = ?
       AND estado = 1
       AND deleted_at IS NULL`,
    [idUsuario]
  );

  return rows[0];
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT id_vehiculo, placa, marca, modelo, anio, color, id_cliente
     FROM vehiculo
     ORDER BY id_vehiculo`
  );

  return rows;
}

async function findAllByClienteId(idCliente) {
  const [rows] = await pool.execute(
    `SELECT id_vehiculo, placa, marca, modelo, anio, color, id_cliente
     FROM vehiculo
     WHERE id_cliente = ?
     ORDER BY id_vehiculo`,
    [idCliente]
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id_vehiculo, placa, marca, modelo, anio, color, id_cliente
     FROM vehiculo
     WHERE id_vehiculo = ?`,
    [id]
  );

  return rows[0];
}

async function findByIdAndClienteId(id, idCliente) {
  const [rows] = await pool.execute(
    `SELECT id_vehiculo, placa, marca, modelo, anio, color, id_cliente
     FROM vehiculo
     WHERE id_vehiculo = ?
     AND id_cliente = ?`,
    [id, idCliente]
  );

  return rows[0];
}

async function create(vehiculo) {
  const { placa, marca, modelo, anio, color, id_cliente } = vehiculo;
  const [result] = await pool.execute(
    `INSERT INTO vehiculo (placa, marca, modelo, anio, color, id_cliente)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [placa, marca, modelo, anio, color, id_cliente]
  );

  return result.insertId;
}

async function update(id, vehiculo) {
  const { placa, marca, modelo, anio, color } = vehiculo;
  const [result] = await pool.execute(
    `UPDATE vehiculo
     SET placa = ?, marca = ?, modelo = ?, anio = ?, color = ?
     WHERE id_vehiculo = ?`,
    [placa, marca, modelo, anio, color, id]
  );

  return result.affectedRows;
}

module.exports = {
  findClienteById,
  findClienteByUserId,
  findAll,
  findAllByClienteId,
  findById,
  findByIdAndClienteId,
  create,
  update,
};
