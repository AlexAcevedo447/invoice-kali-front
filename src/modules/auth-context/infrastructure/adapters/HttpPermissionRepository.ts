import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Permission } from "../../domain/entities/Permission";
import type { PermissionCatalog } from "../../domain/entities/PermissionCatalog";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { PermissionRepository } from "../../domain/repositories/PermissionRepository";
import type { PermissionId } from "../../domain/value-objects/PermissionId";
import {
  mapPermissionApiToDomain,
  mapPermissionCatalogApiToDomain,
  type ApiPermission,
  type ApiPermissionCatalog,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

type PermissionBody = { resource: string; action: string };

export class HttpPermissionRepository implements PermissionRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: PermissionBody,
    options: IdempotentProtectedRequestOptions,
  ): Promise<Permission> {
    const response = await this.httpClient.post<ApiPermission, PermissionBody>(
      AuthContextEndpoints.permissions.create,
      { resource: command.resource, action: command.action },
      toIdempotentProtectedConfig(options),
    );
    return mapPermissionApiToDomain(response);
  }

  async list(options: ProtectedRequestOptions): Promise<Permission[]> {
    const response = await this.httpClient.get<ApiPermission[] | null>(
      AuthContextEndpoints.permissions.list,
      toProtectedConfig(options),
    );
    return (response ?? []).map(mapPermissionApiToDomain);
  }

  async catalog(options: ProtectedRequestOptions): Promise<PermissionCatalog> {
    const response = await this.httpClient.get<ApiPermissionCatalog>(
      AuthContextEndpoints.permissions.catalog,
      toProtectedConfig(options),
    );
    return mapPermissionCatalogApiToDomain(response);
  }

  async getById(
    query: { permissionId: PermissionId },
    options: ProtectedRequestOptions,
  ): Promise<Permission> {
    const response = await this.httpClient.get<ApiPermission>(
      AuthContextEndpoints.permissions.getById(query.permissionId),
      toProtectedConfig(options),
    );
    return mapPermissionApiToDomain(response);
  }

  async update(
    command: { permissionId: PermissionId } & PermissionBody,
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<void, PermissionBody>(
      AuthContextEndpoints.permissions.update(command.permissionId),
      { resource: command.resource, action: command.action },
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { permissionId: PermissionId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.permissions.delete(command.permissionId),
      toIdempotentProtectedConfig(options),
    );
  }
}
