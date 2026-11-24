const vehiculoService = require("./vehiculo.service");

async function createVehiculo(req, res, next) {
  try {
    const vehiculo = await vehiculoService.createVehiculo(req.user, req.body);

    return res.status(201).json({
      message: "Vehicle registered successfully",
      data: vehiculo,
    });
  } catch (error) {
    next(error);
  }
}

async function getVehiculos(req, res, next) {
  try {
    const vehiculos = await vehiculoService.getVehiculos(req.user);

    return res.status(200).json({
      data: vehiculos,
    });
  } catch (error) {
    next(error);
  }
}

async function getVehiculoById(req, res, next) {
  try {
    const vehiculo = await vehiculoService.getVehiculoById(req.params.id, req.user);

    return res.status(200).json({
      data: vehiculo,
    });
  } catch (error) {
    next(error);
  }
}

async function updateVehiculo(req, res, next) {
  try {
    const vehiculo = await vehiculoService.updateVehiculo(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      message: "Vehicle updated successfully",
      data: vehiculo,
    });
  } catch (error) {
    next(error);
  }
}

async function changeVehiculoStatus(req, res, next) {
  try {
    const vehiculo = await vehiculoService.changeVehiculoStatus(
      req.params.id,
      req.body.estado,
      req.user
    );

    return res.status(200).json({
      message: "Vehicle status updated successfully",
      data: vehiculo,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createVehiculo,
  getVehiculos,
  getVehiculoById,
  updateVehiculo,
  changeVehiculoStatus,
};
