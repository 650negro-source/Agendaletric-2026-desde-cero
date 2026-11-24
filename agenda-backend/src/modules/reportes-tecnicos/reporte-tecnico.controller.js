const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const reporteService = require("./reporte-tecnico.service");
const { storageDirectory } = require("./reporte-tecnico.upload");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function ensureCanManageReport(req, res, next) {
  reporteService
    .ensureCanManageByCitaId(req.params.idCita, req.user)
    .then(() => next())
    .catch(next);
}

async function hasValidFileSignature(file) {
  const handle = await fs.promises.open(file.path, "r");
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);

    if (file.mimetype === "image/jpeg") {
      return (
        bytesRead >= 3 &&
        header[0] === 0xff &&
        header[1] === 0xd8 &&
        header[2] === 0xff
      );
    }
    if (file.mimetype === "video/mp4") {
      return bytesRead >= 12 && header.toString("ascii", 4, 8) === "ftyp";
    }
    return false;
  } finally {
    await handle.close();
  }
}

async function getByCitaId(req, res, next) {
  try {
    const reporte = await reporteService.getByCitaId(
      req.params.idCita,
      req.user
    );

    return res.status(200).json({
      data: reporte,
    });
  } catch (error) {
    next(error);
  }
}

async function updateByCitaId(req, res, next) {
  try {
    const reporte = await reporteService.updateByCitaId(
      req.params.idCita,
      req.user,
      req.body
    );

    return res.status(200).json({
      message: "Technical report updated successfully",
      data: reporte,
    });
  } catch (error) {
    next(error);
  }
}

async function addArchivo(req, res, next) {
  let registrado = false;

  try {
    if (!req.file) {
      throw createError("An evidence file is required", 400);
    }
    if (!(await hasValidFileSignature(req.file))) {
      throw createError("The uploaded content is not a valid JPG or MP4 file", 400);
    }

    const nombreOriginal = path.basename(
      req.file.originalname.replace(/\\/g, "/")
    );
    if (Array.from(nombreOriginal).length > 255) {
      throw createError("The evidence filename must not exceed 255 characters", 400);
    }

    const archivo = await reporteService.addArchivo(
      req.params.idCita,
      req.user,
      {
        nombre_original: nombreOriginal,
        nombre_archivo: req.file.filename,
        tipo_mime: req.file.mimetype,
        tamano_bytes: req.file.size,
      }
    );
    registrado = true;

    return res.status(201).json({
      message: "Evidence file uploaded successfully",
      data: archivo,
    });
  } catch (error) {
    if (req.file && !registrado) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (cleanupError) {
        const cleanupFailure = new Error(
          "Unable to remove an unregistered evidence file",
          { cause: error }
        );
        cleanupFailure.status = 500;
        cleanupFailure.cleanupError = cleanupError;
        return next(cleanupFailure);
      }
    }
    return next(error);
  }
}

async function downloadArchivo(req, res, next) {
  try {
    const archivo = await reporteService.getArchivo(
      req.params.idCita,
      req.params.idArchivo,
      req.user
    );
    const filePath = path.join(
      storageDirectory,
      path.basename(archivo.nombre_archivo)
    );

    return res.download(filePath, archivo.nombre_original, (error) => {
      if (!error) return;
      if (res.headersSent) return res.destroy(error);
      next(error);
    });
  } catch (error) {
    return next(error);
  }
}

async function downloadPdf(req, res, next) {
  try {
    const reporte = await reporteService.getByCitaId(
      req.params.idCita,
      req.user
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="reporte-tecnico-${req.params.idCita}.pdf"`
    );

    const pdf = new PDFDocument({ margin: 50 });
    pdf.on("error", (error) => {
      if (res.headersSent) return res.destroy(error);
      next(error);
    });
    pdf.pipe(res);

    pdf.fontSize(18).text("Reporte técnico", { align: "center" });
    pdf.moveDown();
    pdf.fontSize(11);
    pdf.text(`Cita: ${reporte.id_cita}`);
    pdf.text(`Fecha del reporte: ${reporte.fecha_reporte}`);
    pdf.text(`Cliente: ${reporte.nombre_cliente}`);
    pdf.text(`Técnico: ${reporte.nombre_tecnico}`);
    pdf.text(`Vehículo: ${reporte.placa}`);
    pdf.text(
      `Fecha programada: ${reporte.fecha_programada} ${reporte.hora_programada}`
    );
    if (reporte.tipo_servicio_nombre) {
      pdf.text(`Servicio solicitado: ${reporte.tipo_servicio_nombre}`);
    }
    if (reporte.detalle_servicio) {
      pdf.text("Detalle del servicio solicitado:");
      pdf.text(reporte.detalle_servicio);
    }
    if (reporte.tipo_averia_nombre) {
      pdf.text(`Posible avería reportada: ${reporte.tipo_averia_nombre}`);
    }
    pdf.text(`Descripción del problema: ${reporte.descripcion_averia}`);
    pdf.moveDown();
    pdf.fontSize(13).text("Diagnóstico");
    pdf.fontSize(11).text(reporte.diagnostico);
    pdf.moveDown();
    pdf.fontSize(13).text("Procedimiento realizado");
    pdf.fontSize(11).text(reporte.procedimiento_realizado);
    if (reporte.observaciones) {
      pdf.moveDown();
      pdf.fontSize(13).text("Observaciones");
      pdf.fontSize(11).text(reporte.observaciones);
    }
    if (reporte.archivos.length > 0) {
      pdf.moveDown();
      pdf.fontSize(13).text("Evidencias adjuntas");
      pdf.fontSize(11);
      for (const archivo of reporte.archivos) {
        pdf.text(`${archivo.nombre_original} (${archivo.tipo_mime})`);
      }
    }
    pdf.end();
  } catch (error) {
    return next(error);
  }
}

async function publishByCitaId(req, res, next) {
  try {
    const result = await reporteService.publishByCitaId(
      req.params.idCita,
      req.user
    );

    return res.status(200).json({
      message: result.envio.estado_envio === "ENVIADO"
        ? "Report published and email delivered"
        : "Report published, but email delivery failed and was recorded",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function requestCorrectionByCitaId(req, res, next) {
  try {
    const result = await reporteService.requestCorrectionByCitaId(
      req.params.idCita,
      req.user,
      req.body.comentario
    );

    return res.status(200).json({
      message: result.envio.estado_envio === "ENVIADO"
        ? "Correction requested and email delivered"
        : "Correction requested, but email delivery failed and was recorded",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

async function retryNotificationByCitaId(req, res, next) {
  try {
    const result = await reporteService.retryNotificationByCitaId(
      req.params.idCita,
      req.user
    );

    return res.status(200).json({
      message: result.envio.estado_envio === "ENVIADO"
        ? "Report notification email delivered"
        : "Report notification email delivery failed and was recorded",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getByCitaId,
  updateByCitaId,
  ensureCanManageReport,
  addArchivo,
  downloadArchivo,
  downloadPdf,
  publishByCitaId,
  requestCorrectionByCitaId,
  retryNotificationByCitaId,
};
