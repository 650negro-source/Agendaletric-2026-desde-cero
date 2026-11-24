const bcrypt = require('bcrypt');
const userRepository = require('./user.repository');
const CUSTOMER_ROLE_ID = 2;
const ASSIGNABLE_USER_ROLE_IDS = new Set([1, 3]);
const assignableRoleError = 'Role cannot be assigned through user management';

async function createUser(userData) {
const { nombre, correo, contrasena, id_rol } = userData;
if (!ASSIGNABLE_USER_ROLE_IDS.has(Number(id_rol))) {
const error = new Error('Only administrator and technician accounts can be created through user management');
error.status = 400;
throw error;
}
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
let userId;
try {
userId = await userRepository.create(newUser);
} catch (error) {
if (error.code === 'ER_DUP_ENTRY') {
const conflict = new Error('Email is already registered');
conflict.status = 409;
throw conflict;
}
throw error;
}
return {
id_usuario: userId,
nombre,
correo,
id_rol
};
}

// Listar usuarios
async function getUsers() {
return await userRepository.findAll();
}
// Consultar usuario por ID
async function getUserById(id) {
const user = await userRepository.findById(id);
if (!user) {
const error = new Error('User not found');
error.status = 404;
throw error;
}
return user;
}
// Actualizar usuario
async function updateUser(id, userData, actorId) {
const user = await userRepository.findById(id);
if (!user) {
const error = new Error('User not found');
error.status = 404;
throw error;
}
const currentRoleId = Number(user.id_rol);
const targetRoleId = Number(userData.id_rol);
if (Number(id) === Number(actorId) && currentRoleId !== targetRoleId) {
const error = new Error('You cannot change your own role; ask another administrator');
error.status = 409;
throw error;
}
const existingCustomerRole = currentRoleId === CUSTOMER_ROLE_ID &&
targetRoleId === CUSTOMER_ROLE_ID;
if (!ASSIGNABLE_USER_ROLE_IDS.has(targetRoleId) && !existingCustomerRole) {
const error = new Error(assignableRoleError);
error.status = 400;
throw error;
}
const existingEmail =
await userRepository.findByEmail(userData.correo);
if (
existingEmail &&
existingEmail.id_usuario !== Number(id)
) {
const error = new Error('Email is already registered');
error.status = 409;
throw error;
}
const role =
await userRepository.findRoleById(userData.id_rol);
if (!role) {
const error = new Error('Role does not exist');
error.status = 400;
throw error;
}
try {
await userRepository.update(id, userData);
} catch (error) {
if (error.code === 'ER_DUP_ENTRY') {
const conflict = new Error('Email is already registered');
conflict.status = 409;
throw conflict;
}
throw error;
}
return await userRepository.findById(id);
}
// Cambiar estado
async function changeUserStatus(id, estado) {
const user = await userRepository.findById(id);
if (!user) {
const error = new Error('User not found');
error.status = 404;
throw error;
}
await userRepository.updateStatus(id, estado);
return await userRepository.findById(id);
}
// Eliminación lógica
async function deleteUser(id) {
const user = await userRepository.findById(id);
if (!user) {
const error = new Error('User not found');
error.status = 404;
throw error;
}
await userRepository.softDelete(id);
}

module.exports = {
createUser,
getUsers,
getUserById,
updateUser,
changeUserStatus,
deleteUser
};