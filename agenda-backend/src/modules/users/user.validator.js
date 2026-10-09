function validateCreateUser(req, res, next) {
const { nombre, correo, contrasena, id_rol } = req.body;
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
if (!emailRegex.test(correo)) {
return res.status(400).json({
message: 'Invalid email format'
});
}
// Contraseña
if (typeof contrasena !== 'string' || contrasena.length < 8) {
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
next();
}
module.exports = {
validateCreateUser
};