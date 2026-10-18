const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const tipoAveriaController = require("./tipo-averia.controller");
const {
  validateTipoAveriaId,
  validateTipoAveriaNombre,
  validateTipoAveriaEstado,
} = require("./tipo-averia.validator");

const router = express.Router();

router.use(authenticate);

router.get("/", authorizeRoles(1, 2, 3), tipoAveriaController.findAll);
router.get(
  "/:id",
  authorizeRoles(1),
  validateTipoAveriaId,
  tipoAveriaController.findById
);
router.post(
  "/",
  authorizeRoles(1),
  validateTipoAveriaNombre,
  tipoAveriaController.create
);
router.put(
  "/:id",
  authorizeRoles(1),
  validateTipoAveriaId,
  validateTipoAveriaNombre,
  tipoAveriaController.update
);
router.patch(
  "/:id/estado",
  authorizeRoles(1),
  validateTipoAveriaId,
  validateTipoAveriaEstado,
  tipoAveriaController.updateEstado
);

module.exports = router;
