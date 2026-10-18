const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const horarioController = require("./horario.controller");
const {
  validateCreateHorario,
  validateHorarioId,
  validateUpdateHorario,
} = require("./horario.validator");

const router = express.Router();

router.use(authenticate);

router.get("/me", authorizeRoles(3), horarioController.getMyHorarios);

router.post("/", authorizeRoles(1), validateCreateHorario, horarioController.createHorario);
router.get("/", authorizeRoles(1), horarioController.getHorarios);
router.get("/:id", authorizeRoles(1), validateHorarioId, horarioController.getHorarioById);
router.put("/:id", authorizeRoles(1), validateHorarioId, validateUpdateHorario, horarioController.updateHorario);
router.delete("/:id", authorizeRoles(1), validateHorarioId, horarioController.deleteHorario);

module.exports = router;
