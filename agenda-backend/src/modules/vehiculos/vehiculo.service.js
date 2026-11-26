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
      throw createError("Customer profile not found", 404);
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
  let idVehiculo;
  try {
    idVehiculo = await vehiculoRepository.create({
      ...vehiculoData,
      id_cliente: idCliente,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("Vehicle plate is already registered", 409);
    }
    throw error;
  }

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
  try {
    const updateResult = await vehiculoRepository.update(id, vehiculoData);
    if (updateResult.notFound) {
      throw createError("Vehicle not found", 404);
    }
    if (updateResult.plateChangeBlocked) {
      throw createError(
        "Vehicle plate cannot be changed after it has appointments",
        409
      );
    }
  } catch (error) {
    if (error.status) throw error;
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("Vehicle plate is already registered", 409);
    }
    throw error;
  }
  return getVehiculoById(id, user);
}

async function changeVehiculoStatus(id, estado, user) {
  await getVehiculoById(id, user);
  const updateResult = await vehiculoRepository.updateStatus(id, estado);
  if (updateResult.notFound) {
    throw createError("Vehicle not found", 404);
  }
  if (updateResult.activeAppointments) {
    throw createError(
      "Vehicle with active appointments cannot be deactivated",
      409
    );
  }

  return getVehiculoById(id, user);
}

async function deleteVehiculoPermanently(id, user) {
  if (user.role !== 1) {
    throw createError("Access denied", 403);
  }

  const result = await vehiculoRepository.deletePermanently(id);
  if (result.notFound) {
    throw createError("Vehicle not found", 404);
  }
  if (result.clientNotDeleted) {
    throw createError("Vehicle can only be permanently deleted after its client is deleted", 409);
  }
  if (result.activeAppointments) {
    throw createError("Vehicle with active appointments cannot be permanently deleted", 409);
  }
}

module.exports = {
  createVehiculo,
  getVehiculos,
  getVehiculoById,
  updateVehiculo,
  changeVehiculoStatus,
  deleteVehiculoPermanently,
};
