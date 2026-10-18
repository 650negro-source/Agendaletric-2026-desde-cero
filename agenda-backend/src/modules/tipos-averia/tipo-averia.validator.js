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

function validateTipoAveriaId(req, res, next) {
  const id = normalizeInteger(req.params.id);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid fault type ID",
    });
  }

  req.params.id = String(id);
  next();
}

function validateTipoAveriaNombre(req, res, next) {
  const body = req.body || {};
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";

  if (!nombre || nombre.length > 100) {
    return res.status(400).json({
      message: "A non-empty fault type name of at most 100 characters is required",
    });
  }

  body.nombre = nombre;
  req.body = body;
  next();
}

function validateTipoAveriaEstado(req, res, next) {
  const estado = normalizeInteger(req.body?.estado);

  if (estado !== 0 && estado !== 1) {
    return res.status(400).json({
      message: "Status must be 0 or 1",
    });
  }

  req.body = { ...(req.body || {}), estado };
  next();
}

module.exports = {
  validateTipoAveriaId,
  validateTipoAveriaNombre,
  validateTipoAveriaEstado,
};
