export const VEHICLE_TYPES = [
  { value: 'AUTOMOVIL', label: 'Automóvil' },
  { value: 'CAMIONETA', label: 'Camioneta' },
  { value: 'CAMION', label: 'Camión' },
  { value: 'OTRO', label: 'Otro vehículo terrestre' },
]

export const VEHICLE_ENERGY_TYPES = [
  { value: 'GASOLINA', label: 'Gasolina' },
  { value: 'DIESEL', label: 'Diésel' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'ELECTRICO', label: 'Eléctrico' },
]

export function getVehicleValidationMessage(vehicle) {
  const plate = vehicle.placa?.trim().toUpperCase() ?? ''
  if (!/^[A-Z]{3}\d{3}$/.test(plate)) {
    return 'La placa debe tener el formato colombiano de 3 letras y 3 números.'
  }
  if (!vehicle.marca?.trim() || vehicle.marca.trim().length > 50) {
    return 'Ingresa una marca de máximo 50 caracteres.'
  }
  if (!vehicle.modelo?.trim() || vehicle.modelo.trim().length > 50) {
    return 'Ingresa un modelo de máximo 50 caracteres.'
  }
  const year = Number(vehicle.anio)
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
    return `El año debe estar entre 1900 y ${new Date().getFullYear() + 1}.`
  }
  if (!vehicle.color?.trim() || vehicle.color.trim().length > 30) {
    return 'Ingresa un color de máximo 30 caracteres.'
  }
  if (!VEHICLE_TYPES.some(({ value }) => value === vehicle.tipo_vehiculo)) {
    return 'Selecciona un tipo de vehículo válido.'
  }
  if (!VEHICLE_ENERGY_TYPES.some(({ value }) => value === vehicle.tipo_energia)) {
    return 'Selecciona un tipo de energía válido.'
  }
  if (vehicle.id_cliente !== undefined && (!Number.isInteger(Number(vehicle.id_cliente)) || Number(vehicle.id_cliente) <= 0)) {
    return 'Selecciona un cliente válido.'
  }

  return ''
}
