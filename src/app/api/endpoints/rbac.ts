export const RbacEndpoints = {
  assignUserRole: "/api/v1/rbac/users/roles/assign",
  removeUserRole: "/api/v1/rbac/users/roles/remove",
  assignRolePermission: "/api/v1/rbac/roles/permissions/assign",
  removeRolePermission: "/api/v1/rbac/roles/permissions/remove",
  getUserRoles: (tenantId: string, userId: string) =>
    `/api/v1/rbac/users/roles?tenant_id=${tenantId}&user_id=${userId}`,
  getRolePermissions: (tenantId: string, roleId: string) =>
    `/api/v1/rbac/roles/permissions?tenant_id=${tenantId}&role_id=${roleId}`,
  getUserEffectivePermissions: (tenantId: string, userId: string) =>
    `/api/v1/rbac/users/effective-permissions?tenant_id=${tenantId}&user_id=${userId}`,
} as const;

export type RbacEndpoints = typeof RbacEndpoints;
