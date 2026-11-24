const {
  getPasswordError,
  getPasswordConfirmationError,
} = require("../../utils/password-policy");
const { normalizeEmail } = require("../../utils/identity-policy");

function validateLogin(req, res, next) {
  const correo = typeof req.body?.correo === "string" ? req.body.correo : req.body?.email;
  const contrasena = req.body?.contrasena;
  const normalizedEmail = normalizeEmail(correo);

  if (
    typeof correo !== "string" ||
    typeof contrasena !== "string" ||
    contrasena.length === 0
  ) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }
  if (!normalizedEmail) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  req.body.correo = normalizedEmail;

  next();
}

function validateChangePassword(req, res, next) {
  const body = req.body || {};
  const { contrasena_actual, nueva_contrasena, confirmar_contrasena } = body;

  if (
    typeof contrasena_actual !== "string" ||
    contrasena_actual.length === 0 ||
    typeof nueva_contrasena !== "string" ||
    typeof confirmar_contrasena !== "string"
  ) {
    return res.status(400).json({
      message: "Current password, new password, and confirmation are required",
    });
  }

  const passwordError = getPasswordError(nueva_contrasena);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const confirmationError = getPasswordConfirmationError(
    nueva_contrasena,
    confirmar_contrasena
  );
  if (confirmationError) {
    return res.status(400).json({ message: confirmationError });
  }

  next();
}

function validateForgotPassword(req, res, next) {
  const correo = typeof req.body?.correo === "string"
    ? req.body.correo
    : req.body?.email;
  const normalizedEmail = normalizeEmail(correo);

  if (!normalizedEmail) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  req.body = { correo: normalizedEmail };
  next();
}

function validateResetPassword(req, res, next) {
  const token = typeof req.body?.token === "string"
    ? req.body.token.trim()
    : "";
  const nuevaContrasena = req.body?.nueva_contrasena;
  const confirmarContrasena = req.body?.confirmar_contrasena;

  if (
    !/^[a-f0-9]{64}$/i.test(token) ||
    typeof nuevaContrasena !== "string" ||
    typeof confirmarContrasena !== "string"
  ) {
    return res.status(400).json({
      message: "A valid reset token, new password, and confirmation are required",
    });
  }

  const passwordError = getPasswordError(nuevaContrasena);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const confirmationError = getPasswordConfirmationError(
    nuevaContrasena,
    confirmarContrasena
  );
  if (confirmationError) {
    return res.status(400).json({ message: confirmationError });
  }

  req.body = {
    token: token.toLowerCase(),
    nueva_contrasena: nuevaContrasena,
  };
  next();
}

module.exports = {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
};
