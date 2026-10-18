const tipoServicioRepository = require("./tipo-servicio.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findAll(user) {
  return tipoServicioRepository.findAll(user.role === 1);
}

async function findById(id) {
  const tipoServicio = await tipoServicioRepository.findById(id);
  if (!tipoServicio) {
    throw createError("Service type not found", 404);
  }

  return tipoServicio;
}

async function create(tipoServicioData) {
  try {
    const id = await tipoServicioRepository.create({
      nombre: tipoServicioData.nombre,
      descripcion: tipoServicioData.descripcion ?? null,
      requiere_detalle: tipoServicioData.requiere_detalle ?? 0,
    });
    return tipoServicioRepository.findById(id);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("A service type with this name already exists", 409);
    }
    throw error;
  }
}

async function update(id, tipoServicioData) {
  const current = await findById(id);
  const updated = {
    nombre: tipoServicioData.nombre,
    descripcion:
      tipoServicioData.descripcion === undefined
        ? current.descripcion
        : tipoServicioData.descripcion,
    requiere_detalle:
      tipoServicioData.requiere_detalle === undefined
        ? current.requiere_detalle
        : tipoServicioData.requiere_detalle,
  };

  try {
    await tipoServicioRepository.update(id, updated);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("A service type with this name already exists", 409);
    }
    throw error;
  }

  return findById(id);
}

async function updateEstado(id, estado) {
  await findById(id);
  await tipoServicioRepository.updateEstado(id, estado);
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateEstado,
};
