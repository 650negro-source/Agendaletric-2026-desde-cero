import { getEmailValidationMessage } from './emailValidation.js'

const personNamePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u

export function getCustomerDataValidationMessage(customer) {
  const name = customer.nombre_completo?.trim().normalize('NFC') ?? ''
  if (name.length < 2 || name.length > 60 || !personNamePattern.test(name)) {
    return 'Ingresa un nombre válido, solo con letras, espacios, apóstrofo o guion.'
  }
  if (!/^\d{6,10}$/.test(customer.documento_identidad?.trim() ?? '')) {
    return 'La cédula debe contener entre 6 y 10 dígitos.'
  }
  if (!/^3\d{9}$/.test(customer.telefono?.trim() ?? '')) {
    return 'El celular debe tener 10 dígitos y comenzar por 3.'
  }
  const email = customer.correo?.trim() ?? ''
  const emailError = getEmailValidationMessage(email)
  if (emailError) {
    return emailError
  }
  if ((customer.direccion?.trim().length ?? 0) > 150) {
    return 'La dirección no puede superar 150 caracteres.'
  }

  return ''
}
