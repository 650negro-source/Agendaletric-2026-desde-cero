const pool = require("../../config/database");

const APPOINTMENT_STATES = [
  "BORRADOR",
  "PROGRAMADA",
  "VALIDADA",
  "EN_PROCESO",
  "ATENDIDA",
  "CANCELADA",
];
const REPORT_STATES = ["BORRADOR", "PUBLICADO", "REQUIERE_CORRECCION"];

function countByState(rows, states, stateKey) {
  const counts = new Map(
    rows.map((row) => [row[stateKey], Number(row.total)])
  );
  return states.map((estado) => ({
    estado,
    total: counts.get(estado) || 0,
  }));
}

async function getSummary() {
  const [
    [appointmentCounts],
    [appointmentStates],
    [reportStates],
    [userCounts],
  ] = await Promise.all([
    pool.execute(
      `SELECT
         COUNT(
           CASE
             WHEN fecha_programada = CURRENT_DATE
               AND estado <> 'CANCELADA'
             THEN 1
           END
         ) AS citas_hoy,
         COUNT(
           CASE
             WHEN fecha_programada > CURRENT_DATE
               AND fecha_programada <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
               AND estado IN ('BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO')
             THEN 1
           END
         ) AS citas_proximos_7_dias
       FROM cita
       WHERE fecha_programada >= CURRENT_DATE
         AND fecha_programada <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)`
    ),
    pool.execute(
      `SELECT estado, COUNT(*) AS total
       FROM cita
       GROUP BY estado`
    ),
    pool.execute(
      `SELECT estado_publicacion, COUNT(*) AS total
       FROM reporte_tecnico
       GROUP BY estado_publicacion`
    ),
    pool.execute(
      `SELECT
         (
           SELECT COUNT(*)
           FROM cliente
           INNER JOIN usuario
             ON usuario.id_usuario = cliente.id_usuario
           WHERE cliente.estado = 1
             AND cliente.deleted_at IS NULL
             AND usuario.estado = 1
             AND usuario.deleted_at IS NULL
         ) AS clientes_activos,
         (
           SELECT COUNT(*)
           FROM tecnico
           INNER JOIN usuario
             ON usuario.id_usuario = tecnico.id_usuario
           WHERE usuario.id_rol_fk = 3
             AND usuario.estado = 1
             AND usuario.deleted_at IS NULL
         ) AS tecnicos_activos`
    ),
  ]);

  return {
    citas: {
      hoy: Number(appointmentCounts[0].citas_hoy),
      proximos_7_dias: Number(appointmentCounts[0].citas_proximos_7_dias),
      por_estado: countByState(appointmentStates, APPOINTMENT_STATES, "estado"),
    },
    reportes: {
      por_estado: countByState(
        reportStates,
        REPORT_STATES,
        "estado_publicacion"
      ),
    },
    clientes_activos: Number(userCounts[0].clientes_activos),
    tecnicos_activos: Number(userCounts[0].tecnicos_activos),
  };
}

module.exports = {
  getSummary,
};
