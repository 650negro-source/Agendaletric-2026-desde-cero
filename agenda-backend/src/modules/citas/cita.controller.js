const citaService = require("./cita.service");

async function createCita(req, res, next) {
  try {
    const cita = await citaService.createCita(req.user, req.body);

    return res.status(201).json({
      message: "Appointment scheduled successfully",
      data: cita,
    });
  } catch (error) {
    next(error);
  }
}

async function getCitas(req, res, next) {
  try {
    const citas = await citaService.getCitas(req.user);

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    next(error);
  }
}

async function getDisponibilidad(req, res, next) {
  try {
    const horarios = await citaService.getDisponibilidad(
      req.user,
      req.availabilityQuery
    );

    return res.status(200).json({
      data: horarios,
    });
  } catch (error) {
    next(error);
  }
}

async function getCitaById(req, res, next) {
  try {
    const cita = await citaService.getCitaById(req.params.id, req.user);

    return res.status(200).json({
      data: cita,
    });
  } catch (error) {
    next(error);
  }
}

async function getHistorial(req, res, next) {
  try {
    const historial = await citaService.getHistorial(req.params.id, req.user);

    return res.status(200).json({
      data: historial,
    });
  } catch (error) {
    next(error);
  }
}

async function validarCita(req, res, next) {
  try {
    const result = await citaService.transitionCita(
      req.params.id,
      req.user,
      "VALIDADA",
      "VALIDADA",
      req.body.observaciones
    );

    return res.status(200).json({
      message: "Appointment validated; a demo email reminder was scheduled 24 hours before",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function iniciarCita(req, res, next) {
  try {
    const result = await citaService.transitionCita(
      req.params.id,
      req.user,
      "EN_PROCESO",
      "INICIO_SERVICIO",
      req.body.observaciones
    );

    return res.status(200).json({
      message: "Appointment service started",
      data: result.cita,
    });
  } catch (error) {
    next(error);
  }
}

async function finalizarCita(req, res, next) {
  try {
    const result = await citaService.transitionCita(
      req.params.id,
      req.user,
      "ATENDIDA",
      "SERVICIO_FINALIZADO",
      req.body.observaciones,
      req.body
    );

    return res.status(200).json({
      message: "Appointment service completed and technical report created",
      data: {
        cita: result.cita,
        reporte: result.reporte,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function cancelarCita(req, res, next) {
  try {
    const cita = await citaService.cancelarCita(req.params.id, req.user);

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      data: cita,
    });
  } catch (error) {
    next(error);
  }
}

async function reprogramarCita(req, res, next) {
  try {
    const cita = await citaService.reprogramarCita(
      req.params.id,
      req.body,
      req.user
    );

    return res.status(200).json({
      message: "Appointment rescheduled successfully",
      data: cita,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCita,
  getCitas,
  getDisponibilidad,
  getCitaById,
  getHistorial,
  validarCita,
  iniciarCita,
  finalizarCita,
  cancelarCita,
  reprogramarCita,
};
