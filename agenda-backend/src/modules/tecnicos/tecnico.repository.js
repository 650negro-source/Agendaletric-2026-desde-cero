const pool = require("../../config/database");

async function findEligibleUser(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT u.id_usuario
     FROM usuario u
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE u.id_usuario = ?
       AND u.deleted_at IS NULL
       AND r.nombre = ?`,
    [idUsuario, "TECHNICIAN"]
  );

  return rows[0];
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT
       t.id_usuario,
       u.nombre,
       u.correo,
       u.estado,
       t.especialidad,
       t.telefono
     FROM tecnico t
     INNER JOIN usuario u ON u.id_usuario = t.id_usuario
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE u.deleted_at IS NULL
       AND r.nombre = ?
     ORDER BY t.id_usuario`,
    ["TECHNICIAN"]
  );

  return rows;
}

async function findById(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT
       t.id_usuario,
       u.nombre,
       u.correo,
       u.estado,
       t.especialidad,
       t.telefono
     FROM tecnico t
     INNER JOIN usuario u ON u.id_usuario = t.id_usuario
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE t.id_usuario = ?
       AND u.deleted_at IS NULL
       AND r.nombre = ?`,
    [idUsuario, "TECHNICIAN"]
  );

  return rows[0];
}

async function create(tecnico) {
  const [result] = await pool.execute(
    `INSERT INTO tecnico (id_usuario, especialidad, telefono)
     VALUES (?, ?, ?)`,
    [tecnico.id_usuario, tecnico.especialidad, tecnico.telefono]
  );

  return result.affectedRows;
}

async function update(idUsuario, tecnico) {
  const [result] = await pool.execute(
    `UPDATE tecnico
     SET especialidad = ?, telefono = ?
     WHERE id_usuario = ?`,
    [tecnico.especialidad, tecnico.telefono, idUsuario]
  );

  return result.affectedRows;
}

module.exports = {
  findEligibleUser,
  findAll,
  findById,
  create,
  update,
};
