import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCustomers } from '../../services/customerService.js'
import {
  changeVehicleStatus,
  createVehicle,
  getVehicle,
  getVehicles,
  updateVehicle,
} from '../../services/vehicleService.js'
import { ADMIN_ROLE_ID } from '../../shared/userRoles.js'
import { VEHICLE_ENERGY_TYPES, VEHICLE_TYPES } from '../../shared/vehiclePolicy.js'
import ConfirmDialog from '../users/ConfirmDialog.jsx'
import VehiculoForm from './VehiculoForm.jsx'
import './VehiculosPage.css'
import '../users/ConfirmDialog.css'
import '../users/UserForm.css'
import '../users/UsersPage.css'
import '../users/UsersTable.css'

function getOptionLabel(options, value) {
  return options.find((option) => option.value === value)?.label ?? 'Pendiente de actualizar'
}

function VehiculosPage({ session }) {
  const isAdmin = Number(session.user.id_rol) === ADMIN_ROLE_ID
  const [vehicles, setVehicles] = useState([])
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingVehicle, setEditingVehicle] = useState(null)
  const [isCreatingVehicle, setIsCreatingVehicle] = useState(false)
  const [viewingVehicle, setViewingVehicle] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      const loadedVehicles = await getVehicles(session.token)
      const loadedClients = isAdmin ? await getCustomers(session.token) : []
      setVehicles(loadedVehicles)
      setClients(loadedClients)
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [isAdmin, session.token])

  useEffect(() => {
    let isCurrent = true

    async function loadInitialData() {
      try {
        const loadedVehicles = await getVehicles(session.token)
        const loadedClients = isAdmin ? await getCustomers(session.token) : []
        if (!isCurrent) return
        setVehicles(loadedVehicles)
        setClients(loadedClients)
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

  const activeClients = useMemo(
    () => clients.filter((client) => Number(client.estado) === 1),
    [clients]
  )

  const visibleVehicles = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    if (!normalizedSearch) return vehicles

    return vehicles.filter((vehicle) => [
      vehicle.placa,
      vehicle.marca,
      vehicle.modelo,
      vehicle.tipo_vehiculo,
      vehicle.tipo_energia,
      vehicle.cliente_nombre,
      vehicle.cliente_correo,
    ].some((value) => String(value ?? '').toLocaleLowerCase().includes(normalizedSearch)))
  }, [search, vehicles])

  async function handleSave(vehicleData) {
    setPageError('')
    setSuccessMessage('')
    if (editingVehicle) {
      await updateVehicle(session.token, editingVehicle.id_vehiculo, vehicleData)
      setSuccessMessage('El vehículo se actualizó correctamente.')
    } else {
      await createVehicle(session.token, vehicleData)
      setSuccessMessage('El vehículo se registró correctamente.')
    }
    setEditingVehicle(null)
    setIsCreatingVehicle(false)
    await loadData()
  }

  async function handleView(vehicleId) {
    setPageError('')
    try {
      setViewingVehicle(await getVehicle(session.token, vehicleId))
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function handleEdit(vehicleId) {
    setPageError('')
    try {
      const vehicle = await getVehicle(session.token, vehicleId)
      setEditingVehicle(vehicle)
      setIsCreatingVehicle(false)
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function handleStatusChange() {
    if (!pendingStatus) return

    setIsUpdatingStatus(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await changeVehicleStatus(
        session.token,
        pendingStatus.vehicle.id_vehiculo,
        pendingStatus.nextStatus
      )
      setSuccessMessage(
        pendingStatus.nextStatus === 1
          ? 'El vehículo se activó correctamente.'
          : 'El vehículo se dio de baja y se conservó su historial.'
      )
      setPendingStatus(null)
      await loadData()
    } catch (error) {
      setPendingStatus(null)
      setPageError(error.message)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <main className="users-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">{isAdmin ? 'Administración' : 'Cuenta de cliente'}</p>
          <h1>{isAdmin ? 'Vehículos' : 'Mis vehículos'}</h1>
          <p className="users-subtitle">
            {isAdmin
              ? 'Consulta y administra los vehículos asociados a cada cliente.'
              : 'Registra tus vehículos y mantén actualizados sus datos.'}
          </p>
        </div>
        <button
          className="button button--primary"
          type="button"
          onClick={() => {
            setEditingVehicle(null)
            setIsCreatingVehicle(true)
          }}
          disabled={isAdmin && activeClients.length === 0}
        >
          Registrar vehículo
        </button>
      </div>

      {isAdmin && !isLoading && activeClients.length === 0 && (
        <p className="feedback feedback--error" role="status">
          No hay clientes activos para asociar un vehículo. Activa o registra un cliente primero.
        </p>
      )}

      <section className="users-card" aria-labelledby="vehicles-list-title">
        <div className="users-toolbar">
          <div>
            <h2 id="vehicles-list-title">
              {isAdmin ? 'Directorio de vehículos' : 'Vehículos asociados a tu cuenta'}
            </h2>
            <p>{vehicles.length} {vehicles.length === 1 ? 'vehículo' : 'vehículos'}</p>
          </div>
          <div className="users-toolbar-actions">
            <label className="users-search">
              <span className="visually-hidden">Buscar vehículos</span>
              <input
                type="search"
                placeholder={isAdmin ? 'Buscar placa, marca o cliente' : 'Buscar placa, marca o modelo'}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
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

        {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
        {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}
        {isLoading ? (
          <p className="users-state" role="status">Cargando vehículos...</p>
        ) : visibleVehicles.length === 0 ? (
          <p className="users-state">
            {vehicles.length === 0
              ? 'Aún no hay vehículos registrados.'
              : 'No hay vehículos que coincidan con la búsqueda.'}
          </p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table vehicles-table">
              <thead>
                <tr>
                  <th scope="col">Placa</th>
                  <th scope="col">Vehículo</th>
                  <th scope="col">Energía</th>
                  {isAdmin && <th scope="col">Cliente</th>}
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleVehicles.map((vehicle) => {
                  const isActive = Number(vehicle.estado) === 1
                  return (
                    <tr key={vehicle.id_vehiculo}>
                      <td><strong className="vehicle-plate">{vehicle.placa}</strong></td>
                      <td>
                        <strong className="user-name">{vehicle.marca} {vehicle.modelo}</strong>
                        <span className="user-email">
                          {getOptionLabel(VEHICLE_TYPES, vehicle.tipo_vehiculo)} · {vehicle.anio} · {vehicle.color}
                        </span>
                      </td>
                      <td>{getOptionLabel(VEHICLE_ENERGY_TYPES, vehicle.tipo_energia)}</td>
                      {isAdmin && (
                        <td>
                          <strong className="user-name">{vehicle.cliente_nombre}</strong>
                          <span className="user-email">{vehicle.cliente_correo}</span>
                        </td>
                      )}
                      <td>
                        <span className={`status-pill ${isActive ? 'status-pill--active' : 'status-pill--inactive'}`}>
                          <span aria-hidden="true" className="status-dot" />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void handleView(vehicle.id_vehiculo)}
                          >
                            Ver
                          </button>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void handleEdit(vehicle.id_vehiculo)}
                          >
                            Editar
                          </button>
                          <button
                            className={`text-button ${isActive ? 'text-button--danger' : ''}`}
                            type="button"
                            onClick={() => setPendingStatus({
                              vehicle,
                              nextStatus: isActive ? 0 : 1,
                            })}
                          >
                            {isActive ? 'Dar de baja' : 'Activar'}
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

      {(isCreatingVehicle || editingVehicle !== null) && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="vehicle-form-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">{isAdmin ? 'Administración' : 'Mis vehículos'}</p>
                <h2 id="vehicle-form-title">
                  {editingVehicle ? 'Editar vehículo' : 'Registrar vehículo'}
                </h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar formulario"
                onClick={() => {
                  setEditingVehicle(null)
                  setIsCreatingVehicle(false)
                }}
              >
                ×
              </button>
            </div>
            <VehiculoForm
              key={editingVehicle?.id_vehiculo ?? 'new'}
              vehicle={editingVehicle}
              clients={activeClients}
              isAdmin={isAdmin}
              onCancel={() => {
                setEditingVehicle(null)
                setIsCreatingVehicle(false)
              }}
              onSubmit={handleSave}
            />
          </section>
        </div>
      )}

      {viewingVehicle && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewingVehicle(null)
        }}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="vehicle-details-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Detalle del vehículo</p>
                <h2 id="vehicle-details-title">{viewingVehicle.placa}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setViewingVehicle(null)}
              >
                ×
              </button>
            </div>
            <dl className="vehicle-details-grid">
              <div><dt>Tipo</dt><dd>{getOptionLabel(VEHICLE_TYPES, viewingVehicle.tipo_vehiculo)}</dd></div>
              <div><dt>Marca</dt><dd>{viewingVehicle.marca}</dd></div>
              <div><dt>Modelo</dt><dd>{viewingVehicle.modelo}</dd></div>
              <div><dt>Año</dt><dd>{viewingVehicle.anio}</dd></div>
              <div><dt>Color</dt><dd>{viewingVehicle.color}</dd></div>
              <div><dt>Energía</dt><dd>{getOptionLabel(VEHICLE_ENERGY_TYPES, viewingVehicle.tipo_energia)}</dd></div>
              <div><dt>Estado</dt><dd>{Number(viewingVehicle.estado) === 1 ? 'Activo' : 'Inactivo'}</dd></div>
              {isAdmin && <div><dt>Propietario</dt><dd>{viewingVehicle.cliente_nombre}</dd></div>}
            </dl>
          </section>
        </div>
      )}

      {pendingStatus && (
        <ConfirmDialog
          title={pendingStatus.nextStatus === 0 ? 'Dar de baja vehículo' : 'Activar vehículo'}
          message={pendingStatus.nextStatus === 0
            ? `¿Deseas dar de baja el vehículo ${pendingStatus.vehicle.placa}? Se conservará para consultar las citas anteriores.`
            : `¿Deseas volver a activar el vehículo ${pendingStatus.vehicle.placa}?`}
          confirmLabel={pendingStatus.nextStatus === 0 ? 'Dar de baja' : 'Activar vehículo'}
          confirmingLabel={pendingStatus.nextStatus === 0 ? 'Dando de baja...' : 'Activando...'}
          isConfirming={isUpdatingStatus}
          onCancel={() => setPendingStatus(null)}
          onConfirm={() => void handleStatusChange()}
        />
      )}
    </main>
  )
}

export default VehiculosPage
