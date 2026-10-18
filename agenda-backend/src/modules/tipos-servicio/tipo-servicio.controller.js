const tipoServicioService = require("./tipo-servicio.service");

async function findAll(req, res, next) {
  try {
    const tipos = await tipoServicioService.findAll(req.user);
    return res.status(200).json({ data: tipos });
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const tipo = await tipoServicioService.findById(req.params.id);
    return res.status(200).json({ data: tipo });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const tipo = await tipoServicioService.create(req.body);
    return res.status(201).json({
      message: "Service type created successfully",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const tipo = await tipoServicioService.update(req.params.id, req.body);
    return res.status(200).json({
      message: "Service type updated successfully",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEstado(req, res, next) {
  try {
    const tipo = await tipoServicioService.updateEstado(
      req.params.id,
      req.body.estado
    );
    return res.status(200).json({
      message: "Service type status updated successfully",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  updateEstado,
};
