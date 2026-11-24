const vehicleTypes = new Set(["AUTOMOVIL", "CAMIONETA", "CAMION", "OTRO"]);
const energyTypes = new Set(["GASOLINA", "DIESEL", "HIBRIDO", "ELECTRICO"]);
const colombianPlatePattern = /^[A-Z]{3}\d{3}$/;

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
  const placa = typeof body.placa === "string" ? body.placa.trim().toUpperCase() : "";
  const { marca, modelo, color, tipo_vehiculo, tipo_energia } = body;
  const normalizedYear = normalizeInteger(body.anio);
  const idCliente = includeClienteId ? normalizeInteger(body.id_cliente) : undefined;
  const maximumYear = new Date().getFullYear() + 1;

  if (!placa || !marca || !modelo || normalizedYear === undefined || !color) {
    return res.status(400).json({
      message: "Plate, make, model, year, and color are required",
    });
  }

  if (!colombianPlatePattern.test(placa)) {
    return res.status(400).json({
      message: "Plate must follow the Colombian format AAA999",
    });
  }

  const stringFields = [
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

  if (!vehicleTypes.has(tipo_vehiculo)) {
    return res.status(400).json({
      message: "Invalid vehicle type",
    });
  }

  if (!energyTypes.has(tipo_energia)) {
    return res.status(400).json({
      message: "Invalid vehicle energy type",
    });
  }

  if (normalizedYear < 1900 || normalizedYear > maximumYear) {
    return res.status(400).json({
      message: "Year must be between 1900 and the next calendar year",
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

  body.placa = placa;
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

function validateStatus(req, res, next) {
  const estado = normalizeInteger(req.body?.estado);
  if (estado !== 0 && estado !== 1) {
    return res.status(400).json({
      message: "Status must be 0 or 1",
    });
  }

  req.body = { ...(req.body || {}), estado };
  next();
}

module.exports = {
  validateCreateVehiculo,
  validateVehiculoId,
  validateUpdateVehiculo,
  validateStatus,
};
