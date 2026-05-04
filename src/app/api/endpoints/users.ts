export const UserEndpoints = {
  create: "/api/v1/users",
  byEmail: (tenantId: string, email: string) =>
    `/api/v1/users/by-email?tenant_id=${encodeURIComponent(tenantId)}&email=${encodeURIComponent(email)}`,
  list: (tenantId: string) =>
    `/api/v1/users?tenant_id=${encodeURIComponent(tenantId)}`,
  getById: (userId: string, tenantId: string) =>
    `/api/v1/users/${encodeURIComponent(userId)}?tenant_id=${encodeURIComponent(tenantId)}`,
  update: (userId: string) => `/api/v1/users/${userId}`,
  delete: (userId: string, tenantId: string) =>
    `/api/v1/users/${encodeURIComponent(userId)}?tenant_id=${encodeURIComponent(tenantId)}`,
} as const;

export type UserEndpoints = typeof UserEndpoints;
