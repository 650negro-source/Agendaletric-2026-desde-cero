const {
  getPasswordError,
  getPasswordConfirmationError,
} = require("../../utils/password-policy");
const {
  normalizeEmail,
  normalizePersonName,
} = require("../../utils/identity-policy");

const identityDocumentPattern = /^\d{6,10}$/;
const mobilePhonePattern = /^3\d{9}$/;

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
  const {
    nombre_completo,
    documento_identidad,
    telefono,
    correo,
    contrasena,
    confirmar_contrasena,
    direccion,
  } = body;
  const nombre = normalizePersonName(nombre_completo);
  const email = normalizeEmail(correo);

  if (
    !nombre_completo ||
    !documento_identidad ||
    !telefono ||
    !correo ||
    typeof contrasena !== "string" ||
    typeof confirmar_contrasena !== "string"
  ) {
    return res.status(400).json({
      message: "Name, identity document, phone, email, and password are required",
    });
  }

  if (!nombre) {
    return res.status(400).json({
      message: "Invalid name",
    });
  }

  if (
    typeof documento_identidad !== "string" ||
    !identityDocumentPattern.test(documento_identidad.trim())
  ) {
    return res.status(400).json({
      message: "Identity document must contain 6 to 10 digits",
    });
  }

  if (
    typeof telefono !== "string" ||
    !mobilePhonePattern.test(telefono.trim())
  ) {
    return res.status(400).json({
      message: "Mobile phone must contain 10 digits and start with 3",
    });
  }

  if (!email) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  const passwordError = getPasswordError(contrasena);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }
  const confirmationError = getPasswordConfirmationError(
    contrasena,
    confirmar_contrasena
  );
  if (confirmationError) {
    return res.status(400).json({ message: confirmationError });
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

  body.nombre_completo = nombre;
  body.documento_identidad = documento_identidad.trim();
  body.telefono = telefono.trim();
  body.correo = email;
  body.direccion = typeof direccion === "string" ? direccion.trim() || null : null;
  delete body.confirmar_contrasena;
  req.body = body;

  next();
}

function validateUpdateCliente(req, res, next) {
  const body = req.body || {};
  const { nombre_completo, documento_identidad, telefono, correo, direccion } = body;
  const nombre = normalizePersonName(nombre_completo);
  const email = normalizeEmail(correo);

  if (!nombre_completo || !documento_identidad || !telefono || !correo) {
    return res.status(400).json({
      message: "Name, identity document, phone, and email are required",
    });
  }

  if (!nombre) {
    return res.status(400).json({
      message: "Invalid full name",
    });
  }

  if (
    typeof documento_identidad !== "string" ||
    !identityDocumentPattern.test(documento_identidad.trim())
  ) {
    return res.status(400).json({
      message: "Identity document must contain 6 to 10 digits",
    });
  }

  if (
    typeof telefono !== "string" ||
    !mobilePhonePattern.test(telefono.trim())
  ) {
    return res.status(400).json({
      message: "Mobile phone must contain 10 digits and start with 3",
    });
  }

  if (!email) {
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

  body.nombre_completo = nombre;
  body.documento_identidad = documento_identidad.trim();
  body.telefono = telefono.trim();
  body.correo = email;
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
