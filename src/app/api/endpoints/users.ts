// La empresa la toma el servidor del token: no se envía tenant_id.
export const UserEndpoints = {
  create: "/api/v1/users",
  byEmail: (email: string) =>
    `/api/v1/users/by-email?email=${encodeURIComponent(email)}`,
  list: "/api/v1/users",
  getById: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
  update: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
  delete: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
} as const;

export type UserEndpoints = typeof UserEndpoints;
