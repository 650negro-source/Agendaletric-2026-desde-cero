import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  changeCustomerStatus,
  deleteCustomer,
  getCustomer,
  getCustomers,
  updateCustomer,
} from '../../services/customerService.js'
import ConfirmDialog from '../users/ConfirmDialog.jsx'
import ClienteForm from './ClienteForm.jsx'
import './ClientesPage.css'
import '../users/ConfirmDialog.css'
import '../users/UserForm.css'
import '../users/UsersPage.css'
import '../users/UsersTable.css'

function ClientesPage({ session, initialActiveOnly = false }) {
  const [clientes, setClientes] = useState([])
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(initialActiveOnly)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [busyClientId, setBusyClientId] = useState(null)
  const [editingClient, setEditingClient] = useState(null)
  const [viewingClient, setViewingClient] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    setPageError('')
    try {
      setClientes(await getCustomers(session.token))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    let isCurrent = true
    getCustomers(session.token)
      .then((loadedCustomers) => {
        if (isCurrent) setClientes(loadedCustomers)
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

  const visibleCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return clientes.filter((cliente) => {
      if (activeOnly && Number(cliente.estado) !== 1) return false
      if (!normalizedSearch) return true

      return [
        cliente.id_cliente,
        cliente.nombre_completo,
        cliente.documento_identidad,
        cliente.telefono,
        cliente.correo,
      ].some((value) => String(value ?? '').toLocaleLowerCase().includes(normalizedSearch))
    })
  }, [activeOnly, clientes, search])

  async function handleView(customerId) {
    setPageError('')
    try {
      setViewingClient(await getCustomer(session.token, customerId))
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function handleSave(customerData) {
    setPageError('')
    setSuccessMessage('')
    await updateCustomer(session.token, editingClient.id_cliente, customerData)
    setEditingClient(null)
    setSuccessMessage('Los datos del cliente se actualizaron correctamente.')
    await loadCustomers()
  }

  async function handleStatusChange(cliente) {
    setBusyClientId(cliente.id_cliente)
    setPageError('')
    setSuccessMessage('')
    try {
      await changeCustomerStatus(
        session.token,
        cliente.id_cliente,
        Number(cliente.estado) === 1 ? 0 : 1
      )
      setSuccessMessage(`Se actualizó el estado de ${cliente.nombre_completo}.`)
      await loadCustomers()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setBusyClientId(null)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return

    setIsDeleting(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteCustomer(session.token, pendingDelete.id_cliente)
      setPendingDelete(null)
      setSuccessMessage(`Se desactivó el acceso de ${pendingDelete.nombre_completo}.`)
      await loadCustomers()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="users-page">
      <div className="users-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Clientes</h1>
          <p className="users-subtitle">Consulta y administra los perfiles de cliente.</p>
        </div>
      </div>

      <section className="users-card" aria-labelledby="customers-list-title">
        <div className="users-toolbar">
          <div>
            <h2 id="customers-list-title">Directorio de clientes</h2>
            <p>
              {activeOnly
                ? `${visibleCustomers.length} clientes activos`
                : `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'}`}
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
            <label className="users-search">
              <span className="visually-hidden">Buscar clientes</span>
              <input
                type="search"
                placeholder="Buscar por nombre, cédula, teléfono o correo"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => void loadCustomers()}
              disabled={isLoading}
            >
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
        {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}
        {isLoading ? (
          <p className="users-state" role="status">Cargando clientes...</p>
        ) : visibleCustomers.length === 0 ? (
          <p className="users-state">
            {activeOnly && !search.trim()
              ? 'No hay clientes activos.'
              : 'No hay clientes que coincidan con la búsqueda.'}
          </p>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th scope="col">Cliente</th>
                  <th scope="col">Cédula</th>
                  <th scope="col">Celular</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleCustomers.map((cliente) => {
                  const isActive = Number(cliente.estado) === 1
                  const isBusy = busyClientId === cliente.id_cliente
                  return (
                    <tr key={cliente.id_cliente}>
                      <td>
                        <strong className="user-name">{cliente.nombre_completo}</strong>
                        <span className="user-email">{cliente.correo}</span>
                      </td>
                      <td>{cliente.documento_identidad}</td>
                      <td>{cliente.telefono}</td>
                      <td>
                        <span className={`status-pill ${isActive ? 'status-pill--active' : 'status-pill--inactive'}`}>
                          <span aria-hidden="true" className="status-dot" />
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="user-actions">
                          <button className="text-button" type="button" onClick={() => void handleView(cliente.id_cliente)}>
                            Ver
                          </button>
                          <button className="text-button" type="button" onClick={() => setEditingClient(cliente)}>
                            Editar
                          </button>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => void handleStatusChange(cliente)}
                            disabled={isBusy}
                          >
                            {isBusy ? 'Actualizando...' : isActive ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            className="text-button text-button--danger"
                            type="button"
                            onClick={() => setPendingDelete(cliente)}
                          >
                            Eliminar
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

      {editingClient && (
        <div className="dialog-backdrop" role="presentation">
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="edit-customer-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Perfil de cliente</p>
                <h2 id="edit-customer-title">Editar cliente</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar formulario"
                onClick={() => setEditingClient(null)}
              >
                ×
              </button>
            </div>
            <ClienteForm
              cliente={editingClient}
              onCancel={() => setEditingClient(null)}
              onSubmit={handleSave}
            />
          </section>
        </div>
      )}

      {viewingClient && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewingClient(null)
        }}>
          <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="customer-details-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Detalle del cliente</p>
                <h2 id="customer-details-title">{viewingClient.nombre_completo}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setViewingClient(null)}
              >
                ×
              </button>
            </div>
            <dl className="client-summary-grid">
              <div><dt>Cédula</dt><dd>{viewingClient.documento_identidad}</dd></div>
              <div><dt>Celular</dt><dd>{viewingClient.telefono}</dd></div>
              <div><dt>Correo</dt><dd>{viewingClient.correo}</dd></div>
              <div><dt>Dirección</dt><dd>{viewingClient.direccion || 'No registrada'}</dd></div>
              <div><dt>Estado</dt><dd>{Number(viewingClient.estado) === 1 ? 'Activo' : 'Inactivo'}</dd></div>
            </dl>
          </section>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Desactivar cliente"
          message={`¿Deseas desactivar a ${pendingDelete.nombre_completo}? Se deshabilitará su cuenta y se conservarán sus registros.`}
          confirmLabel="Desactivar cliente"
          confirmingLabel="Desactivando..."
          isConfirming={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </main>
  )
}

export default ClientesPage
