function UsersTable({ users, canManageUsers, busyUserId, onChangeStatus, onDelete, onView, onEdit }) {
  if (users.length === 0) {
    return (
      <p className="users-state">
        No hay usuarios que coincidan con la búsqueda.
      </p>
    )
  }

  return (
    <div className="users-table-scroll">
      <table className="users-table">
        <thead>
          <tr>
            <th scope="col">Usuario</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isActive = user.estado === 1
            const isBusy = busyUserId === user.id_usuario

            return (
              <tr key={user.id_usuario}>
                <td>
                  <strong className="user-name">{user.nombre}</strong>
                  <span className="user-email">{user.correo}</span>
                </td>
                <td><span className="role-label">{user.rol || `Rol ${user.id_rol}`}</span></td>
                <td>
                  <span className={`status-pill ${isActive ? 'status-pill--active' : 'status-pill--inactive'}`}>
                    <span aria-hidden="true" className="status-dot" />
                    {isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="user-actions">
                    <button className="text-button" type="button" onClick={() => onView(user.id_usuario)}>
                      Ver
                    </button>
                    {canManageUsers && (
                      <>
                        <button className="text-button" type="button" onClick={() => onEdit(user.id_usuario)}>
                          Editar
                        </button>
                        <button className="text-button text-button--danger" type="button" onClick={() => onDelete(user)}>
                          Eliminar
                        </button>
                      </>
                    )}
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => onChangeStatus(user)}
                      disabled={isBusy}
                    >
                      {isBusy ? 'Actualizando...' : isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default UsersTable
