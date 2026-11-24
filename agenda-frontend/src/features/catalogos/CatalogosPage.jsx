import { useCallback, useEffect, useState } from 'react'
import {
  createFaultType,
  createServiceType,
  getFaultTypes,
  getServiceTypes,
  updateFaultType,
  updateFaultTypeStatus,
  updateServiceType,
  updateServiceTypeStatus,
} from '../../services/catalogService.js'
import { ADMIN_ROLE_ID } from '../../shared/userRoles.js'
import '../users/UsersPage.css'
import '../users/UsersTable.css'
import './CatalogosPage.css'

const EMPTY_SERVICE = {
  nombre: '',
  descripcion: '',
  requiere_detalle: false,
  duracion_minutos: '',
}

function ServiceForm({ service, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => ({
    nombre: service?.nombre ?? '',
    descripcion: service?.descripcion ?? '',
    requiere_detalle: Number(service?.requiere_detalle) === 1,
    duracion_minutos: service?.duracion_minutos
      ? String(service.duracion_minutos)
      : '',
  }))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await onSubmit({
        ...(service ? { id_tipo_servicio: service.id_tipo_servicio } : {}),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        requiere_detalle: form.requiere_detalle ? 1 : 0,
        duracion_minutos: form.duracion_minutos
          ? Number(form.duracion_minutos)
          : null,
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="catalog-form" onSubmit={handleSubmit}>
      <label>
        Nombre del servicio
        <input
          maxLength="100"
          value={form.nombre}
          onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
          required
        />
      </label>
      <label>
        Descripción
        <textarea
          maxLength="255"
          value={form.descripcion}
          onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
        />
      </label>
      <label>
        Duración estimada
        <select
          value={form.duracion_minutos}
          onChange={(event) => setForm((current) => ({ ...current, duracion_minutos: event.target.value }))}
        >
          <option value="">Sin configurar</option>
          {[60, 120, 180, 240, 300, 360].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes / 60} {minutes === 60 ? 'hora' : 'horas'}
            </option>
          ))}
        </select>
        <small>Los servicios sin duración configurada no se ofrecen para reservar.</small>
      </label>
      <label className="catalog-checkbox">
        <input
          type="checkbox"
          checked={form.requiere_detalle}
          onChange={(event) => setForm((current) => ({ ...current, requiere_detalle: event.target.checked }))}
        />
        Solicitar al cliente que describa el servicio
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : service ? 'Guardar cambios' : 'Crear servicio'}
        </button>
      </div>
    </form>
  )
}

function FaultForm({ faultType, onCancel, onSubmit }) {
  const [nombre, setNombre] = useState(faultType?.nombre ?? '')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      await onSubmit({
        ...(faultType ? { id_tipo_averia: faultType.id_tipo_averia } : {}),
        nombre: nombre.trim(),
      })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="catalog-form catalog-form--fault" onSubmit={handleSubmit}>
      <label>
        Nombre del tipo de avería
        <input
          maxLength="100"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
        />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <button className="button button--secondary" type="button" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </button>
        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? 'Guardando...' : faultType ? 'Guardar cambios' : 'Crear tipo'}
        </button>
      </div>
    </form>
  )
}

