import { apiRequest } from './apiClient.js'

export async function getDashboardSummary(token) {
  const response = await apiRequest('/dashboard', { token })
  const summary = response?.data
  if (
    !summary?.citas ||
    !Array.isArray(summary.citas.por_estado) ||
    !Array.isArray(summary.reportes?.por_estado)
  ) {
    throw new Error('La API no devolvió el resumen esperado.')
  }
  return summary
}
