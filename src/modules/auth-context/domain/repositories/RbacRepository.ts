import type { Permission } from "../entities/Permission";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { UserId } from "../value-objects/UserId";
import type { RoleId } from "../value-objects/RoleId";
import type { PermissionId } from "../value-objects/PermissionId";

/** Asignaciones en la empresa del token (la interfaz no envía tenant_id). */
export interface RbacRepository {
  assignUserRole(
    command: { userId: UserId; roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  removeUserRole(
    command: { userId: UserId; roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  assignRolePermission(
    command: { roleId: RoleId; permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  removeRolePermission(
    command: { roleId: RoleId; permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  /** Ids de los roles asignados al usuario (el servidor devuelve vínculos usuario↔rol). */
  getUserRoles(
    query: { userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<RoleId[]>;

  /** Ids de los permisos asignados al rol (el servidor devuelve vínculos rol↔permiso). */
  getRolePermissions(
    query: { roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<PermissionId[]>;

  getUserEffectivePermissions(
    query: { userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]>;
}
