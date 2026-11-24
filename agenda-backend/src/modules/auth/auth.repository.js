const pool = require("../../config/database");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findByEmail(correo) {
  const [rows] = await pool.execute(
    `SELECT
       id_usuario,
       nombre,
       correo,
       contrasena,
       id_rol_fk,
       estado,
       token_version
     FROM usuario
     WHERE LOWER(correo) = LOWER(?)
     AND deleted_at IS NULL`,
    [correo]
  );

  return rows[0];
}

async function findActiveByEmail(correo) {
  const [rows] = await pool.execute(
    `SELECT id_usuario, nombre, correo
     FROM usuario
     WHERE LOWER(correo) = LOWER(?)
       AND estado = 1
       AND deleted_at IS NULL`,
    [correo]
  );

  return rows[0];
}

async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT
       id_usuario,
       nombre,
       correo,
       id_rol_fk,
       estado,
       token_version
     FROM usuario
     WHERE id_usuario = ?
     AND deleted_at IS NULL`,
    [id]
  );

  return rows[0];
}

async function findPasswordById(id) {
  const [rows] = await pool.execute(
    `SELECT id_usuario, contrasena, estado
     FROM usuario
     WHERE id_usuario = ?
       AND deleted_at IS NULL`,
    [id]
  );

  return rows[0];
}

async function updatePassword(id, hashedPassword) {
  const [result] = await pool.execute(
    `UPDATE usuario
     SET contrasena = ?
     WHERE id_usuario = ?
       AND estado = 1
       AND deleted_at IS NULL`,
    [hashedPassword, id]
  );

  return result.affectedRows;
}

async function createPasswordResetToken(idUsuario, tokenHash) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    await connection.execute(
      `DELETE FROM password_reset_token
       WHERE id_usuario = ?`,
      [idUsuario]
    );
    await connection.execute(
      `INSERT INTO password_reset_token
         (id_usuario, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE))`,
      [idUsuario, tokenHash]
    );
    await connection.commit();
    committed = true;
  } catch (error) {
    if (!committed) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function resetPasswordByToken(tokenHash, hashedPassword) {
  const connection = await pool.getConnection();
  let committed = false;

  try {
    await connection.beginTransaction();
    const [tokens] = await connection.execute(
      `SELECT reset.id_token, reset.id_usuario
       FROM password_reset_token reset
       INNER JOIN usuario
         ON usuario.id_usuario = reset.id_usuario
       WHERE reset.token_hash = ?
         AND reset.used_at IS NULL
         AND reset.expires_at > CURRENT_TIMESTAMP
         AND usuario.estado = 1
         AND usuario.deleted_at IS NULL
       FOR UPDATE`,
      [tokenHash]
    );

    if (!tokens[0]) {
      throw createError("Invalid or expired reset token", 400);
    }

    const idUsuario = tokens[0].id_usuario;
    const [updateResult] = await connection.execute(
      `UPDATE usuario
      SET contrasena = ?,
          token_version = token_version + 1
       WHERE id_usuario = ?
         AND estado = 1
         AND deleted_at IS NULL`,
      [hashedPassword, idUsuario]
    );
    if (updateResult.affectedRows !== 1) {
      throw createError("Invalid or expired reset token", 400);
    }

    await connection.execute(
      `UPDATE password_reset_token
       SET used_at = CURRENT_TIMESTAMP
       WHERE id_usuario = ?
         AND used_at IS NULL`,
      [idUsuario]
    );
    await connection.commit();
    committed = true;
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
  findByEmail,
  findActiveByEmail,
  findById,
  findPasswordById,
  updatePassword,
  createPasswordResetToken,
  resetPasswordByToken,
};
