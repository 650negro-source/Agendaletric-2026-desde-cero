const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createHash, randomBytes } = require("crypto");
const authRepository = require("./auth.repository");
const emailService = require("../notificaciones/email.service");

async function login(correo, contrasena) {
  const normalizedCorreo = correo.trim().toLowerCase();
  const user = await authRepository.findByEmail(normalizedCorreo);

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  if (user.estado !== 1) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const validPassword = await bcrypt.compare(contrasena, user.contrasena);

  if (!validPassword) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id_usuario,
      ver: Number(user.token_version) || 0,
    },
    process.env.JWT_SECRET,
    {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    }
  );

  return {
    token,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      id_rol: user.id_rol_fk,
    },
  };
}

async function changePassword(idUsuario, contrasenaActual, nuevaContrasena) {
  const user = await authRepository.findPasswordById(idUsuario);
  if (!user || user.estado !== 1) {
    const error = new Error("Invalid or inactive user");
    error.status = 401;
    throw error;
  }

  if (!(await bcrypt.compare(contrasenaActual, user.contrasena))) {
    const error = new Error("Current password is incorrect");
    error.status = 400;
    throw error;
  }

  if (await bcrypt.compare(nuevaContrasena, user.contrasena)) {
    const error = new Error("New password must be different");
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
  await authRepository.updatePassword(idUsuario, hashedPassword);
}

async function requestPasswordReset(correo) {
  const user = await authRepository.findActiveByEmail(correo);
  if (!user) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await authRepository.createPasswordResetToken(user.id_usuario, tokenHash);

  try {
    await emailService.sendPasswordResetEmail({
      to: user.correo,
      name: user.nombre,
      token,
    });
  } catch (error) {
    console.error("Password reset email delivery failed", {
      userId: user.id_usuario,
      error: error.message,
    });
  }
}

async function resetPassword(token, nuevaContrasena) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
  await authRepository.resetPasswordByToken(tokenHash, hashedPassword);
}

async function getProfile(id) {
  const user = await authRepository.findById(id);

  if (!user || user.estado !== 1) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  return {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    correo: user.correo,
    id_rol: user.id_rol_fk,
    estado: user.estado
  };
}


module.exports = {
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
  getProfile,
};
