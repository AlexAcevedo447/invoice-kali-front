import type { AuthSession } from "../entities/AuthSession";
import type { AuthorizationDecision } from "../entities/AuthorizationDecision";
import type {
  ProtectedRequestOptions,
  RequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { TenantId } from "../value-objects/TenantId";
import type { UserId } from "../value-objects/UserId";

export interface AuthRepository {
  /**
   * El tenant nunca lo envía el cliente: el servidor lo resuelve a partir de la
   * cuenta. `tenantCode` (código legible de empresa) solo se envía cuando el
   * servidor lo pide porque el correo existe en varias empresas.
   */
  login(
    command: {
      email: string;
      password: string;
      tenantCode?: string;
    },
    options?: RequestOptions,
  ): Promise<AuthSession>;

  authorize(
    command: {
      tenantId: TenantId;
      userId: UserId;
      resource: string;
      action: string;
    },
    options: ProtectedRequestOptions,
  ): Promise<AuthorizationDecision>;
}
