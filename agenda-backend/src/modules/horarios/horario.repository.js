const pool = require("../../config/database");

async function findActiveTechnician(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario
     FROM usuario u
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE u.id_usuario = ?
       AND u.estado = 1
       AND u.deleted_at IS NULL
       AND r.nombre = ?`,
    [idUsuario, "TECHNICIAN"]
  );

  return rows[0];
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT
       h.id_horario,
       h.id_usuario_tecnico,
       u.nombre AS nombre_tecnico,
       h.dia_semana,
       h.hora_inicio,
       h.hora_fin
     FROM horario_tecnico h
     INNER JOIN usuario u ON u.id_usuario = h.id_usuario_tecnico
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE u.deleted_at IS NULL
       AND r.nombre = ?
     ORDER BY h.id_usuario_tecnico, h.dia_semana, h.hora_inicio`,
    ["TECHNICIAN"]
  );

  return rows;
}

async function findAllByTechnicianId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT id_horario, id_usuario_tecnico, dia_semana, hora_inicio, hora_fin
     FROM horario_tecnico
     WHERE id_usuario_tecnico = ?
     ORDER BY dia_semana, hora_inicio`,
    [idUsuario]
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
       h.id_horario,
       h.id_usuario_tecnico,
       u.nombre AS nombre_tecnico,
       h.dia_semana,
       h.hora_inicio,
       h.hora_fin
     FROM horario_tecnico h
     INNER JOIN usuario u ON u.id_usuario = h.id_usuario_tecnico
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE h.id_horario = ?
       AND u.deleted_at IS NULL
       AND r.nombre = ?`,
    [id, "TECHNICIAN"]
  );

  return rows[0];
}

async function create(horario) {
  const { id_usuario_tecnico, dia_semana, hora_inicio, hora_fin } = horario;
  const [result] = await pool.execute(
    `INSERT INTO horario_tecnico
       (id_usuario_tecnico, dia_semana, hora_inicio, hora_fin)
     VALUES (?, ?, ?, ?)`,
    [id_usuario_tecnico, dia_semana, hora_inicio, hora_fin]
  );

  return result.insertId;
}

async function update(id, horario) {
  const { dia_semana, hora_inicio, hora_fin } = horario;
  const [result] = await pool.execute(
    `UPDATE horario_tecnico
     SET dia_semana = ?, hora_inicio = ?, hora_fin = ?
     WHERE id_horario = ?`,
    [dia_semana, hora_inicio, hora_fin, id]
  );

  return result.affectedRows;
}

async function remove(id) {
  const [result] = await pool.execute(
    `DELETE FROM horario_tecnico
     WHERE id_horario = ?`,
    [id]
  );

  return result.affectedRows;
}

module.exports = {
  findActiveTechnician,
  findAll,
  findAllByTechnicianId,
  findById,
  create,
  update,
  remove,
};
