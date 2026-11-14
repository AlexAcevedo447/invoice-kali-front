import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Permission } from "../../domain/entities/Permission";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { RbacRepository } from "../../domain/repositories/RbacRepository";
import type { PermissionId } from "../../domain/value-objects/PermissionId";
import type { RoleId } from "../../domain/value-objects/RoleId";
import type { UserId } from "../../domain/value-objects/UserId";
import {
  mapPermissionApiToDomain,
  mapRolePermissionLinksToPermissionIds,
  mapUserRoleLinksToRoleIds,
  type ApiPermission,
  type ApiRolePermissionLink,
  type ApiUserRoleLink,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

type UserRoleBody = { user_id: string; role_id: string };
type RolePermissionBody = { role_id: string; permission_id: string };

export class HttpRbacRepository implements RbacRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async assignUserRole(
    command: { userId: UserId; roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, UserRoleBody>(
      AuthContextEndpoints.rbac.assignUserRole,
      { user_id: command.userId, role_id: command.roleId },
      toIdempotentProtectedConfig(options),
    );
  }

  async removeUserRole(
    command: { userId: UserId; roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, UserRoleBody>(
      AuthContextEndpoints.rbac.removeUserRole,
      { user_id: command.userId, role_id: command.roleId },
      toIdempotentProtectedConfig(options),
    );
  }

  async assignRolePermission(
    command: { roleId: RoleId; permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, RolePermissionBody>(
      AuthContextEndpoints.rbac.assignRolePermission,
      { role_id: command.roleId, permission_id: command.permissionId },
      toIdempotentProtectedConfig(options),
    );
  }

  async removeRolePermission(
    command: { roleId: RoleId; permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, RolePermissionBody>(
      AuthContextEndpoints.rbac.removeRolePermission,
      { role_id: command.roleId, permission_id: command.permissionId },
      toIdempotentProtectedConfig(options),
    );
  }

  async getUserRoles(
    query: { userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<RoleId[]> {
    const response = await this.httpClient.get<ApiUserRoleLink[] | null>(
      AuthContextEndpoints.rbac.getUserRoles(query.userId),
      toProtectedConfig(options),
    );
    return mapUserRoleLinksToRoleIds(response);
  }

  async getRolePermissions(
    query: { roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<PermissionId[]> {
    const response = await this.httpClient.get<ApiRolePermissionLink[] | null>(
      AuthContextEndpoints.rbac.getRolePermissions(query.roleId),
      toProtectedConfig(options),
    );
    return mapRolePermissionLinksToPermissionIds(response);
  }

  async getUserEffectivePermissions(
    query: { userId: UserId },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]> {
    const response = await this.httpClient.get<ApiPermission[] | null>(
      AuthContextEndpoints.rbac.getUserEffectivePermissions(query.userId),
      toProtectedConfig(options),
    );
    return (response ?? []).map(mapPermissionApiToDomain);
  }
}
