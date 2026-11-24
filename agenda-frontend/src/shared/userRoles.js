export const USER_ROLES = [
  { id: 1, name: 'SYSTEM_ADMIN' },
  { id: 2, name: 'CUSTOMER' },
  { id: 3, name: 'TECHNICIAN' },
]

export const ADMIN_ROLE_ID = 1
export const CUSTOMER_ROLE_ID = 2
export const TECHNICIAN_ROLE_ID = 3

export function canListUsers(roleId) {
  return roleId === ADMIN_ROLE_ID
}

export function getAssignableUserRoles(currentRoleId) {
  return USER_ROLES.filter(
    (role) => role.id !== CUSTOMER_ROLE_ID || role.id === Number(currentRoleId)
  )
}

export function getRoleLabel(roleId) {
  const role = USER_ROLES.find((item) => item.id === roleId)
  return role?.name ?? 'Usuario'
}
