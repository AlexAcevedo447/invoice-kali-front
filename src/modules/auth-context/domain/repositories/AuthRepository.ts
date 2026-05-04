import type {
  AuthSession,
  AuthorizationDecision,
} from "@modules/auth-context/domain/entities";
import type {
  ProtectedRequestOptions,
  RequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type {
  TenantId,
  UserId,
} from "@modules/auth-context/domain/value-objects";

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
