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

function validateCreateCliente(req, res, next) {
  const body = req.body || {};
  const { nombre_completo, documento_identidad, telefono, correo, contrasena, direccion } = body;

  if (!nombre_completo || !documento_identidad || !telefono || !correo || !contrasena) {
    return res.status(400).json({
      message: "Name, identity document, phone, email, and password are required",
    });
  }

  if (typeof nombre_completo !== "string" || nombre_completo.trim().length < 2) {
    return res.status(400).json({
      message: "Full name must contain at least 2 characters",
    });
  }

  if (nombre_completo.trim().length > 100) {
    return res.status(400).json({
      message: "Full name must not exceed 100 characters",
    });
  }

  if (
    typeof documento_identidad !== "string" ||
    !documento_identidad.trim() ||
    documento_identidad.trim().length > 50
  ) {
    return res.status(400).json({
      message: "Identity document is required and must not exceed 50 characters",
    });
  }

  if (typeof telefono !== "string" || !telefono.trim() || telefono.trim().length > 20) {
    return res.status(400).json({
      message: "Phone is required and must not exceed 20 characters",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof correo !== "string" || correo.trim().length > 150 || !emailRegex.test(correo.trim())) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  if (typeof contrasena !== "string" || contrasena.trim().length < 8) {
    return res.status(400).json({
      message: "Password must contain at least 8 characters",
    });
  }

  if (direccion !== undefined && direccion !== null && typeof direccion !== "string") {
    return res.status(400).json({
      message: "Address must be a string",
    });
  }
  if (typeof direccion === "string" && direccion.trim().length > 150) {
    return res.status(400).json({
      message: "Address must not exceed 150 characters",
    });
  }

  body.nombre_completo = nombre_completo.trim();
  body.documento_identidad = documento_identidad.trim();
  body.telefono = telefono.trim();
  body.correo = correo.trim();
  body.contrasena = contrasena.trim();
  body.direccion = typeof direccion === "string" ? direccion.trim() || null : null;
  req.body = body;

  next();
}

function validateUpdateCliente(req, res, next) {
  const body = req.body || {};
  const { nombre_completo, documento_identidad, telefono, correo, direccion } = body;

  if (!nombre_completo || !documento_identidad || !telefono || !correo) {
    return res.status(400).json({
      message: "Name, identity document, phone, and email are required",
    });
  }

  if (
    typeof nombre_completo !== "string" ||
    nombre_completo.trim().length < 2 ||
    nombre_completo.trim().length > 100
  ) {
    return res.status(400).json({
      message: "Invalid full name",
    });
  }

  if (
    typeof documento_identidad !== "string" ||
    !documento_identidad.trim() ||
    documento_identidad.trim().length > 50
  ) {
    return res.status(400).json({
      message: "Invalid identity document",
    });
  }

  if (typeof telefono !== "string" || !telefono.trim() || telefono.trim().length > 20) {
    return res.status(400).json({
      message: "Invalid phone",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof correo !== "string" || correo.trim().length > 150 || !emailRegex.test(correo.trim())) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  if (direccion !== undefined && direccion !== null && typeof direccion !== "string") {
    return res.status(400).json({
      message: "Address must be a string",
    });
  }
  if (typeof direccion === "string" && direccion.trim().length > 150) {
    return res.status(400).json({
      message: "Address must not exceed 150 characters",
    });
  }

  body.nombre_completo = nombre_completo.trim();
  body.documento_identidad = documento_identidad.trim();
  body.telefono = telefono.trim();
  body.correo = correo.trim();
  body.direccion = typeof direccion === "string" ? direccion.trim() || null : null;
  req.body = body;

  next();
}

function validateClienteId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid client ID",
    });
  }

  next();
}

function validateStatus(req, res, next) {
  const body = req.body || {};
  const estado = normalizeInteger(body.estado);

  if (estado !== 0 && estado !== 1) {
    return res.status(400).json({
      message: "Status must be 0 or 1",
    });
  }

  body.estado = estado;
  req.body = body;
  next();
}

module.exports = {
  validateCreateCliente,
  validateUpdateCliente,
  validateClienteId,
  validateStatus,
};
