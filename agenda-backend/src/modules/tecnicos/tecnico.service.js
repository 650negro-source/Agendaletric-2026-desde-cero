const tecnicoRepository = require("./tecnico.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function create(tecnicoData) {
  const user = await tecnicoRepository.findEligibleUser(tecnicoData.id_usuario);
  if (!user) {
    throw createError("User not found or does not have the TECHNICIAN role", 404);
  }

  try {
    await tecnicoRepository.create(tecnicoData);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw createError("A technician profile already exists for this user", 409);
    }
    throw error;
  }

  return tecnicoRepository.findById(tecnicoData.id_usuario);
}

async function findAll() {
  return tecnicoRepository.findAll();
}

async function findById(idUsuario) {
  const tecnico = await tecnicoRepository.findById(idUsuario);
  if (!tecnico) {
    throw createError("Technician profile not found", 404);
  }
  return tecnico;
}

async function findMyProfile(idUsuario) {
  return findById(idUsuario);
}

async function update(idUsuario, tecnicoData) {
  const tecnico = await tecnicoRepository.findById(idUsuario);
  if (!tecnico) {
    throw createError("Technician profile not found", 404);
  }

  await tecnicoRepository.update(idUsuario, tecnicoData);
  return tecnicoRepository.findById(idUsuario);
}

module.exports = {
  create,
  findAll,
  findById,
  findMyProfile,
  update,
};
