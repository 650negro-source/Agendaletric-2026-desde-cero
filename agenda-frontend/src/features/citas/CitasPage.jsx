import { useCallback, useEffect, useMemo, useState } from 'react'
import { getVehicles } from '../../services/vehicleService.js'
import {
  cancelAppointment,
  createAppointment,
  getAppointments,
  getAvailableSlots,
  rescheduleAppointment,
  transitionAppointment,
} from '../../services/appointmentService.js'
import { getFaultTypes, getServiceTypes } from '../../services/catalogService.js'
import {
  ADMIN_ROLE_ID,
  CUSTOMER_ROLE_ID,
  TECHNICIAN_ROLE_ID,
} from '../../shared/userRoles.js'
import './CitasPage.css'
import '../users/UserForm.css'
import '../users/UsersPage.css'
import '../users/UsersTable.css'

const ACTIVE_STATES = ['BORRADOR', 'PROGRAMADA', 'VALIDADA', 'EN_PROCESO']
const CHANGEABLE_STATES = ['BORRADOR', 'PROGRAMADA', 'VALIDADA']
const STATUS_LABELS = {
  BORRADOR: 'Borrador',
  PROGRAMADA: 'Programada',
  VALIDADA: 'Validada',
  EN_PROCESO: 'En proceso',
  ATENDIDA: 'Atendida',
  CANCELADA: 'Cancelada',
}
const REMINDER_LABELS = {
  PENDIENTE: 'Programado (demostración)',
  SIMULADO: 'Simulado; no se envió',
  CANCELADO: 'Cancelado',
  ENVIADO: 'Enviado',
  FALLIDO: 'Fallido',
}

function getDefaultDate() {
  const date = new Date()
  date.setDate(date.getDate() + 2)
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = String(value).slice(0, 10).split('-')
  return `${day}/${month}/${year}`
}

function formatReminderDate(value) {
  if (!value) return '—'
  const [date, time] = String(value).split(' ')
  return `${formatDate(date)} ${time?.slice(0, 5) || ''}`.trim()
}

