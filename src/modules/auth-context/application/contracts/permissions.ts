import type { Permission } from "@modules/auth-context/domain/entities/Permission";

export interface CreatePermissionCommand {
  tenantId: string;
  resource: string;
  action: string;
}

export interface ListPermissionsQuery {
  tenantId: string;
}

export interface GetPermissionByIdQuery {
  permissionId: string;
}

export interface UpdatePermissionCommand {
  permissionId: string;
  tenantId: string;
  resource: string;
  action: string;
}

export interface DeletePermissionCommand {
  permissionId: string;
}

export type PermissionResult = Permission;
export type PermissionListResult = Permission[];
