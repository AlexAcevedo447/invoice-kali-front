import type { Permission } from "../../domain/entities/Permission";

// La empresa la toma el servidor del token: los comandos no llevan tenantId.
export interface AssignUserRoleCommand {
  userId: string;
  roleId: string;
}

export interface RemoveUserRoleCommand {
  userId: string;
  roleId: string;
}

export interface AssignRolePermissionCommand {
  roleId: string;
  permissionId: string;
}

export interface RemoveRolePermissionCommand {
  roleId: string;
  permissionId: string;
}

export interface UserRolesQuery {
  userId: string;
}

export interface RolePermissionsQuery {
  roleId: string;
}

export interface UserEffectivePermissionsQuery {
  userId: string;
}

/** Ids de los roles asignados. */
export type UserRolesResult = string[];
/** Ids de los permisos asignados. */
export type RolePermissionsResult = string[];
export type UserEffectivePermissionsResult = Permission[];
