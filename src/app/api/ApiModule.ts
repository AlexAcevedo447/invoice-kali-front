export const ApiModule = {
  Health: "health",
  Auth: "auth",
  Users: "users",
  Tenants: "tenants",
  Roles: "roles",
  Permissions: "permissions",
  Rbac: "rbac",
  Invoices: "invoices",
} as const;

export type ApiModule = (typeof ApiModule)[keyof typeof ApiModule];
