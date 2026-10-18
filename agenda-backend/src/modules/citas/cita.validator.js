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

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeTime(value) {
  if (typeof value !== "string") {
    return undefined;
  }

  value = value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)) {
    return undefined;
  }

  return value.length === 5 ? `${value}:00` : value;
}

function validateCreateCita(req, res, next) {
  const body = req.body || {};
  const idVehiculo = normalizeInteger(body.id_vehiculo);
  const idTipoAveria = normalizeInteger(body.id_tipo_averia);
  const idTipoServicio = normalizeInteger(body.id_tipo_servicio);
  const horaProgramada = normalizeTime(body.hora_programada);
  const observaciones = body.observaciones;
  const detalleServicio = body.detalle_servicio;

  if (
    idVehiculo === undefined ||
    idVehiculo <= 0 ||
    idTipoAveria === undefined ||
    idTipoAveria <= 0 ||
    idTipoServicio === undefined ||
    idTipoServicio <= 0 ||
    !isValidDate(body.fecha_programada) ||
    !horaProgramada ||
    typeof body.descripcion_averia !== "string" ||
    !body.descripcion_averia.trim()
  ) {
    return res.status(400).json({
      message: "A valid vehicle, fault type, service type, date, time, and issue description are required",
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
  if (
    detalleServicio !== undefined &&
    detalleServicio !== null &&
    (typeof detalleServicio !== "string" || detalleServicio.length > 1000)
  ) {
    return res.status(400).json({
      message: "Service details must be a string of at most 1000 characters",
    });
  }

  body.id_vehiculo = idVehiculo;
  body.id_tipo_averia = idTipoAveria;
  body.id_tipo_servicio = idTipoServicio;
  body.hora_programada = horaProgramada;
  body.descripcion_averia = body.descripcion_averia.trim();
  body.detalle_servicio =
    typeof detalleServicio === "string" ? detalleServicio.trim() || null : null;
  body.observaciones =
    typeof observaciones === "string" ? observaciones.trim() || null : null;
  req.body = body;
  next();
}

function validateReprogramCita(req, res, next) {
  const body = req.body || {};
  const fechaProgramada = body.fecha_programada;
  const horaProgramada = normalizeTime(body.hora_programada);

  if (!isValidDate(fechaProgramada) || !horaProgramada) {
    return res.status(400).json({
      message: "A valid appointment date and time are required",
    });
  }

  body.hora_programada = horaProgramada;
  req.body = body;
  next();
}

function validateCitaId(req, res, next) {
  const id = normalizeInteger(req.params.id);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid appointment ID",
    });
  }

  req.params.id = String(id);
  next();
}

function validateObservaciones(req, res, next) {
  const body = req.body || {};
  const { observaciones } = body;

  if (
    observaciones !== undefined &&
    observaciones !== null &&
    typeof observaciones !== "string"
  ) {
    return res.status(400).json({
      message: "Observations must be a string",
    });
  }

  body.observaciones =
    typeof observaciones === "string" ? observaciones.trim() || null : null;
  req.body = body;
  next();
}

function validateFinalizeCita(req, res, next) {
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

module.exports = {
  validateCreateCita,
  validateReprogramCita,
  validateCitaId,
  validateObservaciones,
  validateFinalizeCita,
};
