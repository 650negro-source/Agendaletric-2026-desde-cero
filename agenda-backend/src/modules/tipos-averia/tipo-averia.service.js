const tipoAveriaRepository = require("./tipo-averia.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function findAll(user) {
  return tipoAveriaRepository.findAll(user.role === 1);
}

async function findById(id) {
  const tipoAveria = await tipoAveriaRepository.findById(id);
  if (!tipoAveria) {
    throw createError("Fault type not found", 404);
  }

  return tipoAveria;
}

async function create(nombre) {
  try {
    const id = await tipoAveriaRepository.create(nombre);
    return tipoAveriaRepository.findById(id);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("A fault type with this name already exists", 409);
    }
    throw error;
  }
}

async function update(id, nombre) {
  await findById(id);

  try {
    await tipoAveriaRepository.update(id, nombre);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("A fault type with this name already exists", 409);
    }
    throw error;
  }

  return findById(id);
}

async function updateEstado(id, estado) {
  await findById(id);
  await tipoAveriaRepository.updateEstado(id, estado);
  return findById(id);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateEstado,
};
