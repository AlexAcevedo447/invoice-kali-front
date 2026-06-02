import type { Role } from "@modules/auth-context/domain/entities/Role";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type {
  RoleId,
  TenantId,
} from "@modules/auth-context/domain/value-objects";

export interface RoleRepository {
  create(
    command: { tenantId: TenantId; name: string; description: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  list(
    query: { tenantId: TenantId },
    options: ProtectedRequestOptions,
  ): Promise<Role[]>;

  getById(
    query: { roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<Role>;

  update(
    command: {
      roleId: RoleId;
      tenantId: TenantId;
      name: string;
      description: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(
    command: { roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
