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
const { nombre, correo, contrasena } = req.body;
const id_rol = normalizeInteger(req.body.id_rol);
// Campos obligatorios
if (!nombre || !correo || !contrasena || id_rol === undefined) {
return res.status(400).json({
message: 'All fields are required'
});
}
// Nombre
if (typeof nombre !== 'string' || nombre.trim().length < 2) {
return res.status(400).json({
message: 'Name must contain at least 2 characters'
});
}
// Correo
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(correo.trim())) {
return res.status(400).json({
message: 'Invalid email format'
});
}
// Contraseña
if (typeof contrasena !== 'string' || contrasena.trim().length < 8) {
return res.status(400).json({
message: 'Password must contain at least 8 characters'
});
}
// Rol
if (!Number.isInteger(id_rol) || id_rol <= 0) {
return res.status(400).json({
message: 'Role ID must be a positive integer'
});
}
req.body.nombre = nombre.trim();
req.body.correo = correo.trim();
req.body.contrasena = contrasena.trim();
req.body.id_rol = id_rol;
next();
} //final de validateCreateUser

// Validar ID
function validateUserId(req, res, next) {
const id = Number(req.params.id);
if (!Number.isInteger(id) || id <= 0) {
return res.status(400).json({
message: 'Invalid user ID'
});
}
next();
}
// Validar actualización
function validateUpdateUser(req, res, next) {
const { nombre, correo } = req.body;
const id_rol = normalizeInteger(req.body.id_rol);
if (!nombre || !correo || id_rol === undefined) {
return res.status(400).json({
message: 'All fields are required'
});
}
if (typeof nombre !== 'string' || nombre.trim().length < 2) {
return res.status(400).json({
message: 'Invalid name'
});
}
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(correo.trim())) {
return res.status(400).json({
message: 'Invalid email format'
});
}
if (!Number.isInteger(id_rol) || id_rol <= 0) {
return res.status(400).json({
message: 'Invalid role ID'
});
}
req.body.nombre = nombre.trim();
req.body.correo = correo.trim();
req.body.id_rol = id_rol;
next();
}
// Validar estado
function validateStatus(req, res, next) {
const estado = normalizeInteger(req.body.estado);
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