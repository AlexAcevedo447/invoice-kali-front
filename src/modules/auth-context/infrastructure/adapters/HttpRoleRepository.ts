import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Role } from "../../domain/entities/Role";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { RoleRepository } from "../../domain/repositories/RoleRepository";
import type { RoleId } from "../../domain/value-objects/RoleId";
import {
  mapRoleApiToDomain,
  type ApiRole,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

type RoleBody = { name: string; description: string };

export class HttpRoleRepository implements RoleRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: RoleBody,
    options: IdempotentProtectedRequestOptions,
  ): Promise<Role> {
    const response = await this.httpClient.post<ApiRole, RoleBody>(
      AuthContextEndpoints.roles.create,
      { name: command.name, description: command.description },
      toIdempotentProtectedConfig(options),
    );
    return mapRoleApiToDomain(response);
  }

  async list(options: ProtectedRequestOptions): Promise<Role[]> {
    const response = await this.httpClient.get<ApiRole[] | null>(
      AuthContextEndpoints.roles.list,
      toProtectedConfig(options),
    );
    return (response ?? []).map(mapRoleApiToDomain);
  }

  async getById(
    query: { roleId: RoleId },
    options: ProtectedRequestOptions,
  ): Promise<Role> {
    const response = await this.httpClient.get<ApiRole>(
      AuthContextEndpoints.roles.getById(query.roleId),
      toProtectedConfig(options),
    );
    return mapRoleApiToDomain(response);
  }

  async update(
    command: { roleId: RoleId } & RoleBody,
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<void, RoleBody>(
      AuthContextEndpoints.roles.update(command.roleId),
      { name: command.name, description: command.description },
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { roleId: RoleId },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.roles.delete(command.roleId),
      toIdempotentProtectedConfig(options),
    );
  }
}
