const vehiculoRepository = require("./vehiculo.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getClienteIdForUser(user, requestedId) {
  if (user.role === 2) {
    const cliente = await vehiculoRepository.findClienteByUserId(user.id);
    if (!cliente) {
      throw createError("Client not found", 404);
    }
    return cliente.id_cliente;
  }

  if (!requestedId) {
    throw createError("Client ID is required for administrators", 400);
  }

  const cliente = await vehiculoRepository.findClienteById(requestedId);
  if (!cliente) {
    throw createError("Client not found", 404);
  }

  return cliente.id_cliente;
}

async function createVehiculo(user, vehiculoData) {
  const idCliente = await getClienteIdForUser(user, vehiculoData.id_cliente);
  const idVehiculo = await vehiculoRepository.create({
    ...vehiculoData,
    id_cliente: idCliente,
  });

  return vehiculoRepository.findById(idVehiculo);
}

async function getVehiculos(user) {
  if (user.role === 1) {
    return vehiculoRepository.findAll();
  }

  const idCliente = await getClienteIdForUser(user);
  return vehiculoRepository.findAllByClienteId(idCliente);
}

async function getVehiculoById(id, user) {
  if (user.role === 1) {
    const vehiculo = await vehiculoRepository.findById(id);
    if (!vehiculo) {
      throw createError("Vehicle not found", 404);
    }
    return vehiculo;
  }

  const idCliente = await getClienteIdForUser(user);
  const vehiculo = await vehiculoRepository.findByIdAndClienteId(id, idCliente);
  if (!vehiculo) {
    throw createError("Vehicle not found", 404);
  }
  return vehiculo;
}

async function updateVehiculo(id, vehiculoData, user) {
  await getVehiculoById(id, user);
  await vehiculoRepository.update(id, vehiculoData);
  return getVehiculoById(id, user);
}

module.exports = {
  createVehiculo,
  getVehiculos,
  getVehiculoById,
  updateVehiculo,
};
