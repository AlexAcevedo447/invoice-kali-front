import type { Permission } from "../entities/Permission";
import type { Role } from "../entities/Role";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "@modules/auth-context/domain/repositories/RequestOptions";
import type { TenantId } from "../value-objects/TenantId";
import type { UserId } from "../value-objects/UserId";
import type { RoleId } from "../value-objects/RoleId";
import type { PermissionId } from "../value-objects/PermissionId";

export interface RbacRepository {
  assignUserRole(
    command: { tenantId: TenantId; userId: UserId; roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  removeUserRole(
    command: { tenantId: TenantId; userId: UserId; roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<void>;

  assignRolePermission(
    command: {
      tenantId: TenantId;
      roleId: RoleId;
      permissionId: PermissionId;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void>;

  removeRolePermission(
    command: {
      tenantId: TenantId;
      roleId: RoleId;
      permissionId: PermissionId;
    },
    options: ProtectedRequestOptions,
  ): Promise<void>;

  getUserRoles(
    query: { tenantId: TenantId; userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<Role[]>;

  getRolePermissions(
    query: { tenantId: TenantId; roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]>;

  getUserEffectivePermissions(
    query: { tenantId: TenantId; userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]>;
}
