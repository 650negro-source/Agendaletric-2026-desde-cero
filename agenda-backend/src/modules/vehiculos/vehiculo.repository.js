const pool = require("../../config/database");

const vehicleSelect = `SELECT v.id_vehiculo, v.placa, v.marca, v.modelo, v.anio,
                              v.color, v.tipo_vehiculo, v.tipo_energia, v.estado,
                              c.id_cliente, u.nombre AS cliente_nombre,
                              u.correo AS cliente_correo,
                              c.deleted_at IS NOT NULL AS cliente_eliminado,
                              EXISTS (
                                SELECT 1
                                FROM cita c_activa
                                WHERE c_activa.id_vehiculo = v.id_vehiculo
                                  AND c_activa.estado IN (
                                    'BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO'
                                  )
                              ) AS tiene_citas_activas
                       FROM vehiculo v
                       INNER JOIN cliente c ON c.id_cliente = v.id_cliente
                       INNER JOIN usuario u ON u.id_usuario = c.id_usuario`;

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
    `${vehicleSelect}
     ORDER BY v.id_vehiculo`
  );

  return rows;
}

async function findAllByClienteId(idCliente) {
  const [rows] = await pool.execute(
    `${vehicleSelect}
     WHERE v.id_cliente = ?
     ORDER BY v.id_vehiculo`,
    [idCliente]
  );

  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    `${vehicleSelect}
     WHERE v.id_vehiculo = ?`,
    [id]
  );

  return rows[0];
}

async function findByIdAndClienteId(id, idCliente) {
  const [rows] = await pool.execute(
    `${vehicleSelect}
     WHERE v.id_vehiculo = ?
       AND v.id_cliente = ?`,
    [id, idCliente]
  );

  return rows[0];
}

async function create(vehiculo) {
  const {
    placa,
    marca,
    modelo,
    anio,
    color,
    tipo_vehiculo,
    tipo_energia,
    id_cliente,
  } = vehiculo;
  const [result] = await pool.execute(
    `INSERT INTO vehiculo
       (placa, marca, modelo, anio, color, tipo_vehiculo, tipo_energia, id_cliente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [placa, marca, modelo, anio, color, tipo_vehiculo, tipo_energia, id_cliente]
  );

  return result.insertId;
}

async function update(id, vehiculo) {
  const { placa, marca, modelo, anio, color, tipo_vehiculo, tipo_energia } = vehiculo;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [vehicles] = await connection.execute(
      `SELECT placa
       FROM vehiculo
       WHERE id_vehiculo = ?
       FOR UPDATE`,
      [id]
    );
    if (vehicles.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    if (vehicles[0].placa !== placa) {
      const [appointments] = await connection.execute(
        `SELECT 1
         FROM cita
         WHERE id_vehiculo = ?
         LIMIT 1`,
        [id]
      );
      if (appointments.length > 0) {
        await connection.rollback();
        return { plateChangeBlocked: true };
      }
    }

    await connection.execute(
      `UPDATE vehiculo
       SET placa = ?, marca = ?, modelo = ?, anio = ?, color = ?,
           tipo_vehiculo = ?, tipo_energia = ?
       WHERE id_vehiculo = ?`,
      [placa, marca, modelo, anio, color, tipo_vehiculo, tipo_energia, id]
    );
    await connection.commit();
    return { updated: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateStatus(id, estado) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [vehicles] = await connection.execute(
      `SELECT id_vehiculo
       FROM vehiculo
       WHERE id_vehiculo = ?
       FOR UPDATE`,
      [id]
    );
    if (vehicles.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    if (estado === 0) {
      const [appointments] = await connection.execute(
        `SELECT 1
         FROM cita
         WHERE id_vehiculo = ?
           AND estado IN ('BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO')
         LIMIT 1`,
        [id]
      );
      if (appointments.length > 0) {
        await connection.rollback();
        return { activeAppointments: true };
      }
    }

    await connection.execute(
      `UPDATE vehiculo
       SET estado = ?
       WHERE id_vehiculo = ?`,
      [estado, id]
    );
    await connection.commit();
    return { updated: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deletePermanently(id) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [vehicles] = await connection.execute(
      `SELECT v.id_vehiculo, v.placa, v.marca, v.modelo, v.anio,
              v.color, v.tipo_vehiculo, v.tipo_energia, c.deleted_at
       FROM vehiculo v
       INNER JOIN cliente c ON c.id_cliente = v.id_cliente
       WHERE v.id_vehiculo = ?
       FOR UPDATE`,
      [id]
    );
    if (vehicles.length === 0) {
      await connection.rollback();
      return { notFound: true };
    }

    const vehicle = vehicles[0];
    if (vehicle.deleted_at === null) {
      await connection.rollback();
      return { clientNotDeleted: true };
    }

    const [activeAppointments] = await connection.execute(
      `SELECT id_cita
       FROM cita
       WHERE id_vehiculo = ?
         AND estado IN ('BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO')
       LIMIT 1
       FOR UPDATE`,
      [id]
    );
    if (activeAppointments.length > 0) {
      await connection.rollback();
      return { activeAppointments: true };
    }

    await connection.execute(
      `UPDATE cita
       SET vehiculo_placa_historial = COALESCE(vehiculo_placa_historial, ?),
           vehiculo_marca_historial = COALESCE(vehiculo_marca_historial, ?),
           vehiculo_modelo_historial = COALESCE(vehiculo_modelo_historial, ?),
           vehiculo_anio_historial = COALESCE(vehiculo_anio_historial, ?),
           vehiculo_color_historial = COALESCE(vehiculo_color_historial, ?),
           vehiculo_tipo_historial = COALESCE(vehiculo_tipo_historial, ?),
           vehiculo_energia_historial = COALESCE(vehiculo_energia_historial, ?),
           id_vehiculo = NULL
       WHERE id_vehiculo = ?`,
      [
        vehicle.placa,
        vehicle.marca,
        vehicle.modelo,
        vehicle.anio,
        vehicle.color,
        vehicle.tipo_vehiculo,
        vehicle.tipo_energia,
        id,
      ]
    );
    await connection.execute(
      `DELETE FROM vehiculo
       WHERE id_vehiculo = ?`,
      [id]
    );
    await connection.commit();
    return { deleted: true };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
  updateStatus,
  deletePermanently,
};
