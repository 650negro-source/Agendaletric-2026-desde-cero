const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getEmailValidationMessage(value) {
  const email = typeof value === 'string' ? value.trim() : ''

  if (!email) {
    return 'Ingresa tu correo electrónico.'
  }
  if (/\s/.test(email)) {
    return 'El correo electrónico no puede contener espacios.'
  }
  if (email.length > 150) {
    return 'El correo electrónico no puede superar 150 caracteres.'
  }

  const atIndex = email.indexOf('@')
  if (atIndex === -1) {
    return 'Al correo le falta el signo @. Ejemplo: nombre@dominio.com.'
  }
  if (email.indexOf('@', atIndex + 1) !== -1) {
    return 'El correo debe tener un solo signo @.'
  }
  if (atIndex === 0) {
    return 'Escribe un nombre antes del signo @.'
  }

  const domain = email.slice(atIndex + 1)
  if (!domain) {
    return 'Escribe el dominio después del signo @.'
  }
  if (!domain.includes('.')) {
    return 'Al dominio le falta una extensión, como .com.'
  }
  if (!emailPattern.test(email)) {
    return 'Revisa el formato del correo. Ejemplo: nombre@dominio.com.'
  }

  return ''
}
