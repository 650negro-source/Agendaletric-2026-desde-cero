const pool = require("../../config/database");

const activeStates = ["BORRADOR", "PROGRAMADA", "VALIDADA", "EN_PROCESO"];

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findClienteIdByUser(connection, idUsuario) {
  const [rows] = await connection.execute(
    `SELECT c.id_cliente
     FROM cliente c
     INNER JOIN usuario u ON u.id_usuario = c.id_usuario
     WHERE c.id_usuario = ?
       AND c.estado = 1
       AND c.deleted_at IS NULL
       AND u.estado = 1
       AND u.deleted_at IS NULL`,
    [idUsuario]
  );

  return rows[0];
}

async function findVehicleByOwner(connection, idVehiculo, idCliente) {
  const [rows] = await connection.execute(
    `SELECT id_vehiculo
     FROM vehiculo
     WHERE id_vehiculo = ?
       AND id_cliente = ?`,
    [idVehiculo, idCliente]
  );

  return rows[0];
}

async function isAtLeastHoursAhead(connection, fecha, hora, hours) {
  const [rows] = await connection.execute(
    `SELECT TIMESTAMP(?, ?) >= TIMESTAMPADD(HOUR, ?, NOW()) AS permitido`,
    [fecha, hora, hours]
  );

  return Boolean(rows[0].permitido);
}

async function findAvailableTechnicians(
  connection,
  fecha,
  hora,
  excludeCitaId
) {
  const excludedId = excludeCitaId || 0;
  const [rows] = await connection.execute(
    `SELECT DISTINCT u.id_usuario
     FROM usuario u
     INNER JOIN rol r ON r.id_rol = u.id_rol_fk
     INNER JOIN horario_tecnico h ON h.id_usuario_tecnico = u.id_usuario
     WHERE u.estado = 1
       AND u.deleted_at IS NULL
       AND r.nombre = ?
       AND h.dia_semana = WEEKDAY(?) + 1
       AND CAST(? AS CHAR) >= CAST(h.hora_inicio AS CHAR)
       AND CAST(? AS CHAR) < CAST(h.hora_fin AS CHAR)
       AND NOT EXISTS (
         SELECT 1
         FROM cita c
         WHERE c.id_usuario_tecnico = u.id_usuario
           AND c.fecha_programada = ?
           AND c.hora_programada = ?
           AND c.estado IN (?, ?, ?, ?)
           AND c.id_cita <> ?
       )
     ORDER BY u.id_usuario`,
    [
      "TECHNICIAN",
      fecha,
      hora,
      hora,
      fecha,
      hora,
      ...activeStates,
      excludedId,
    ]
  );

  return rows;
}

