import assert from 'node:assert/strict'
import test from 'node:test'
import { getEmailValidationMessage } from '../src/shared/emailValidation.js'

test('email validation gives actionable messages for missing parts', () => {
  assert.match(getEmailValidationMessage(''), /Ingresa tu correo/)
  assert.match(getEmailValidationMessage('usuarioejemplo.com'), /falta el signo @/)
  assert.match(getEmailValidationMessage('usuario@dominio'), /falta una extensión/)
})

test('email validation accepts valid addresses and rejects malformed ones', () => {
  assert.equal(getEmailValidationMessage(' persona@ejemplo.com '), '')
  assert.match(getEmailValidationMessage('persona@@ejemplo.com'), /un solo signo @/)
  assert.match(getEmailValidationMessage('persona @ejemplo.com'), /no puede contener espacios/)
})
