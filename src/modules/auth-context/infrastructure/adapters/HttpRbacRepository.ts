import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Permission, Role } from "@modules/auth-context/domain/entities";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
  RbacRepository,
} from "@modules/auth-context/domain/repositories";
import {
  mapPermissionApiToDomain,
  mapRoleApiToDomain,
  type ApiPermission,
  type ApiRole,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

export class HttpRbacRepository implements RbacRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async assignUserRole(
    command: { tenantId: string; userId: string; roleId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        user_id: string;
        role_id: string;
      }
    >(
      AuthContextEndpoints.rbac.assignUserRole,
      {
        tenant_id: command.tenantId,
        user_id: command.userId,
        role_id: command.roleId,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async removeUserRole(
    command: { tenantId: string; userId: string; roleId: string },
    options: ProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        user_id: string;
        role_id: string;
      }
    >(
      AuthContextEndpoints.rbac.removeUserRole,
      {
        tenant_id: command.tenantId,
        user_id: command.userId,
        role_id: command.roleId,
      },
      toProtectedConfig(options),
    );
  }

  async assignRolePermission(
    command: { tenantId: string; roleId: string; permissionId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        role_id: string;
        permission_id: string;
      }
    >(
      AuthContextEndpoints.rbac.assignRolePermission,
      {
        tenant_id: command.tenantId,
        role_id: command.roleId,
        permission_id: command.permissionId,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async removeRolePermission(
    command: { tenantId: string; roleId: string; permissionId: string },
    options: ProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        role_id: string;
        permission_id: string;
      }
    >(
      AuthContextEndpoints.rbac.removeRolePermission,
      {
        tenant_id: command.tenantId,
        role_id: command.roleId,
        permission_id: command.permissionId,
      },
      toProtectedConfig(options),
    );
  }

  async getUserRoles(
    query: { tenantId: string; userId: string },
    options: ProtectedRequestOptions,
  ): Promise<Role[]> {
    const response = await this.httpClient.get<ApiRole[]>(
      AuthContextEndpoints.rbac.getUserRoles(query.tenantId, query.userId),
      toProtectedConfig(options),
    );

    return response.map(mapRoleApiToDomain);
  }

  async getRolePermissions(
    query: { tenantId: string; roleId: string },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]> {
    const response = await this.httpClient.get<ApiPermission[]>(
      AuthContextEndpoints.rbac.getRolePermissions(
        query.tenantId,
        query.roleId,
      ),
      toProtectedConfig(options),
    );

    return response.map(mapPermissionApiToDomain);
  }

  async getUserEffectivePermissions(
    query: { tenantId: string; userId: string },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]> {
    const response = await this.httpClient.get<ApiPermission[]>(
      AuthContextEndpoints.rbac.getUserEffectivePermissions(
        query.tenantId,
        query.userId,
      ),
      toProtectedConfig(options),
    );

    return response.map(mapPermissionApiToDomain);
  }
}
