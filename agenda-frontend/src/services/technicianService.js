import { apiRequest } from './apiClient.js'

async function getList(path, token, message) {
  const response = await apiRequest(path, { token })
  if (!Array.isArray(response?.data)) {
    throw new Error(message)
  }
  return response.data
}

export async function getTechnicians(token) {
  return getList(
    '/tecnicos',
    token,
    'La API no devolvió el listado de técnicos esperado.'
  )
}

export async function getMyTechnician(token) {
  const response = await apiRequest('/tecnicos/me', { token })
  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió tu perfil técnico.')
  }
  return response.data
}

export async function createTechnician(token, technician) {
  return apiRequest('/tecnicos', {
    token,
    method: 'POST',
    body: technician,
  })
}

export async function updateTechnician(token, technicianId, technician) {
  return apiRequest(`/tecnicos/${technicianId}`, {
    token,
    method: 'PUT',
    body: technician,
  })
}

export async function getSchedules(token) {
  return getList(
    '/horarios',
    token,
    'La API no devolvió el listado de horarios esperado.'
  )
}

export async function getMySchedules(token) {
  return getList(
    '/horarios/me',
    token,
    'La API no devolvió tus horarios.'
  )
}

export async function createSchedule(token, schedule) {
  return apiRequest('/horarios', {
    token,
    method: 'POST',
    body: schedule,
  })
}

export async function updateSchedule(token, scheduleId, schedule) {
  return apiRequest(`/horarios/${scheduleId}`, {
    token,
    method: 'PUT',
    body: schedule,
  })
}

export async function deleteSchedule(token, scheduleId) {
  return apiRequest(`/horarios/${scheduleId}`, {
    token,
    method: 'DELETE',
  })
}
