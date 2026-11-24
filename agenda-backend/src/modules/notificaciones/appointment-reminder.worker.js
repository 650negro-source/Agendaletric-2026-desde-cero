const pool = require("../../config/database");

const POLL_INTERVAL_MS = 60 * 1000;

async function processDueReminders() {
  const [result] = await pool.execute(
    `UPDATE recordatorio
     INNER JOIN cita ON cita.id_cita = recordatorio.id_cita
     SET recordatorio.estado_envio = 'SIMULADO',
         recordatorio.fecha_envio = CURRENT_TIMESTAMP
     WHERE recordatorio.medio_envio = 'CORREO'
       AND recordatorio.estado_envio = 'PENDIENTE'
       AND recordatorio.fecha_programada <= CURRENT_TIMESTAMP
       AND cita.estado = 'VALIDADA'`
  );

  return result.affectedRows;
}

function startReminderWorker() {
  let isProcessing = false;

  async function processReminders() {
    if (isProcessing) {
      return;
    }

    isProcessing = true;
    try {
      const processedCount = await processDueReminders();
      if (processedCount > 0) {
        console.info(
          `Marked ${processedCount} appointment reminder(s) as simulated`
        );
      }
    } catch (error) {
      console.error("Appointment reminder processing failed", {
        error: error.message,
      });
    } finally {
      isProcessing = false;
    }
  }

  void processReminders();
  return setInterval(() => {
    void processReminders();
  }, POLL_INTERVAL_MS);
}

module.exports = {
  processDueReminders,
  startReminderWorker,
};
