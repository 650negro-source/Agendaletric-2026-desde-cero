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

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateTecnicoId(req, res, next) {
  const id = normalizeInteger(req.params.idUsuario);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid technician user ID",
    });
  }

  req.params.idUsuario = String(id);
  next();
}

function validateCreateTecnico(req, res, next) {
  const body = req.body || {};
  const idUsuario = normalizeInteger(body.id_usuario);
  const especialidad = normalizeText(body.especialidad);
  const telefono = normalizeText(body.telefono);

  if (
    idUsuario === undefined ||
    idUsuario <= 0 ||
    !especialidad ||
    especialidad.length > 100 ||
    !telefono ||
    telefono.length > 30
  ) {
    return res.status(400).json({
      message: "A valid user ID, specialty (up to 100 characters), and phone (up to 30 characters) are required",
    });
  }

  body.id_usuario = idUsuario;
  body.especialidad = especialidad;
  body.telefono = telefono;
  req.body = body;
  next();
}

function validateUpdateTecnico(req, res, next) {
  const body = req.body || {};
  const especialidad = normalizeText(body.especialidad);
  const telefono = normalizeText(body.telefono);

  if (
    !especialidad ||
    especialidad.length > 100 ||
    !telefono ||
    telefono.length > 30
  ) {
    return res.status(400).json({
      message: "A valid specialty (up to 100 characters) and phone (up to 30 characters) are required",
    });
  }

  body.especialidad = especialidad;
  body.telefono = telefono;
  req.body = body;
  next();
}

module.exports = {
  validateTecnicoId,
  validateCreateTecnico,
  validateUpdateTecnico,
};
