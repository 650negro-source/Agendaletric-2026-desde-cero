const horarioService = require("./horario.service");

async function createHorario(req, res, next) {
  try {
    const horario = await horarioService.createHorario(req.body);

    return res.status(201).json({
      message: "Technician schedule created successfully",
      data: horario,
    });
  } catch (error) {
    next(error);
  }
}

async function getHorarios(req, res, next) {
  try {
    const horarios = await horarioService.getHorarios();

    return res.status(200).json({
      data: horarios,
    });
  } catch (error) {
    next(error);
  }
}

async function getMyHorarios(req, res, next) {
  try {
    const horarios = await horarioService.getMyHorarios(req.user.id);

    return res.status(200).json({
      data: horarios,
    });
  } catch (error) {
    next(error);
  }
}

async function getHorarioById(req, res, next) {
  try {
    const horario = await horarioService.getHorarioById(req.params.id);

    return res.status(200).json({
      data: horario,
    });
  } catch (error) {
    next(error);
  }
}

async function updateHorario(req, res, next) {
  try {
    const horario = await horarioService.updateHorario(req.params.id, req.body);

    return res.status(200).json({
      message: "Technician schedule updated successfully",
      data: horario,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteHorario(req, res, next) {
  try {
    await horarioService.deleteHorario(req.params.id);

    return res.status(200).json({
      message: "Technician schedule deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createHorario,
  getHorarios,
  getMyHorarios,
  getHorarioById,
  updateHorario,
  deleteHorario,
};
