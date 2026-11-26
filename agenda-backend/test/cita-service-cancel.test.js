const test = require("node:test");
const assert = require("node:assert/strict");
const citaRepository = require("../src/modules/citas/cita.repository");
const citaService = require("../src/modules/citas/cita.service");

test("cancellation applies the same notice rule to every authorized role", async (t) => {
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

  assert.deepEqual(cancellationCalls, [
    [7, 1, "PROGRAMADA"],
    [7, 10, "PROGRAMADA"],
    [7, 20, "PROGRAMADA"],
  ]);
});

test("appointments in progress cannot be cancelled or rescheduled", async (t) => {
  const appointment = {
    id_cita: 7,
    estado: "EN_PROCESO",
    id_usuario_cliente: 10,
    id_usuario_tecnico: 20,
  };
  let cancellationAttempted = false;
  let rescheduleAttempted = false;

  t.mock.method(citaRepository, "findById", async () => appointment);
  t.mock.method(citaRepository, "cancelarCita", async () => {
    cancellationAttempted = true;
  });
  t.mock.method(citaRepository, "reprogramarCita", async () => {
    rescheduleAttempted = true;
  });

  await assert.rejects(
    citaService.cancelarCita(7, { id: 10, role: 2 }),
    { status: 409, message: "Appointment cannot be changed while it is in progress" }
  );
  await assert.rejects(
    citaService.reprogramarCita(
      7,
      { fecha_programada: "2030-01-02", hora_programada: "10:00" },
      { id: 10, role: 2 }
    ),
    { status: 409, message: "Appointment cannot be changed while it is in progress" }
  );

  assert.equal(cancellationAttempted, false);
  assert.equal(rescheduleAttempted, false);
});
