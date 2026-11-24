const authService = require("./auth.service");

async function login(req, res, next) {
  try {
    const { correo, contrasena } = req.body;

    const result = await authService.login(
      correo,
      contrasena
    );

    return res.status(200).json({
      message: "Login successful",
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { contrasena_actual, nueva_contrasena } = req.body;
    await authService.changePassword(
      req.user.id,
      contrasena_actual,
      nueva_contrasena
    );

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { login, changePassword };