async function insertHistory(
  connection,
  idCita,
  idUsuarioActor,
  accion,
  estadoAnterior,
  estadoNuevo,
  detalle
) {
  await connection.execute(
    `INSERT INTO cita_historial
       (id_cita, id_usuario_actor, accion, estado_anterior, estado_nuevo, detalle)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [idCita, idUsuarioActor, accion, estadoAnterior, estadoNuevo, detalle]
  );
}

async function findCitaByIdWithConnection(connection, id) {
  const [rows] = await connection.execute(
    `SELECT
       c.id_cita,
       c.codigo_asignacion,
       c.id_cliente,
       c.id_vehiculo,
       c.id_tipo_averia,
       c.tipo_averia_nombre,
       c.id_tipo_servicio,
       c.tipo_servicio_nombre,
       c.detalle_servicio,
       c.id_usuario_tecnico,
       c.fecha_programada,
       c.hora_programada,
       c.estado,
       c.descripcion_averia,
       c.observaciones,
       c.fecha_creacion,
       c.fecha_actualizacion,
       cliente.id_usuario AS id_usuario_cliente,
       u_cliente.nombre AS nombre_cliente,
       u_cliente.correo AS correo_cliente,
       v.placa,
       u_tecnico.nombre AS nombre_tecnico
     FROM cita c
     INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
     INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
     INNER JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
     INNER JOIN usuario u_tecnico ON u_tecnico.id_usuario = c.id_usuario_tecnico
     WHERE c.id_cita = ?`,
    [id]
  );

  return rows[0];
}

async function createCita(cita, idUsuarioActor) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (
      !(await isAtLeastHoursAhead(
        connection,
        cita.fecha_programada,
        cita.hora_programada,
        24
      ))
    ) {
      throw createError("Appointments must be scheduled at least 24 hours ahead", 400);
    }

    const cliente = await findClienteIdByUser(connection, idUsuarioActor);
    if (!cliente) {
      throw createError("Active client profile not found", 404);
    }

    const vehicle = await findVehicleByOwner(
      connection,
      cita.id_vehiculo,
      cliente.id_cliente
    );
    if (!vehicle) {
      throw createError("Vehicle does not belong to the authenticated client", 404);
    }

    const [faultTypes] = await connection.execute(
      `SELECT id_tipo_averia, nombre
       FROM tipo_averia
       WHERE id_tipo_averia = ?
         AND estado = 1
       FOR UPDATE`,
      [cita.id_tipo_averia]
    );
    const faultType = faultTypes[0];
    if (!faultType) {
      throw createError("Fault type not found or inactive", 400);
    }

    const [serviceTypes] = await connection.execute(
      `SELECT id_tipo_servicio, nombre, requiere_detalle
       FROM tipo_servicio
       WHERE id_tipo_servicio = ?
         AND estado = 1
       FOR UPDATE`,
      [cita.id_tipo_servicio]
    );
    const serviceType = serviceTypes[0];
    if (!serviceType) {
      throw createError("Service type not found or inactive", 400);
    }
    if (serviceType.requiere_detalle && !cita.detalle_servicio) {
      throw createError("Details are required for the selected service type", 400);
    }
    const detalleServicio = serviceType.requiere_detalle
      ? cita.detalle_servicio
      : null;

    const technicians = await findAvailableTechnicians(
      connection,
      cita.fecha_programada,
      cita.hora_programada
    );

    if (technicians.length === 0) {
      throw createError("No technician is available at the requested date and time", 409);
    }

    let idCita;

    for (const technician of technicians) {
      try {
        const [result] = await connection.execute(
          `INSERT INTO cita
             (codigo_asignacion, id_cliente, id_vehiculo, id_tipo_averia,
              tipo_averia_nombre, id_tipo_servicio, tipo_servicio_nombre,
              detalle_servicio, id_usuario_tecnico,
              fecha_programada, hora_programada, estado, descripcion_averia,
              observaciones)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROGRAMADA', ?, ?)`,
          [
            cita.codigo_asignacion,
            cliente.id_cliente,
            cita.id_vehiculo,
            faultType.id_tipo_averia,
            faultType.nombre,
            serviceType.id_tipo_servicio,
            serviceType.nombre,
            detalleServicio,
            technician.id_usuario,
            cita.fecha_programada,
            cita.hora_programada,
            cita.descripcion_averia,
            cita.observaciones,
          ]
        );
        idCita = result.insertId;
        break;
      } catch (error) {
        if (
          error.code === "ER_DUP_ENTRY" &&
          String(error.message).includes("uq_cita_tecnico_hora_activa")
        ) {
          continue;
        }
        if (
          error.code === "ER_DUP_ENTRY" &&
          String(error.message).includes("uq_cita_cliente_activa")
        ) {
          throw createError("The client already has an active appointment", 409);
        }
        throw error;
      }
    }

    if (!idCita) {
      throw createError("No technician is available at the requested date and time", 409);
    }

    await insertHistory(
      connection,
      idCita,
      idUsuarioActor,
      "CREADA",
      null,
      "PROGRAMADA",
      "Appointment created and technician assigned automatically"
    );

    const result = await findCitaByIdWithConnection(connection, idCita);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT
       c.id_cita, c.codigo_asignacion, c.id_cliente, c.id_vehiculo,
       c.id_tipo_averia, c.tipo_averia_nombre,
       c.id_tipo_servicio, c.tipo_servicio_nombre, c.detalle_servicio,
       c.id_usuario_tecnico, c.fecha_programada, c.hora_programada,
       c.estado, c.descripcion_averia, c.observaciones,
       c.fecha_creacion, c.fecha_actualizacion,
       u_cliente.nombre AS nombre_cliente, u_cliente.correo AS correo_cliente,
       v.placa, u_tecnico.nombre AS nombre_tecnico
     FROM cita c
     INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
     INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
     INNER JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
     INNER JOIN usuario u_tecnico ON u_tecnico.id_usuario = c.id_usuario_tecnico
     ORDER BY c.fecha_programada, c.hora_programada`
  );

  return rows;
}

async function findAllByClienteUserId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT
       c.id_cita, c.codigo_asignacion, c.id_cliente, c.id_vehiculo,
       c.id_tipo_averia, c.tipo_averia_nombre,
       c.id_tipo_servicio, c.tipo_servicio_nombre, c.detalle_servicio,
       c.id_usuario_tecnico, c.fecha_programada, c.hora_programada,
       c.estado, c.descripcion_averia, c.observaciones,
       c.fecha_creacion, c.fecha_actualizacion,
       u_cliente.nombre AS nombre_cliente, u_cliente.correo AS correo_cliente,
       v.placa, u_tecnico.nombre AS nombre_tecnico
     FROM cita c
     INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
     INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
     INNER JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
     INNER JOIN usuario u_tecnico ON u_tecnico.id_usuario = c.id_usuario_tecnico
     WHERE cliente.id_usuario = ?
     ORDER BY c.fecha_programada, c.hora_programada`,
    [idUsuario]
  );

  return rows;
}

