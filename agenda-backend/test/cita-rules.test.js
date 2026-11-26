const assert = require("node:assert/strict");
const test = require("node:test");
const { assertCanChangeAppointment } = require(
  "../src/modules/citas/cita.rules"
);

test("only appointments not yet in progress can be cancelled or rescheduled", () => {
  for (const state of ["BORRADOR", "PROGRAMADA", "VALIDADA"]) {
    assert.doesNotThrow(() => assertCanChangeAppointment(state, "cancelled"));
    assert.doesNotThrow(() => assertCanChangeAppointment(state, "rescheduled"));
  }

  for (const state of ["EN_PROCESO", "ATENDIDA", "CANCELADA"]) {
    assert.throws(
      () => assertCanChangeAppointment(state, "rescheduled"),
      { status: 409 }
    );
    assert.throws(
      () => assertCanChangeAppointment(state, "cancelled"),
      { status: 409 }
    );
  }
});
