import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";

export type TenantStatus = "ACTIVE" | "SUSPENDED";

export interface Tenant {
  id: TenantId;
  name: string;
  status: TenantStatus;
}
