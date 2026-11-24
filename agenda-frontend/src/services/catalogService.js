import { apiRequest } from './apiClient.js'

export async function getServiceTypes(token) {
  return getData('/tipos-servicio', token)
}

export async function getFaultTypes(token) {
  return getData('/tipos-averia', token)
}

async function getData(path, token) {
  const response = await apiRequest(path, { token })
  if (!Array.isArray(response?.data)) {
    throw new Error('La API no devolvió el listado esperado.')
  }
  return response.data
}

export async function createServiceType(token, serviceType) {
  return apiRequest('/tipos-servicio', {
    token,
    method: 'POST',
    body: serviceType,
  })
}

export async function updateServiceType(token, serviceType) {
  return apiRequest(`/tipos-servicio/${serviceType.id_tipo_servicio}`, {
    token,
    method: 'PUT',
    body: serviceType,
  })
}

export async function updateServiceTypeStatus(token, serviceTypeId, estado) {
  return apiRequest(`/tipos-servicio/${serviceTypeId}/estado`, {
    token,
    method: 'PATCH',
    body: { estado },
  })
}

export async function createFaultType(token, faultType) {
  return apiRequest('/tipos-averia', {
    token,
    method: 'POST',
    body: faultType,
  })
}

export async function updateFaultType(token, faultType) {
  return apiRequest(`/tipos-averia/${faultType.id_tipo_averia}`, {
    token,
    method: 'PUT',
    body: faultType,
  })
}

export async function updateFaultTypeStatus(token, faultTypeId, estado) {
  return apiRequest(`/tipos-averia/${faultTypeId}/estado`, {
    token,
    method: 'PATCH',
    body: { estado },
  })
}
