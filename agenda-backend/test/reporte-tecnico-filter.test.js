const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/database");
const reporteRepository = require("../src/modules/reportes-tecnicos/reporte-tecnico.repository");
const reporteService = require("../src/modules/reportes-tecnicos/reporte-tecnico.service");
const { validateEstadoPublicacion } = require("../src/modules/reportes-tecnicos/reporte-tecnico.validator");

function runValidator(state) {
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

  validateEstadoPublicacion(
    { params: { estado: state } },
    result,
    () => {
      result.nextCalled = true;
    }
  );
  return result;
}

test("report publication-state filter accepts only supported states", () => {
  for (const state of ["BORRADOR", "PUBLICADO", "REQUIERE_CORRECCION"]) {
    assert.equal(runValidator(state).nextCalled, true);
  }

  const invalidState = runValidator("INEXISTENTE");
  assert.equal(invalidState.statusCode, 400);
  assert.equal(invalidState.payload.message, "Invalid report publication state");
});

test("report repository returns appointment IDs for the selected publication state", async () => {
  const originalExecute = pool.execute;
  pool.execute = async (query, params) => {
    assert.match(query, /WHERE estado_publicacion = \?/);
    assert.deepEqual(params, ["PUBLICADO"]);
    return [[{ id_cita: "12" }, { id_cita: 24 }]];
  };

  try {
    assert.deepEqual(
      await reporteRepository.findCitaIdsByPublicationState("PUBLICADO"),
      [12, 24]
    );
  } finally {
    pool.execute = originalExecute;
  }
});

test("only administrators can query report appointment IDs by state", async () => {
  await assert.rejects(
    reporteService.getCitaIdsByPublicationState("PUBLICADO", { role: 2 }),
    { status: 403, message: "Access denied" }
  );
});
