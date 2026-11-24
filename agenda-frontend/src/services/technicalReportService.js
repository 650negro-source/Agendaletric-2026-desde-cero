import { apiRequest } from './apiClient.js'

export async function getAppointmentReport(token, appointmentId) {
  const response = await apiRequest(`/reportes-tecnicos/${appointmentId}`, { token })
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el reporte esperado.')
  }
  return response.data
}

export async function updateAppointmentReport(token, appointmentId, report) {
  return apiRequest(`/reportes-tecnicos/${appointmentId}`, {
    token,
    method: 'PUT',
    body: report,
  })
}

export async function uploadReportEvidence(token, appointmentId, file) {
  const body = new FormData()
  body.append('archivo', file)
  return apiRequest(`/reportes-tecnicos/${appointmentId}/archivos`, {
    token,
    method: 'POST',
    body,
  })
}

export async function publishAppointmentReport(token, appointmentId) {
  return apiRequest(`/reportes-tecnicos/${appointmentId}/enviar`, {
    token,
    method: 'POST',
  })
}

export async function requestReportCorrection(token, appointmentId, comentario) {
  return apiRequest(`/reportes-tecnicos/${appointmentId}/solicitar-correccion`, {
    token,
    method: 'POST',
    body: { comentario },
  })
}

export async function retryReportNotification(token, appointmentId) {
  return apiRequest(`/reportes-tecnicos/${appointmentId}/reintentar-notificacion`, {
    token,
    method: 'POST',
  })
}

export async function downloadReportFile(token, path, filename) {
  const apiPath = path.startsWith('/api/') ? path.slice(4) : path
  const blob = await apiRequest(apiPath, { token, responseType: 'blob' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
