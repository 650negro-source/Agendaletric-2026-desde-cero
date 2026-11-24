import { apiRequest } from './apiClient.js'

export async function getVehicles(token) {
  const response = await apiRequest('/vehiculos', { token })

  if (!Array.isArray(response?.data)) {
    throw new Error('La API no devolvió el listado de vehículos esperado.')
  }

  return response.data
}

export async function getVehicle(token, vehicleId) {
  const response = await apiRequest(`/vehiculos/${vehicleId}`, { token })

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el vehículo solicitado.')
  }

  return response.data
}

export async function createVehicle(token, vehicle) {
  return apiRequest('/vehiculos', {
    token,
    method: 'POST',
    body: vehicle,
  })
}

export async function updateVehicle(token, vehicleId, vehicle) {
  return apiRequest(`/vehiculos/${vehicleId}`, {
    token,
    method: 'PUT',
    body: vehicle,
  })
}

export async function changeVehicleStatus(token, vehicleId, estado) {
  return apiRequest(`/vehiculos/${vehicleId}/status`, {
    token,
    method: 'PATCH',
    body: { estado },
  })
}
