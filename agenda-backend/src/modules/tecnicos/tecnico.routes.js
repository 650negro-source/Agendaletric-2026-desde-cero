const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const tecnicoController = require("./tecnico.controller");
const {
  validateTecnicoId,
  validateCreateTecnico,
  validateUpdateTecnico,
} = require("./tecnico.validator");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRoles(1),
  validateCreateTecnico,
  tecnicoController.create
);
router.get("/", authorizeRoles(1), tecnicoController.findAll);
router.get("/me", authorizeRoles(3), tecnicoController.findMyProfile);
router.get(
  "/:idUsuario",
  authorizeRoles(1),
  validateTecnicoId,
  tecnicoController.findById
);
router.put(
  "/:idUsuario",
  authorizeRoles(1),
  validateTecnicoId,
  validateUpdateTecnico,
  tecnicoController.update
);

module.exports = router;
