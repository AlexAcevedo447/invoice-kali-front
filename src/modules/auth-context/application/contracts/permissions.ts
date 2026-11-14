import type { Permission } from "@modules/auth-context/domain/entities/Permission";
import type { PermissionCatalog } from "@modules/auth-context/domain/entities/PermissionCatalog";

// La empresa la toma el servidor del token: los comandos no llevan tenantId.
export interface CreatePermissionCommand {
  resource: string;
  action: string;
}

export interface GetPermissionByIdQuery {
  permissionId: string;
}

export interface UpdatePermissionCommand {
  permissionId: string;
  resource: string;
  action: string;
}

export interface DeletePermissionCommand {
  permissionId: string;
}

export type PermissionResult = Permission;
export type PermissionListResult = Permission[];
export type PermissionCatalogResult = PermissionCatalog;
