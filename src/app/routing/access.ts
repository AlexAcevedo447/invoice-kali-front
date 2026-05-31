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
