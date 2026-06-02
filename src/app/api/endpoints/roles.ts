export const RoleEndpoints = {
  create: "/api/v1/roles",
  list: (tenantId: string) =>
    `/api/v1/roles?tenant_id=${encodeURIComponent(tenantId)}`,
  getById: (roleId: string) => `/api/v1/roles/${roleId}`,
  update: (roleId: string) => `/api/v1/roles/${roleId}`,
  delete: (roleId: string) => `/api/v1/roles/${roleId}`,
} as const;

export type RoleEndpoints = typeof RoleEndpoints;
