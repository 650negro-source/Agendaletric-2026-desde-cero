const pool = require("../../config/database");
const {
  schedulesOverlap,
  scheduleChangeInvalidatesAppointments,
} = require("./horario.rules");

const activeAppointmentStates = ["BORRADOR", "PROGRAMADA", "VALIDADA", "EN_PROCESO"];

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function lockTechnician(connection, idUsuario, requireActive) {
  const activeCondition = requireActive ? "AND u.estado = 1" : "";
  const [rows] = await connection.execute(
    `SELECT u.id_usuario
     FROM usuario u
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     WHERE u.id_usuario = ?
       AND u.deleted_at IS NULL
       AND r.nombre = ?
       ${activeCondition}
     FOR UPDATE`,
    [idUsuario, "TECHNICIAN"]
  );

  if (!rows[0]) {
    throw createError(
      requireActive ? "Active technician user not found" : "Technician user not found",
      404
    );
  }
}

async function findOtherSchedules(connection, idUsuario, excludeId) {
  const [rows] = await connection.execute(
    `SELECT id_horario, dia_semana, hora_inicio, hora_fin
     FROM horario_tecnico
     WHERE id_usuario_tecnico = ?
       AND id_horario <> ?
     ORDER BY dia_semana, hora_inicio
     FOR UPDATE`,
    [idUsuario, excludeId || 0]
  );

  return rows;
}

async function ensureActiveAppointmentsRemainCovered(
  connection,
  idUsuario,
  currentSchedules,
  schedules
) {
  const [appointments] = await connection.execute(
    `SELECT
       WEEKDAY(fecha_programada) + 1 AS dia_semana,
       TIME_FORMAT(hora_programada, '%H:%i:%s') AS hora_inicio,
       CASE
         WHEN duracion_minutos IS NULL THEN NULL
         WHEN duracion_minutos IN (60, 120, 180, 240, 300, 360)
         THEN duracion_minutos
         ELSE 360
       END AS duracion_minutos
     FROM cita
     WHERE id_usuario_tecnico = ?
       AND estado IN (?, ?, ?, ?)`,
    [idUsuario, ...activeAppointmentStates]
  );

  if (
    scheduleChangeInvalidatesAppointments(
      appointments,
      currentSchedules,
      schedules
    )
  ) {
    throw createError(
      "Schedule change would invalidate active appointments",
      409
    );
  }
}

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
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await lockTechnician(connection, horario.id_usuario_tecnico, true);

    const schedules = await findOtherSchedules(
      connection,
      horario.id_usuario_tecnico,
      0
    );
    if (schedulesOverlap(schedules, horario)) {
      throw createError("Technician schedule intervals cannot overlap", 409);
    }

    const [result] = await connection.execute(
      `INSERT INTO horario_tecnico
         (id_usuario_tecnico, dia_semana, hora_inicio, hora_fin)
       VALUES (?, ?, ?, ?)`,
      [
        horario.id_usuario_tecnico,
        horario.dia_semana,
        horario.hora_inicio,
        horario.hora_fin,
      ]
    );

    await connection.commit();
    transactionStarted = false;
    return result.insertId;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(id, horario) {
  const [existingRows] = await pool.execute(
    `SELECT id_usuario_tecnico
     FROM horario_tecnico
     WHERE id_horario = ?`,
    [id]
  );
  if (!existingRows[0]) {
    throw createError("Schedule not found", 404);
  }

  const idUsuario = existingRows[0].id_usuario_tecnico;
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await lockTechnician(connection, idUsuario, false);

    const [currentRows] = await connection.execute(
      `SELECT id_horario, dia_semana, hora_inicio, hora_fin
       FROM horario_tecnico
       WHERE id_horario = ?
         AND id_usuario_tecnico = ?
       FOR UPDATE`,
      [id, idUsuario]
    );
    if (!currentRows[0]) {
      throw createError("Schedule not found", 404);
    }

    const otherSchedules = await findOtherSchedules(connection, idUsuario, id);
    if (schedulesOverlap(otherSchedules, horario)) {
      throw createError("Technician schedule intervals cannot overlap", 409);
    }
    const nextSchedules = [
      ...otherSchedules,
      { ...horario, id_horario: Number(id) },
    ];
    await ensureActiveAppointmentsRemainCovered(
      connection,
      idUsuario,
      [...otherSchedules, currentRows[0]],
      nextSchedules
    );

    const [result] = await connection.execute(
      `UPDATE horario_tecnico
       SET dia_semana = ?, hora_inicio = ?, hora_fin = ?
       WHERE id_horario = ?`,
      [horario.dia_semana, horario.hora_inicio, horario.hora_fin, id]
    );

    await connection.commit();
    transactionStarted = false;
    return result.affectedRows;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function remove(id) {
  const [existingRows] = await pool.execute(
    `SELECT id_usuario_tecnico
     FROM horario_tecnico
     WHERE id_horario = ?`,
    [id]
  );
  if (!existingRows[0]) {
    throw createError("Schedule not found", 404);
  }

  const idUsuario = existingRows[0].id_usuario_tecnico;
  const connection = await pool.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;
    await lockTechnician(connection, idUsuario, false);

    const [currentRows] = await connection.execute(
      `SELECT id_horario, dia_semana, hora_inicio, hora_fin
       FROM horario_tecnico
       WHERE id_horario = ?
         AND id_usuario_tecnico = ?
       FOR UPDATE`,
      [id, idUsuario]
    );
    if (!currentRows[0]) {
      throw createError("Schedule not found", 404);
    }

    const otherSchedules = await findOtherSchedules(connection, idUsuario, id);
    await ensureActiveAppointmentsRemainCovered(
      connection,
      idUsuario,
      [...otherSchedules, currentRows[0]],
      otherSchedules
    );

    await connection.execute(
      `DELETE FROM horario_tecnico
       WHERE id_horario = ?`,
      [id]
    );

    await connection.commit();
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
