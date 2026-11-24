const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateCreateVehiculo,
  validateUpdateVehiculo,
  validateStatus,
} = require("../src/modules/vehiculos/vehiculo.validator");

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

function validVehicle() {
  return {
    placa: "abc123",
    marca: "Toyota",
    modelo: "Corolla",
    anio: 2020,
    color: "Blanco",
    tipo_vehiculo: "AUTOMOVIL",
    tipo_energia: "HIBRIDO",
    id_cliente: "8",
  };
}

test("vehicle create normalizes Colombian plates and client IDs", () => {
  const body = validVehicle();
  const result = runValidator(validateCreateVehiculo, body);

  assert.equal(result.nextCalled, true);
  assert.equal(body.placa, "ABC123");
  assert.equal(body.id_cliente, 8);
});

test("vehicle create and update reject non-Colombian car plate formats", () => {
  for (const plate of ["AB1234", "ABC12D", "ABC-123", "123ABC"]) {
    const createResult = runValidator(validateCreateVehiculo, {
      ...validVehicle(),
      placa: plate,
    });
    const updateResult = runValidator(validateUpdateVehiculo, {
      ...validVehicle(),
      placa: plate,
    });

    assert.equal(createResult.statusCode, 400, `create accepted ${plate}`);
    assert.equal(createResult.payload.message, "Plate must follow the Colombian format AAA999");
    assert.equal(updateResult.statusCode, 400, `update accepted ${plate}`);
  }
});

test("vehicle validation rejects unsupported types, energy, and out-of-range years", () => {
  const invalidCases = [
    { tipo_vehiculo: "MOTOCICLETA" },
    { tipo_energia: "GAS" },
    { anio: 1899 },
    { anio: new Date().getFullYear() + 2 },
  ];

  for (const invalidCase of invalidCases) {
    const result = runValidator(validateCreateVehiculo, {
      ...validVehicle(),
      ...invalidCase,
    });

    assert.equal(result.statusCode, 400);
  }
});

test("vehicle status only accepts active or inactive values", () => {
  assert.equal(runValidator(validateStatus, { estado: "0" }).nextCalled, true);

  for (const estado of [2, -1, "inactive"]) {
    const result = runValidator(validateStatus, { estado });
    assert.equal(result.statusCode, 400);
    assert.equal(result.payload.message, "Status must be 0 or 1");
  }
});
