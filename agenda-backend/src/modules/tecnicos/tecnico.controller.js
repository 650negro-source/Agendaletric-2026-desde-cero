const tecnicoService = require("./tecnico.service");

async function create(req, res, next) {
  try {
    const tecnico = await tecnicoService.create(req.body);

    return res.status(201).json({
      message: "Technician profile created successfully",
      data: tecnico,
    });
  } catch (error) {
    next(error);
  }
}

async function findAll(req, res, next) {
  try {
    const tecnicos = await tecnicoService.findAll();

    return res.status(200).json({
      data: tecnicos,
    });
  } catch (error) {
    next(error);
  }
}

async function findById(req, res, next) {
  try {
    const tecnico = await tecnicoService.findById(req.params.idUsuario);

    return res.status(200).json({
      data: tecnico,
    });
  } catch (error) {
    next(error);
  }
}

async function findMyProfile(req, res, next) {
  try {
    const tecnico = await tecnicoService.findMyProfile(req.user.id);

    return res.status(200).json({
      data: tecnico,
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const tecnico = await tecnicoService.update(req.params.idUsuario, req.body);

    return res.status(200).json({
      message: "Technician profile updated successfully",
      data: tecnico,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  findAll,
  findById,
  findMyProfile,
  update,
};
