const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/database");
const vehiculoRepository = require("../src/modules/vehiculos/vehiculo.repository");
const vehiculoService = require("../src/modules/vehiculos/vehiculo.service");

function createConnection({ clientDeleted = true, activeAppointments = false } = {}) {
  const queries = [];
  const vehicle = {
    id_vehiculo: 4,
    placa: "ABC123",
    marca: "Marca",
    modelo: "Modelo",
    anio: 2020,
    color: "Azul",
    tipo_vehiculo: "AUTOMOVIL",
    tipo_energia: "GASOLINA",
    deleted_at: clientDeleted ? "2026-01-01 10:00:00" : null,
  };
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query) {
      queries.push(query);
      if (query.includes("FROM vehiculo v")) return [[vehicle]];
      if (query.includes("FROM cita") && query.includes("SELECT id_cita")) {
        return [activeAppointments ? [{ id_cita: 9 }] : []];
      }
      return [{ affectedRows: 1 }];
    },
  };

  return { connection, queries };
}

test("permanent deletion preserves canceled appointment vehicle details", async (t) => {
  const { connection, queries } = createConnection();
  t.mock.method(pool, "getConnection", async () => connection);

  const result = await vehiculoRepository.deletePermanently(4);
  const detachIndex = queries.findIndex((query) => query.includes("UPDATE cita"));
  const deleteIndex = queries.findIndex((query) => query.includes("DELETE FROM vehiculo"));

  assert.deepEqual(result, { deleted: true });
  assert.ok(detachIndex >= 0);
  assert.ok(deleteIndex > detachIndex);
  assert.match(queries[detachIndex], /vehiculo_placa_historial/);
  assert.match(queries[detachIndex], /id_vehiculo = NULL/);
});

test("permanent deletion requires a deleted client", async (t) => {
  const { connection } = createConnection({ clientDeleted: false });
  t.mock.method(pool, "getConnection", async () => connection);

  await assert.rejects(
    vehiculoService.deleteVehiculoPermanently(4, { role: 1 }),
    (error) => error.status === 409
  );
});

test("permanent deletion is blocked while appointments are active", async (t) => {
  const { connection, queries } = createConnection({ activeAppointments: true });
  t.mock.method(pool, "getConnection", async () => connection);

  await assert.rejects(
    vehiculoService.deleteVehiculoPermanently(4, { role: 1 }),
    (error) => error.status === 409
  );
  assert.equal(queries.some((query) => query.includes("UPDATE cita")), false);
  assert.equal(queries.some((query) => query.includes("DELETE FROM vehiculo")), false);
});

test("only administrators may permanently delete vehicles", async (t) => {
  let connectionRequested = false;
  t.mock.method(pool, "getConnection", async () => {
    connectionRequested = true;
    return createConnection().connection;
  });

  await assert.rejects(
    vehiculoService.deleteVehiculoPermanently(4, { role: 2 }),
    (error) => error.status === 403
  );
  assert.equal(connectionRequested, false);
});
