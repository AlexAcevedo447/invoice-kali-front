import type { AuthSession } from "../../modules/auth-context/domain/entities/AuthSession";
import { ROUTES } from "./routes";

type SessionPermission = AuthSession["permissions"][number];

const normalize = (value: string): string => value.trim().toLowerCase();

const includesRole = (roles: string[], expectedRole: string): boolean => {
  const target = normalize(expectedRole);
  return roles.some((role) => normalize(role) === target);
};

const matchesResource = (
  permissionResource: string,
  resources: readonly string[],
): boolean => {
  const current = normalize(permissionResource);
  if (current === "*") {
    return true;
  }

  return resources.some((resource) => {
    const candidate = normalize(resource);
    return (
      current === candidate ||
      current.startsWith(`${candidate}:`) ||
      current.startsWith(`${candidate}.`) ||
      current.startsWith(`${candidate}/`)
    );
  });
};

const matchesAction = (
  permissionAction: string,
  actions: readonly string[],
): boolean => {
  const current = normalize(permissionAction);
  if (current === "*") {
    return true;
  }

  return actions.some((action) => normalize(action) === current);
};

const hasAnyPermission = (
  permissions: SessionPermission[],
  resources: readonly string[],
  actions: readonly string[] = ["*", "read", "list", "view", "manage"],
): boolean => {
  return permissions.some(
    (permission) =>
      matchesResource(permission.resource, resources) &&
      matchesAction(permission.action, actions),
  );
};

export const canAccessInvoicingModule = (
  roles: string[],
  permissions: SessionPermission[],
): boolean => {
  if (includesRole(roles, "invoicing")) {
    return true;
  }

  return hasAnyPermission(permissions, [
    "invoices",
    "invoice-items",
    "metrics",
  ]);
};

export const canAccessAdminModule = (
  roles: string[],
  permissions: SessionPermission[],
): boolean => {
  if (includesRole(roles, "admin")) {
    return true;
  }

  return hasAnyPermission(permissions, [
    "users",
    "tenants",
    "roles",
    "permissions",
    "rbac",
  ]);
};

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

export const resolveHomeRoute = (
  roles: string[],
  permissions: SessionPermission[],
): string | null => {
  if (canAccessInvoicingModule(roles, permissions)) {
    return ROUTES.invoicing.invoices;
  }

  if (canAccessAdminModule(roles, permissions)) {
    return ROUTES.admin.users;
  }

  return null;
};
