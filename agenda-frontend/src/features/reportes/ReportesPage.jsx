import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAppointments } from '../../services/appointmentService.js'
import {
  downloadReportFile,
  getAppointmentReport,
  publishAppointmentReport,
  requestReportCorrection,
  updateAppointmentReport,
  uploadReportEvidence,
} from '../../services/technicalReportService.js'
import {
  ADMIN_ROLE_ID,
  CUSTOMER_ROLE_ID,
  TECHNICIAN_ROLE_ID,
} from '../../shared/userRoles.js'
import '../users/UsersPage.css'
import '../users/UsersTable.css'
import './ReportesPage.css'

const PUBLICATION_LABELS = {
  BORRADOR: 'Borrador',
  PUBLICADO: 'Publicado',
  REQUIERE_CORRECCION: 'Requiere corrección',
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function ReportesPage({ session }) {
  const roleId = Number(session.user.id_rol)
  const isAdmin = roleId === ADMIN_ROLE_ID
  const isCustomer = roleId === CUSTOMER_ROLE_ID
  const canManage = isAdmin || roleId === TECHNICIAN_ROLE_ID
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [report, setReport] = useState(null)
  const [draft, setDraft] = useState({
    diagnostico: '',
    procedimiento_realizado: '',
    observaciones: '',
  })
  const [correctionComment, setCorrectionComment] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const reportRequestId = useRef(0)

  const loadAppointments = useCallback(async () => {
    setPageError('')
    setIsLoading(true)
    try {
      const loaded = await getAppointments(session.token)
      setAppointments(loaded.filter((appointment) => appointment.estado === 'ATENDIDA'))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    let isCurrent = true
    getAppointments(session.token)
      .then((loaded) => {
        if (isCurrent) {
          setAppointments(loaded.filter((appointment) => appointment.estado === 'ATENDIDA'))
        }
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

  const publicationState = report?.estado_publicacion
  const isEditable = canManage && ['BORRADOR', 'REQUIERE_CORRECCION'].includes(publicationState)
  const appointmentSubtitle = useMemo(() => {
    if (!selectedAppointment) return ''
    return `${formatDate(selectedAppointment.fecha_programada)} · ${String(selectedAppointment.hora_programada).slice(0, 5)} · ${selectedAppointment.placa}`
  }, [selectedAppointment])

  async function handleSelectAppointment(appointment) {
    const requestId = reportRequestId.current + 1
    reportRequestId.current = requestId
    setSelectedAppointment(appointment)
    setReport(null)
    setInfoMessage('')
    setPageError('')
    setSuccessMessage('')
    setIsLoadingReport(true)
    try {
      const loadedReport = await getAppointmentReport(session.token, appointment.id_cita)
      if (requestId !== reportRequestId.current) return
      setReport(loadedReport)
      setDraft({
        diagnostico: loadedReport.diagnostico ?? '',
        procedimiento_realizado: loadedReport.procedimiento_realizado ?? '',
        observaciones: loadedReport.observaciones ?? '',
      })
    } catch (error) {
      if (requestId !== reportRequestId.current) return
      if (error.status === 404) {
        setInfoMessage(
          isCustomer
            ? 'El reporte todavía no está publicado para consulta.'
            : 'Esta cita no tiene un reporte técnico disponible.'
        )
      } else {
        setPageError(error.message)
      }
    } finally {
      if (requestId === reportRequestId.current) setIsLoadingReport(false)
    }
  }

  async function refreshReport() {
    if (!selectedAppointment) return
    const loadedReport = await getAppointmentReport(
      session.token,
      selectedAppointment.id_cita
    )
    setReport(loadedReport)
    setDraft({
      diagnostico: loadedReport.diagnostico ?? '',
      procedimiento_realizado: loadedReport.procedimiento_realizado ?? '',
      observaciones: loadedReport.observaciones ?? '',
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    if (!selectedAppointment) return
    setIsSaving(true)
    setPageError('')
    setSuccessMessage('')
    try {
      const response = await updateAppointmentReport(
        session.token,
        selectedAppointment.id_cita,
        draft
      )
      setReport(response.data)
      setSuccessMessage('El reporte se guardó correctamente.')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!selectedAppointment || !selectedFile) return
    setIsSaving(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await uploadReportEvidence(session.token, selectedAppointment.id_cita, selectedFile)
      setSelectedFile(null)
      await refreshReport()
      setSuccessMessage('La evidencia se adjuntó correctamente.')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!selectedAppointment) return
    setIsSaving(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await publishAppointmentReport(session.token, selectedAppointment.id_cita)
      await refreshReport()
      setSuccessMessage('El reporte se publicó para el cliente.')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCorrection(event) {
    event.preventDefault()
    if (!selectedAppointment) return
    setIsSaving(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await requestReportCorrection(
        session.token,
        selectedAppointment.id_cita,
        correctionComment
      )
      setCorrectionComment('')
      await refreshReport()
      setSuccessMessage('Se solicitó la corrección al técnico.')
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDownload(path, filename) {
    setPageError('')
    try {
      await downloadReportFile(session.token, path, filename)
    } catch (error) {
      setPageError(error.message)
    }
  }

  return (
    <main className="users-page reports-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">{isCustomer ? 'Servicio' : 'Gestión de servicio'}</p>
          <h1>{isCustomer ? 'Mis reportes técnicos' : 'Reportes técnicos'}</h1>
          <p className="users-subtitle">
            {isCustomer
              ? 'Consulta los reportes publicados de tus citas atendidas.'
              : 'Completa el reporte de cada cita atendida, adjunta evidencia y publícalo.'}
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void loadAppointments()}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}

      <section className="users-card">
        <div className="users-toolbar">
          <div>
            <h2>Citas atendidas</h2>
            <p>Selecciona una cita para consultar su reporte.</p>
          </div>
        </div>
        {isLoading ? (
          <p className="users-state" role="status">Cargando citas atendidas...</p>
        ) : appointments.length === 0 ? (
          <p className="users-state">No hay citas atendidas.</p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table reports-table">
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  <th scope="col">Servicio</th>
                  <th scope="col">Vehículo</th>
                  {!isCustomer && <th scope="col">Cliente</th>}
                  {roleId !== TECHNICIAN_ROLE_ID && !isCustomer && <th scope="col">Técnico</th>}
                  <th scope="col">Reporte</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id_cita}>
                    <td>{formatDate(appointment.fecha_programada)} · {String(appointment.hora_programada).slice(0, 5)}</td>
                    <td>{appointment.tipo_servicio_nombre || 'Servicio'}</td>
                    <td>{appointment.placa}</td>
                    {!isCustomer && <td>{appointment.nombre_cliente}</td>}
                    {roleId !== TECHNICIAN_ROLE_ID && !isCustomer && (
                      <td>{appointment.nombre_tecnico || '—'}</td>
                    )}
                    <td>
                      <button
                        className="text-button"
                        type="button"
                        disabled={isLoadingReport || isSaving}
                        onClick={() => void handleSelectAppointment(appointment)}
                      >
                        {selectedAppointment?.id_cita === appointment.id_cita
                          ? 'Seleccionada'
                          : 'Consultar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedAppointment && (
        <section className="users-card report-detail" aria-live="polite">
          <div className="users-toolbar">
            <div>
              <h2>Cita #{selectedAppointment.id_cita}</h2>
              <p>{appointmentSubtitle} · {selectedAppointment.tipo_servicio_nombre || 'Servicio'}</p>
            </div>
            {report && (
              <span className="appointment-status">
                {PUBLICATION_LABELS[publicationState] || publicationState}
              </span>
            )}
          </div>
          {isLoadingReport ? (
            <p className="users-state" role="status">Cargando reporte...</p>
          ) : infoMessage ? (
            <p className="users-state">{infoMessage}</p>
          ) : report ? (
            <div className="report-content">
              {canManage && isEditable ? (
                <form className="report-form" onSubmit={handleSave}>
                  <label>
                    Diagnóstico
                    <textarea
                      value={draft.diagnostico}
                      onChange={(event) => setDraft((current) => ({ ...current, diagnostico: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Procedimiento realizado
                    <textarea
                      value={draft.procedimiento_realizado}
                      onChange={(event) => setDraft((current) => ({ ...current, procedimiento_realizado: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Observaciones
                    <textarea
                      value={draft.observaciones}
                      onChange={(event) => setDraft((current) => ({ ...current, observaciones: event.target.value }))}
                    />
                  </label>
                  {report.comentario_admin && (
                    <p className="feedback feedback--notice">
                      Solicitud de administración: {report.comentario_admin}
                    </p>
                  )}
                  <button className="button button--primary" type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar reporte'}
                  </button>
                </form>
              ) : (
                <div className="report-readonly">
                  <h3>Diagnóstico</h3>
                  <p>{report.diagnostico}</p>
                  <h3>Procedimiento realizado</h3>
                  <p>{report.procedimiento_realizado}</p>
                  {report.observaciones && (
                    <>
                      <h3>Observaciones</h3>
                      <p>{report.observaciones}</p>
                    </>
                  )}
                </div>
              )}

              {report.archivos?.length > 0 && (
                <div className="report-evidence">
                  <h3>Evidencias</h3>
                  <ul>
                    {report.archivos.map((file, index) => (
                      <li key={file.id_archivo || `${file.nombre_original}-${file.fecha_subida}-${index}`}>
                        {canManage && file.url ? (
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void handleDownload(
                              file.url,
                              file.nombre_original
                            )}
                          >
                            {file.nombre_original}
                          </button>
                        ) : (
                          <span>{file.nombre_original}</span>
                        )}
                        <span className="user-email">
                          {file.tipo_mime} · {Math.ceil(Number(file.tamano_bytes) / 1024)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {canManage && isEditable && (
                <>
                  <form className="report-upload" onSubmit={handleUpload}>
                    <label>
                      Adjuntar foto JPG/JPEG o video MP4 (máximo 10 MB por archivo)
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.mp4,image/jpeg,video/mp4"
                        onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button className="button button--secondary" type="submit" disabled={isSaving || !selectedFile}>
                      {isSaving ? 'Subiendo...' : 'Adjuntar evidencia'}
                    </button>
                  </form>
                  <button
                    className="button button--primary"
                    type="button"
                    onClick={() => void handlePublish()}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Publicando...' : 'Publicar para el cliente'}
                  </button>
                </>
              )}

              {isAdmin && publicationState === 'PUBLICADO' && (
                <form className="report-correction" onSubmit={handleCorrection}>
                  <label>
                    Motivo de la corrección
                    <textarea
                      value={correctionComment}
                      onChange={(event) => setCorrectionComment(event.target.value)}
                      required
                    />
                  </label>
                  <button className="button button--secondary" type="submit" disabled={isSaving}>
                    Solicitar corrección al técnico
                  </button>
                </form>
              )}

              <button
                className="button button--secondary"
                type="button"
                onClick={() => void handleDownload(
                  `/reportes-tecnicos/${selectedAppointment.id_cita}/pdf`,
                  `reporte-tecnico-${selectedAppointment.id_cita}.pdf`
                )}
              >
                Descargar PDF
              </button>
            </div>
          ) : null}
        </section>
      )}
    </main>
  )
}

export default ReportesPage
