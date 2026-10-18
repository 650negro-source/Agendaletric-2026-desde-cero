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

function validateTipoServicioId(req, res, next) {
  const id = normalizeInteger(req.params.id);
  if (id === undefined || id <= 0) {
    return res.status(400).json({ message: "Invalid service type ID" });
  }

  req.params.id = String(id);
  next();
}

function validateTipoServicioData(req, res, next) {
  const body = req.body || {};
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const descripcion = body.descripcion;
  const requiereDetalle = body.requiere_detalle;

  if (!nombre || nombre.length > 100) {
    return res.status(400).json({
      message: "A non-empty service type name of at most 100 characters is required",
    });
  }
  if (
    descripcion !== undefined &&
    descripcion !== null &&
    (typeof descripcion !== "string" || descripcion.length > 255)
  ) {
    return res.status(400).json({
      message: "Service description must be a string of at most 255 characters",
    });
  }
  if (
    requiereDetalle !== undefined &&
    requiereDetalle !== true &&
    requiereDetalle !== false &&
    requiereDetalle !== 0 &&
    requiereDetalle !== 1 &&
    requiereDetalle !== "0" &&
    requiereDetalle !== "1"
  ) {
    return res.status(400).json({
      message: "The requires-detail value must be true or false",
    });
  }

  req.body = {
    nombre,
    ...(descripcion !== undefined
      ? { descripcion: typeof descripcion === "string" ? descripcion.trim() || null : null }
      : {}),
    ...(requiereDetalle !== undefined
      ? {
          requiere_detalle:
            requiereDetalle === true ||
            requiereDetalle === 1 ||
            requiereDetalle === "1"
              ? 1
              : 0,
        }
      : {}),
  };
  next();
}

function validateTipoServicioEstado(req, res, next) {
  const estado = normalizeInteger(req.body?.estado);
  if (estado !== 0 && estado !== 1) {
    return res.status(400).json({ message: "Status must be 0 or 1" });
  }

  req.body = { ...(req.body || {}), estado };
  next();
}

module.exports = {
  validateTipoServicioId,
  validateTipoServicioData,
  validateTipoServicioEstado,
};
