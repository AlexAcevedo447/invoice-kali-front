import type { Role } from "@modules/auth-context/domain/entities/Role";

export interface CreateRoleCommand {
  tenantId: string;
  name: string;
  description: string;
}

export interface ListRolesQuery {
  tenantId: string;
}

export interface GetRoleByIdQuery {
  roleId: string;
}

export interface UpdateRoleCommand {
  roleId: string;
  tenantId: string;
  name: string;
  description: string;
}

export interface DeleteRoleCommand {
  roleId: string;
}

export type RoleResult = Role;
export type RoleListResult = Role[];
