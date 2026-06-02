export const AuthContextEndpoints = {
  health: {
    root: "/",
    health: "/health",
  },
  auth: {
    login: "/api/v1/auth/login",
    authorize: "/api/v1/auth/authorize",
  },
  users: {
    create: "/api/v1/users",
    byEmail: (tenantId: string, email: string) =>
      `/api/v1/users/by-email?tenant_id=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}`,
    list: (tenantId: string) =>
      `/api/v1/users?tenant_id=${encodeURIComponent(tenantId)}`,
    getById: (userId: string, tenantId: string) =>
      `/api/v1/users/${encodeURIComponent(userId)}?tenant_id=${encodeURIComponent(tenantId)}`,
    update: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
    delete: (userId: string, tenantId: string) =>
      `/api/v1/users/${encodeURIComponent(userId)}?tenant_id=${encodeURIComponent(tenantId)}`,
  },
  tenants: {
    create: "/api/v1/tenants",
    list: "/api/v1/tenants",
    getById: (tenantId: string) =>
      `/api/v1/tenants/${encodeURIComponent(tenantId)}`,
    byName: (name: string) =>
      `/api/v1/tenants/by-name?name=${encodeURIComponent(name)}`,
    update: (tenantId: string) =>
      `/api/v1/tenants/${encodeURIComponent(tenantId)}`,
    activate: (tenantId: string) =>
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/activate`,
    suspend: (tenantId: string) =>
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/suspend`,
  },
  roles: {
    create: "/api/v1/roles",
    list: (tenantId: string) =>
      `/api/v1/roles?tenant_id=${encodeURIComponent(tenantId)}`,
    getById: (roleId: string) => `/api/v1/roles/${encodeURIComponent(roleId)}`,
    update: (roleId: string) => `/api/v1/roles/${encodeURIComponent(roleId)}`,
    delete: (roleId: string) => `/api/v1/roles/${encodeURIComponent(roleId)}`,
  },
  permissions: {
    create: "/api/v1/permissions",
    list: (tenantId: string) =>
      `/api/v1/permissions?tenant_id=${encodeURIComponent(tenantId)}`,
    getById: (permissionId: string) =>
      `/api/v1/permissions/${encodeURIComponent(permissionId)}`,
    update: (permissionId: string) =>
      `/api/v1/permissions/${encodeURIComponent(permissionId)}`,
    delete: (permissionId: string) =>
      `/api/v1/permissions/${encodeURIComponent(permissionId)}`,
  },
  rbac: {
    assignUserRole: "/api/v1/rbac/users/roles/assign",
    removeUserRole: "/api/v1/rbac/users/roles/remove",
    assignRolePermission: "/api/v1/rbac/roles/permissions/assign",
    removeRolePermission: "/api/v1/rbac/roles/permissions/remove",
    getUserRoles: (tenantId: string, userId: string) =>
      `/api/v1/rbac/users/roles?tenant_id=${encodeURIComponent(tenantId)}&user_id=${encodeURIComponent(userId)}`,
    getRolePermissions: (tenantId: string, roleId: string) =>
      `/api/v1/rbac/roles/permissions?tenant_id=${encodeURIComponent(tenantId)}&role_id=${encodeURIComponent(roleId)}`,
    getUserEffectivePermissions: (tenantId: string, userId: string) =>
      `/api/v1/rbac/users/effective-permissions?tenant_id=${encodeURIComponent(tenantId)}&user_id=${encodeURIComponent(userId)}`,
  },
} as const;

export type AuthContextEndpoints = typeof AuthContextEndpoints;
