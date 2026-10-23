export const USER_ROLES = [
  { id: 1, name: 'SYSTEM_ADMIN' },
  { id: 2, name: 'CUSTOMER' },
  { id: 3, name: 'TECHNICIAN' },
]

export const ADMIN_ROLE_ID = 1
export const TECHNICIAN_ROLE_ID = 3

export function canListUsers(roleId) {
  return roleId === ADMIN_ROLE_ID || roleId === TECHNICIAN_ROLE_ID
}
