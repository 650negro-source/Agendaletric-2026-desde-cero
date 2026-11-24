const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateCreateCliente,
  validateUpdateCliente,
} = require("../src/modules/clientes/cliente.validator");

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

function validCustomer() {
  return {
    nombre_completo: "María López",
    documento_identidad: "1234567890",
    telefono: "3001234567",
    correo: "Maria@Example.com",
    contrasena: "Abcdefg1!x",
    confirmar_contrasena: "Abcdefg1!x",
    direccion: "Cali",
  };
}

test("customer registration accepts Colombian ID and mobile formats", () => {
  const body = validCustomer();
  const result = runValidator(validateCreateCliente, body);

  assert.equal(result.nextCalled, true);
  assert.equal(body.documento_identidad, "1234567890");
  assert.equal(body.telefono, "3001234567");
  assert.equal(body.correo, "maria@example.com");
  assert.equal("confirmar_contrasena" in body, false);
});

test("customer create and update reject ID documents outside 6 to 10 digits", () => {
  for (const document of ["12345", "12345678901", "1234A678"]) {
    const createResult = runValidator(validateCreateCliente, {
      ...validCustomer(),
      documento_identidad: document,
    });
    const updateResult = runValidator(validateUpdateCliente, {
      ...validCustomer(),
      documento_identidad: document,
    });

    assert.equal(createResult.statusCode, 400, `create accepted ${document}`);
    assert.equal(createResult.payload.message, "Identity document must contain 6 to 10 digits");
    assert.equal(updateResult.statusCode, 400, `update accepted ${document}`);
    assert.equal(updateResult.payload.message, "Identity document must contain 6 to 10 digits");
  }
});

test("customer create and update require a 10-digit Colombian mobile starting with 3", () => {
  for (const phone of ["300123456", "2001234567", "30012345678"]) {
    const createResult = runValidator(validateCreateCliente, {
      ...validCustomer(),
      telefono: phone,
    });
    const updateResult = runValidator(validateUpdateCliente, {
      ...validCustomer(),
      telefono: phone,
    });

    assert.equal(createResult.statusCode, 400, `create accepted ${phone}`);
    assert.equal(updateResult.statusCode, 400, `update accepted ${phone}`);
    assert.equal(createResult.payload.message, "Mobile phone must contain 10 digits and start with 3");
    assert.equal(updateResult.payload.message, "Mobile phone must contain 10 digits and start with 3");
  }
});
