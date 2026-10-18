function validateLogin(req, res, next) {
  const correo = typeof req.body?.correo === "string" ? req.body.correo : req.body?.email;
  const contrasena = req.body?.contrasena;

  if (
    typeof correo !== "string" ||
    !correo.trim() ||
    typeof contrasena !== "string" ||
    !contrasena.trim()
  ) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  req.body.correo = correo.trim();
  req.body.contrasena = contrasena.trim();

  next();
}

module.exports = { validateLogin };
