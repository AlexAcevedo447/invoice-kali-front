export const TenantEndpoints = {
  create: "/api/v1/tenants",
  byName: (name: string) =>
    `/api/v1/tenants/by-name?name=${encodeURIComponent(name)}`,
  list: "/api/v1/tenants",
  getById: (tenantId: string) => `/api/v1/tenants/${tenantId}`,
  update: (tenantId: string) => `/api/v1/tenants/${tenantId}`,
  activate: (tenantId: string) => `/api/v1/tenants/${tenantId}/activate`,
  suspend: (tenantId: string) => `/api/v1/tenants/${tenantId}/suspend`,
} as const;

export type TenantEndpoints = typeof TenantEndpoints;
