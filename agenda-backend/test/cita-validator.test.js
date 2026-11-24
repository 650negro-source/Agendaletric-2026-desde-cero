const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateAvailabilityQuery,
} = require("../src/modules/citas/cita.validator");

function runValidator(query) {
  const req = { query };
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

  validateAvailabilityQuery(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("availability query normalizes service and optional appointment IDs", () => {
  const { req, nextCalled } = runValidator({
    fecha: "2026-07-24",
    id_tipo_servicio: "5",
    id_cita: "12",
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.availabilityQuery, {
    fecha: "2026-07-24",
    id_tipo_servicio: 5,
    id_cita: 12,
  });
});

test("availability query rejects invalid dates and non-positive IDs", () => {
  const invalidQueries = [
    { fecha: "2026-02-30", id_tipo_servicio: "5" },
    { fecha: "2026-07-24", id_tipo_servicio: "0" },
    { fecha: "2026-07-24", id_tipo_servicio: "5", id_cita: "x" },
  ];

  for (const query of invalidQueries) {
    const { res, nextCalled } = runValidator(query);
    assert.equal(res.statusCode, 400);
    assert.equal(nextCalled, false);
  }
});
