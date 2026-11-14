import type { TenantId } from "@modules/auth-context/domain/value-objects/TenantId";
import type { UserId } from "@modules/auth-context/domain/value-objects/UserId";
import type { Permission } from "./Permission";

export interface AuthSession {
  accessToken: string;
  tokenType: "Bearer" | string;
  expiresIn: number;
  /** Identificador técnico del tenant: solo de uso interno, nunca se muestra. */
  tenantId: TenantId;
  /** Nombre y código legibles de la empresa, para mostrar al usuario. */
  tenantName: string;
  tenantCode: string;
  userId: UserId;
  email: string;
  needsRehash: boolean;
  roles: string[];
  permissions: Pick<Permission, "id" | "resource" | "action">[];
}
