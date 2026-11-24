import { useState } from 'react'
import { getVehicleValidationMessage, VEHICLE_ENERGY_TYPES, VEHICLE_TYPES } from '../../shared/vehiclePolicy.js'

function VehiculoForm({ vehicle, clients, isAdmin, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    placa: vehicle?.placa ?? '',
    marca: vehicle?.marca ?? '',
    modelo: vehicle?.modelo ?? '',
    anio: vehicle?.anio ? String(vehicle.anio) : '',
    color: vehicle?.color ?? '',
    tipo_vehiculo: vehicle?.tipo_vehiculo ?? '',
    tipo_energia: vehicle?.tipo_energia ?? '',
    id_cliente: vehicle?.id_cliente ? String(vehicle.id_cliente) : '',
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

    const validationData = { ...form }
    if (!isAdmin || vehicle) delete validationData.id_cliente
    const validationMessage = getVehicleValidationMessage(validationData)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    const vehicleData = {
      placa: form.placa.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio: Number(form.anio),
      color: form.color.trim(),
      tipo_vehiculo: form.tipo_vehiculo,
      tipo_energia: form.tipo_energia,
    }
    if (isAdmin && !vehicle) {
      vehicleData.id_cliente = Number(form.id_cliente)
    }

    setIsSubmitting(true)
    try {
      await onSubmit(vehicleData)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="user-form vehicle-form" onSubmit={handleSubmit}>
      {isAdmin && !vehicle && (
        <label>
          Cliente propietario
          <select name="id_cliente" value={form.id_cliente} onChange={updateField} required>
            <option value="">Selecciona un cliente activo</option>
            {clients.map((client) => (
              <option key={client.id_cliente} value={client.id_cliente}>
                {client.nombre_completo} — {client.documento_identidad}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Placa
        <input
          autoCapitalize="characters"
          autoComplete="off"
          maxLength="6"
          name="placa"
          pattern="[A-Za-z]{3}[0-9]{3}"
          placeholder="ABC123"
          title="Formato colombiano: 3 letras seguidas de 3 números."
          value={form.placa}
          onChange={updateField}
          required
        />
      </label>
      <label>
        Tipo de vehículo
        <select name="tipo_vehiculo" value={form.tipo_vehiculo} onChange={updateField} required>
          <option value="">Selecciona un tipo</option>
          {VEHICLE_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Tipo de energía
        <select name="tipo_energia" value={form.tipo_energia} onChange={updateField} required>
          <option value="">Selecciona energía</option>
          {VEHICLE_ENERGY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Marca
        <input
          maxLength="50"
          name="marca"
          value={form.marca}
          onChange={updateField}
          required
        />
      </label>
      <label>
        Modelo
        <input
          maxLength="50"
          name="modelo"
          value={form.modelo}
          onChange={updateField}
          required
        />
      </label>
      <label>
        Año
        <input
          max={new Date().getFullYear() + 1}
          min="1900"
          name="anio"
          type="number"
          value={form.anio}
          onChange={updateField}
          required
        />
      </label>
      <label>
        Color
        <input
          maxLength="30"
          name="color"
          value={form.color}
          onChange={updateField}
          required
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : vehicle ? 'Guardar cambios' : 'Registrar vehículo'}
        </button>
      </div>
    </form>
  )
}

export default VehiculoForm
