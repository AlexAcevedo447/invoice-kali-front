import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import { AuthEndpoints } from "./endpoints/auth";
import { HealthEndpoints } from "./endpoints/health";
import { PermissionEndpoints } from "./endpoints/permissions";
import { RbacEndpoints } from "./endpoints/rbac";
import { RoleEndpoints } from "./endpoints/roles";
import { TenantEndpoints } from "./endpoints/tenants";
import { UserEndpoints } from "./endpoints/users";

export const ApiEndpoints = {
  health: HealthEndpoints,
  auth: AuthEndpoints,
  users: UserEndpoints,
  tenants: TenantEndpoints,
  roles: RoleEndpoints,
  permissions: PermissionEndpoints,
  rbac: RbacEndpoints,
  invoices: InvoiceEndpoints,
} as const;
