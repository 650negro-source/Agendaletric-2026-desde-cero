const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const clienteController = require("./cliente.controller");
const {
  validateCreateCliente,
  validateClienteId,
  validateUpdateCliente,
  validateStatus,
} = require("./cliente.validator");

const router = express.Router();

router.post("/", validateCreateCliente, clienteController.createCliente);

router.use(authenticate);

router.get("/me", authorizeRoles(2), clienteController.getMyCliente);

router.put("/me", authorizeRoles(2), validateUpdateCliente, clienteController.updateMyCliente);

router.get("/", authorizeRoles(1), clienteController.getClientes);

router.get("/:id", authorizeRoles(1), validateClienteId, clienteController.getClienteById);

router.put("/:id", authorizeRoles(1), validateClienteId, validateUpdateCliente, clienteController.updateCliente);

router.patch("/:id/status", authorizeRoles(1), validateClienteId, validateStatus, clienteController.changeClienteStatus);

router.delete("/:id", authorizeRoles(1), validateClienteId, clienteController.deleteCliente);

module.exports = router;
