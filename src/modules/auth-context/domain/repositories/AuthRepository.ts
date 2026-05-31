import type { AuthSession } from "../entities/AuthSession";
import type { AuthorizationDecision } from "../entities/AuthorizationDecision";
import type {
  ProtectedRequestOptions,
  RequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { TenantId } from "../value-objects/TenantId";
import type { UserId } from "../value-objects/UserId";

export interface AuthRepository {
  login(
    command: {
      tenantId: TenantId;
      email: string;
      password: string;
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
