const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} = require("../src/modules/auth/auth.validator");

function runValidator(validator, body) {
  const result = {
    statusCode: 200,
    payload: null,
    nextCalled: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  const req = { body };
  validator(req, result, () => {
    result.nextCalled = true;
  });

  result.req = req;
  return result;
}

test("login normalizes email but preserves password characters exactly", () => {
  const body = {
    correo: "  Persona@Example.com ",
    contrasena: " pass ",
  };
  const result = runValidator(validateLogin, body);

  assert.equal(result.nextCalled, true);
  assert.equal(body.correo, "persona@example.com");
  assert.equal(body.contrasena, " pass ");
});

test("password change requires a strong matching confirmation", () => {
  const valid = runValidator(validateChangePassword, {
    contrasena_actual: "Old password",
    nueva_contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!x",
  });
  const mismatch = runValidator(validateChangePassword, {
    contrasena_actual: "Old password",
    nueva_contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!X",
  });

  assert.equal(valid.nextCalled, true);
  assert.equal(mismatch.statusCode, 400);
  assert.equal(mismatch.payload.message, "Passwords do not match");
});

test("password recovery normalizes the email and rejects malformed addresses", () => {
  const valid = runValidator(validateForgotPassword, {
    correo: " Persona@Example.com ",
  });
  const invalid = runValidator(validateForgotPassword, {
    correo: "not-an-email",
  });

  assert.equal(valid.nextCalled, true);
  assert.equal(valid.req.body.correo, "persona@example.com");
  assert.equal(valid.payload, null);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.payload.message, "Invalid email format");
});

test("password reset accepts a strong password and rejects invalid confirmation", () => {
  const token = "a".repeat(64);
  const valid = runValidator(validateResetPassword, {
    token: token.toUpperCase(),
    nueva_contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!x",
  });
  const mismatch = runValidator(validateResetPassword, {
    token,
    nueva_contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!X",
  });
  const malformed = runValidator(validateResetPassword, {
    token: "short",
    nueva_contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!x",
  });

  assert.equal(valid.nextCalled, true);
  assert.equal(valid.req.body.token, token);
  assert.equal(valid.req.body.confirmar_contrasena, undefined);
  assert.equal(mismatch.statusCode, 400);
  assert.equal(mismatch.payload.message, "Passwords do not match");
  assert.equal(malformed.statusCode, 400);
  assert.equal(
    malformed.payload.message,
    "A valid reset token, new password, and confirmation are required"
  );
});
