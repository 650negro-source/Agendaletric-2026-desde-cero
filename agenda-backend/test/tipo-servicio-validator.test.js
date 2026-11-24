const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateTipoServicioData,
} = require("../src/modules/tipos-servicio/tipo-servicio.validator");

function runValidator(body) {
  const req = { body };
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
  let nextCalled = false;

  validateTipoServicioData(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("service duration accepts whole hours from one to six", () => {
  for (const duration of [60, 120, 180, 240, 300, 360]) {
    const { req, nextCalled } = runValidator({
      nombre: "Servicio",
      duracion_minutos: String(duration),
    });

    assert.equal(nextCalled, true);
    assert.equal(req.body.duracion_minutos, duration);
  }
});

test("service duration rejects values outside whole-hour estimates", () => {
  for (const duration of [0, 30, 90, 420, "2 horas"]) {
    const { res, nextCalled } = runValidator({
      nombre: "Servicio",
      duracion_minutos: duration,
    });

    assert.equal(res.statusCode, 400);
    assert.equal(nextCalled, false);
  }
});

test("service duration may remain unset until administration estimates it", () => {
  const { req, nextCalled } = runValidator({
    nombre: "Servicio",
    duracion_minutos: null,
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.duracion_minutos, null);
});
