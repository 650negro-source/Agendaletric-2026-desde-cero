const pool = require("../../config/database");

async function findAll(includeInactive) {
  const [rows] = await pool.execute(
    `SELECT id_tipo_averia, nombre, estado
     FROM tipo_averia
     WHERE (? = 1 OR estado = 1)
     ORDER BY nombre`,
    [includeInactive ? 1 : 0]
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id_tipo_averia, nombre, estado
     FROM tipo_averia
     WHERE id_tipo_averia = ?`,
    [id]
  );

  return rows[0];
}

async function create(nombre) {
  const [result] = await pool.execute(
    `INSERT INTO tipo_averia (nombre)
     VALUES (?)`,
    [nombre]
  );

  return result.insertId;
}

async function update(id, nombre) {
  const [result] = await pool.execute(
    `UPDATE tipo_averia
     SET nombre = ?
     WHERE id_tipo_averia = ?`,
    [nombre, id]
  );

  return result.affectedRows;
}

async function updateEstado(id, estado) {
  const [result] = await pool.execute(
    `UPDATE tipo_averia
     SET estado = ?
     WHERE id_tipo_averia = ?`,
    [estado, id]
  );

  return result.affectedRows;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateEstado,
};
