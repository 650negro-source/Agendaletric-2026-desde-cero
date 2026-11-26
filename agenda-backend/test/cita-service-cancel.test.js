const test = require("node:test");
const assert = require("node:assert/strict");
const citaRepository = require("../src/modules/citas/cita.repository");
const citaService = require("../src/modules/citas/cita.service");

test("only customers are subject to the 12-hour cancellation notice", async (t) => {
  const appointment = {
    id_cita: 7,
    estado: "PROGRAMADA",
    id_usuario_cliente: 10,
    id_usuario_tecnico: 20,
  };
  const cancellationCalls = [];

  t.mock.method(citaRepository, "findById", async () => appointment);
  t.mock.method(citaRepository, "cancelarCita", async (...args) => {
    cancellationCalls.push(args);
    return { estado: "CANCELADA" };
  });

  await citaService.cancelarCita(7, { id: 1, role: 1 });
  await citaService.cancelarCita(7, { id: 10, role: 2 });
  await citaService.cancelarCita(7, { id: 20, role: 3 });

  assert.deepEqual(
    cancellationCalls.map(([, , , enforceNotice]) => enforceNotice),
    [false, true, false]
  );
});
