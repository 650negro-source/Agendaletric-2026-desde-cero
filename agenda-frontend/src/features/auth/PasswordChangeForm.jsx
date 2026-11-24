import { useState } from 'react'
import { changePassword } from '../../services/authService.js'
import { getPasswordValidationMessage } from '../../shared/passwordPolicy.js'

function PasswordChangeForm({ token, onCancel, onSuccess }) {
  const [contrasenaActual, setContrasenaActual] = useState('')
  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

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
      await changePassword(token, {
        contrasena_actual: contrasenaActual,
        nueva_contrasena: nuevaContrasena,
        confirmar_contrasena: confirmacion,
      })
      onSuccess()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="password-change-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">Seguridad de la cuenta</p>
            <h2 id="password-change-title">Cambiar contraseña</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Cerrar"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>
        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            Contraseña actual
            <input
              autoComplete="current-password"
              type="password"
              value={contrasenaActual}
              onChange={(event) => setContrasenaActual(event.target.value)}
              required
            />
          </label>
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
            Confirmar nueva contraseña
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
            Entre 10 y 64 caracteres, sin espacios, con mayúscula, minúscula,
            número y símbolo.
          </small>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button
              className="button button--secondary"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default PasswordChangeForm
