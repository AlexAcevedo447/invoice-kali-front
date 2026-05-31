import type { Permission } from "../../domain/entities/Permission";
import type { Role } from "../../domain/entities/Role";

export interface AssignUserRoleCommand {
  tenantId: string;
  userId: string;
  roleId: string;
}

export interface RemoveUserRoleCommand {
  tenantId: string;
  userId: string;
  roleId: string;
}

export interface AssignRolePermissionCommand {
  tenantId: string;
  roleId: string;
  permissionId: string;
}

export interface RemoveRolePermissionCommand {
  tenantId: string;
  roleId: string;
  permissionId: string;
}

export interface UserRolesQuery {
  tenantId: string;
  userId: string;
}

export interface RolePermissionsQuery {
  tenantId: string;
  roleId: string;
}

export interface UserEffectivePermissionsQuery {
  tenantId: string;
  userId: string;
}

export type UserRolesResult = Role[];
export type RolePermissionsResult = Permission[];
export type UserEffectivePermissionsResult = Permission[];
