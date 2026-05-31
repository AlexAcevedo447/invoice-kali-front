import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Role } from "../../domain/entities/Role";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { RoleRepository } from "../../domain/repositories/RoleRepository";
import {
  mapRoleApiToDomain,
  type ApiRole,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

export class HttpRoleRepository implements RoleRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: { tenantId: string; name: string; description: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        name: string;
        description: string;
      }
    >(
      AuthContextEndpoints.roles.create,
      {
        tenant_id: command.tenantId,
        name: command.name,
        description: command.description,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async list(
    query: { tenantId: string },
    options: ProtectedRequestOptions,
  ): Promise<Role[]> {
    const response = await this.httpClient.get<ApiRole[]>(
      AuthContextEndpoints.roles.list(query.tenantId),
      toProtectedConfig(options),
    );

    return response.map(mapRoleApiToDomain);
  }

  async getById(
    query: { roleId: string },
    options: ProtectedRequestOptions,
  ): Promise<Role> {
    const response = await this.httpClient.get<ApiRole>(
      AuthContextEndpoints.roles.getById(query.roleId),
      toProtectedConfig(options),
    );

    return mapRoleApiToDomain(response);
  }

  async update(
    command: {
      roleId: string;
      tenantId: string;
      name: string;
      description: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<
      void,
      {
        tenant_id: string;
        name: string;
        description: string;
      }
    >(
      AuthContextEndpoints.roles.update(command.roleId),
      {
        tenant_id: command.tenantId,
        name: command.name,
        description: command.description,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { roleId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.roles.delete(command.roleId),
      toIdempotentProtectedConfig(options),
    );
  }
}
