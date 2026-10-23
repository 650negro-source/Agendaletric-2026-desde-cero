const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export async function apiRequest(path, { token, method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : ''
    throw new Error(`No fue posible conectar con la API${detail}.`, { cause: error })
  }

  const responseText = await response.text()
  let payload = null

  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      if (response.ok) {
        throw new Error('La API respondió con un formato distinto de JSON.')
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('agendaletric:unauthorized'))
    }

    const error = new Error(toSpanishError(payload?.message, response.status))
    error.status = response.status
    throw error
  }

  return payload
}

function toSpanishError(message, status) {
  const translations = {
    'Authentication required': 'Debes iniciar sesión para continuar.',
    'Invalid credentials': 'El correo o la contraseña son incorrectos.',
    'Invalid or expired token': 'La sesión venció. Inicia sesión nuevamente.',
    'Invalid or inactive user': 'El usuario no existe o está inactivo.',
    'Access denied': 'Tu rol no tiene permiso para realizar esta acción.',
    'Internal server error': 'Ocurrió un error interno en el servidor.',
    'Email is already registered': 'Ese correo ya está registrado.',
    'Role does not exist': 'El rol seleccionado ya no está disponible.',
    'User not found': 'No se encontró el usuario solicitado.',
    'All fields are required': 'Completa todos los campos obligatorios.',
    'Name must contain at least 2 characters': 'El nombre debe tener al menos 2 caracteres.',
    'Invalid name': 'El nombre no es válido.',
    'Invalid email format': 'Ingresa un correo electrónico válido.',
    'Password must contain at least 8 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'Role ID must be a positive integer': 'Selecciona un rol válido.',
    'Invalid role ID': 'Selecciona un rol válido.',
    'Status must be 0 or 1': 'El estado seleccionado no es válido.',
  }

  return translations[message] || message || `La solicitud falló (HTTP ${status}).`
}
