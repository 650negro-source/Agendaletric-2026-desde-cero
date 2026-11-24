const test = require("node:test");
const assert = require("node:assert/strict");
const {
  schedulesOverlap,
  scheduleChangeInvalidatesAppointments,
} = require("../src/modules/horarios/horario.rules");

test("technician shifts may be adjacent but cannot overlap on the same day", () => {
  const existing = [
    {
      dia_semana: 1,
      hora_inicio: "08:00:00",
      hora_fin: "12:00:00",
    },
  ];

  assert.equal(
    schedulesOverlap(existing, {
      dia_semana: 1,
      hora_inicio: "12:00:00",
      hora_fin: "17:00:00",
    }),
    false
  );
  assert.equal(
    schedulesOverlap(existing, {
      dia_semana: 1,
      hora_inicio: "11:30:00",
      hora_fin: "15:00:00",
    }),
    true
  );
  assert.equal(
    schedulesOverlap(existing, {
      dia_semana: 2,
      hora_inicio: "09:00:00",
      hora_fin: "11:00:00",
    }),
    false
  );
});

test("schedule changes are rejected only when they remove active appointment coverage", () => {
  const appointment = {
    dia_semana: 1,
    hora_inicio: "09:00:00",
    duracion_minutos: 120,
  };
  const mondayShift = {
    dia_semana: 1,
    hora_inicio: "08:00:00",
    hora_fin: "12:00:00",
  };

  assert.equal(
    scheduleChangeInvalidatesAppointments(
      [appointment],
      [mondayShift],
      [{ ...mondayShift, hora_fin: "10:00:00" }]
    ),
    true
  );
  assert.equal(
    scheduleChangeInvalidatesAppointments(
      [appointment],
      [mondayShift],
      [
        { ...mondayShift, hora_fin: "10:00:00" },
        { dia_semana: 1, hora_inicio: "09:00:00", hora_fin: "11:00:00" },
      ]
    ),
    false
  );
  assert.equal(
    scheduleChangeInvalidatesAppointments(
      [appointment],
      [],
      []
    ),
    false
  );
  assert.equal(
    scheduleChangeInvalidatesAppointments(
      [{ ...appointment, duracion_minutos: null }],
      [mondayShift],
      []
    ),
    true
  );
});
