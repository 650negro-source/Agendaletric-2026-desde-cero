const bcrypt = require('bcrypt');
const userRepository = require('./user.repository');
async function createUser(userData) {
const { nombre, correo, contrasena, id_rol } = userData;
// El correo debe ser único
const existingUser = await userRepository.findByEmail(correo);
if (existingUser) {
const error = new Error('Email is already registered');
error.status = 409;
throw error;
}
// El rol debe existir
const role = await userRepository.findRoleById(id_rol);
if (!role) {
const error = new Error('Role does not exist');
error.status = 400;
throw error;
}
// Proteger contraseña
const hashedPassword = await bcrypt.hash(contrasena, 10);
const newUser = {
nombre,
correo,
contrasena: hashedPassword,
id_rol
};
const userId = await userRepository.create(newUser);
return {
id_usuario: userId,
nombre,
correo,
id_rol
};
}
module.exports = {
createUser
};