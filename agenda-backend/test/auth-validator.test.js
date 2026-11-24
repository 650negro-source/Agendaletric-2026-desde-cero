const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateLogin,
  validateChangePassword,
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

  validator({ body }, result, () => {
    result.nextCalled = true;
  });

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
