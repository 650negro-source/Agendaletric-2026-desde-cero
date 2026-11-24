import { useState } from 'react'
import { getAssignableUserRoles } from '../../shared/userRoles.js'
import { getPasswordValidationMessage } from '../../shared/passwordPolicy.js'

function UserForm({ mode, user, onCancel, onSubmit }) {
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [correo, setCorreo] = useState(user?.correo || '')
  const [idRol, setIdRol] = useState(String(user?.id_rol ?? ''))
  const [contrasena, setContrasena] = useState('')
  const [confirmarContrasena, setConfirmarContrasena] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isCreating = mode === 'create'
  const availableRoles = getAssignableUserRoles(user?.id_rol)
  const isExistingCustomer = !isCreating && Number(user?.id_rol) === 2

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!idRol) {
      setError('Selecciona un rol para el usuario.')
      return
    }
    if (isCreating) {
      const passwordError = getPasswordValidationMessage(contrasena)
      if (passwordError) {
        setError(passwordError)
        return
      }
      if (contrasena !== confirmarContrasena) {
        setError('Las contraseñas no coinciden.')
        return
      }
    }

    const userData = {
      nombre: nombre.trim(),
      correo: correo.trim(),
      id_rol: Number(idRol),
    }

    if (isCreating) {
      userData.contrasena = contrasena
      userData.confirmar_contrasena = confirmarContrasena
    }

    setIsSubmitting(true)
    try {
      await onSubmit(userData)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{isCreating ? 'Nueva cuenta' : 'Editar cuenta'}</p>
            <h2 id="user-form-title">{isCreating ? 'Crear usuario' : 'Actualizar usuario'}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Cerrar formulario" onClick={onCancel} disabled={isSubmitting}>
            ×
          </button>
        </div>

        <form className="user-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              autoComplete="name"
              maxLength="60"
              minLength="2"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              required
            />
          </label>
          <label>
            Correo electrónico
            <input
              autoComplete="email"
              maxLength="150"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              required
            />
          </label>
          <label>
            Rol
            <select
              value={idRol}
              onChange={(event) => setIdRol(event.target.value)}
              disabled={isExistingCustomer}
              required
            >
              <option value="">Selecciona un rol</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            {isExistingCustomer && (
              <small>El rol de cliente se conserva junto con su perfil de cliente.</small>
            )}
          </label>
          {isCreating && (
            <>
              <label>
                Contraseña inicial
                <input
                  autoComplete="new-password"
                  maxLength="64"
                  type="password"
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  required
                />
                <small>
                  Entre 10 y 64 caracteres, sin espacios, con mayúscula,
                  minúscula, número y símbolo.
                </small>
              </label>
              <label>
                Confirmar contraseña
                <input
                  autoComplete="new-password"
                  maxLength="64"
                  type="password"
                  value={confirmarContrasena}
                  onChange={(event) => setConfirmarContrasena(event.target.value)}
                  required
                />
              </label>
            </>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : isCreating ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UserForm
