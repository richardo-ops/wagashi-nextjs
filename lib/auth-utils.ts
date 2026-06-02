export function isSuperAdminRole(role?: string | null) {
  return role === 'super-admin' || role === 'super_admin'
}
