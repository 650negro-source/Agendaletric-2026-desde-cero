const tipoAveriaService = require("./tipo-averia.service");

async function findAll(req, res, next) {
  try {
    const tipos = await tipoAveriaService.findAll(req.user);

    return res.status(200).json({
      data: tipos,
    });
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const tipo = await tipoAveriaService.findById(req.params.id);

    return res.status(200).json({
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const tipo = await tipoAveriaService.create(req.body.nombre);

    return res.status(201).json({
      message: "Fault type created successfully",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const tipo = await tipoAveriaService.update(req.params.id, req.body.nombre);

    return res.status(200).json({
      message: "Fault type updated successfully",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
}

async function updateEstado(req, res, next) {
  try {
    const tipo = await tipoAveriaService.updateEstado(
      req.params.id,
      req.body.estado
    );

    return res.status(200).json({
      message: "Fault type status updated successfully",
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
