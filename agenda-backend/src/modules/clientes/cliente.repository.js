const pool = require("../../config/database");

async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id_usuario
     FROM usuario
     WHERE correo = ?
       AND deleted_at IS NULL`,
    [email]
  );

  return rows[0];
}

async function findByDocumento(documentoIdentidad) {
  const [rows] = await pool.execute(
    `SELECT id_cliente
     FROM cliente
     WHERE documento_identidad = ?
     AND deleted_at IS NULL`,
    [documentoIdentidad]
  );

  return rows[0];
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.id_usuario, c.documento_identidad, c.telefono,
            c.preferencia_notificacion, c.direccion, c.estado,
            u.nombre AS nombre_completo, u.correo
     FROM cliente c
     INNER JOIN usuario u ON u.id_usuario = c.id_usuario
     WHERE c.id_cliente = ?
       AND c.deleted_at IS NULL
       AND u.deleted_at IS NULL`,
    [id]
  );

  return rows[0];
}

async function findByUserId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.id_usuario, c.documento_identidad, c.telefono,
            c.preferencia_notificacion, c.direccion, c.estado,
            u.nombre AS nombre_completo, u.correo
     FROM cliente c
     INNER JOIN usuario u ON u.id_usuario = c.id_usuario
     WHERE c.id_usuario = ?
       AND c.deleted_at IS NULL
       AND u.deleted_at IS NULL`,
    [idUsuario]
  );

  return rows[0];
}

async function findAll() {
  const [rows] = await pool.execute(
    `SELECT c.id_cliente, c.id_usuario, c.documento_identidad, c.telefono,
            c.preferencia_notificacion, c.direccion, c.estado,
            u.nombre AS nombre_completo, u.correo
     FROM cliente c
     INNER JOIN usuario u ON u.id_usuario = c.id_usuario
     WHERE c.deleted_at IS NULL
       AND u.deleted_at IS NULL`
  );

  return rows;
}

async function createWithUser(cliente) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [roles] = await connection.execute(
      `SELECT id_rol
       FROM rol
       WHERE nombre = ?`,
      ["CUSTOMER"]
    );

    if (roles.length === 0) {
      const error = new Error("CUSTOMER role is not configured");
      error.status = 500;
      throw error;
    }

    const [userResult] = await connection.execute(
      `INSERT INTO usuario (nombre, correo, contrasena, id_rol_fk)
       VALUES (?, ?, ?, ?)`,
      [cliente.nombre_completo, cliente.correo, cliente.contrasena, roles[0].id_rol]
    );

    const [clienteResult] = await connection.execute(
      `INSERT INTO cliente
        (documento_identidad, telefono, preferencia_notificacion, direccion, id_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente.documento_identidad,
        cliente.telefono,
        cliente.preferencia_notificacion || "CORREO",
        cliente.direccion,
        userResult.insertId,
      ]
    );

    await connection.commit();
    return {
      id_cliente: clienteResult.insertId,
      id_usuario: userResult.insertId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createForUser(idUsuario, cliente) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [users] = await connection.execute(
      `SELECT u.id_usuario
       FROM usuario u
       INNER JOIN rol r ON r.id_rol = u.id_rol_fk
       WHERE u.id_usuario = ?
         AND r.nombre = ?
         AND u.estado = 1
         AND u.deleted_at IS NULL
       FOR UPDATE`,
      [idUsuario, "CUSTOMER"]
    );

    if (users.length === 0) {
      const error = new Error("Customer account not found");
      error.status = 404;
      throw error;
    }

    const [existingClients] = await connection.execute(
      `SELECT id_cliente
       FROM cliente
       WHERE id_usuario = ?
       FOR UPDATE`,
      [idUsuario]
    );

    if (existingClients.length > 0) {
      const error = new Error("Client profile already exists");
      error.status = 409;
      throw error;
    }

    await connection.execute(
      `UPDATE usuario
       SET nombre = ?, correo = ?
       WHERE id_usuario = ?`,
      [cliente.nombre_completo, cliente.correo, idUsuario]
    );

    const [result] = await connection.execute(
      `INSERT INTO cliente
         (documento_identidad, telefono, preferencia_notificacion, direccion, id_usuario)
       VALUES (?, ?, ?, ?, ?)`,
      [
        cliente.documento_identidad,
        cliente.telefono,
        cliente.preferencia_notificacion || "CORREO",
        cliente.direccion,
        idUsuario,
      ]
    );

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function update(id, cliente) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id_usuario
       FROM cliente
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return 0;
    }

    await connection.execute(
      `UPDATE usuario
       SET nombre = ?, correo = ?
       WHERE id_usuario = ?
         AND deleted_at IS NULL`,
      [cliente.nombre_completo, cliente.correo, rows[0].id_usuario]
    );

    const [result] = await connection.execute(
      `UPDATE cliente
       SET documento_identidad = ?, telefono = ?, direccion = ?,
           preferencia_notificacion = COALESCE(?, preferencia_notificacion)
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [
        cliente.documento_identidad,
        cliente.telefono,
        cliente.direccion,
        cliente.preferencia_notificacion || null,
        id,
      ]
    );

    await connection.commit();
    return result.affectedRows;
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

    const [rows] = await connection.execute(
      `SELECT id_usuario
       FROM cliente
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return 0;
    }

    await connection.execute(
      `UPDATE usuario SET estado = ? WHERE id_usuario = ?`,
      [estado, rows[0].id_usuario]
    );
    const [result] = await connection.execute(
      `UPDATE cliente
       SET estado = ?
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [estado, id]
    );

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function softDelete(id) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id_usuario
       FROM cliente
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return 0;
    }

    await connection.execute(
      `UPDATE usuario
       SET estado = 0, deleted_at = NOW()
       WHERE id_usuario = ?`,
      [rows[0].id_usuario]
    );
    const [result] = await connection.execute(
      `UPDATE cliente
       SET estado = 0, deleted_at = NOW()
       WHERE id_cliente = ?
         AND deleted_at IS NULL`,
      [id]
    );

    await connection.commit();
    return result.affectedRows;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findByEmail,
  findByDocumento,
  findById,
  findByUserId,
  findAll,
  createWithUser,
  createForUser,
  update,
  updateStatus,
  softDelete,
};