function CatalogosPage({ session }) {
  const [services, setServices] = useState([])
  const [faultTypes, setFaultTypes] = useState([])
  const [serviceForm, setServiceForm] = useState(null)
  const [faultForm, setFaultForm] = useState(null)
  const [busyItem, setBusyItem] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const isAdmin = Number(session.user.id_rol) === ADMIN_ROLE_ID

  const loadCatalogs = useCallback(async () => {
    setPageError('')
    setIsLoading(true)
    try {
      const [loadedServices, loadedFaultTypes] = await Promise.all([
        getServiceTypes(session.token),
        getFaultTypes(session.token),
      ])
      setServices(loadedServices)
      setFaultTypes(loadedFaultTypes)
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    let isCurrent = true
    Promise.all([
      getServiceTypes(session.token),
      getFaultTypes(session.token),
    ])
      .then(([loadedServices, loadedFaultTypes]) => {
        if (!isCurrent) return
        setServices(loadedServices)
        setFaultTypes(loadedFaultTypes)
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

  async function handleSaveService(data) {
    setPageError('')
    setSuccessMessage('')
    const response = data.id_tipo_servicio
      ? await updateServiceType(session.token, data)
      : await createServiceType(session.token, data)
    setServiceForm(null)
    setSuccessMessage(
      data.id_tipo_servicio
        ? 'El servicio se actualizó correctamente.'
        : 'El servicio se creó correctamente.'
    )
    await loadCatalogs()
    return response.data
  }

  async function handleSaveFaultType(data) {
    setPageError('')
    setSuccessMessage('')
    if (data.id_tipo_averia) {
      await updateFaultType(session.token, data)
    } else {
      await createFaultType(session.token, { nombre: data.nombre })
    }
    setFaultForm(null)
    setSuccessMessage(
      data.id_tipo_averia
        ? 'El tipo de avería se actualizó correctamente.'
        : 'El tipo de avería se creó correctamente.'
    )
    await loadCatalogs()
  }

  async function handleServiceStatus(service) {
    const busyId = `servicio-${service.id_tipo_servicio}`
    setBusyItem(busyId)
    setPageError('')
    setSuccessMessage('')
    try {
      await updateServiceTypeStatus(
        session.token,
        service.id_tipo_servicio,
        Number(service.estado) === 1 ? 0 : 1
      )
      setSuccessMessage(
        Number(service.estado) === 1
          ? 'El servicio se desactivó; las citas anteriores se conservan.'
          : 'El servicio se activó.'
      )
      await loadCatalogs()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setBusyItem('')
    }
  }

  async function handleFaultStatus(faultType) {
    const busyId = `averia-${faultType.id_tipo_averia}`
    setBusyItem(busyId)
    setPageError('')
    setSuccessMessage('')
    try {
      await updateFaultTypeStatus(
        session.token,
        faultType.id_tipo_averia,
        Number(faultType.estado) === 1 ? 0 : 1
      )
      setSuccessMessage(
        Number(faultType.estado) === 1
          ? 'El tipo de avería se desactivó; los registros históricos se conservan.'
          : 'El tipo de avería se activó.'
      )
      await loadCatalogs()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setBusyItem('')
    }
  }

  if (!isAdmin) {
    return (
      <main className="users-page">
        <section className="notice-card" role="alert">
          <h1>Acceso restringido</h1>
          <p>Solo administración puede gestionar los catálogos.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="users-page catalogs-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Catálogos</h1>
          <p className="users-subtitle">
            Administra los servicios reservables y los tipos de avería que el cliente selecciona en sus citas.
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={() => void loadCatalogs()}
          disabled={isLoading}
        >
          {isLoading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
      {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}

      <section className="users-card" aria-labelledby="service-catalog-title">
        <div className="users-toolbar">
          <div>
            <h2 id="service-catalog-title">Tipos de servicio</h2>
            <p>{services.length} {services.length === 1 ? 'servicio' : 'servicios'} · la duración debe configurarse antes de reservar.</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setServiceForm(EMPTY_SERVICE)}
            disabled={Boolean(serviceForm)}
          >
            Nuevo servicio
          </button>
        </div>
        {serviceForm && (
          <div className="catalog-form-wrap">
            <h3>{serviceForm.id_tipo_servicio ? 'Editar servicio' : 'Crear servicio'}</h3>
            <ServiceForm
              key={serviceForm.id_tipo_servicio ?? 'nuevo-servicio'}
              service={serviceForm.id_tipo_servicio ? serviceForm : null}
              onCancel={() => setServiceForm(null)}
              onSubmit={handleSaveService}
            />
          </div>
        )}
        {isLoading ? (
          <p className="users-state" role="status">Cargando servicios...</p>
        ) : services.length === 0 ? (
          <p className="users-state">No hay tipos de servicio registrados.</p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table catalog-table">
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Duración</th>
                  <th scope="col">Detalle del cliente</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const isActive = Number(service.estado) === 1
                  const isBusy = busyItem === `servicio-${service.id_tipo_servicio}`
                  return (
                    <tr key={service.id_tipo_servicio}>
                      <td>
                        <strong>{service.nombre}</strong>
                        <span className="user-email">{service.descripcion || 'Sin descripción'}</span>
                      </td>
                      <td>
                        {service.duracion_minutos
                          ? `${Number(service.duracion_minutos) / 60} h`
                          : 'Pendiente'}
                      </td>
                      <td>{Number(service.requiere_detalle) === 1 ? 'Requerido' : 'No requerido'}</td>
                      <td><span className={`catalog-status ${isActive ? 'is-active' : ''}`}>{isActive ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="user-actions">
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setServiceForm(service)}
                            disabled={Boolean(serviceForm) || isBusy}
                          >
                            Editar
                          </button>
                          <button
                            className={isActive ? 'text-button text-button--danger' : 'text-button'}
                            type="button"
                            onClick={() => void handleServiceStatus(service)}
                            disabled={Boolean(serviceForm) || isBusy}
                          >
                            {isBusy ? 'Guardando...' : isActive ? 'Desactivar' : 'Activar'}
                          </button>
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

      <section className="users-card" aria-labelledby="fault-catalog-title">
        <div className="users-toolbar">
          <div>
            <h2 id="fault-catalog-title">Tipos de avería</h2>
            <p>{faultTypes.length} {faultTypes.length === 1 ? 'tipo' : 'tipos'} · se conservan en el historial al desactivarlos.</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setFaultForm({ nombre: '' })}
            disabled={Boolean(faultForm)}
          >
            Nuevo tipo de avería
          </button>
        </div>
        {faultForm && (
          <div className="catalog-form-wrap">
            <h3>{faultForm.id_tipo_averia ? 'Editar tipo de avería' : 'Crear tipo de avería'}</h3>
            <FaultForm
              key={faultForm.id_tipo_averia ?? 'nueva-averia'}
              faultType={faultForm.id_tipo_averia ? faultForm : null}
              onCancel={() => setFaultForm(null)}
              onSubmit={handleSaveFaultType}
            />
          </div>
        )}
        {isLoading ? (
          <p className="users-state" role="status">Cargando tipos de avería...</p>
        ) : faultTypes.length === 0 ? (
          <p className="users-state">No hay tipos de avería registrados.</p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table catalog-table catalog-table--fault">
              <thead>
                <tr>
                  <th scope="col">Tipo de avería</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {faultTypes.map((faultType) => {
                  const isActive = Number(faultType.estado) === 1
                  const isBusy = busyItem === `averia-${faultType.id_tipo_averia}`
                  return (
                    <tr key={faultType.id_tipo_averia}>
                      <td>{faultType.nombre}</td>
                      <td><span className={`catalog-status ${isActive ? 'is-active' : ''}`}>{isActive ? 'Activo' : 'Inactivo'}</span></td>
                      <td>
                        <div className="user-actions">
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setFaultForm(faultType)}
                            disabled={Boolean(faultForm) || isBusy}
                          >
                            Editar
                          </button>
                          <button
                            className={isActive ? 'text-button text-button--danger' : 'text-button'}
                            type="button"
                            onClick={() => void handleFaultStatus(faultType)}
                            disabled={Boolean(faultForm) || isBusy}
                          >
                            {isBusy ? 'Guardando...' : isActive ? 'Desactivar' : 'Activar'}
                          </button>
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
    </main>
  )
}

export default CatalogosPage
