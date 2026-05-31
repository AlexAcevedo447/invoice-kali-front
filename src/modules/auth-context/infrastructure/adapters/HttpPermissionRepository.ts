import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Permission } from "../../domain/entities/Permission";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { PermissionRepository } from "../../domain/repositories/PermissionRepository";
import {
  mapPermissionApiToDomain,
  type ApiPermission,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

export class HttpPermissionRepository implements PermissionRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: { tenantId: string; resource: string; action: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        resource: string;
        action: string;
      }
    >(
      AuthContextEndpoints.permissions.create,
      {
        tenant_id: command.tenantId,
        resource: command.resource,
        action: command.action,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async list(
    query: { tenantId: string },
    options: ProtectedRequestOptions,
  ): Promise<Permission[]> {
    const response = await this.httpClient.get<ApiPermission[]>(
      AuthContextEndpoints.permissions.list(query.tenantId),
      toProtectedConfig(options),
    );

    return response.map(mapPermissionApiToDomain);
  }

  async getById(
    query: { permissionId: string },
    options: ProtectedRequestOptions,
  ): Promise<Permission> {
    const response = await this.httpClient.get<ApiPermission>(
      AuthContextEndpoints.permissions.getById(query.permissionId),
      toProtectedConfig(options),
    );

    return mapPermissionApiToDomain(response);
  }

  async update(
    command: {
      permissionId: string;
      tenantId: string;
      resource: string;
      action: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<
      void,
      {
        tenant_id: string;
        resource: string;
        action: string;
      }
    >(
      AuthContextEndpoints.permissions.update(command.permissionId),
      {
        tenant_id: command.tenantId,
        resource: command.resource,
        action: command.action,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { permissionId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.permissions.delete(command.permissionId),
      toIdempotentProtectedConfig(options),
    );
  }
}
