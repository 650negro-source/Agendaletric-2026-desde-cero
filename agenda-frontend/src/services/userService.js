import { apiRequest } from './apiClient.js'

export async function getUsers(token) {
  const response = await apiRequest('/users', { token })

  if (!Array.isArray(response?.data)) {
    throw new Error('La API no devolvió el arreglo de usuarios esperado.')
  }

  return response.data
}

export async function getUser(token, userId) {
  const response = await apiRequest(`/users/${userId}`, { token })

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('La API no devolvió el usuario solicitado.')
  }

  return response.data
}

export async function createUser(token, user) {
  return apiRequest('/users', {
    token,
    method: 'POST',
    body: user,
  })
}

export async function updateUser(token, userId, user) {
  return apiRequest(`/users/${userId}`, {
    token,
    method: 'PUT',
    body: user,
  })
}

export async function changeUserStatus(token, userId, estado) {
  return apiRequest(`/users/${userId}/status`, {
    token,
    method: 'PATCH',
    body: { estado },
  })
}

export async function deleteUser(token, userId) {
  return apiRequest(`/users/${userId}`, {
    token,
    method: 'DELETE',
  })
}
