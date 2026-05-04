import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import {
  AuthEndpoints,
  HealthEndpoints,
  PermissionEndpoints,
  RbacEndpoints,
  RoleEndpoints,
  TenantEndpoints,
  UserEndpoints,
} from "@app/api/endpoints";

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
