// Health endpoints
export interface HealthEndpointsType {
  root: string;
  health: string;
}

export interface HealthEndpointModule {
  health: HealthEndpointsType;
}

// Auth endpoints
export interface AuthEndpointsType {
  login: string;
  authorize: string;
}

export interface AuthEndpointModule {
  auth: AuthEndpointsType;
}

// User endpoints
export interface UserEndpointsType {
  create: string;
  byEmail: (tenantId: string, email: string) => string;
  list: (tenantId: string) => string;
  getById: (userId: string, tenantId: string) => string;
  update: (userId: string) => string;
  delete: (userId: string, tenantId: string) => string;
}

export interface UserEndpointModule {
  users: UserEndpointsType;
}

// Tenant endpoints
export interface TenantEndpointsType {
  create: string;
  byName: (name: string) => string;
  list: string;
  getById: (tenantId: string) => string;
  update: (tenantId: string) => string;
  activate: (tenantId: string) => string;
  suspend: (tenantId: string) => string;
}

export interface TenantEndpointModule {
  tenants: TenantEndpointsType;
}

// Role endpoints
export interface RoleEndpointsType {
  create: string;
  list: (tenantId: string) => string;
  getById: (roleId: string) => string;
  update: (roleId: string) => string;
  delete: (roleId: string) => string;
}

export interface RoleEndpointModule {
  roles: RoleEndpointsType;
}

// Permission endpoints
export interface PermissionEndpointsType {
  create: string;
  list: (tenantId: string) => string;
  getById: (permissionId: string) => string;
  update: (permissionId: string) => string;
  delete: (permissionId: string) => string;
}

export interface PermissionEndpointModule {
  permissions: PermissionEndpointsType;
}

// RBAC endpoints
export interface RbacEndpointsType {
  assignUserRole: string;
  removeUserRole: string;
  assignRolePermission: string;
  removeRolePermission: string;
  getUserRoles: (tenantId: string, userId: string) => string;
  getRolePermissions: (tenantId: string, roleId: string) => string;
  getUserEffectivePermissions: (tenantId: string, userId: string) => string;
}

export interface RbacEndpointModule {
  rbac: RbacEndpointsType;
}

// Invoice endpoints (legacy)
export interface InvoiceEndpointsType {
  list: string;
  getById: (id: string) => string;
  create: string;
  update: (id: string) => string;
  delete: (id: string) => string;
}

export interface InvoiceEndpointModule {
  invoices: InvoiceEndpointsType;
}

// Mapeo tipado de módulos a sus tipos de endpoints
export interface EndpointModuleMap {
  health: HealthEndpointModule;
  auth: AuthEndpointModule;
  users: UserEndpointModule;
  tenants: TenantEndpointModule;
  roles: RoleEndpointModule;
  permissions: PermissionEndpointModule;
  rbac: RbacEndpointModule;
  invoices: InvoiceEndpointModule;
}

export type EndpointModuleKey = keyof EndpointModuleMap;

export type EndpointFactoryResult<K extends EndpointModuleKey> =
  EndpointModuleMap[K];

export type EndpointFactory<K extends EndpointModuleKey = EndpointModuleKey> =
  () => Promise<EndpointModuleMap[K]>;
