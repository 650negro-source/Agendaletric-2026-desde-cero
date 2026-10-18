function normalizeInteger(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const asNumber = Number(trimmed);
    return Number.isInteger(asNumber) ? asNumber : undefined;
  }

  return undefined;
}

function validateHorarioFields(req, res, next, includeTecnicoId) {
  const body = req.body || {};
  const diaSemana = normalizeInteger(body.dia_semana);
  let { hora_inicio, hora_fin } = body;
  const idTecnico = includeTecnicoId
    ? normalizeInteger(body.id_usuario_tecnico)
    : undefined;

  if (
    diaSemana === undefined ||
    typeof hora_inicio !== "string" ||
    typeof hora_fin !== "string"
  ) {
    return res.status(400).json({
      message: "Weekday, start time, and end time are required",
    });
  }

  if (diaSemana < 1 || diaSemana > 7) {
    return res.status(400).json({
      message: "Weekday must use ISO numbering from 1 (Monday) to 7 (Sunday)",
    });
  }

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if (!timePattern.test(hora_inicio) || !timePattern.test(hora_fin)) {
    return res.status(400).json({
      message: "Times must use HH:MM or HH:MM:SS format",
    });
  }

  if (hora_inicio.length === 5) {
    hora_inicio = `${hora_inicio}:00`;
  }
  if (hora_fin.length === 5) {
    hora_fin = `${hora_fin}:00`;
  }

  if (hora_fin <= hora_inicio) {
    return res.status(400).json({
      message: "End time must be later than start time",
    });
  }

  if (includeTecnicoId && (idTecnico === undefined || idTecnico <= 0)) {
    return res.status(400).json({
      message: "A positive technician user ID is required",
    });
  }

  body.dia_semana = diaSemana;
  body.hora_inicio = hora_inicio;
  body.hora_fin = hora_fin;
  if (includeTecnicoId) {
    body.id_usuario_tecnico = idTecnico;
  }
  req.body = body;

  next();
}

function validateCreateHorario(req, res, next) {
  return validateHorarioFields(req, res, next, true);
}

function validateUpdateHorario(req, res, next) {
  return validateHorarioFields(req, res, next, false);
}

function validateHorarioId(req, res, next) {
  const id = normalizeInteger(req.params.id);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid schedule ID",
    });
  }

  req.params.id = String(id);
  next();
}

module.exports = {
  validateCreateHorario,
  validateHorarioId,
  validateUpdateHorario,
};
