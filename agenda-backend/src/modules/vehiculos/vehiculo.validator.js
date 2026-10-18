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

function validateVehiculoFields(req, res, next, includeClienteId) {
  const body = req.body || {};
  const { placa, marca, modelo, anio, color } = body;
  const normalizedYear = normalizeInteger(anio);
  const idCliente = includeClienteId ? normalizeInteger(body.id_cliente) : undefined;

  if (!placa || !marca || !modelo || normalizedYear === undefined || !color) {
    return res.status(400).json({
      message: "Plate, make, model, year, and color are required",
    });
  }

  const stringFields = [
    ["placa", placa, 20],
    ["marca", marca, 50],
    ["modelo", modelo, 50],
    ["color", color, 30],
  ];

  for (const [field, value, maxLength] of stringFields) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      return res.status(400).json({
        message: `Invalid ${field}`,
      });
    }
  }

  if (normalizedYear <= 0) {
    return res.status(400).json({
      message: "Year must be a positive integer",
    });
  }

  if (
    includeClienteId &&
    body.id_cliente !== undefined &&
    (idCliente === undefined || idCliente <= 0)
  ) {
    return res.status(400).json({
      message: "Invalid client ID",
    });
  }

  body.placa = placa.trim();
  body.marca = marca.trim();
  body.modelo = modelo.trim();
  body.anio = normalizedYear;
  body.color = color.trim();
  if (includeClienteId && idCliente !== undefined) {
    body.id_cliente = idCliente;
  }
  req.body = body;

  next();
}

function validateCreateVehiculo(req, res, next) {
  return validateVehiculoFields(req, res, next, true);
}

function validateUpdateVehiculo(req, res, next) {
  return validateVehiculoFields(req, res, next, false);
}

function validateVehiculoId(req, res, next) {
  const id = normalizeInteger(req.params.id);

  if (id === undefined || id <= 0) {
    return res.status(400).json({
      message: "Invalid vehicle ID",
    });
  }

  req.params.id = String(id);
  next();
}

module.exports = {
  validateCreateVehiculo,
  validateVehiculoId,
  validateUpdateVehiculo,
};
