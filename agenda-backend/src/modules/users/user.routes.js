const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const userController = require("./user.controller");

const {
  validateCreateUser,
  validateUserId,
  validateUpdateUser,
  validateStatus,
} = require("./user.validator");

const router = express.Router();

// Todas las rutas requieren un token JWT válido
router.use(authenticate);

// Crear usuario - Solo administrador
router.post( "/", authorizeRoles(1), validateCreateUser, userController.createUser);

// Listar usuarios - Solo administrador
router.get("/", authorizeRoles(1,3), userController.getUsers);

router.get("/me",  userController.getMyProfile);


// Consultar usuario por ID - Solo administrador
router.get("/:id", authorizeRoles(1,3), validateUserId, userController.getUserById);

// Actualizar usuario - Solo administrador
router.put("/:id", authorizeRoles(1), validateUserId, validateUpdateUser,userController.updateUser);

// Cambiar estado - Solo administrador
router.patch("/:id/status", authorizeRoles(1,3), validateUserId, validateStatus, userController.changeUserStatus);

// Eliminación lógica - Solo administrador
router.delete("/:id", authorizeRoles(1,), validateUserId, userController.deleteUser);



module.exports = router;
