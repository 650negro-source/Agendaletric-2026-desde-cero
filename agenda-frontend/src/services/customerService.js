import { apiRequest } from './apiClient.js'

export async function registerCustomer(customer) {
  const response = await apiRequest('/clientes', {
    method: 'POST',
    body: customer,
  })

  if (
    !Number.isInteger(Number(response?.data?.id_usuario)) ||
    Number(response.data.id_usuario) <= 0
  ) {
    throw new Error('La API no confirmó el registro del cliente.')
  }

  return response.data
}

export async function getMyCustomer(token) {
  const response = await apiRequest('/clientes/me', { token })

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el perfil de cliente esperado.')
  }

  return response.data
}

export async function updateMyCustomer(token, customer) {
  const response = await apiRequest('/clientes/me', {
    token,
    method: 'PUT',
    body: customer,
  })

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el perfil actualizado.')
  }

  return response.data
}

export async function getCustomers(token) {
  const response = await apiRequest('/clientes', { token })

  if (!Array.isArray(response?.data)) {
    throw new Error('La API no devolvió el listado de clientes esperado.')
  }

  return response.data
}

export async function getCustomer(token, customerId) {
  const response = await apiRequest(`/clientes/${customerId}`, { token })

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el cliente solicitado.')
  }

  return response.data
}

export async function updateCustomer(token, customerId, customer) {
  return apiRequest(`/clientes/${customerId}`, {
    token,
    method: 'PUT',
    body: customer,
  })
}

export async function changeCustomerStatus(token, customerId, estado) {
  return apiRequest(`/clientes/${customerId}/status`, {
    token,
    method: 'PATCH',
    body: { estado },
  })
}

export async function deleteCustomer(token, customerId) {
  return apiRequest(`/clientes/${customerId}`, {
    token,
    method: 'DELETE',
  })
}
