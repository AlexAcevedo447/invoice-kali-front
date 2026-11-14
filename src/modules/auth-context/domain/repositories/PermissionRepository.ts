import type { Permission } from "@modules/auth-context/domain/entities/Permission";
import type { PermissionCatalog } from "@modules/auth-context/domain/entities/PermissionCatalog";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { PermissionId } from "../value-objects/PermissionId";

/** Opera siempre en la empresa del token (la interfaz no envía tenant_id). */
export interface PermissionRepository {
  create(
    command: { resource: string; action: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<Permission>;

  list(options: ProtectedRequestOptions): Promise<Permission[]>;

  catalog(options: ProtectedRequestOptions): Promise<PermissionCatalog>;

  update(
    command: { permissionId: PermissionId; resource: string; action: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(
    command: { permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
