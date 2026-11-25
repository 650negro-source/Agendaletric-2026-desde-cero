import { useCallback, useEffect, useState } from 'react'
import { getDashboardSummary } from '../../services/dashboardService.js'
import '../users/UsersPage.css'
import './DashboardPage.css'

const APPOINTMENT_LABELS = {
  BORRADOR: 'Borrador',
  PROGRAMADA: 'Programada',
  VALIDADA: 'Validada',
  EN_PROCESO: 'En proceso',
  ATENDIDA: 'Atendida',
  CANCELADA: 'Cancelada',
}
const REPORT_LABELS = {
  BORRADOR: 'Pendientes de publicar',
  PUBLICADO: 'Publicados',
  REQUIERE_CORRECCION: 'Requieren corrección',
}

function DashboardPage({ session, onNavigate }) {
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadSummary = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      setSummary(await getDashboardSummary(session.token))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    let isCurrent = true

    getDashboardSummary(session.token)
      .then((nextSummary) => {
        if (isCurrent) setSummary(nextSummary)
      })
      .catch((error) => {
        if (isCurrent) setPageError(error.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [session.token])

  return (
    <main className="users-page dashboard-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Panel administrativo</h1>
          <p className="users-subtitle">
            Resumen de citas, reportes y usuarios activos.
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void loadSummary()}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {isLoading && !summary ? (
        <p className="users-state" role="status">Cargando resumen...</p>
      ) : summary ? (
        <>
          <section className="dashboard-metrics" aria-label="Resumen general">
            <button
              className="dashboard-metric dashboard-metric--interactive"
              type="button"
              onClick={() => onNavigate('appointments', { type: 'today' })}
              aria-label={`Ver ${summary.citas.hoy} citas de hoy`}
            >
              <span>Citas de hoy</span>
              <strong>{summary.citas.hoy}</strong>
            </button>
            <button
              className="dashboard-metric dashboard-metric--interactive"
              type="button"
              onClick={() => onNavigate('appointments', { type: 'next-seven-days' })}
              aria-label={`Ver ${summary.citas.proximos_7_dias} citas de los próximos 7 días`}
            >
              <span>Citas próximos 7 días</span>
              <strong>{summary.citas.proximos_7_dias}</strong>
            </button>
            <button
              className="dashboard-metric dashboard-metric--interactive"
              type="button"
              onClick={() => onNavigate('clients', { activeOnly: true })}
              aria-label={`Ver ${summary.clientes_activos} clientes activos`}
            >
              <span>Clientes activos</span>
              <strong>{summary.clientes_activos}</strong>
            </button>
            <button
              className="dashboard-metric dashboard-metric--interactive"
              type="button"
              onClick={() => onNavigate('technicians', { activeOnly: true })}
              aria-label={`Ver ${summary.tecnicos_activos} técnicos activos`}
            >
              <span>Técnicos activos</span>
              <strong>{summary.tecnicos_activos}</strong>
            </button>
          </section>

          <section className="users-card dashboard-card" aria-labelledby="dashboard-appointments-title">
            <div className="users-toolbar">
              <div>
                <h2 id="dashboard-appointments-title">Citas por estado</h2>
                <p>Conteo de todas las citas registradas</p>
              </div>
            </div>
            <ul className="dashboard-breakdown">
              {summary.citas.por_estado.map(({ estado, total }) => (
                <li key={estado}>
                  <button
                    className="dashboard-breakdown-item dashboard-breakdown-item--interactive"
                    type="button"
                    onClick={() => onNavigate('appointments', { type: 'status', value: estado })}
                    aria-label={`Ver ${total} citas: ${APPOINTMENT_LABELS[estado] || estado}`}
                  >
                    <span>{APPOINTMENT_LABELS[estado] || estado}</span>
                    <strong>{total}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="users-card dashboard-card" aria-labelledby="dashboard-reports-title">
            <div className="users-toolbar">
              <div>
                <h2 id="dashboard-reports-title">Reportes técnicos</h2>
                <p>Estado actual de publicación</p>
              </div>
            </div>
            <ul className="dashboard-breakdown">
              {summary.reportes.por_estado.map(({ estado, total }) => (
                <li key={estado}>
                  <button
                    className="dashboard-breakdown-item dashboard-breakdown-item--interactive"
                    type="button"
                    onClick={() => onNavigate('reports', { publicationState: estado })}
                    aria-label={`Ver ${total} reportes: ${REPORT_LABELS[estado] || estado}`}
                  >
                    <span>{REPORT_LABELS[estado] || estado}</span>
                    <strong>{total}</strong>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <p className="users-state">No hay información disponible.</p>
      )}
    </main>
  )
}

export default DashboardPage
