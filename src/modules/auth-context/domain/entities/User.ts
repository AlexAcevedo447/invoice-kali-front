import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";
import type { UserId } from "@modules/auth-context/domain/value-objects/UserId";

export interface User {
  id: UserId;
  tenantId: TenantId;
  identificationNumber: string;
  username: string;
  email: string;
}
