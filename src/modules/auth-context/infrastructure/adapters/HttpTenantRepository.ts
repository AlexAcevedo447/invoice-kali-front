import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { Tenant } from "../../domain/entities/Tenant";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { TenantRepository } from "../../domain/repositories/TenantRepository";
import {
  mapTenantApiToDomain,
  type ApiTenant,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

export class HttpTenantRepository implements TenantRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: { name: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, { name: string }>(
      AuthContextEndpoints.tenants.create,
      {
        name: command.name,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async list(options: ProtectedRequestOptions): Promise<Tenant[]> {
    const response = await this.httpClient.get<ApiTenant[]>(
      AuthContextEndpoints.tenants.list,
      toProtectedConfig(options),
    );

    return response.map(mapTenantApiToDomain);
  }

  async getById(
    query: { tenantId: string },
    options: ProtectedRequestOptions,
  ): Promise<Tenant> {
    const response = await this.httpClient.get<ApiTenant>(
      AuthContextEndpoints.tenants.getById(query.tenantId),
      toProtectedConfig(options),
    );

    return mapTenantApiToDomain(response);
  }

  async getByName(
    query: { name: string },
    options: ProtectedRequestOptions,
  ): Promise<Tenant> {
    const response = await this.httpClient.get<ApiTenant>(
      AuthContextEndpoints.tenants.byName(query.name),
      toProtectedConfig(options),
    );

    return mapTenantApiToDomain(response);
  }

  async update(
    command: { tenantId: string; name: string; status: "ACTIVE" | "SUSPENDED" },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<
      void,
      { name: string; status: "ACTIVE" | "SUSPENDED" }
    >(
      AuthContextEndpoints.tenants.update(command.tenantId),
      {
        name: command.name,
        status: command.status,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async activate(
    command: { tenantId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, null>(
      AuthContextEndpoints.tenants.activate(command.tenantId),
      null,
      toIdempotentProtectedConfig(options),
    );
  }

  async suspend(
    command: { tenantId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<void, null>(
      AuthContextEndpoints.tenants.suspend(command.tenantId),
      null,
      toIdempotentProtectedConfig(options),
    );
  }
}
