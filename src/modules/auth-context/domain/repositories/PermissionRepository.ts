import type { Permission } from "@modules/auth-context/domain/entities/Permission";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { PermissionId } from "../value-objects/PermissionId";
import type { TenantId } from "../value-objects/TenantId";

export interface PermissionRepository {
  create(
    command: { tenantId: TenantId; resource: string; action: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  list(
    query: { tenantId: TenantId },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]>;

  update(
    command: {
      permissionId: PermissionId;
      tenantId: TenantId;
      resource: string;
      action: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(
    command: { permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
