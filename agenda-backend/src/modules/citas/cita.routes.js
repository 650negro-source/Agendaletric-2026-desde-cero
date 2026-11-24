const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const citaController = require("./cita.controller");
const {
  validateCreateCita,
  validateReprogramCita,
  validateAvailabilityQuery,
  validateCitaId,
  validateObservaciones,
  validateFinalizeCita,
} = require("./cita.validator");

const router = express.Router();

router.use(authenticate);

router.post("/", authorizeRoles(2), validateCreateCita, citaController.createCita);
router.get("/", authorizeRoles(1, 2, 3), citaController.getCitas);
router.get(
  "/disponibilidad",
  authorizeRoles(1, 2, 3),
  validateAvailabilityQuery,
  citaController.getDisponibilidad
);
router.get("/:id/historial", authorizeRoles(1, 2, 3), validateCitaId, citaController.getHistorial);
router.get("/:id", authorizeRoles(1, 2, 3), validateCitaId, citaController.getCitaById);
router.patch("/:id/validar", authorizeRoles(1, 3), validateCitaId, validateObservaciones, citaController.validarCita);
router.patch("/:id/iniciar", authorizeRoles(1, 3), validateCitaId, validateObservaciones, citaController.iniciarCita);
router.patch("/:id/finalizar", authorizeRoles(1, 3), validateCitaId, validateFinalizeCita, citaController.finalizarCita);
router.patch("/:id/cancelar", authorizeRoles(1, 2, 3), validateCitaId, citaController.cancelarCita);
router.patch("/:id/reprogramar", authorizeRoles(1, 2, 3), validateCitaId, validateReprogramCita, citaController.reprogramarCita);

module.exports = router;
