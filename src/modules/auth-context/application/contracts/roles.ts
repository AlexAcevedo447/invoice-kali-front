import type { Role } from "@modules/auth-context/domain/entities/Role";

// La empresa la toma el servidor del token: los comandos no llevan tenantId.
export interface CreateRoleCommand {
  name: string;
  description: string;
}

export interface GetRoleByIdQuery {
  roleId: string;
}

export interface UpdateRoleCommand {
  roleId: string;
  name: string;
  description: string;
}

export interface DeleteRoleCommand {
  roleId: string;
}

export type RoleResult = Role;
export type RoleListResult = Role[];
