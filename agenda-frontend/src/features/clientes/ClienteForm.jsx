import { useState } from 'react'
import { getCustomerDataValidationMessage } from '../../shared/customerValidation.js'

function ClienteForm({ cliente, onCancel, onSubmit, submitLabel = 'Guardar cambios' }) {
  const [form, setForm] = useState({
    nombre_completo: cliente.nombre_completo ?? '',
    documento_identidad: cliente.documento_identidad ?? '',
    telefono: cliente.telefono ?? '',
    correo: cliente.correo ?? '',
    preferencia_notificacion: cliente.preferencia_notificacion ?? 'CORREO',
    direccion: cliente.direccion ?? '',
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

    const validationMessage = getCustomerDataValidationMessage(form)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...form,
        nombre_completo: form.nombre_completo.trim().normalize('NFC'),
        documento_identidad: form.documento_identidad.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim().toLowerCase(),
        direccion: form.direccion.trim() || null,
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <label>
        Nombre completo
        <input
          autoComplete="name"
          maxLength="60"
          minLength="2"
          name="nombre_completo"
          value={form.nombre_completo}
          onChange={updateField}
          required
        />
      </label>
      <label>
        Cédula de ciudadanía
        <input
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
        Celular
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
        Canal preferido para recordatorios y reportes
        <select
          name="preferencia_notificacion"
          value={form.preferencia_notificacion}
          onChange={updateField}
        >
          <option value="CORREO">Correo electrónico</option>
          <option value="WHATSAPP">WhatsApp (simulación)</option>
        </select>
      </label>
      {form.preferencia_notificacion === 'WHATSAPP' && (
        <small>
          Los mensajes de WhatsApp se simulan por ahora; no se enviarán al celular.
        </small>
      )}
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
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        {onCancel && (
          <button
            className="button button--secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        )}
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default ClienteForm
