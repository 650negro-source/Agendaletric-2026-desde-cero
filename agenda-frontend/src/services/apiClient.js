const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

export async function apiRequest(path, {
  token,
  method = 'GET',
  body,
  responseType = 'json',
} = {}) {
  const headers = { Accept: responseType === 'blob' ? '*/*' : 'application/json' }
  const isFormData = body instanceof FormData

  if (body !== undefined && !isFormData) {
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
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (error) {
    const detail = error instanceof Error ? ` (${error.message})` : ''
    throw new Error(`No fue posible conectar con la API${detail}.`, { cause: error })
  }

  if (responseType === 'blob' && response.ok) {
    return response.blob()
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
    'Invalid credentials': 'El correo o la contraseña no coinciden con una cuenta. Verifica los datos e inténtalo nuevamente.',
    'Invalid or expired token': 'La sesión venció. Inicia sesión nuevamente.',
    'Invalid or inactive user': 'El usuario no existe o está inactivo.',
    'Access denied': 'Tu rol no tiene permiso para realizar esta acción.',
    'Internal server error': 'Ocurrió un error interno en el servidor.',
    'Too many login attempts. Try again in 15 minutes.': 'Demasiados intentos de inicio de sesión. Espera 15 minutos e inténtalo nuevamente.',
    'Email and password are required': 'Ingresa tu correo electrónico y contraseña.',
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
    'Customer profile not found': 'Tu cuenta no tiene un perfil de cliente. Complétalo desde “Mi perfil” para continuar.',
    'Customer account not found': 'No se encontró una cuenta de cliente activa.',
    'Client profile already exists': 'El perfil de cliente ya existe. Actualiza la página para continuar.',
    'Active client profile not found': 'Tu cuenta no tiene un perfil de cliente activo. Complétalo desde “Mi perfil” para continuar.',
    'Invalid client ID': 'El cliente solicitado no es válido.',
    'Vehicle not found': 'No se encontró el vehículo solicitado.',
    'Vehicle plate is already registered': 'Esa placa ya está registrada.',
    'Vehicle plate cannot be changed after it has appointments': 'No se puede cambiar la placa porque el vehículo tiene citas; registra el vehículo nuevo y da de baja este.',
    'Vehicle with active appointments cannot be deactivated': 'No se puede dar de baja el vehículo mientras tenga citas activas.',
    'Vehicle can only be permanently deleted after its client is deleted': 'Solo se puede eliminar permanentemente un vehículo cuando su cliente está eliminado.',
    'Vehicle with active appointments cannot be permanently deleted': 'Cancela todas las citas activas antes de eliminar permanentemente el vehículo.',
    'Plate must follow the Colombian format AAA999': 'La placa debe tener el formato colombiano de 3 letras y 3 números.',
    'Invalid vehicle type': 'Selecciona un tipo de vehículo válido.',
    'Invalid vehicle energy type': 'Selecciona un tipo de energía válido.',
    'Invalid marca': 'Ingresa una marca válida.',
    'Invalid modelo': 'Ingresa un modelo válido.',
    'Invalid color': 'Ingresa un color válido.',
    'Year must be between 1900 and the next calendar year': 'El año debe estar entre 1900 y el próximo año calendario.',
    'Client ID is required for administrators': 'Selecciona el cliente propietario del vehículo.',
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
    'Service duration is not configured': 'Este servicio aún no se puede reservar porque administración debe configurar su duración.',
    'Invalid or expired reset token': 'El enlace de recuperación venció o ya fue utilizado. Solicita uno nuevo.',
    'A valid reset token, new password, and confirmation are required': 'El enlace o los datos de la nueva contraseña no son válidos.',
    'Too many password recovery requests. Try again in 15 minutes.': 'Solicitaste demasiados enlaces. Espera 15 minutos e inténtalo nuevamente.',
    'Too many password reset attempts. Try again in 15 minutes.': 'Hubo demasiados intentos. Espera 15 minutos e inténtalo nuevamente.',
    'A service type with this name already exists': 'Ya existe un servicio con ese nombre.',
    'A fault type with this name already exists': 'Ya existe un tipo de avería con ese nombre.',
    'A non-empty service type name of at most 100 characters is required': 'El nombre del servicio es obligatorio y no debe superar 100 caracteres.',
    'A non-empty fault type name of at most 100 characters is required': 'El nombre del tipo de avería es obligatorio y no debe superar 100 caracteres.',
    'Service description must be a string of at most 255 characters': 'La descripción no debe superar 255 caracteres.',
    'Service duration must be from 60 to 360 minutes in 60-minute increments': 'La duración debe ser de 1 a 6 horas, en intervalos de una hora.',
    'Published reports can only be edited after an administrator requests a correction': 'El reporte publicado está bloqueado. Administración debe solicitar una corrección para habilitar cambios.',
    'Only draft or corrected reports can be published': 'Solo se pueden publicar reportes en borrador o que hayan sido devueltos para corrección.',
    'Only published reports can be sent for correction': 'Solo se pueden solicitar correcciones de un reporte publicado.',
    'Service type not found or inactive': 'El servicio seleccionado no está disponible.',
    'No technician is available at the requested date and time': 'Ese horario acaba de ocuparse o no tiene un técnico disponible. Elige otro.',
    'The client already has an active appointment': 'Ya tienes una cita activa. Cancélala o reprográmala antes de solicitar otra.',
    'Changes require at least 12 hours of notice': 'Solo puedes modificar la cita con al menos 12 horas de anticipación.',
    'Appointments must be scheduled at least 24 hours ahead': 'La cita debe programarse con al menos 24 horas de anticipación.',
    'Vehicle does not belong to the authenticated client': 'El vehículo seleccionado no pertenece a tu cuenta.',
    'The service type cannot be changed while rescheduling': 'Al reprogramar no se puede cambiar el servicio.',
    'Appointment can no longer be rescheduled': 'Esta cita ya no se puede reprogramar.',
    'Details are required for the selected service type': 'Especifica los detalles requeridos para este servicio.',
    'Technician profile not found': 'Aún no tienes un perfil técnico; solicita a administración que lo cree.',
    'Active technician user not found': 'La cuenta técnica no existe o está inactiva.',
    'Technician user not found': 'No se encontró la cuenta técnica.',
    'A technician profile already exists for this user': 'Ese usuario ya tiene un perfil técnico.',
    'Technician schedule intervals cannot overlap': 'Los turnos de un mismo día no pueden superponerse.',
    'Schedule change would invalidate active appointments': 'No se puede cambiar ese turno porque dejaría citas activas fuera del horario.',
    'End time must be later than start time': 'La hora de finalización debe ser posterior a la de inicio.',
    'A valid date and service type are required': 'Selecciona una fecha y un servicio válidos.',
  }

  return translations[message] || message || `La solicitud falló (HTTP ${status}).`
}
