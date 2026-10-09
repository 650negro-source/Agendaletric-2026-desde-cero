const pool = require('../../config/database');
// Buscar usuario por correo
async function findByEmail(email) {
const [rows] = await pool.execute(
'SELECT id_usuario FROM usuario WHERE correo = ? AND deleted_at IS NULL',
[email]
);
return rows[0];
}
// Buscar rol por ID
async function findRoleById(roleId) {
const [rows] = await pool.execute(
'SELECT id_rol FROM rol WHERE id_rol = ?',
[roleId]
);
return rows[0];
}
// Crear usuario
async function create(user) {
const { nombre, correo, contrasena, id_rol } = user;
const [result] = await pool.execute(
`INSERT INTO usuario
(nombre, correo, contrasena, id_rol_fk)
VALUES (?, ?, ?, ?)`,
[nombre, correo, contrasena, id_rol]
);
return result.insertId;
}
module.exports = {
findByEmail,
findRoleById,
create
};