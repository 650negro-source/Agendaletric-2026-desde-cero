import { apiRequest } from './apiClient.js'

async function getData(path, token) {
  const response = await apiRequest(path, { token })
  if (!Array.isArray(response?.data)) {
    throw new Error('La API no devolvió el listado esperado.')
  }
  return response.data
}

export async function getAppointments(token) {
  return getData('/citas', token)
}

export async function getAvailableSlots(token, { fecha, id_tipo_servicio, id_cita }) {
  const params = new URLSearchParams({
    fecha,
    id_tipo_servicio: String(id_tipo_servicio),
  })
  if (id_cita !== undefined) params.set('id_cita', String(id_cita))
  return getData(`/citas/disponibilidad?${params.toString()}`, token)
}

export async function createAppointment(token, appointment) {
  return apiRequest('/citas', {
    token,
    method: 'POST',
    body: appointment,
  })
}

export async function cancelAppointment(token, appointmentId) {
  return apiRequest(`/citas/${appointmentId}/cancelar`, {
    token,
    method: 'PATCH',
  })
}

export async function rescheduleAppointment(token, appointmentId, schedule) {
  return apiRequest(`/citas/${appointmentId}/reprogramar`, {
    token,
    method: 'PATCH',
    body: schedule,
  })
}

export async function transitionAppointment(token, appointmentId, action, body = {}) {
  return apiRequest(`/citas/${appointmentId}/${action}`, {
    token,
    method: 'PATCH',
    body,
  })
}