function formatDuration(value) {
  if (!value) return 'Duración pendiente'
  const hours = Number(value) / 60
  return `${hours} ${hours === 1 ? 'hora' : 'horas'}`
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function getDashboardFilterLabel(filter) {
  if (!filter) return ''
  if (filter.type === 'today') return 'Citas de hoy'
  if (filter.type === 'next-seven-days') return 'Citas de los próximos 7 días'
  return `Citas: ${STATUS_LABELS[filter.value] || filter.value}`
}

function matchesDashboardFilter(appointment, filter) {
  if (!filter) return true

  const appointmentDate = String(appointment.fecha_programada).slice(0, 10)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayString = formatLocalDate(today)

  if (filter.type === 'today') {
    return appointmentDate === todayString && appointment.estado !== 'CANCELADA'
  }

  if (filter.type === 'next-seven-days') {
    const lastDate = new Date(today)
    lastDate.setDate(lastDate.getDate() + 7)
    return appointmentDate > todayString &&
      appointmentDate <= formatLocalDate(lastDate) &&
      ACTIVE_STATES.includes(appointment.estado)
  }

  return filter.type === 'status' && appointment.estado === filter.value
}

function CitasPage({ session, dashboardFilter: initialDashboardFilter = null }) {
  const roleId = Number(session.user.id_rol)
  const isAdmin = roleId === ADMIN_ROLE_ID
  const isTechnician = roleId === TECHNICIAN_ROLE_ID
  const isCustomer = roleId === CUSTOMER_ROLE_ID
  const [appointments, setAppointments] = useState([])
  const [dashboardFilter, setDashboardFilter] = useState(initialDashboardFilter)
  const [vehicles, setVehicles] = useState([])
  const [services, setServices] = useState([])
  const [faultTypes, setFaultTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [reschedulingAppointment, setReschedulingAppointment] = useState(null)
  const [availabilityResult, setAvailabilityResult] = useState({
    key: '',
    slots: [],
    error: '',
  })
  const [isSavingAppointment, setIsSavingAppointment] = useState(false)
  const [draft, setDraft] = useState({
    id_vehiculo: '',
    id_tipo_averia: '',
    id_tipo_servicio: '',
    descripcion_averia: '',
    detalle_servicio: '',
    observaciones: '',
    fecha_programada: getDefaultDate(),
    hora_programada: '',
  })
  const [finishingAppointment, setFinishingAppointment] = useState(null)
  const [finalReport, setFinalReport] = useState({
    diagnostico: '',
    procedimiento_realizado: '',
    observaciones: '',
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      const [loadedAppointments, loadedServices, loadedVehicles, loadedFaultTypes] =
        await Promise.all([
          getAppointments(session.token),
          getServiceTypes(session.token),
          isCustomer ? getVehicles(session.token) : Promise.resolve([]),
          isCustomer ? getFaultTypes(session.token) : Promise.resolve([]),
        ])
      setAppointments(loadedAppointments)
      setServices(loadedServices)
      setVehicles(loadedVehicles)
      setFaultTypes(loadedFaultTypes)
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [isCustomer, session.token])

  useEffect(() => {
    let isCurrent = true

    async function loadInitialData() {
      try {
        const [loadedAppointments, loadedServices, loadedVehicles, loadedFaultTypes] =
          await Promise.all([
            getAppointments(session.token),
            getServiceTypes(session.token),
            isCustomer ? getVehicles(session.token) : Promise.resolve([]),
            isCustomer ? getFaultTypes(session.token) : Promise.resolve([]),
          ])
        if (!isCurrent) return
        setAppointments(loadedAppointments)
        setServices(loadedServices)
        setVehicles(loadedVehicles)
        setFaultTypes(loadedFaultTypes)
      } catch (error) {
        if (isCurrent) setPageError(error.message)
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    void loadInitialData()
    return () => {
      isCurrent = false
    }
  }, [isCustomer, session.token])

  const activeServices = useMemo(
    () => services.filter((service) => Number(service.estado) === 1),
    [services]
  )
  const activeVehicles = useMemo(
    () => vehicles.filter((vehicle) => Number(vehicle.estado) === 1),
    [vehicles]
  )
  const hasActiveAppointment = useMemo(
    () => appointments.some((appointment) => ACTIVE_STATES.includes(appointment.estado)),
    [appointments]
  )
  const selectedService = activeServices.find(
    (service) => String(service.id_tipo_servicio) === draft.id_tipo_servicio
  )
  const isFormOpen = isCreating || Boolean(reschedulingAppointment)
  const availabilityKey = [
    draft.fecha_programada,
    draft.id_tipo_servicio,
    reschedulingAppointment?.id_cita ?? '',
  ].join(':')
  const availabilityMatchesQuery = availabilityResult.key === availabilityKey
  const availability = availabilityMatchesQuery ? availabilityResult.slots : []
  const availabilityError = availabilityMatchesQuery ? availabilityResult.error : ''
  const isLoadingAvailability =
    isFormOpen &&
    Boolean(draft.fecha_programada) &&
    Boolean(draft.id_tipo_servicio) &&
    (Boolean(reschedulingAppointment) || Boolean(selectedService?.duracion_minutos)) &&
    !availabilityMatchesQuery

  useEffect(() => {
    if (
      !isFormOpen ||
      !draft.fecha_programada ||
      !draft.id_tipo_servicio ||
      (!reschedulingAppointment && !selectedService?.duracion_minutos)
    ) {
      return undefined
    }

    let isCurrent = true
    getAvailableSlots(session.token, {
      fecha: draft.fecha_programada,
      id_tipo_servicio: draft.id_tipo_servicio,
      id_cita: reschedulingAppointment?.id_cita,
    })
      .then((slots) => {
        if (isCurrent) {
          setAvailabilityResult({ key: availabilityKey, slots, error: '' })
        }
      })
      .catch((error) => {
        if (isCurrent) {
          setAvailabilityResult({
            key: availabilityKey,
            slots: [],
            error: error.message,
          })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [
    draft.fecha_programada,
    draft.id_tipo_servicio,
    availabilityKey,
    isFormOpen,
    reschedulingAppointment,
    selectedService,
    session.token,
  ])

  function openCreateForm() {
    setPageError('')
    setSuccessMessage('')
    setAvailabilityResult({ key: '', slots: [], error: '' })
    setReschedulingAppointment(null)
    setDraft({
      id_vehiculo: String(activeVehicles[0]?.id_vehiculo ?? ''),
      id_tipo_averia: String(faultTypes[0]?.id_tipo_averia ?? ''),
      id_tipo_servicio: String(
        activeServices.find((service) => service.duracion_minutos)?.id_tipo_servicio ?? ''
      ),
      descripcion_averia: '',
      detalle_servicio: '',
      observaciones: '',
      fecha_programada: getDefaultDate(),
      hora_programada: '',
    })
    setIsCreating(true)
  }

  function openRescheduleForm(appointment) {
    setPageError('')
    setSuccessMessage('')
    setAvailabilityResult({ key: '', slots: [], error: '' })
    setIsCreating(false)
    setReschedulingAppointment(appointment)
    setDraft({
      id_vehiculo: String(appointment.id_vehiculo),
      id_tipo_averia: String(appointment.id_tipo_averia),
      id_tipo_servicio: String(appointment.id_tipo_servicio),
      descripcion_averia: appointment.descripcion_averia ?? '',
      detalle_servicio: appointment.detalle_servicio ?? '',
      observaciones: appointment.observaciones ?? '',
      fecha_programada: String(appointment.fecha_programada).slice(0, 10),
      hora_programada: String(appointment.hora_programada).slice(0, 5),
    })
  }

  async function handleAppointmentSubmit(event) {
    event.preventDefault()
    setPageError('')
    setSuccessMessage('')
    setIsSavingAppointment(true)
    try {
      const schedule = {
        fecha_programada: draft.fecha_programada,
        hora_programada: draft.hora_programada,
      }
      if (reschedulingAppointment) {
        await rescheduleAppointment(
          session.token,
          reschedulingAppointment.id_cita,
          schedule
        )
        setSuccessMessage('La cita se reprogramó correctamente.')
      } else {
        await createAppointment(session.token, {
          ...schedule,
          id_vehiculo: Number(draft.id_vehiculo),
          id_tipo_averia: Number(draft.id_tipo_averia),
          id_tipo_servicio: Number(draft.id_tipo_servicio),
          descripcion_averia: draft.descripcion_averia.trim(),
          detalle_servicio: draft.detalle_servicio.trim() || null,
          observaciones: draft.observaciones.trim() || null,
        })
        setSuccessMessage('La cita se solicitó y el técnico fue asignado automáticamente.')
      }
      setIsCreating(false)
      setReschedulingAppointment(null)
      await loadData()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsSavingAppointment(false)
    }
  }

  async function handleCancel(appointment) {
    if (!window.confirm(`¿Cancelar la cita del ${formatDate(appointment.fecha_programada)}?`)) {
      return
    }
    setPageError('')
    setSuccessMessage('')
    try {
      await cancelAppointment(session.token, appointment.id_cita)
      setSuccessMessage('La cita se canceló correctamente.')
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function handleTransition(appointment, action, body) {
    setPageError('')
    setSuccessMessage('')
    try {
      await transitionAppointment(session.token, appointment.id_cita, action, body)
      setSuccessMessage('El estado de la cita se actualizó correctamente.')
      setFinishingAppointment(null)
      await loadData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function handleFinishSubmit(event) {
    event.preventDefault()
    await handleTransition(finishingAppointment, 'finalizar', finalReport)
  }

  function updateDraft(event) {
    const { name, value } = event.target
    setDraft((current) => ({
      ...current,
      [name]: value,
      ...(name === 'id_tipo_servicio' || name === 'fecha_programada'
        ? { hora_programada: '' }
        : {}),
    }))
  }

  const filteredAppointments = appointments.filter((appointment) => (
    matchesDashboardFilter(appointment, dashboardFilter)
  ))
  const dashboardFilterLabel = getDashboardFilterLabel(dashboardFilter)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => (
    `${a.fecha_programada} ${a.hora_programada}`.localeCompare(
      `${b.fecha_programada} ${b.hora_programada}`
    )
  ))

  return (
    <main className="users-page appointments-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">{isAdmin ? 'Administración' : isTechnician ? 'Técnico' : 'Cuenta de cliente'}</p>
          <h1>{isCustomer ? 'Mis citas' : 'Citas'}</h1>
          <p className="users-subtitle">
            {isCustomer
              ? 'Solicita una cita y consulta su estado. Reserva con 24 horas y modifica o cancela con al menos 2 horas de anticipación.'
              : isTechnician
                ? 'Consulta las citas asignadas y actualiza su atención.'
                : 'Consulta las citas y administra la atención del taller.'}
          </p>
        </div>
        {isCustomer && (
          <button
            className="button button--primary"
            type="button"
            onClick={openCreateForm}
            disabled={hasActiveAppointment || activeVehicles.length === 0}
          >
            Solicitar cita
          </button>
        )}
      </div>

      {isCustomer && hasActiveAppointment && (
        <p className="feedback feedback--notice">
          {appointments.some((appointment) => appointment.estado === 'EN_PROCESO')
            ? 'Tienes una cita en proceso; no se puede cancelar ni reprogramar. Contacta al taller si necesitas ayuda.'
            : 'Ya tienes una cita activa. Puedes cancelarla o reprogramarla con al menos 2 horas de anticipación antes de solicitar otra.'}
        </p>
      )}
      {isCustomer && !isLoading && activeVehicles.length === 0 && (
        <p className="feedback feedback--notice">
          Necesitas un vehículo activo asociado a tu cuenta para solicitar una cita.
        </p>
      )}
      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}

      <section className="users-card" aria-labelledby="appointments-list-title">
        <div className="users-toolbar">
          <div>
            <h2 id="appointments-list-title">{isCustomer ? 'Historial de mis citas' : 'Citas registradas'}</h2>
            <p>
              {filteredAppointments.length} {filteredAppointments.length === 1 ? 'cita' : 'citas'}
              {dashboardFilterLabel ? ` · ${dashboardFilterLabel}` : ''}
            </p>
          </div>
          <div className="users-toolbar-actions">
            {dashboardFilter && (
              <button
                className="button button--quiet"
                type="button"
                onClick={() => setDashboardFilter(null)}
              >
                Mostrar todas
              </button>
            )}
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void loadData()}
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>
        {isLoading ? (
          <p className="users-state" role="status">Cargando citas...</p>
        ) : sortedAppointments.length === 0 ? (
          <p className="users-state">
            {dashboardFilter
              ? 'No hay citas que coincidan con este indicador.'
              : 'Aún no hay citas registradas.'}
          </p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table appointments-table">
              <thead>
                <tr>
                  <th scope="col">Fecha y hora</th>
                  <th scope="col">Servicio</th>
                  <th scope="col">Vehículo</th>
                  {!isCustomer && <th scope="col">Cliente</th>}
                  {!isTechnician && <th scope="col">Técnico</th>}
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedAppointments.map((appointment) => {
                  const isManageable = isAdmin || isTechnician
                  return (
                    <tr key={appointment.id_cita}>
                      <td>
                        <strong>{formatDate(appointment.fecha_programada)}</strong>
                        <span className="user-email">
                          {String(appointment.hora_programada).slice(0, 5)} · {formatDuration(appointment.duracion_minutos)}
                        </span>
                        {isCustomer && appointment.estado_recordatorio && (
                          <span className="user-email appointment-reminder" role="status">
                            Recordatorio: {REMINDER_LABELS[appointment.estado_recordatorio] || appointment.estado_recordatorio}
                            {appointment.medio_recordatorio &&
                              ` por ${appointment.medio_recordatorio === 'WHATSAPP' ? 'WhatsApp' : 'correo'}`}
                            {appointment.estado_recordatorio === 'PENDIENTE' &&
                              ` · ${formatReminderDate(appointment.fecha_recordatorio)}`}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{appointment.tipo_servicio_nombre || 'Servicio'}</strong>
                        <span className="user-email">{appointment.tipo_averia_nombre || ''}</span>
                        {appointment.detalle_servicio && (
                          <span className="user-email">Detalle: {appointment.detalle_servicio}</span>
                        )}
                      </td>
                      <td>
                        <strong>{appointment.placa}</strong>
                        <span className="user-email">{appointment.descripcion_averia}</span>
                      </td>
                      {!isCustomer && (
                        <td>
                          <strong>{appointment.nombre_cliente}</strong>
                          <span className="user-email">{appointment.correo_cliente}</span>
                        </td>
                      )}
                      {!isTechnician && (
                        <td>{appointment.nombre_tecnico || '—'}</td>
                      )}
                      <td>
                        <span className={`appointment-status appointment-status--${appointment.estado.toLowerCase()}`}>
                          {STATUS_LABELS[appointment.estado] || appointment.estado}
                        </span>
                      </td>
                      <td>
                        <div className="user-actions appointment-actions">
                                  {CHANGEABLE_STATES.includes(appointment.estado) && (
                            <>
                              <button
                                className="text-button"
                                type="button"
                                onClick={() => openRescheduleForm(appointment)}
                              >
                                Reprogramar
                              </button>
                              <button
                                className="text-button text-button--danger"
                                type="button"
                                onClick={() => void handleCancel(appointment)}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {isManageable && appointment.estado === 'PROGRAMADA' && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => void handleTransition(appointment, 'validar', {})}
                            >
                              Validar
                            </button>
                          )}
                          {isManageable && appointment.estado === 'VALIDADA' && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => void handleTransition(appointment, 'iniciar', {})}
                            >
                              Iniciar
                            </button>
                          )}
                          {isManageable && appointment.estado === 'EN_PROCESO' && (
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => {
                                setFinishingAppointment(appointment)
                                setFinalReport({
                                  diagnostico: '',
                                  procedimiento_realizado: '',
                                  observaciones: '',
                                })
                              }}
                            >
                              Finalizar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card appointment-dialog" role="dialog" aria-modal="true" aria-labelledby="appointment-form-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">{reschedulingAppointment ? 'Reprogramar cita' : 'Nueva solicitud'}</p>
                <h2 id="appointment-form-title">{reschedulingAppointment ? 'Selecciona otro horario' : 'Solicitar cita'}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setIsCreating(false)
                  setReschedulingAppointment(null)
                }}
              >
                ×
              </button>
            </div>
            <form className="user-form appointment-form" onSubmit={handleAppointmentSubmit}>
              {!reschedulingAppointment && (
                <>
                  <label>
                    Vehículo
                    <select name="id_vehiculo" value={draft.id_vehiculo} onChange={updateDraft} required>
                      <option value="">Selecciona un vehículo</option>
                      {activeVehicles.map((vehicle) => (
                        <option key={vehicle.id_vehiculo} value={vehicle.id_vehiculo}>
                          {vehicle.placa} — {vehicle.marca} {vehicle.modelo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tipo de avería
                    <select name="id_tipo_averia" value={draft.id_tipo_averia} onChange={updateDraft} required>
                      <option value="">Selecciona una avería</option>
                      {faultTypes.map((fault) => (
                        <option key={fault.id_tipo_averia} value={fault.id_tipo_averia}>
                          {fault.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Servicio requerido
                    <select name="id_tipo_servicio" value={draft.id_tipo_servicio} onChange={updateDraft} required>
                      <option value="">Selecciona un servicio</option>
                      {activeServices.map((service) => (
                        <option
                          key={service.id_tipo_servicio}
                          value={service.id_tipo_servicio}
                          disabled={!service.duracion_minutos}
                        >
                          {service.nombre} {!service.duracion_minutos ? '(duración pendiente)' : `(${formatDuration(service.duracion_minutos)})`}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedService?.requiere_detalle ? (
                    <label className="appointment-form-wide">
                      Detalla el servicio que necesitas
                      <textarea
                        maxLength="1000"
                        name="detalle_servicio"
                        value={draft.detalle_servicio}
                        onChange={updateDraft}
                        required
                      />
                    </label>
                  ) : null}
                  <label className="appointment-form-wide">
                    Describe la avería
                    <textarea
                      name="descripcion_averia"
                      value={draft.descripcion_averia}
                      onChange={updateDraft}
                      required
                    />
                  </label>
                </>
              )}
              <label>
                Fecha
                <input
                  name="fecha_programada"
                  type="date"
                  value={draft.fecha_programada}
                  onChange={updateDraft}
                  required
                />
              </label>
              <label>
                Hora disponible
                <select
                  name="hora_programada"
                  value={draft.hora_programada}
                  onChange={updateDraft}
                  required
                  disabled={isLoadingAvailability || availability.length === 0}
                >
                  <option value="">
                    {isLoadingAvailability ? 'Buscando horarios...' : 'Selecciona una hora'}
                  </option>
                  {availability.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              {availabilityError ? (
                <p className="appointment-availability form-error" role="alert">{availabilityError}</p>
              ) : isLoadingAvailability ? (
                <p className="appointment-availability" role="status">Consultando técnicos disponibles...</p>
              ) : !reschedulingAppointment && !draft.id_tipo_servicio ? (
                <p className="appointment-availability">Selecciona un servicio para consultar horarios.</p>
              ) : availability.length === 0 ? (
                <p className="appointment-availability">No hay horarios disponibles para esta fecha. Prueba otro día.</p>
              ) : (
                <p className="appointment-availability">El servicio incluye 30 minutos de margen y debe caber dentro del horario del técnico.</p>
              )}
              {!reschedulingAppointment && (
                <label className="appointment-form-wide">
                  Observaciones (opcional)
                  <textarea
                    name="observaciones"
                    value={draft.observaciones}
                    onChange={updateDraft}
                  />
                </label>
              )}
              {pageError && <p className="form-error appointment-form-wide" role="alert">{pageError}</p>}
              <div className="dialog-actions appointment-form-wide">
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setReschedulingAppointment(null)
                  }}
                  disabled={isSavingAppointment}
                >
                  Volver
                </button>
                <button
                  className="button button--primary"
                  type="submit"
                  disabled={isSavingAppointment || isLoadingAvailability || !draft.hora_programada}
                >
                  {isSavingAppointment ? 'Guardando...' : reschedulingAppointment ? 'Confirmar horario' : 'Solicitar cita'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {finishingAppointment && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="finish-appointment-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Reporte técnico</p>
                <h2 id="finish-appointment-title">Finalizar atención</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar reporte"
                onClick={() => setFinishingAppointment(null)}
              >
                ×
              </button>
            </div>
            <form className="user-form" onSubmit={handleFinishSubmit}>
              <label>
                Diagnóstico
                <textarea
                  value={finalReport.diagnostico}
                  onChange={(event) => setFinalReport((current) => ({ ...current, diagnostico: event.target.value }))}
                  required
                />
              </label>
              <label>
                Procedimiento realizado
                <textarea
                  value={finalReport.procedimiento_realizado}
                  onChange={(event) => setFinalReport((current) => ({ ...current, procedimiento_realizado: event.target.value }))}
                  required
                />
              </label>
              <label>
                Observaciones (opcional)
                <textarea
                  value={finalReport.observaciones}
                  onChange={(event) => setFinalReport((current) => ({ ...current, observaciones: event.target.value }))}
                />
              </label>
              {pageError && <p className="form-error" role="alert">{pageError}</p>}
              <div className="dialog-actions">
                <button className="button button--secondary" type="button" onClick={() => setFinishingAppointment(null)}>
                  Cancelar
                </button>
                <button className="button button--primary" type="submit">
                  Guardar reporte y finalizar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default CitasPage
