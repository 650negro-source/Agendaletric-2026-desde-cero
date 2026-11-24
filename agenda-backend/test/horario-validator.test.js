const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateCreateHorario,
  validateUpdateHorario,
} = require("../src/modules/horarios/horario.validator");

function runValidator(validator, body) {
  const req = { body };
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

  validator(req, res, () => {
    nextCalled = true;
  });

  return { req, res, nextCalled };
}

test("schedule validation normalizes ISO weekday, technician ID, and times", () => {
  const { req, nextCalled } = runValidator(validateCreateHorario, {
    id_usuario_tecnico: "14",
    dia_semana: "1",
    hora_inicio: "08:30",
    hora_fin: "17:00",
  });

  assert.equal(nextCalled, true);
  assert.equal(req.body.id_usuario_tecnico, 14);
  assert.equal(req.body.dia_semana, 1);
  assert.equal(req.body.hora_inicio, "08:30:00");
  assert.equal(req.body.hora_fin, "17:00:00");
});

test("schedule validation rejects invalid weekdays and non-positive shifts", () => {
  const invalidSchedules = [
    { dia_semana: 0, hora_inicio: "08:00", hora_fin: "17:00" },
    { dia_semana: 8, hora_inicio: "08:00", hora_fin: "17:00" },
    { dia_semana: 1, hora_inicio: "17:00", hora_fin: "17:00" },
    { dia_semana: 1, hora_inicio: "18:00", hora_fin: "17:00" },
    { dia_semana: 1, hora_inicio: "8:00", hora_fin: "17:00" },
  ];

  for (const schedule of invalidSchedules) {
    const { res, nextCalled } = runValidator(validateUpdateHorario, schedule);
    assert.equal(res.statusCode, 400);
    assert.equal(nextCalled, false);
  }
});
