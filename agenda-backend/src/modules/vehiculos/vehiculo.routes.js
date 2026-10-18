const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const vehiculoController = require("./vehiculo.controller");
const {
  validateCreateVehiculo,
  validateVehiculoId,
  validateUpdateVehiculo,
} = require("./vehiculo.validator");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRoles(1, 2));

router.post("/", validateCreateVehiculo, vehiculoController.createVehiculo);
router.get("/", vehiculoController.getVehiculos);
router.get("/:id", validateVehiculoId, vehiculoController.getVehiculoById);
router.put("/:id", validateVehiculoId, validateUpdateVehiculo, vehiculoController.updateVehiculo);

module.exports = router;
