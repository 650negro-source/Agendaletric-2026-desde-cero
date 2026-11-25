const express = require("express");
const authenticate = require("../../middlewares/auth.middleware");
const authorizeRoles = require("../../middlewares/role.middleware");

const reporteController = require("./reporte-tecnico.controller");
const { receiveEvidence } = require("./reporte-tecnico.upload");
const {
  validateReporteId,
  validateEstadoPublicacion,
  validateArchivoId,
  validateUpdateReporte,
  validateSolicitudCorreccion,
} = require("./reporte-tecnico.validator");

const router = express.Router();

router.use(authenticate);

router.get(
  "/estado/:estado",
  authorizeRoles(1),
  validateEstadoPublicacion,
  reporteController.getCitaIdsByPublicationState
);
router.get(
  "/:idCita",
  authorizeRoles(1, 2, 3),
  validateReporteId,
  reporteController.getByCitaId
);
router.put(
  "/:idCita",
  authorizeRoles(1, 3),
  validateReporteId,
  validateUpdateReporte,
  reporteController.updateByCitaId
);
router.post(
  "/:idCita/archivos",
  authorizeRoles(1, 3),
  validateReporteId,
  reporteController.ensureCanManageReport,
  receiveEvidence,
  reporteController.addArchivo
);
router.get(
  "/:idCita/archivos/:idArchivo",
  authorizeRoles(1, 3),
  validateReporteId,
  validateArchivoId,
  reporteController.downloadArchivo
);
router.post(
  "/:idCita/enviar",
  authorizeRoles(1, 3),
  validateReporteId,
  reporteController.publishByCitaId
);
router.post(
  "/:idCita/solicitar-correccion",
  authorizeRoles(1),
  validateReporteId,
  validateSolicitudCorreccion,
  reporteController.requestCorrectionByCitaId
);
router.post(
  "/:idCita/reintentar-notificacion",
  authorizeRoles(1, 3),
  validateReporteId,
  reporteController.retryNotificationByCitaId
);
router.get(
  "/:idCita/pdf",
  authorizeRoles(1, 2, 3),
  validateReporteId,
  reporteController.downloadPdf
);

module.exports = router;
