const horarioRepository = require("./horario.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createHorario(horarioData) {
  const technician = await horarioRepository.findActiveTechnician(
    horarioData.id_usuario_tecnico
  );

  if (!technician) {
    throw createError("Active technician user not found", 404);
  }

  const idHorario = await horarioRepository.create(horarioData);
  return horarioRepository.findById(idHorario);
}

async function getHorarios() {
  return horarioRepository.findAll();
}

async function getMyHorarios(idUsuario) {
  const technician = await horarioRepository.findActiveTechnician(idUsuario);
  if (!technician) {
    throw createError("Active technician user not found", 404);
  }

  return horarioRepository.findAllByTechnicianId(idUsuario);
}

async function getHorarioById(id) {
  const horario = await horarioRepository.findById(id);
  if (!horario) {
    throw createError("Schedule not found", 404);
  }

  return horario;
}

async function updateHorario(id, horarioData) {
  await getHorarioById(id);
  await horarioRepository.update(id, horarioData);
  return getHorarioById(id);
}

async function deleteHorario(id) {
  await getHorarioById(id);
  await horarioRepository.remove(id);
}

module.exports = {
  createHorario,
  getHorarios,
  getMyHorarios,
  getHorarioById,
  updateHorario,
  deleteHorario,
};
