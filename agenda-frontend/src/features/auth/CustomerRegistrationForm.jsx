import { useState } from 'react'
import { registerCustomer } from '../../services/customerService.js'
import { getPasswordValidationMessage } from '../../shared/passwordPolicy.js'
import { getCustomerDataValidationMessage } from '../../shared/customerValidation.js'

function CustomerRegistrationForm({ onCancel, onSuccess }) {
  const [form, setForm] = useState({
    nombre_completo: '',
    documento_identidad: '',
    telefono: '',
    correo: '',
    direccion: '',
    contrasena: '',
    confirmar_contrasena: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const customerError = getCustomerDataValidationMessage(form)
    if (customerError) {
      setError(customerError)
      return
    }

    const passwordError = getPasswordValidationMessage(form.contrasena)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (form.contrasena !== form.confirmar_contrasena) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerCustomer({
        ...form,
        correo: form.correo.trim(),
        direccion: form.direccion.trim() || null,
      })
      onSuccess(form.correo.trim().toLowerCase())
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="login-card" aria-labelledby="registration-title">
      <div className="login-brand-mark" aria-hidden="true">⚡</div>
      <p className="eyebrow">AgendaLetric</p>
      <h1 id="registration-title">Crear cuenta de cliente</h1>
      <p className="login-description">
        El registro público crea únicamente una cuenta de cliente.
      </p>

      <form className="user-form customer-registration-form" noValidate onSubmit={handleSubmit}>
        <label>
          Nombre completo
          <input
            autoComplete="name"
            maxLength="60"
            name="nombre_completo"
            value={form.nombre_completo}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Documento de identidad
          <input
            autoComplete="off"
            inputMode="numeric"
            maxLength="10"
            minLength="6"
            name="documento_identidad"
            pattern="[0-9]{6,10}"
            title="Ingresa de 6 a 10 dígitos."
            value={form.documento_identidad}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Teléfono
          <input
            autoComplete="tel"
            inputMode="numeric"
            maxLength="10"
            name="telefono"
            pattern="3[0-9]{9}"
            title="Ingresa 10 dígitos y comienza por 3."
            value={form.telefono}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Correo electrónico
          <input
            autoComplete="email"
            maxLength="150"
            name="correo"
            type="email"
            value={form.correo}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Dirección <span>(opcional)</span>
          <input
            autoComplete="street-address"
            maxLength="150"
            name="direccion"
            value={form.direccion}
            onChange={updateField}
          />
        </label>
        <label>
          Contraseña
          <input
            autoComplete="new-password"
            maxLength="64"
            name="contrasena"
            type="password"
            value={form.contrasena}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Confirmar contraseña
          <input
            autoComplete="new-password"
            maxLength="64"
            name="confirmar_contrasena"
            type="password"
            value={form.confirmar_contrasena}
            onChange={updateField}
            required
          />
        </label>
        <small>
          Usa entre 10 y 64 caracteres, sin espacios, con mayúscula, minúscula,
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
            Volver
          </button>
          <button className="button button--primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CustomerRegistrationForm