async function findAllByTechnicianId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT
       c.id_cita, c.codigo_asignacion, c.id_cliente, c.id_vehiculo,
       c.id_tipo_averia, c.tipo_averia_nombre,
       c.id_tipo_servicio, c.tipo_servicio_nombre, c.detalle_servicio,
       c.id_usuario_tecnico, c.fecha_programada, c.hora_programada,
       c.estado, c.descripcion_averia, c.observaciones,
       c.fecha_creacion, c.fecha_actualizacion,
       u_cliente.nombre AS nombre_cliente, u_cliente.correo AS correo_cliente,
       v.placa, u_tecnico.nombre AS nombre_tecnico
     FROM cita c
     INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
     INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
     INNER JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
     INNER JOIN usuario u_tecnico ON u_tecnico.id_usuario = c.id_usuario_tecnico
     WHERE c.id_usuario_tecnico = ?
     ORDER BY c.fecha_programada, c.hora_programada`,
    [idUsuario]
  );

  return rows;
}

async function findById(id) {
  return findCitaByIdWithConnection(pool, id);
}

async function changeEstado(
  id,
  idUsuarioActor,
  estadoAnterior,
  estadoNuevo,
  accion,
  observaciones,
  reporte = null
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT estado
       FROM cita
       WHERE id_cita = ?
       FOR UPDATE`,
      [id]
    );

    if (!rows[0]) {
      throw createError("Appointment not found", 404);
    }
    if (rows[0].estado !== estadoAnterior) {
      throw createError("Appointment state changed; reload and try again", 409);
    }

    await connection.execute(
      `UPDATE cita
       SET estado = ?, observaciones = COALESCE(?, observaciones)
       WHERE id_cita = ?`,
      [estadoNuevo, observaciones, id]
    );

    let reporteCreado = null;
    if (estadoNuevo === "ATENDIDA") {
      if (!reporte) {
        throw createError("Technical report details are required to complete the appointment", 400);
      }

      const [result] = await connection.execute(
        `INSERT INTO reporte_tecnico
           (id_cita, diagnostico, procedimiento_realizado, observaciones)
         VALUES (?, ?, ?, ?)`,
        [
          id,
          reporte.diagnostico,
          reporte.procedimiento_realizado,
          reporte.observaciones,
        ]
      );
      const [rows] = await connection.execute(
        `SELECT id_reporte, id_cita, fecha_reporte, diagnostico,
                procedimiento_realizado, observaciones,
                estado_publicacion, fecha_publicacion
         FROM reporte_tecnico
         WHERE id_reporte = ?`,
        [result.insertId]
      );
      reporteCreado = rows[0];
    }

    await insertHistory(
      connection,
      id,
      idUsuarioActor,
      accion,
      estadoAnterior,
      estadoNuevo,
      observaciones
    );

    let recordatorios = [];
    if (estadoNuevo === "VALIDADA") {
      const cita = await findCitaByIdWithConnection(connection, id);
      const [result] = await connection.execute(
        `INSERT INTO recordatorio
           (id_cita, medio_envio, fecha_programada, fecha_envio, mensaje, estado_envio)
         VALUES
           (?, 'CORREO', DATE_SUB(TIMESTAMP(?, ?), INTERVAL 24 HOUR), NOW(), ?, 'SIMULADO'),
           (?, 'SMS', DATE_SUB(TIMESTAMP(?, ?), INTERVAL 24 HOUR), NOW(), ?, 'SIMULADO')`,
        [
          id,
          cita.fecha_programada,
          cita.hora_programada,
          `Recordatorio simulado de cita ${cita.codigo_asignacion}`,
          id,
          cita.fecha_programada,
          cita.hora_programada,
          `Recordatorio simulado de cita ${cita.codigo_asignacion}`,
        ]
      );
      recordatorios = [
        { medio_envio: "CORREO", estado_envio: "SIMULADO" },
        { medio_envio: "SMS", estado_envio: "SIMULADO" },
      ];
      if (result.affectedRows !== 2) {
        throw new Error("Could not persist simulated appointment reminders");
      }
    }

    const cita = await findCitaByIdWithConnection(connection, id);
    await connection.commit();
    return { cita, recordatorios, reporte: reporteCreado };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function cancelarCita(id, idUsuarioActor, estadoAnterior) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT estado,
              DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada,
              TIME_FORMAT(hora_programada, '%H:%i:%s') AS hora_programada
       FROM cita
       WHERE id_cita = ?
       FOR UPDATE`,
      [id]
    );

    if (!rows[0]) {
      throw createError("Appointment not found", 404);
    }
    if (rows[0].estado !== estadoAnterior) {
      throw createError("Appointment state changed; reload and try again", 409);
    }
    if (["ATENDIDA", "CANCELADA"].includes(rows[0].estado)) {
      throw createError("Appointment can no longer be cancelled", 409);
    }
    if (
      !(await isAtLeastHoursAhead(
        connection,
        rows[0].fecha_programada,
        rows[0].hora_programada,
        12
      ))
    ) {
      throw createError("Cancellation requires at least 12 hours of notice", 409);
    }

    await connection.execute(
      `UPDATE cita SET estado = 'CANCELADA' WHERE id_cita = ?`,
      [id]
    );
    await connection.execute(
      `UPDATE recordatorio
       SET estado_envio = 'CANCELADO'
       WHERE id_cita = ?
         AND estado_envio = 'PENDIENTE'`,
      [id]
    );
    await insertHistory(
      connection,
      id,
      idUsuarioActor,
      "CANCELADA",
      estadoAnterior,
      "CANCELADA",
      null
    );

    const cita = await findCitaByIdWithConnection(connection, id);
    await connection.commit();
    return cita;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function reprogramarCita(id, idUsuarioActor, estadoAnterior, fecha, hora) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT estado,
              DATE_FORMAT(fecha_programada, '%Y-%m-%d') AS fecha_programada,
              TIME_FORMAT(hora_programada, '%H:%i:%s') AS hora_programada
       FROM cita
       WHERE id_cita = ?
       FOR UPDATE`,
      [id]
    );

    if (!rows[0]) {
      throw createError("Appointment not found", 404);
    }
    if (rows[0].estado !== estadoAnterior) {
      throw createError("Appointment state changed; reload and try again", 409);
    }
    if (["ATENDIDA", "CANCELADA"].includes(rows[0].estado)) {
      throw createError("Appointment can no longer be rescheduled", 409);
    }
    if (
      !(await isAtLeastHoursAhead(
        connection,
        rows[0].fecha_programada,
        rows[0].hora_programada,
        12
      ))
    ) {
      throw createError("Changes require at least 12 hours of notice", 409);
    }
    if (
      !(await isAtLeastHoursAhead(connection, fecha, hora, 24))
    ) {
      throw createError("Appointments must be scheduled at least 24 hours ahead", 400);
    }

    const technicians = await findAvailableTechnicians(connection, fecha, hora, id);
    if (technicians.length === 0) {
      throw createError("No technician is available at the requested date and time", 409);
    }

    let updated = false;
    for (const technician of technicians) {
      try {
        await connection.execute(
          `UPDATE cita
           SET id_usuario_tecnico = ?,
               fecha_programada = ?,
               hora_programada = ?,
               estado = 'PROGRAMADA'
           WHERE id_cita = ?`,
          [technician.id_usuario, fecha, hora, id]
        );
        updated = true;
        break;
      } catch (error) {
        if (
          error.code === "ER_DUP_ENTRY" &&
          String(error.message).includes("uq_cita_tecnico_hora_activa")
        ) {
          continue;
        }
        throw error;
      }
    }

    if (!updated) {
      throw createError("No technician is available at the requested date and time", 409);
    }

    await connection.execute(
      `UPDATE recordatorio
       SET estado_envio = 'CANCELADO'
       WHERE id_cita = ?
         AND estado_envio = 'PENDIENTE'`,
      [id]
    );
    await insertHistory(
      connection,
      id,
      idUsuarioActor,
      "REPROGRAMADA",
      estadoAnterior,
      "PROGRAMADA",
      `Rescheduled from ${rows[0].fecha_programada} ${rows[0].hora_programada} to ${fecha} ${hora}`
    );

    const cita = await findCitaByIdWithConnection(connection, id);
    await connection.commit();
    return cita;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findHistorial(idCita) {
  const [rows] = await pool.execute(
    `SELECT
       h.id_historial, h.id_cita, h.id_usuario_actor,
       u.nombre AS nombre_actor, h.accion,
       h.estado_anterior, h.estado_nuevo, h.detalle, h.fecha_evento
     FROM cita_historial h
     INNER JOIN usuario u ON u.id_usuario = h.id_usuario_actor
     WHERE h.id_cita = ?
     ORDER BY h.fecha_evento, h.id_historial`,
    [idCita]
  );

  return rows;
}

module.exports = {
  createCita,
  findAll,
  findAllByClienteUserId,
  findAllByTechnicianId,
  findById,
  changeEstado,
  cancelarCita,
  reprogramarCita,
  findHistorial,
};
