import type { RoleId } from "@modules/auth-context/domain/value-objects/RoleId";
import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";

export interface Role {
  id: RoleId;
  tenantId: TenantId;
  name: string;
  description: string;
}
