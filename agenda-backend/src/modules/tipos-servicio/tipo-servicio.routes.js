const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const tipoServicioController = require("./tipo-servicio.controller");
const {
  validateTipoServicioId,
  validateTipoServicioData,
  validateTipoServicioEstado,
} = require("./tipo-servicio.validator");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles(1, 2, 3), tipoServicioController.findAll);
router.get(
  "/:id",
  authorizeRoles(1),
  validateTipoServicioId,
  tipoServicioController.findById
);
router.post(
  "/",
  authorizeRoles(1),
  validateTipoServicioData,
  tipoServicioController.create
);
router.put(
  "/:id",
  authorizeRoles(1),
  validateTipoServicioId,
  validateTipoServicioData,
  tipoServicioController.update
);
router.patch(
  "/:id/estado",
  authorizeRoles(1),
  validateTipoServicioId,
  validateTipoServicioEstado,
  tipoServicioController.updateEstado
);

module.exports = router;
