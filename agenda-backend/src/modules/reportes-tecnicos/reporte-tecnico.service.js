const citaService = require("../citas/cita.service");
const reporteRepository = require("./reporte-tecnico.repository");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
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
  }

  return response;
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
  return {
    reporte: await getByCitaId(idCita, user),
    envio: result.envio,
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
  return {
    reporte: await getByCitaId(idCita, user),
    envio: result.envio,
  };
}

module.exports = {
  getByCitaId,
  updateByCitaId,
  ensureCanManageByCitaId,
  addArchivo,
  getArchivo,
  publishByCitaId,
  requestCorrectionByCitaId,
};
