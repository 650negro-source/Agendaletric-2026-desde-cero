import { useCallback, useEffect, useMemo, useState } from 'react'
import { getUsers } from '../../services/userService.js'
import {
  createSchedule,
  createTechnician,
  deleteSchedule,
  getMySchedules,
  getMyTechnician,
  getSchedules,
  getTechnicians,
  updateSchedule,
  updateTechnician,
} from '../../services/technicianService.js'
import { ADMIN_ROLE_ID } from '../../shared/userRoles.js'
import './TecnicosPage.css'
import '../users/UserForm.css'
import '../users/UsersPage.css'
import '../users/UsersTable.css'

const WEEKDAYS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

function getWeekdayLabel(value) {
  return WEEKDAYS.find((day) => day.value === Number(value))?.label ?? 'Día inválido'
}

function formatTime(value) {
  return String(value ?? '').slice(0, 5)
}

function TechnicianProfileForm({ technician, availableUsers, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    id_usuario: technician?.id_usuario ?? '',
    especialidad: technician?.especialidad ?? '',
    telefono: technician?.telefono ?? '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({
        ...(technician ? {} : { id_usuario: Number(form.id_usuario) }),
        especialidad: form.especialidad.trim(),
        telefono: form.telefono.trim(),
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      {!technician && (
        <label>
          Cuenta de técnico activa
          <select
            value={form.id_usuario}
            onChange={(event) => setForm((current) => ({ ...current, id_usuario: event.target.value }))}
            required
          >
            <option value="">Selecciona un usuario con rol Técnico</option>
            {availableUsers.map((user) => (
              <option key={user.id_usuario} value={user.id_usuario}>
                {user.nombre} — {user.correo}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Especialidad
        <input
          maxLength="100"
          value={form.especialidad}
          onChange={(event) => setForm((current) => ({ ...current, especialidad: event.target.value }))}
          required
        />
      </label>
      <label>
        Teléfono de contacto
        <input
          maxLength="30"
          value={form.telefono}
          onChange={(event) => setForm((current) => ({ ...current, telefono: event.target.value }))}
          required
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : technician ? 'Guardar cambios' : 'Crear perfil'}
        </button>
      </div>
    </form>
  )
}

function ScheduleForm({ schedule, onCancel, onSubmit }) {
  const [form, setForm] = useState({
    dia_semana: schedule?.dia_semana ?? '1',
    hora_inicio: formatTime(schedule?.hora_inicio) || '08:00',
    hora_fin: formatTime(schedule?.hora_fin) || '17:00',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onSubmit({
        dia_semana: Number(form.dia_semana),
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
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
        Día de la semana
        <select
          value={form.dia_semana}
          onChange={(event) => setForm((current) => ({ ...current, dia_semana: event.target.value }))}
        >
          {WEEKDAYS.map((day) => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>
      </label>
      <label>
        Hora de inicio
        <input
          type="time"
          value={form.hora_inicio}
          onChange={(event) => setForm((current) => ({ ...current, hora_inicio: event.target.value }))}
          required
        />
      </label>
      <label>
        Hora de finalización
        <input
          type="time"
          value={form.hora_fin}
          onChange={(event) => setForm((current) => ({ ...current, hora_fin: event.target.value }))}
          required
        />
      </label>
      <p className="technician-form-hint">
        Puedes crear varios turnos por día; no se permiten turnos superpuestos.
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : schedule ? 'Guardar turno' : 'Agregar turno'}
        </button>
      </div>
    </form>
  )
}

function TechnicianSchedules({ schedules, isAdmin, onEdit, onDelete }) {
  if (schedules.length === 0) {
    return <p className="users-state">No hay horarios configurados para este técnico.</p>
  }

  return (
    <div className="users-table-scroll">
      <table className="users-table technician-schedules-table">
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Turno</th>
            {isAdmin && <th scope="col">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {schedules.map((schedule) => (
            <tr key={schedule.id_horario}>
              <td><strong>{getWeekdayLabel(schedule.dia_semana)}</strong></td>
              <td>{formatTime(schedule.hora_inicio)} – {formatTime(schedule.hora_fin)}</td>
              {isAdmin && (
                <td>
                  <div className="user-actions">
                    <button className="text-button" type="button" onClick={() => onEdit(schedule)}>
                      Editar
                    </button>
                    <button
                      className="text-button text-button--danger"
                      type="button"
                      onClick={() => onDelete(schedule)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TecnicosPage({ session, initialActiveOnly = false }) {
  const isAdmin = Number(session.user.id_rol) === ADMIN_ROLE_ID
  const [technicians, setTechnicians] = useState([])
  const [activeOnly, setActiveOnly] = useState(initialActiveOnly)
  const [users, setUsers] = useState([])
  const [schedules, setSchedules] = useState([])
  const [myTechnician, setMyTechnician] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('')
  const [editingTechnician, setEditingTechnician] = useState(null)
  const [isCreatingTechnician, setIsCreatingTechnician] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadAdminData = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      const [loadedTechnicians, loadedUsers, loadedSchedules] = await Promise.all([
        getTechnicians(session.token),
        getUsers(session.token),
        getSchedules(session.token),
      ])
      setTechnicians(loadedTechnicians)
      setUsers(loadedUsers)
      setSchedules(loadedSchedules)
      setSelectedTechnicianId((current) => {
        const technicianIds = loadedUsers
          .filter((user) => Number(user.id_rol) === 3)
          .map((user) => String(user.id_usuario))
        return technicianIds.includes(String(current))
          ? String(current)
          : technicianIds[0] ?? ''
      })
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  const loadMyData = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    setProfileError('')
    const [profileResult, scheduleResult] = await Promise.allSettled([
      getMyTechnician(session.token),
      getMySchedules(session.token),
    ])
    if (profileResult.status === 'fulfilled') {
      setMyTechnician(profileResult.value)
    } else {
      setMyTechnician(null)
      setProfileError(profileResult.reason.message)
    }
    if (scheduleResult.status === 'fulfilled') {
      setSchedules(scheduleResult.value)
    } else {
      setPageError(scheduleResult.reason.message)
    }
    setIsLoading(false)
  }, [session.token])

  useEffect(() => {
    let isCurrent = true

    async function loadInitialData() {
      try {
        if (isAdmin) {
          const [loadedTechnicians, loadedUsers, loadedSchedules] = await Promise.all([
            getTechnicians(session.token),
            getUsers(session.token),
            getSchedules(session.token),
          ])
          if (!isCurrent) return
          setTechnicians(loadedTechnicians)
          setUsers(loadedUsers)
          setSchedules(loadedSchedules)
          setSelectedTechnicianId((current) => {
            const technicianIds = loadedUsers
              .filter((user) => Number(user.id_rol) === 3)
              .map((user) => String(user.id_usuario))
            return technicianIds.includes(String(current))
              ? String(current)
              : technicianIds[0] ?? ''
          })
        } else {
          const [profileResult, scheduleResult] = await Promise.allSettled([
            getMyTechnician(session.token),
            getMySchedules(session.token),
          ])
          if (!isCurrent) return
          if (profileResult.status === 'fulfilled') {
            setMyTechnician(profileResult.value)
          } else {
            setProfileError(profileResult.reason.message)
          }
          if (scheduleResult.status === 'fulfilled') {
            setSchedules(scheduleResult.value)
          } else {
            setPageError(scheduleResult.reason.message)
          }
        }
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
  }, [isAdmin, session.token])

  const technicianUsers = useMemo(
    () => users.filter((user) => Number(user.id_rol) === 3),
    [users]
  )
  const activeTechnicianUsers = useMemo(
    () => technicianUsers.filter((user) => Number(user.estado) === 1),
    [technicianUsers]
  )
  const visibleTechnicians = useMemo(
    () => activeOnly
      ? technicians.filter((technician) => Number(technician.estado) === 1)
      : technicians,
    [activeOnly, technicians]
  )
  const availableUsers = useMemo(() => {
    const profileIds = new Set(technicians.map((technician) => String(technician.id_usuario)))
    return activeTechnicianUsers.filter(
      (user) => !profileIds.has(String(user.id_usuario))
    )
  }, [activeTechnicianUsers, technicians])
  const selectedUser = technicianUsers.find(
    (user) => String(user.id_usuario) === String(selectedTechnicianId)
  )
  const selectedSchedules = schedules.filter(
    (schedule) => String(schedule.id_usuario_tecnico) === String(selectedTechnicianId)
  )

  async function handleProfileSave(profileData) {
    setPageError('')
    setSuccessMessage('')
    if (editingTechnician) {
      await updateTechnician(
        session.token,
        editingTechnician.id_usuario,
        profileData
      )
      setSuccessMessage('El perfil técnico se actualizó correctamente.')
    } else {
      await createTechnician(session.token, profileData)
      setSuccessMessage('El perfil técnico se creó correctamente.')
    }
    setEditingTechnician(null)
    setIsCreatingTechnician(false)
    await loadAdminData()
  }

  async function handleScheduleSave(scheduleData) {
    setPageError('')
    setSuccessMessage('')
    if (editingSchedule) {
      await updateSchedule(
        session.token,
        editingSchedule.id_horario,
        scheduleData
      )
      setSuccessMessage('El turno se actualizó correctamente.')
    } else {
      await createSchedule(session.token, {
        ...scheduleData,
        id_usuario_tecnico: Number(selectedTechnicianId),
      })
      setSuccessMessage('El turno se agregó correctamente.')
    }
    setEditingSchedule(null)
    setIsCreatingSchedule(false)
    await loadAdminData()
  }

  async function handleScheduleDelete(schedule) {
    if (!window.confirm(
      `¿Eliminar el turno del ${getWeekdayLabel(schedule.dia_semana)} (${formatTime(schedule.hora_inicio)}–${formatTime(schedule.hora_fin)})?`
    )) {
      return
    }

    setPageError('')
    setSuccessMessage('')
    try {
      await deleteSchedule(session.token, schedule.id_horario)
      setSuccessMessage('El turno se eliminó correctamente.')
      await loadAdminData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  return (
    <main className="users-page technicians-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">{isAdmin ? 'Administración' : 'Cuenta de técnico'}</p>
          <h1>{isAdmin ? 'Técnicos y horarios' : 'Mi perfil y horario'}</h1>
          <p className="users-subtitle">
            {isAdmin
              ? 'Administra perfiles y turnos de trabajo. Los turnos permiten asignar citas automáticamente.'
              : 'Consulta los datos de tu perfil técnico y los turnos que administración registró.'}
          </p>
        </div>
        {isAdmin && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => {
              setEditingTechnician(null)
              setIsCreatingTechnician(true)
            }}
            disabled={availableUsers.length === 0}
          >
            Crear perfil técnico
          </button>
        )}
      </div>

      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {profileError && <p className="feedback feedback--notice" role="status">{profileError}. Solicita a administración que cree tu perfil.</p>}
      {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}

      {isAdmin ? (
        <>
          {availableUsers.length === 0 && !isLoading && (
            <p className="feedback feedback--notice">
              {technicianUsers.length === 0
                ? 'Primero crea una cuenta con rol Técnico desde el módulo Usuarios.'
                : activeTechnicianUsers.length === 0
                  ? 'No hay cuentas técnicas activas para crear perfiles o asignar turnos.'
                  : 'Todas las cuentas técnicas activas ya tienen perfil.'}
            </p>
          )}
          <section className="users-card" aria-labelledby="technicians-list-title">
            <div className="users-toolbar">
              <div>
                <h2 id="technicians-list-title">Perfiles técnicos</h2>
                <p>
                  {activeOnly
                    ? `${visibleTechnicians.length} perfiles técnicos activos`
                    : `${technicians.length} ${technicians.length === 1 ? 'perfil' : 'perfiles'}`}
                </p>
              </div>
              <div className="users-toolbar-actions">
                {activeOnly && (
                  <button
                    className="button button--quiet"
                    type="button"
                    onClick={() => setActiveOnly(false)}
                  >
                    Mostrar todos
                  </button>
                )}
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={() => void loadAdminData()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Actualizar'}
                </button>
              </div>
            </div>
            {isLoading ? (
              <p className="users-state" role="status">Cargando técnicos...</p>
            ) : visibleTechnicians.length === 0 ? (
              <p className="users-state">
                {activeOnly
                  ? 'No hay perfiles técnicos activos.'
                  : 'Aún no hay perfiles técnicos.'}
              </p>
            ) : (
              <div className="users-table-scroll">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th scope="col">Técnico</th>
                      <th scope="col">Especialidad</th>
                      <th scope="col">Teléfono</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTechnicians.map((technician) => (
                      <tr key={technician.id_usuario}>
                        <td>
                          <strong className="user-name">{technician.nombre}</strong>
                          <span className="user-email">{technician.correo}</span>
                        </td>
                        <td>{technician.especialidad}</td>
                        <td>{technician.telefono}</td>
                        <td>{Number(technician.estado) === 1 ? 'Activo' : 'Inactivo'}</td>
                        <td>
                          <div className="user-actions">
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => setSelectedTechnicianId(String(technician.id_usuario))}
                            >
                              Ver horarios
                            </button>
                            <button
                              className="text-button"
                              type="button"
                              onClick={() => {
                                setEditingTechnician(technician)
                                setIsCreatingTechnician(false)
                              }}
                            >
                              Editar perfil
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="users-card" aria-labelledby="schedule-list-title">
            <div className="users-toolbar technician-schedule-toolbar">
              <div>
                <h2 id="schedule-list-title">Horarios semanales</h2>
                <p>Varios turnos por día son válidos si no se superponen.</p>
              </div>
              <div className="technician-schedule-controls">
                <label>
                  <span className="visually-hidden">Selecciona técnico para administrar turnos</span>
                  <select
                    value={selectedTechnicianId}
                    onChange={(event) => setSelectedTechnicianId(event.target.value)}
                    disabled={technicianUsers.length === 0}
                  >
                    {technicianUsers.length === 0 && <option value="">Sin usuarios técnicos</option>}
                    {technicianUsers.map((user) => (
                      <option key={user.id_usuario} value={user.id_usuario}>
                        {user.nombre}{Number(user.estado) === 1 ? '' : ' (inactivo)'}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button button--primary"
                  type="button"
                  onClick={() => {
                    setEditingSchedule(null)
                    setIsCreatingSchedule(true)
                  }}
                  disabled={!selectedUser || Number(selectedUser.estado) !== 1}
                >
                  Agregar turno
                </button>
              </div>
            </div>
            {selectedUser && (
              <p className="technician-selected-user">
                Horarios de <strong>{selectedUser.nombre}</strong> · {selectedUser.correo}
              </p>
            )}
            {isLoading ? (
              <p className="users-state" role="status">Cargando horarios...</p>
            ) : !selectedUser ? (
              <p className="users-state">Selecciona una cuenta con rol Técnico.</p>
            ) : (
              <TechnicianSchedules
                schedules={selectedSchedules}
                isAdmin
                onEdit={(schedule) => {
                  setEditingSchedule(schedule)
                  setIsCreatingSchedule(false)
                }}
                onDelete={(schedule) => void handleScheduleDelete(schedule)}
              />
            )}
          </section>
        </>
      ) : (
        <>
          {myTechnician && (
            <section className="users-card technician-profile-card" aria-labelledby="my-technician-profile-title">
              <div className="users-toolbar">
                <div>
                  <h2 id="my-technician-profile-title">Datos del perfil</h2>
                  <p>Para actualizar estos datos, comunícate con administración.</p>
                </div>
              </div>
              <dl className="technician-profile-grid">
                <div><dt>Nombre</dt><dd>{myTechnician.nombre}</dd></div>
                <div><dt>Correo</dt><dd>{myTechnician.correo}</dd></div>
                <div><dt>Especialidad</dt><dd>{myTechnician.especialidad}</dd></div>
                <div><dt>Teléfono</dt><dd>{myTechnician.telefono}</dd></div>
              </dl>
            </section>
          )}
          <section className="users-card" aria-labelledby="my-schedule-title">
            <div className="users-toolbar">
              <div>
                <h2 id="my-schedule-title">Mis horarios</h2>
                <p>Turnos configurados por administración.</p>
              </div>
              <button
                className="button button--secondary"
                type="button"
                onClick={() => void loadMyData()}
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
            {isLoading ? (
              <p className="users-state" role="status">Cargando tus horarios...</p>
            ) : (
              <TechnicianSchedules schedules={schedules} isAdmin={false} />
            )}
          </section>
        </>
      )}

      {(isCreatingTechnician || editingTechnician) && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="technician-form-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Administración</p>
                <h2 id="technician-form-title">{editingTechnician ? 'Editar perfil técnico' : 'Crear perfil técnico'}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setEditingTechnician(null)
                  setIsCreatingTechnician(false)
                }}
              >
                ×
              </button>
            </div>
            <TechnicianProfileForm
              key={editingTechnician?.id_usuario ?? 'new'}
              technician={editingTechnician}
              availableUsers={availableUsers}
              onCancel={() => {
                setEditingTechnician(null)
                setIsCreatingTechnician(false)
              }}
              onSubmit={handleProfileSave}
            />
          </section>
        </div>
      )}

      {(isCreatingSchedule || editingSchedule) && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="schedule-form-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">{selectedUser?.nombre ?? 'Técnico'}</p>
                <h2 id="schedule-form-title">{editingSchedule ? 'Editar turno' : 'Agregar turno'}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar formulario de turno"
                onClick={() => {
                  setEditingSchedule(null)
                  setIsCreatingSchedule(false)
                }}
              >
                ×
              </button>
            </div>
            <ScheduleForm
              key={editingSchedule?.id_horario ?? 'new'}
              schedule={editingSchedule}
              onCancel={() => {
                setEditingSchedule(null)
                setIsCreatingSchedule(false)
              }}
              onSubmit={handleScheduleSave}
            />
          </section>
        </div>
      )}
    </main>
  )
}

export default TecnicosPage
