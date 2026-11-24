const pool = require("../../config/database");
const {
  assertCanEdit,
  assertCanPublish,
  assertCanRequestCorrection,
} = require("./reporte-tecnico.rules");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findByCitaId(idCita) {
  const [rows] = await pool.execute(
    `SELECT r.id_reporte, r.id_cita, r.fecha_reporte, r.diagnostico,
            r.procedimiento_realizado, r.observaciones,
            r.estado_publicacion, r.fecha_publicacion, r.comentario_admin,
            c.fecha_programada, c.hora_programada, c.id_usuario_tecnico,
            c.tipo_servicio_nombre, c.detalle_servicio,
            c.tipo_averia_nombre, c.descripcion_averia,
            cliente.id_usuario AS id_usuario_cliente,
            u_cliente.nombre AS nombre_cliente,
            u_tecnico.nombre AS nombre_tecnico,
            v.placa
     FROM reporte_tecnico r
     INNER JOIN cita c ON c.id_cita = r.id_cita
     INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
     INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
     INNER JOIN usuario u_tecnico ON u_tecnico.id_usuario = c.id_usuario_tecnico
     INNER JOIN vehiculo v ON v.id_vehiculo = c.id_vehiculo
     WHERE r.id_cita = ?`,
    [idCita]
  );

  return rows[0];
}

async function updateByCitaId(idCita, reporte) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT estado_publicacion
       FROM reporte_tecnico
       WHERE id_cita = ?
       FOR UPDATE`,
      [idCita]
    );
    if (!rows[0]) {
      throw createError("Technical report not found", 404);
    }

    assertCanEdit(rows[0].estado_publicacion);
    await connection.execute(
      `UPDATE reporte_tecnico
       SET diagnostico = ?, procedimiento_realizado = ?, observaciones = ?
       WHERE id_cita = ?`,
      [
        reporte.diagnostico,
        reporte.procedimiento_realizado,
        reporte.observaciones,
        idCita,
      ]
    );
    await connection.commit();
    committed = true;

    return findByCitaId(idCita);
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function findArchivosByReporteId(idReporte) {
  const [rows] = await pool.execute(
    `SELECT id_archivo, nombre_original, tipo_mime, tamano_bytes, fecha_subida
     FROM reporte_tecnico_archivo
     WHERE id_reporte = ?
     ORDER BY fecha_subida, id_archivo`,
    [idReporte]
  );

  return rows;
}

async function createArchivo(idReporte, archivo) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [reportRows] = await connection.execute(
      `SELECT estado_publicacion
       FROM reporte_tecnico
       WHERE id_reporte = ?
       FOR UPDATE`,
      [idReporte]
    );
    if (!reportRows[0]) {
      throw createError("Technical report not found", 404);
    }

    assertCanEdit(reportRows[0].estado_publicacion);
    const [result] = await connection.execute(
      `INSERT INTO reporte_tecnico_archivo
         (id_reporte, nombre_original, nombre_archivo, tipo_mime, tamano_bytes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idReporte,
        archivo.nombre_original,
        archivo.nombre_archivo,
        archivo.tipo_mime,
        archivo.tamano_bytes,
      ]
    );
    const [rows] = await connection.execute(
      `SELECT id_archivo, nombre_original, tipo_mime, tamano_bytes, fecha_subida
       FROM reporte_tecnico_archivo
       WHERE id_archivo = ?`,
      [result.insertId]
    );
    await connection.commit();
    committed = true;

    return rows[0];
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function findArchivoById(idReporte, idArchivo) {
  const [rows] = await pool.execute(
    `SELECT id_archivo, nombre_original, nombre_archivo, tipo_mime,
            tamano_bytes, fecha_subida
     FROM reporte_tecnico_archivo
     WHERE id_reporte = ? AND id_archivo = ?`,
    [idReporte, idArchivo]
  );

  return rows[0];
}

