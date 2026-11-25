import { useState } from 'react'
import { requestPasswordReset, resetPassword } from '../../services/authService.js'
import { getPasswordValidationMessage } from '../../shared/passwordPolicy.js'
import { getEmailValidationMessage } from '../../shared/emailValidation.js'
import './LoginPage.css'

function PasswordRecoveryPage({ token, onBack, onResetSuccess }) {
  const [correo, setCorreo] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetComplete, setIsResetComplete] = useState(false)

  async function handleRequest(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const emailError = getEmailValidationMessage(correo)
    if (emailError) {
      setError(emailError)
      return
    }

    setIsSubmitting(true)
    try {
      await requestPasswordReset(correo)
      setMessage(
        'Si existe una cuenta activa con ese correo, recibirás instrucciones para restablecer la contraseña.'
      )
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReset(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const passwordError = getPasswordValidationMessage(nuevaContrasena)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (nuevaContrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword(token, {
        nueva_contrasena: nuevaContrasena,
        confirmar_contrasena: confirmacion,
      })
      setIsResetComplete(true)
      setMessage('Tu contraseña se actualizó. Ya puedes iniciar sesión.')
      onResetSuccess()
    } catch (resetError) {
      setError(resetError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login-card" aria-labelledby="password-recovery-title">
      <div className="login-brand-mark" aria-hidden="true">⚡</div>
      <p className="eyebrow">Seguridad de la cuenta</p>
      <h1 id="password-recovery-title">
        {isResetComplete
          ? 'Contraseña actualizada'
          : token
            ? 'Crear contraseña nueva'
            : 'Recuperar contraseña'}
      </h1>
      <p className="login-description">
        {isResetComplete
          ? 'El enlace de recuperación ya no se puede volver a utilizar.'
          : token
            ? 'El enlace es de un solo uso y vence en 30 minutos.'
            : 'Ingresa el correo asociado a tu cuenta y te enviaremos un enlace de recuperación.'}
      </p>

      {message && <p className="feedback feedback--success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!isResetComplete && (
        <form
          className="login-form"
          noValidate
          onSubmit={token ? handleReset : handleRequest}
        >
          {token ? (
            <>
              <label>
                Nueva contraseña
                <input
                  autoComplete="new-password"
                  maxLength="64"
                  type="password"
                  value={nuevaContrasena}
                  onChange={(event) => setNuevaContrasena(event.target.value)}
                  required
                />
              </label>
              <label>
                Confirmar contraseña
                <input
                  autoComplete="new-password"
                  maxLength="64"
                  type="password"
                  value={confirmacion}
                  onChange={(event) => setConfirmacion(event.target.value)}
                  required
                />
              </label>
              <small>
                Entre 10 y 64 caracteres, sin espacios, con mayúscula,
                minúscula, número y símbolo.
              </small>
            </>
          ) : (
            <label>
              Correo electrónico
              <input
                autoComplete="email"
                type="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </label>
          )}
          <button className="button button--primary login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Procesando...'
              : token
                ? 'Actualizar contraseña'
                : 'Enviar instrucciones'}
          </button>
        </form>
      )}

      <button
        className="button button--quiet registration-link"
        type="button"
        onClick={onBack}
      >
        Volver a iniciar sesión
      </button>
    </section>
  )
}

export default PasswordRecoveryPage
