const nodemailer = require("nodemailer");

function createError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getTransportConfig(env = process.env) {
  const host = env.SMTP_HOST?.trim();
  const port = Number(env.SMTP_PORT);
  const username = env.SMTP_USER?.trim();
  const password = env.SMTP_PASS;
  const from = env.MAIL_FROM?.trim();
  const secureValue = env.SMTP_SECURE;

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !username ||
    !password ||
    !from ||
    !["true", "false"].includes(secureValue)
  ) {
    throw createError("SMTP email delivery is not configured correctly", 503);
  }

  return {
    host,
    port,
    secure: secureValue === "true",
    auth: { user: username, pass: password },
    from,
  };
}

function getFrontendUrl(env = process.env) {
  const configuredUrl = env.FRONTEND_URL?.trim();
  if (!configuredUrl) {
    throw createError("The frontend URL for email links is not configured", 503);
  }

  try {
    const url = new URL(configuredUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported frontend URL protocol");
    }
    return url;
  } catch {
    throw createError("The frontend URL for email links is invalid", 503);
  }
}

async function sendEmail({ to, subject, text }) {
  const config = getTransportConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  return transporter.sendMail({
    from: config.from,
    to,
    subject,
    text,
  });
}

async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = getFrontendUrl();
  resetUrl.hash = new URLSearchParams({ resetToken: token }).toString();

  return sendEmail({
    to,
    subject: "Recuperación de contraseña | AgendaLetric",
    text: [
      `Hola ${name},`,
      "",
      "Recibimos una solicitud para restablecer la contraseña de tu cuenta de AgendaLetric.",
      `Abre este enlace para elegir una contraseña nueva (vence en 30 minutos): ${resetUrl.toString()}`,
      "",
      "Si no solicitaste este cambio, puedes ignorar este mensaje.",
    ].join("\n"),
  });
}

async function sendReportPublishedEmail({ to, name, idCita }) {
  const appUrl = getFrontendUrl();

  return sendEmail({
    to,
    subject: "Tu reporte técnico está disponible | AgendaLetric",
    text: [
      `Hola ${name},`,
      "",
      `El reporte técnico de tu cita ${idCita} ya está publicado.`,
      `Inicia sesión en AgendaLetric para consultarlo y descargar el PDF: ${appUrl.toString()}`,
    ].join("\n"),
  });
}

async function sendReportCorrectionEmail({ to, name, idCita, comentario }) {
  const appUrl = getFrontendUrl();

  return sendEmail({
    to,
    subject: "Corrección solicitada para un reporte técnico | AgendaLetric",
    text: [
      `Hola ${name},`,
      "",
      `Administración solicitó una corrección para el reporte de la cita ${idCita}.`,
      `Comentario: ${comentario}`,
      `Inicia sesión en AgendaLetric para actualizarlo: ${appUrl.toString()}`,
    ].join("\n"),
  });
}

module.exports = {
  getTransportConfig,
  getFrontendUrl,
  sendPasswordResetEmail,
  sendReportPublishedEmail,
  sendReportCorrectionEmail,
};
