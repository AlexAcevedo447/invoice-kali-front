import type { User } from "@modules/auth-context/domain/entities/User";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type {
  TenantId,
  UserId,
} from "@modules/auth-context/domain/value-objects";

export interface UserRepository {
  create(
    command: {
      tenantId: TenantId;
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  list(
    query: { tenantId: TenantId },
    options: ProtectedRequestOptions,
  ): Promise<User[]>;

  getById(
    query: { userId: UserId; tenantId: TenantId },
    options: ProtectedRequestOptions,
  ): Promise<User>;

  getByEmail(
    query: { tenantId: TenantId; email: string },
    options: ProtectedRequestOptions,
  ): Promise<User>;

  update(
    command: {
      userId: UserId;
      tenantId: TenantId;
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(
    command: { userId: UserId; tenantId: TenantId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
