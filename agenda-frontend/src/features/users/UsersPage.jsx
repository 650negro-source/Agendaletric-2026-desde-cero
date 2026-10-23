import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  changeUserStatus,
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from '../../services/userService.js'
import { ADMIN_ROLE_ID, canListUsers } from '../../shared/userRoles.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import UserForm from './UserForm.jsx'
import UsersTable from './UsersTable.jsx'
import './ConfirmDialog.css'
import './UserForm.css'
import './UsersTable.css'
import './UsersPage.css'

function UsersPage({ session }) {
  const roleId = Number(session.user.id_rol)
  const canManageUsers = roleId === ADMIN_ROLE_ID
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(() => canListUsers(roleId))
  const [pageError, setPageError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [activeForm, setActiveForm] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [viewingUser, setViewingUser] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [busyUserId, setBusyUserId] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setPageError('')

    try {
      setUsers(await getUsers(session.token))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [session.token])

  useEffect(() => {
    if (!canListUsers(roleId)) return undefined

    let isCurrent = true
    getUsers(session.token)
      .then((loadedUsers) => {
        if (isCurrent) setUsers(loadedUsers)
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
  }, [roleId, session.token])

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    if (!normalizedSearch) return users

    return users.filter((user) => [
      user.id_usuario,
      user.nombre,
      user.correo,
      user.rol,
    ].some((value) => String(value ?? '').toLocaleLowerCase().includes(normalizedSearch)))
  }, [search, users])

  if (!canListUsers(roleId)) {
    return (
      <main className="users-page">
        <section className="notice-card" role="alert">
          <h1>Acceso restringido</h1>
          <p>Tu rol no tiene permiso para consultar la gestión de usuarios.</p>
        </section>
      </main>
    )
  }

  async function handleSave(userData) {
    setPageError('')
    setSuccessMessage('')
    if (activeForm.mode === 'create') {
      await createUser(session.token, userData)
      setSuccessMessage('El usuario se creó correctamente.')
    } else {
      await updateUser(session.token, activeForm.user.id_usuario, userData)
      setSuccessMessage('Los cambios del usuario se guardaron correctamente.')
    }
    setActiveForm(null)
    await loadUsers()
  }

  async function handleStatusChange(user) {
    setBusyUserId(user.id_usuario)
    setPageError('')
    setSuccessMessage('')
    try {
      await changeUserStatus(session.token, user.id_usuario, user.estado === 1 ? 0 : 1)
      setSuccessMessage(`Se actualizó el estado de ${user.nombre}.`)
      await loadUsers()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setBusyUserId(null)
    }
  }

  async function handleViewUser(userId) {
    setPageError('')
    setIsLoadingDetails(true)
    setViewingUser(null)
    try {
      setViewingUser(await getUser(session.token, userId))
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  async function handleEditUser(userId) {
    setPageError('')
    setIsLoadingDetails(true)
    try {
      const user = await getUser(session.token, userId)
      setActiveForm({ mode: 'edit', user })
    } catch (error) {
      setPageError(error.message)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return

    setIsDeleting(true)
    setPageError('')
    setSuccessMessage('')
    try {
      await deleteUser(session.token, pendingDelete.id_usuario)
      setSuccessMessage(`Se eliminó el usuario ${pendingDelete.nombre}.`)
      setPendingDelete(null)
      await loadUsers()
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
          <h1>Usuarios</h1>
          <p className="users-subtitle">Consulta las cuentas y administra sus permisos de acceso.</p>
        </div>
        {canManageUsers && (
          <button
            className="button button--primary"
            type="button"
            onClick={() => setActiveForm({ mode: 'create', user: null })}
          >
            <span aria-hidden="true">+</span> Crear usuario
          </button>
        )}
      </div>

      <section className="users-card" aria-labelledby="users-list-title">
        <div className="users-toolbar">
          <div>
            <h2 id="users-list-title">Directorio de usuarios</h2>
            <p>{users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}</p>
          </div>
          <div className="users-toolbar-actions">
            <label className="users-search">
              <span className="visually-hidden">Buscar usuarios</span>
              <input
                type="search"
                placeholder="Buscar por nombre, correo o rol"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="button button--secondary" type="button" onClick={() => void loadUsers()} disabled={isLoading}>
              {isLoading ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {pageError && <p className="feedback feedback--error" role="alert">{pageError}</p>}
        {successMessage && <p className="feedback feedback--success" role="status">{successMessage}</p>}
        {isLoading ? (
          <p className="users-state" role="status">Cargando usuarios...</p>
        ) : (
          <UsersTable
            users={visibleUsers}
            canManageUsers={canManageUsers}
            busyUserId={busyUserId}
            onChangeStatus={handleStatusChange}
            onDelete={setPendingDelete}
            onView={handleViewUser}
            onEdit={handleEditUser}
          />
        )}
      </section>

      {isLoadingDetails && <p className="users-state" role="status">Consultando usuario...</p>}

      {activeForm && (
        <UserForm
          mode={activeForm.mode}
          user={activeForm.user}
          onCancel={() => setActiveForm(null)}
          onSubmit={handleSave}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminar usuario"
          message={`¿Deseas eliminar la cuenta de ${pendingDelete.nombre}? La API realizará una eliminación lógica.`}
          confirmLabel="Eliminar usuario"
          isConfirming={isDeleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {viewingUser && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setViewingUser(null)
        }}>
          <section className="dialog-card user-details" role="dialog" aria-modal="true" aria-labelledby="user-details-title">
            <div className="dialog-heading">
              <div>
                <p className="eyebrow">Detalle de usuario</p>
                <h2 id="user-details-title">{viewingUser.nombre}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Cerrar detalle" onClick={() => setViewingUser(null)}>
                ×
              </button>
            </div>
            <dl>
              <div><dt>ID</dt><dd>{viewingUser.id_usuario}</dd></div>
              <div><dt>Correo</dt><dd>{viewingUser.correo}</dd></div>
              <div><dt>Rol</dt><dd>{viewingUser.rol || `Rol ${viewingUser.id_rol}`}</dd></div>
              <div><dt>Estado</dt><dd>{viewingUser.estado === 1 ? 'Activo' : 'Inactivo'}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </main>
  )
}

export default UsersPage
