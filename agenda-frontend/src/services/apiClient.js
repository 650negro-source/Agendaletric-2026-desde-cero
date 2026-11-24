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
    'Too many login attempts. Try again in 15 minutes.': 'Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo nuevamente.',
    'Email is already registered': 'Ese correo ya está registrado.',
    'Identity document already registered': 'Ese documento de identidad ya está registrado.',
    'Email or identity document is already registered': 'El correo o el documento de identidad ya está registrado.',
    'Current password is incorrect': 'La contraseña actual es incorrecta.',
    'New password must be different': 'La nueva contraseña debe ser diferente de la actual.',
    'Password must be between 10 and 64 characters': 'La contraseña debe tener entre 10 y 64 caracteres.',
    'Password must not contain spaces': 'La contraseña no puede contener espacios.',
    'Password must include uppercase, lowercase, number, and symbol': 'Incluye una mayúscula, una minúscula, un número y un símbolo.',
    'Choose a less common password': 'Elige una contraseña menos común.',
    'Passwords do not match': 'Las contraseñas no coinciden.',
    'At least one active system administrator must remain': 'Debe quedar al menos una cuenta administradora activa.',
    'Only administrator and technician accounts can be created through user management': 'Desde gestión de usuarios solo se crean cuentas de administrador o técnico.',
    'Role cannot be assigned through user management': 'Ese rol no se puede asignar desde la gestión genérica de usuarios.',
    'You cannot change your own role; ask another administrator': 'Para cambiar tu rol, solicita el cambio a otro administrador.',
    'Role does not exist': 'El rol seleccionado ya no está disponible.',
    'User not found': 'No se encontró el usuario solicitado.',
    'Client not found': 'No se encontró el cliente solicitado.',
    'Invalid client ID': 'El cliente solicitado no es válido.',
    'All fields are required': 'Completa todos los campos obligatorios.',
    'Invalid name': 'Ingresa un nombre válido, solo con letras, espacios, apóstrofo o guion.',
    'Invalid full name': 'Ingresa un nombre válido, solo con letras, espacios, apóstrofo o guion.',
    'Invalid email format': 'Ingresa un correo electrónico válido.',
    'Name, identity document, phone, email, and password are required': 'Completa nombre, documento, teléfono, correo y contraseña.',
    'Name, identity document, phone, and email are required': 'Completa nombre, cédula, teléfono y correo.',
    'Identity document is required and must not exceed 50 characters': 'Ingresa un documento de identidad de hasta 50 caracteres.',
    'Phone is required and must not exceed 20 characters': 'Ingresa un teléfono de hasta 20 caracteres.',
    'Identity document must contain 6 to 10 digits': 'La cédula debe contener entre 6 y 10 dígitos.',
    'Mobile phone must contain 10 digits and start with 3': 'El celular debe tener 10 dígitos y comenzar por 3.',
    'Address must be a string': 'La dirección no es válida.',
    'Address must not exceed 150 characters': 'La dirección no puede superar 150 caracteres.',
    'Current password, new password, and confirmation are required': 'Completa la contraseña actual, la nueva y su confirmación.',
    'Name must contain at least 2 characters': 'El nombre debe tener al menos 2 caracteres.',
    'Password must contain at least 8 characters': 'La contraseña debe tener al menos 8 caracteres.',
    'Role ID must be a positive integer': 'Selecciona un rol válido.',
    'Invalid role ID': 'Selecciona un rol válido.',
    'Status must be 0 or 1': 'El estado seleccionado no es válido.',
  }

  return translations[message] || message || `La solicitud falló (HTTP ${status}).`
}
