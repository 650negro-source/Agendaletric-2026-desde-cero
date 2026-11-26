const citaService = require("../citas/cita.service");
const emailService = require("../notificaciones/email.service");
const whatsappService = require("../notificaciones/whatsapp.service");
const reporteRepository = require("./reporte-tecnico.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function deliverNotification(idEnvio, eventType, send, whatsappMessage = null) {
  if (whatsappMessage) {
    try {
      const simulated = whatsappService.simulateMessage(whatsappMessage);
      return await reporteRepository.updateEnvioStatus(
        idEnvio,
        simulated.status,
        null
      );
    } catch (error) {
      console.error("Report WhatsApp simulation failed", {
        eventId: idEnvio,
        eventType,
        error: error.message,
      });
      return reporteRepository.updateEnvioStatus(
        idEnvio,
        "FALLIDO",
        "No se pudo completar la simulación de WhatsApp. Revisa los datos del destinatario y los registros del backend."
      );
    }
  }
  if (typeof send !== "function") {
    throw createError("Unsupported report notification channel", 500);
  }

  let deliveryError;
  try {
    await send();
  } catch (error) {
    deliveryError = error;
  }

  if (deliveryError) {
    console.error("Report notification email delivery failed", {
      eventId: idEnvio,
      eventType,
      error: deliveryError.message,
    });
    return reporteRepository.updateEnvioStatus(
      idEnvio,
      "FALLIDO",
      "No se pudo enviar el correo. Revisa la configuración SMTP y los registros del backend."
    );
  }

  return reporteRepository.updateEnvioStatus(idEnvio, "ENVIADO", null);
}

async function getByCitaId(idCita, user) {
  await citaService.getCitaById(idCita, user);

  const reporte = await reporteRepository.findByCitaId(idCita);
  if (!reporte) {
    throw createError("Technical report not found", 404);
  }

  if (user.role === 2 && reporte.estado_publicacion !== "PUBLICADO") {
    throw createError("Technical report not found", 404);
  }

  const archivos = await reporteRepository.findArchivosByReporteId(
    reporte.id_reporte
  );
  const response = {
    ...reporte,
    archivos: archivos.map((archivo) => {
      if (user.role === 2) {
        const {
          nombre_original,
          tipo_mime,
          tamano_bytes,
          fecha_subida,
        } = archivo;
        return {
          nombre_original,
          tipo_mime,
          tamano_bytes,
          fecha_subida,
        };
      }

      return {
        ...archivo,
        url: `/api/reportes-tecnicos/${reporte.id_cita}/archivos/${archivo.id_archivo}`,
      };
    }),
  };

  if (user.role === 2) {
    delete response.comentario_admin;
    delete response.id_usuario_cliente;
    delete response.id_usuario_tecnico;
  } else {
    response.ultimo_envio = await reporteRepository.findLastEnvioByReporteId(
      reporte.id_reporte
    );
  }

  return response;
}

async function getCitaIdsByPublicationState(state, user) {
  if (user.role !== 1) {
    throw createError("Access denied", 403);
  }

  return reporteRepository.findCitaIdsByPublicationState(state);
}

async function updateByCitaId(idCita, user, reporteData) {
  if (![1, 3].includes(user.role)) {
    throw createError("Only administrators and assigned technicians can manage technical reports", 403);
  }

  await citaService.getCitaById(idCita, user);

  const reporte = await reporteRepository.findByCitaId(idCita);
  if (!reporte) {
    throw createError("Technical report not found", 404);
  }

  await reporteRepository.updateByCitaId(idCita, reporteData);
  return getByCitaId(idCita, user);
}

async function ensureCanManageByCitaId(idCita, user) {
  if (![1, 3].includes(user.role)) {
    throw createError("Only administrators and assigned technicians can manage technical reports", 403);
  }

  await citaService.getCitaById(idCita, user);
  const reporte = await reporteRepository.findByCitaId(idCita);
  if (!reporte) {
    throw createError("Technical report not found", 404);
  }

  return reporte;
}

async function addArchivo(idCita, user, archivo) {
  const reporte = await ensureCanManageByCitaId(idCita, user);
  return reporteRepository.createArchivo(reporte.id_reporte, archivo);
}

async function getArchivo(idCita, idArchivo, user) {
  if (user.role === 2) {
    throw createError("Access denied", 403);
  }

  const reporte = await ensureCanManageByCitaId(idCita, user);
  const archivo = await reporteRepository.findArchivoById(
    reporte.id_reporte,
    idArchivo
  );
  if (!archivo) {
    throw createError("Evidence file not found", 404);
  }

  return archivo;
}

async function publishByCitaId(idCita, user) {
  if (![1, 3].includes(user.role)) {
    throw createError("Only administrators and assigned technicians can publish technical reports", 403);
  }

  await ensureCanManageByCitaId(idCita, user);
  const result = await reporteRepository.publishByCitaId(idCita, user.id);
  const envio = await deliverNotification(
    result.envio.id_envio,
    result.envio.tipo_evento,
    result.mail
      ? () => emailService.sendReportPublishedEmail(result.mail)
      : null,
    result.whatsapp
  );
  return {
    reporte: await getByCitaId(idCita, user),
    envio,
  };
}

async function requestCorrectionByCitaId(idCita, user, comentario) {
  if (user.role !== 1) {
    throw createError("Only administrators can request report corrections", 403);
  }

  await ensureCanManageByCitaId(idCita, user);
  const result = await reporteRepository.requestCorrectionByCitaId(
    idCita,
    user.id,
    comentario
  );
  const envio = await deliverNotification(
    result.envio.id_envio,
    result.envio.tipo_evento,
    () => emailService.sendReportCorrectionEmail(result.mail)
  );
  return {
    reporte: await getByCitaId(idCita, user),
    envio,
  };
}

async function retryNotificationByCitaId(idCita, user) {
  if (![1, 3].includes(user.role)) {
    throw createError("Only administrators and assigned technicians can retry report notifications", 403);
  }

  await ensureCanManageByCitaId(idCita, user);
  const result = await reporteRepository.createRetryEnvioByCitaId(
    idCita,
    user.id
  );
  const send = result.mail
    ? result.envio.tipo_evento === "PUBLICACION_CLIENTE"
      ? () => emailService.sendReportPublishedEmail(result.mail)
      : () => emailService.sendReportCorrectionEmail(result.mail)
    : null;
  const envio = await deliverNotification(
    result.envio.id_envio,
    result.envio.tipo_evento,
    send,
    result.whatsapp
  );

  return {
    reporte: await getByCitaId(idCita, user),
    envio,
  };
}

module.exports = {
  getByCitaId,
  getCitaIdsByPublicationState,
  updateByCitaId,
  ensureCanManageByCitaId,
  addArchivo,
  getArchivo,
  publishByCitaId,
  requestCorrectionByCitaId,
  retryNotificationByCitaId,
};
