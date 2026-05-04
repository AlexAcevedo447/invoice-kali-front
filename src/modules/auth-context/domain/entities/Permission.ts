import type { PermissionId } from "@modules/auth-context/domain/value-objects/PermissionId";
import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";

export interface Permission {
  id: PermissionId;
  tenantId: TenantId;
  resource: string;
  action: string;
}
