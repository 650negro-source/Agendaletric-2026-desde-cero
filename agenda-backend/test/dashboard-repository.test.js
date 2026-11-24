const assert = require("node:assert/strict");
const test = require("node:test");
const pool = require("../src/config/database");
const dashboardRepository = require("../src/modules/dashboard/dashboard.repository");

test("dashboard summary aggregates all overview metrics and fills empty states with zero", async () => {
  const originalExecute = pool.execute;
  pool.execute = async (query) => {
    if (query.includes("citas_hoy")) {
      return [[{ citas_hoy: "3", citas_proximos_7_dias: "5" }]];
    }
    if (query.includes("estado_publicacion")) {
      return [[
        { estado_publicacion: "BORRADOR", total: 2 },
        { estado_publicacion: "PUBLICADO", total: 4 },
      ]];
    }
    if (query.includes("clientes_activos")) {
      return [[{ clientes_activos: 8, tecnicos_activos: 2 }]];
    }
    if (query.includes("GROUP BY estado")) {
      return [[
        { estado: "PROGRAMADA", total: 3 },
        { estado: "ATENDIDA", total: 6 },
      ]];
    }
    throw new Error("Unexpected dashboard query");
  };

  try {
    assert.deepEqual(await dashboardRepository.getSummary(), {
      citas: {
        hoy: 3,
        proximos_7_dias: 5,
        por_estado: [
          { estado: "BORRADOR", total: 0 },
          { estado: "PROGRAMADA", total: 3 },
          { estado: "VALIDADA", total: 0 },
          { estado: "EN_PROCESO", total: 0 },
          { estado: "ATENDIDA", total: 6 },
          { estado: "CANCELADA", total: 0 },
        ],
      },
      reportes: {
        por_estado: [
          { estado: "BORRADOR", total: 2 },
          { estado: "PUBLICADO", total: 4 },
          { estado: "REQUIERE_CORRECCION", total: 0 },
        ],
      },
      clientes_activos: 8,
      tecnicos_activos: 2,
    });
  } finally {
    pool.execute = originalExecute;
  }
});
