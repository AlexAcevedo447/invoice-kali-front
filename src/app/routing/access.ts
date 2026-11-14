import type { AuthSession } from "../../modules/auth-context/domain/entities/AuthSession";
import { ROUTES } from "./routes";

type SessionPermission = AuthSession["permissions"][number];

const normalize = (value: string): string => value.trim().toLowerCase();

/** Permiso RBAC que exige el servidor para administrar empresas (mismo que kali-auth-context). */
export const PLATFORM_ADMIN_PERMISSION = { resource: "tenants", action: "manage" } as const;

/**
 * Administración de empresas (RF-05): el servidor la permite solo al
 * administrador de plataforma = usuario de la empresa de plataforma con el
 * permiso tenants/manage (o comodín "*"), igual que TenantGuards.PlatformAdmin.
 * Esta función solo decide qué se muestra; la autorización la aplica el servidor.
 */
export const canManageTenants = (
  isPlatformTenant: boolean,
  permissions: SessionPermission[],
): boolean =>
  isPlatformTenant &&
  permissions.some((permission) => {
    const resource = normalize(permission.resource);
    const action = normalize(permission.action);
    return (
      (resource === "*" || resource === PLATFORM_ADMIN_PERMISSION.resource) &&
      (action === "*" || action === PLATFORM_ADMIN_PERMISSION.action)
    );
  });

/**
 * Regla de autorización del servidor (kali-auth-context, MATRIZ_PERMISOS.md):
 * un permiso cubre (recurso, acción) si el recurso coincide o es "*", y la
 * acción coincide o es "*"; además `manage` incluye `read`. Comparación sin
 * mayúsculas ni espacios a los lados. Solo decide qué muestra la interfaz.
 */
export const permissionCovers = (
  permission: { resource: string; action: string },
  resource: string,
  action: string,
): boolean => {
  const granted = { resource: normalize(permission.resource), action: normalize(permission.action) };
  const required = { resource: normalize(resource), action: normalize(action) };
  const resourceOk = granted.resource === "*" || granted.resource === required.resource;
  const actionOk =
    granted.action === "*" ||
    granted.action === required.action ||
    (granted.action === "manage" && required.action === "read");
  return resourceOk && actionOk;
};

export const hasPermission = (
  permissions: SessionPermission[],
  resource: string,
  action: string,
): boolean => permissions.some((permission) => permissionCovers(permission, resource, action));

/** Ver roles (roles/read; roles/manage lo incluye). */
export const canReadRoles = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "roles", "read");

/** Crear, editar y eliminar roles (roles/manage). */
export const canManageRoles = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "roles", "manage");

/** Ver permisos (permissions/read; permissions/manage lo incluye). */
export const canReadPermissions = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "permissions", "read");

/** Crear, editar y eliminar permisos (permissions/manage). */
export const canManagePermissions = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "permissions", "manage");

/** Asignar y quitar roles a usuarios y permisos a roles (rbac/manage). */
export const canManageAssignments = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "rbac", "manage");

/** Ver usuarios de la empresa (users/read; users/manage lo incluye). */
export const canReadUsers = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "users", "read");

/** Crear, editar y eliminar usuarios (users/manage). */
export const canManageUsers = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "users", "manage");

/** Ver facturas (invoices/read). */
export const canReadInvoices = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "invoices", "read");

/** Ver el catálogo de clientes (customers/read). */
export const canReadCustomers = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "customers", "read");

/** Ver el catálogo de productos (products/read). */
export const canReadProducts = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "products", "read");

/** Ver líneas de factura (invoice-items/read). */
export const canReadInvoiceItems = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "invoice-items", "read");

/**
 * Crear, editar y eliminar líneas de una factura existente y sus impuestos
 * (invoice-items/manage; POST/PUT/DELETE /invoice-items). Crear una factura
 * nueva con sus líneas solo exige invoices/manage (D4-05).
 */
export const canManageInvoiceItems = (permissions: SessionPermission[]): boolean =>
  hasPermission(permissions, "invoice-items", "manage");

/**
 * Módulo de facturación (CA-04.10): solo por permisos efectivos (lectura de
 * facturas, líneas, clientes o productos; manage y comodines incluidos). El
 * nombre del rol (p. ej. "invoicing") no concede nada.
 * `roles` se conserva en la firma por compatibilidad con PermissionRoute.
 */
export const canAccessInvoicingModule = (
  _roles: string[],
  permissions: SessionPermission[],
): boolean =>
  canReadInvoices(permissions) ||
  canReadInvoiceItems(permissions) ||
  canReadCustomers(permissions) ||
  canReadProducts(permissions);

/**
 * Módulo de administración (CA-04.10): solo por permisos efectivos. Cada
 * permiso lleva a su funcionalidad: users/roles/permissions con read,
 * rbac/manage (asignaciones, en Roles) y tenants/manage (Empresas, solo en la
 * empresa de plataforma). El nombre del rol (p. ej. "admin") no concede nada.
 */
export const canAccessAdminModule = (
  _roles: string[],
  permissions: SessionPermission[],
  isPlatformTenant = false,
): boolean =>
  // Cada permiso basta para llegar a SU funcionalidad, sin exigir permisos ajenos:
  // rbac/manage → asignaciones (en Roles); tenants/manage → Empresas (solo plataforma).
  canReadUsers(permissions) ||
  canReadRoles(permissions) ||
  canReadPermissions(permissions) ||
  canManageAssignments(permissions) ||
  canManageTenants(isPlatformTenant, permissions);

/**
 * Primera pantalla a la que la sesión tiene acceso: facturación (facturas,
 * clientes, productos, líneas) y luego administración (usuarios, roles,
 * permisos, asignaciones, empresas). Sin ningún permiso, null: la sesión es
 * válida pero se muestra la pantalla "sin acceso a módulos".
 */
export const resolveHomeRoute = (
  roles: string[],
  permissions: SessionPermission[],
  isPlatformTenant = false,
): string | null => {
  if (canAccessInvoicingModule(roles, permissions)) {
    if (canReadInvoices(permissions)) return ROUTES.invoicing.invoices;
    if (canReadCustomers(permissions)) return ROUTES.invoicing.customers;
    if (canReadProducts(permissions)) return ROUTES.invoicing.products;
    return ROUTES.invoicing.invoiceItems;
  }
  if (canReadUsers(permissions)) return ROUTES.admin.users;
  if (canReadRoles(permissions) || canManageAssignments(permissions)) return ROUTES.admin.roles;
  if (canReadPermissions(permissions)) return ROUTES.admin.permissions;
  if (canManageTenants(isPlatformTenant, permissions)) return ROUTES.admin.tenants;
  return null;
};
