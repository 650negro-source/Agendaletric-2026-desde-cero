const pool = require("../../config/database");

async function findAll(includeInactive) {
  const [rows] = await pool.execute(
    `SELECT id_tipo_servicio, nombre, descripcion, estado, requiere_detalle,
            duracion_minutos
     FROM tipo_servicio
     WHERE (? = 1 OR estado = 1)
     ORDER BY nombre`,
    [includeInactive ? 1 : 0]
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT id_tipo_servicio, nombre, descripcion, estado, requiere_detalle,
            duracion_minutos
     FROM tipo_servicio
     WHERE id_tipo_servicio = ?`,
    [id]
  );

  return rows[0];
}

async function create(tipoServicio) {
  const [result] = await pool.execute(
    `INSERT INTO tipo_servicio
       (nombre, descripcion, requiere_detalle, duracion_minutos)
     VALUES (?, ?, ?, ?)`,
    [
      tipoServicio.nombre,
      tipoServicio.descripcion,
      tipoServicio.requiere_detalle,
      tipoServicio.duracion_minutos,
    ]
  );

  return result.insertId;
}

async function update(id, tipoServicio) {
  const [result] = await pool.execute(
    `UPDATE tipo_servicio
     SET nombre = ?, descripcion = ?, requiere_detalle = ?, duracion_minutos = ?
     WHERE id_tipo_servicio = ?`,
    [
      tipoServicio.nombre,
      tipoServicio.descripcion,
      tipoServicio.requiere_detalle,
      tipoServicio.duracion_minutos,
      id,
    ]
  );

  return result.affectedRows;
}

async function updateEstado(id, estado) {
  const [result] = await pool.execute(
    `UPDATE tipo_servicio
     SET estado = ?
     WHERE id_tipo_servicio = ?`,
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
