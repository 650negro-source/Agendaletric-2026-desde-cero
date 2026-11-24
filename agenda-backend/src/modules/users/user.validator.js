const {
  getPasswordError,
  getPasswordConfirmationError,
} = require("../../utils/password-policy");
const {
  normalizeEmail,
  normalizePersonName,
} = require("../../utils/identity-policy");

function normalizeInteger(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const asNumber = Number(trimmed);
    return Number.isInteger(asNumber) ? asNumber : undefined;
  }

  return undefined;
}

function validateCreateUser(req, res, next) {
  const body = req.body || {};
  const nombre = normalizePersonName(body.nombre);
  const correo = normalizeEmail(body.correo);
  const id_rol = normalizeInteger(body.id_rol);

  if (
    !body.nombre ||
    !body.correo ||
    typeof body.contrasena !== "string" ||
    typeof body.confirmar_contrasena !== "string" ||
    id_rol === undefined
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (!nombre) {
    return res.status(400).json({ message: "Invalid name" });
  }
  if (!correo) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const passwordError = getPasswordError(body.contrasena);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }
  const confirmationError = getPasswordConfirmationError(
    body.contrasena,
    body.confirmar_contrasena
  );
  if (confirmationError) {
    return res.status(400).json({ message: confirmationError });
  }
  if (!Number.isInteger(id_rol) || id_rol <= 0) {
    return res.status(400).json({
      message: 'Role ID must be a positive integer'
    });
  }

  body.nombre = nombre;
  body.correo = correo;
  body.id_rol = id_rol;
  delete body.confirmar_contrasena;
  req.body = body;
  next();
}

// Validar ID
function validateUserId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'Invalid user ID'
    });
  }
  req.params.id = String(id);
  next();
}
// Validar actualización
function validateUpdateUser(req, res, next) {
  const body = req.body || {};
  const nombre = normalizePersonName(body.nombre);
  const correo = normalizeEmail(body.correo);
  const id_rol = normalizeInteger(body.id_rol);

  if (!body.nombre || !body.correo || id_rol === undefined) {
    return res.status(400).json({
      message: 'All fields are required'
    });
  }
  if (!nombre) {
    return res.status(400).json({
      message: 'Invalid name'
    });
  }
  if (!correo) {
    return res.status(400).json({
      message: 'Invalid email format'
    });
  }
  if (!Number.isInteger(id_rol) || id_rol <= 0) {
    return res.status(400).json({
      message: 'Invalid role ID'
    });
  }

  body.nombre = nombre;
  body.correo = correo;
  body.id_rol = id_rol;
  req.body = body;
  next();
}
// Validar estado
function validateStatus(req, res, next) {
  const estado = normalizeInteger(req.body?.estado);
  if (estado !== 0 && estado !== 1) {
    return res.status(400).json({
      message: 'Status must be 0 or 1'
    });
  }
  req.body.estado = estado;
  next();
}

module.exports = {
validateCreateUser,
validateUserId,
validateUpdateUser,
validateStatus
};