function normalizeInteger(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const asNumber = Number(trimmed);
    return Number.isInteger(asNumber) ? asNumber : undefined;
  }

  return undefined;
}

function validateReporteId(req, res, next) {
  const id = normalizeInteger(req.params.idCita);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid appointment ID",
    });
  }

  req.params.idCita = String(id);
  next();
}

function validateEstadoPublicacion(req, res, next) {
  const states = ["BORRADOR", "PUBLICADO", "REQUIERE_CORRECCION"];
  const state = req.params.estado;

  if (!states.includes(state)) {
    return res.status(400).json({
      message: "Invalid report publication state",
    });
  }

  next();
}

function validateArchivoId(req, res, next) {
  const id = normalizeInteger(req.params.idArchivo);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid evidence ID",
    });
  }

  req.params.idArchivo = String(id);
  next();
}

function validateUpdateReporte(req, res, next) {
  const body = req.body || {};
  const { diagnostico, procedimiento_realizado, observaciones } = body;

  if (
    typeof diagnostico !== "string" ||
    !diagnostico.trim() ||
    typeof procedimiento_realizado !== "string" ||
    !procedimiento_realizado.trim()
  ) {
    return res.status(400).json({
      message: "Diagnosis and completed procedure are required",
    });
  }
  if (
    observaciones !== undefined &&
    observaciones !== null &&
    typeof observaciones !== "string"
  ) {
    return res.status(400).json({
      message: "Observations must be a string",
    });
  }

  body.diagnostico = diagnostico.trim();
  body.procedimiento_realizado = procedimiento_realizado.trim();
  body.observaciones =
    typeof observaciones === "string" ? observaciones.trim() || null : null;
  req.body = body;
  next();
}

function validateSolicitudCorreccion(req, res, next) {
  const comentario =
    typeof req.body?.comentario === "string"
      ? req.body.comentario.trim()
      : "";

  if (!comentario) {
    return res.status(400).json({
      message: "A correction comment is required",
    });
  }

  req.body = { comentario };
  next();
}

module.exports = {
  validateReporteId,
  validateEstadoPublicacion,
  validateArchivoId,
  validateUpdateReporte,
  validateSolicitudCorreccion,
};
