import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";

export type TenantStatus = "ACTIVE" | "SUSPENDED";

export interface Tenant {
  id: TenantId;
  name: string;
  /** Código legible de empresa: lo usan los usuarios para iniciar sesión. */
  code: string;
  status: TenantStatus;
}