async function publishByCitaId(idCita, idUsuarioActor) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT r.id_reporte, r.estado_publicacion,
              cliente.id_usuario AS id_usuario_destino,
              u_cliente.correo AS correo_destino
       FROM reporte_tecnico r
       INNER JOIN cita c ON c.id_cita = r.id_cita
       INNER JOIN cliente ON cliente.id_cliente = c.id_cliente
       INNER JOIN usuario u_cliente ON u_cliente.id_usuario = cliente.id_usuario
       WHERE r.id_cita = ?
       FOR UPDATE`,
      [idCita]
    );

    if (!rows[0]) {
      throw createError("Technical report not found", 404);
    }

    assertCanPublish(rows[0].estado_publicacion);
    await connection.execute(
      `UPDATE reporte_tecnico
       SET estado_publicacion = 'PUBLICADO',
           fecha_publicacion = CURRENT_TIMESTAMP,
           comentario_admin = NULL
       WHERE id_cita = ?`,
      [idCita]
    );

    const [envioResult] = await connection.execute(
      `INSERT INTO reporte_tecnico_envio
         (id_reporte, id_usuario_actor, id_usuario_destino, tipo_evento,
          correo_destino, medio_envio, estado_envio, mensaje)
       VALUES (?, ?, ?, 'PUBLICACION_CLIENTE', ?, 'CORREO', 'SIMULADO', ?)`,
      [
        rows[0].id_reporte,
        idUsuarioActor,
        rows[0].id_usuario_destino,
        rows[0].correo_destino,
        "Se registro la publicacion del reporte para el cliente; no se envio un correo real.",
      ]
    );

    const [envios] = await connection.execute(
      `SELECT id_envio, tipo_evento, correo_destino, medio_envio,
              estado_envio, fecha_envio
       FROM reporte_tecnico_envio
       WHERE id_envio = ?`,
      [envioResult.insertId]
    );

    await connection.commit();
    committed = true;

    return {
      reporte: await findByCitaId(idCita),
      envio: envios[0],
    };
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function requestCorrectionByCitaId(
  idCita,
  idUsuarioActor,
  comentario
) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT r.id_reporte, r.estado_publicacion,
              c.id_usuario_tecnico AS id_usuario_destino,
              u_tecnico.correo AS correo_destino
       FROM reporte_tecnico r
       INNER JOIN cita c ON c.id_cita = r.id_cita
       INNER JOIN usuario u_tecnico
         ON u_tecnico.id_usuario = c.id_usuario_tecnico
       WHERE r.id_cita = ?
       FOR UPDATE`,
      [idCita]
    );

    if (!rows[0]) {
      throw createError("Technical report not found", 404);
    }

    assertCanRequestCorrection(rows[0].estado_publicacion);
    await connection.execute(
      `UPDATE reporte_tecnico
       SET estado_publicacion = 'REQUIERE_CORRECCION',
           comentario_admin = ?
       WHERE id_cita = ?`,
      [comentario, idCita]
    );

    const [envioResult] = await connection.execute(
      `INSERT INTO reporte_tecnico_envio
         (id_reporte, id_usuario_actor, id_usuario_destino, tipo_evento,
          correo_destino, medio_envio, estado_envio, mensaje)
       VALUES (?, ?, ?, 'SOLICITUD_CORRECCION_TECNICO', ?, 'CORREO', 'SIMULADO', ?)`,
      [
        rows[0].id_reporte,
        idUsuarioActor,
        rows[0].id_usuario_destino,
        rows[0].correo_destino,
        comentario,
      ]
    );

    const [envios] = await connection.execute(
      `SELECT id_envio, tipo_evento, correo_destino, medio_envio,
              estado_envio, fecha_envio
       FROM reporte_tecnico_envio
       WHERE id_envio = ?`,
      [envioResult.insertId]
    );

    await connection.commit();
    committed = true;

    return {
      reporte: await findByCitaId(idCita),
      envio: envios[0],
    };
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findByCitaId,
  updateByCitaId,
  findArchivosByReporteId,
  createArchivo,
  findArchivoById,
  publishByCitaId,
  requestCorrectionByCitaId,
};
