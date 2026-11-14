import type { Role } from "@modules/auth-context/domain/entities/Role";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { RoleId } from "../value-objects/RoleId";

/** Opera siempre en la empresa del token (la interfaz no envía tenant_id). */
export interface RoleRepository {
  create(
    command: { name: string; description: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<Role>;

  list(options: ProtectedRequestOptions): Promise<Role[]>;

  getById(
    query: { roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<Role>;

  update(
    command: { roleId: RoleId; name: string; description: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  delete(
    command: { roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;
}
