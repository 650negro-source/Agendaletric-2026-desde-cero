const { randomUUID } = require("crypto");
const citaRepository = require("./cita.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function publicCita(cita) {
  if (!cita) return cita;
  const { id_usuario_cliente, correo_cliente, ...response } = cita;
  return response;
}

function authorizeCita(cita, user) {
  if (user.role === 1) {
    return;
  }
  if (user.role === 2 && cita.id_usuario_cliente === user.id) {
    return;
  }
  if (user.role === 3 && cita.id_usuario_tecnico === user.id) {
    return;
  }
  throw createError("Access denied", 403);
}

async function createCita(user, citaData) {
  if (user.role !== 2) {
    throw createError("Only a customer can request an appointment", 403);
  }

  try {
    const cita = await citaRepository.createCita(
      {
        ...citaData,
        codigo_asignacion: randomUUID(),
      },
      user.id
    );
    return publicCita(cita);
  } catch (error) {
    if (
      error.code === "ER_DUP_ENTRY" &&
      String(error.message).includes("uq_cita_cliente_activa")
    ) {
      throw createError("The client already has an active appointment", 409);
    }
    throw error;
  }
}

async function getCitas(user) {
  if (user.role === 1) {
    return (await citaRepository.findAll()).map(publicCita);
  }
  if (user.role === 2) {
    return (await citaRepository.findAllByClienteUserId(user.id)).map(publicCita);
  }
  if (user.role === 3) {
    return (await citaRepository.findAllByTechnicianId(user.id)).map(publicCita);
  }
  throw createError("Access denied", 403);
}

async function getDisponibilidad(user, query) {
  let duracionMinutos;

  if (query.id_cita !== undefined) {
    const cita = await citaRepository.findById(query.id_cita);
    if (!cita) {
      throw createError("Appointment not found", 404);
    }
    authorizeCita(cita, user);
    if (["ATENDIDA", "CANCELADA"].includes(cita.estado)) {
      throw createError("Appointment can no longer be rescheduled", 409);
    }
    if (Number(cita.id_tipo_servicio) !== query.id_tipo_servicio) {
      throw createError("The service type cannot be changed while rescheduling", 400);
    }

    duracionMinutos = cita.duracion_minutos;
    if (duracionMinutos === null) {
      const tipoServicio = await citaRepository.findTipoServicioForCita(
        query.id_tipo_servicio
      );
      duracionMinutos = tipoServicio?.duracion_minutos;
    }
  } else {
    const tipoServicio = await citaRepository.findTipoServicioForCita(
      query.id_tipo_servicio
    );
    if (!tipoServicio || Number(tipoServicio.estado) !== 1) {
      throw createError("Service type not found or inactive", 404);
    }
    duracionMinutos = tipoServicio.duracion_minutos;
  }

  if (!citaRepository.isValidAppointmentDuration(duracionMinutos)) {
    throw createError("Service duration is not configured", 409);
  }

  return citaRepository.findAvailableSlots(
    query.fecha,
    duracionMinutos,
    query.id_cita
  );
}

async function getCitaById(id, user) {
  const cita = await citaRepository.findById(id);
  if (!cita) {
    throw createError("Appointment not found", 404);
  }
  authorizeCita(cita, user);
  return publicCita(cita);
}

async function getHistorial(id, user) {
  await getCitaById(id, user);
  return citaRepository.findHistorial(id);
}

async function transitionCita(
  id,
  user,
  nextState,
  action,
  observaciones,
  reporte = null
) {
  if (![1, 3].includes(user.role)) {
    throw createError("Only administrators and technicians can manage appointment status", 403);
  }

  const cita = await citaRepository.findById(id);
  if (!cita) {
    throw createError("Appointment not found", 404);
  }
  authorizeCita(cita, user);

  const allowedPrevious = {
    VALIDADA: ["PROGRAMADA"],
    EN_PROCESO: ["VALIDADA"],
    ATENDIDA: ["EN_PROCESO"],
  };
  if (!allowedPrevious[nextState]?.includes(cita.estado)) {
    throw createError(`Appointment cannot transition from ${cita.estado} to ${nextState}`, 409);
  }

  const result = await citaRepository.changeEstado(
    id,
    user.id,
    cita.estado,
    nextState,
    action,
    observaciones,
    reporte
  );

  return {
    cita: publicCita(result.cita),
    recordatorios: result.recordatorios,
    reporte: result.reporte,
  };
}

async function cancelarCita(id, user) {
  const cita = await citaRepository.findById(id);
  if (!cita) {
    throw createError("Appointment not found", 404);
  }
  authorizeCita(cita, user);

  return publicCita(
    await citaRepository.cancelarCita(
      id,
      user.id,
      cita.estado,
      user.role === 2
    )
  );
}

async function reprogramarCita(id, citaData, user) {
  const cita = await citaRepository.findById(id);
  if (!cita) {
    throw createError("Appointment not found", 404);
  }
  authorizeCita(cita, user);

  return publicCita(
    await citaRepository.reprogramarCita(
      id,
      user.id,
      cita.estado,
      citaData.fecha_programada,
      citaData.hora_programada
    )
  );
}

module.exports = {
  createCita,
  getCitas,
  getDisponibilidad,
  getCitaById,
  getHistorial,
  transitionCita,
  cancelarCita,
  reprogramarCita,
};
