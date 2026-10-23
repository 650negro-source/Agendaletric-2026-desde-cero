import { apiRequest } from './apiClient.js'

const SESSION_KEY = 'agendaletric.session'

export async function signIn({ correo, contrasena }) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: { correo: correo.trim(), contrasena },
  })
  const session = response?.data

  if (
    typeof session?.token !== 'string' ||
    !session.token ||
    !session.user ||
    !Number.isInteger(Number(session.user.id_rol))
  ) {
    throw new Error('La respuesta de inicio de sesión no tiene el formato esperado.')
  }

  return {
    token: session.token,
    user: {
      ...session.user,
      id_rol: Number(session.user.id_rol),
    },
  }
}

export async function getMyProfile(token) {
  const response = await apiRequest('/users/me', { token })
  const profile = response?.data?.user ?? response?.data ?? response?.user
  const roleId = Number(profile?.id_rol)

  if (
    !profile ||
    !Number.isInteger(Number(profile.id_usuario)) ||
    Number(profile.id_usuario) <= 0 ||
    typeof profile.nombre !== 'string' ||
    typeof profile.correo !== 'string' ||
    !Number.isInteger(roleId) ||
    roleId <= 0
  ) {
    throw new Error('El perfil devuelto por la API no tiene el formato esperado.')
  }

  return { ...profile, id_rol: roleId }
}

export function readSession() {
  const serializedSession = window.sessionStorage.getItem(SESSION_KEY)

  if (!serializedSession) {
    return null
  }

  try {
    const session = JSON.parse(serializedSession)
    if (typeof session?.token === 'string' && session.token && session.user) {
      return session
    }
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY)
    return null
  }

  window.sessionStorage.removeItem(SESSION_KEY)
  return null
}

export function saveSession(session) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY)
}
