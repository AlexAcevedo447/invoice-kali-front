import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";
import type { UserId } from "@modules/auth-context/domain/value-objects/UserId";
import type { Permission } from "./Permission";

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer" | string;
  expiresIn: number;
  tenantId: TenantId;
  userId: UserId;
  email: string;
  needsRehash: boolean;
  roles: string[];
  permissions: Pick<Permission, "id" | "resource" | "action">[];
}
