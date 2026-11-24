export function getPasswordValidationMessage(password) {
  const length = Array.from(password).length
  const byteLength = new TextEncoder().encode(password).length

  if (length < 10 || length > 64 || byteLength > 72) {
    return 'Usa una contraseña de 10 a 64 caracteres.'
  }
  if (/\s/u.test(password)) {
    return 'La contraseña no puede contener espacios.'
  }
  if (
    !/\p{Lu}/u.test(password) ||
    !/\p{Ll}/u.test(password) ||
    !/\p{N}/u.test(password) ||
    !/[^\p{L}\p{N}\s]/u.test(password)
  ) {
    return 'Incluye mayúscula, minúscula, número y símbolo.'
  }

  return ''
}
