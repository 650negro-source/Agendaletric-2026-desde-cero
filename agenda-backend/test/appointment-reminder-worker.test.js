const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/database");
const { processDueReminders } = require(
  "../src/modules/notificaciones/appointment-reminder.worker"
);

test("demo worker marks only due pending email and WhatsApp reminders for validated appointments", async () => {
  const originalExecute = pool.execute;
  let executedQuery = "";

  pool.execute = async (query) => {
    executedQuery = query;
    return [{ affectedRows: 2 }];
  };

  try {
    assert.equal(await processDueReminders(), 2);
    assert.match(executedQuery, /medio_envio IN \('CORREO', 'WHATSAPP'\)/);
    assert.match(executedQuery, /estado_envio = 'PENDIENTE'/);
    assert.match(executedQuery, /fecha_programada <= CURRENT_TIMESTAMP/);
    assert.match(executedQuery, /cita\.estado = 'VALIDADA'/);
    assert.match(executedQuery, /estado_envio = 'SIMULADO'/);
    assert.match(executedQuery, /fecha_envio = CURRENT_TIMESTAMP/);
  } finally {
    pool.execute = originalExecute;
  }
});
