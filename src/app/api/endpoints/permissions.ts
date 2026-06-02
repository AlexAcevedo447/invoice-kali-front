export const PermissionEndpoints = {
  create: "/api/v1/permissions",
  list: (tenantId: string) =>
    `/api/v1/permissions?tenant_id=${encodeURIComponent(tenantId)}`,
  getById: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
  update: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
  delete: (permissionId: string) => `/api/v1/permissions/${permissionId}`,
} as const;

export type PermissionEndpoints = typeof PermissionEndpoints;
