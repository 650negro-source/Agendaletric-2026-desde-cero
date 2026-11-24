const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");

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

  const token = jwt.sign({ id: user.id_usuario }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
  });

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
  getProfile
};
