import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { User } from "@modules/auth-context/domain/entities/User";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
  UserRepository,
} from "@modules/auth-context/domain/repositories";
import {
  mapUserApiToDomain,
  type ApiUser,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

export class HttpUserRepository implements UserRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: {
      tenantId: string;
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.post<
      void,
      {
        tenant_id: string;
        identification_number: string;
        username: string;
        email: string;
        password: string;
      }
    >(
      AuthContextEndpoints.users.create,
      {
        tenant_id: command.tenantId,
        identification_number: command.identificationNumber,
        username: command.username,
        email: command.email,
        password: command.password,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async list(
    query: { tenantId: string },
    options: ProtectedRequestOptions,
  ): Promise<User[]> {
    const response = await this.httpClient.get<ApiUser[]>(
      AuthContextEndpoints.users.list(query.tenantId),
      toProtectedConfig(options),
    );

    return response.map(mapUserApiToDomain);
  }

  async getById(
    query: { userId: string; tenantId: string },
    options: ProtectedRequestOptions,
  ): Promise<User> {
    const response = await this.httpClient.get<ApiUser>(
      AuthContextEndpoints.users.getById(query.userId, query.tenantId),
      toProtectedConfig(options),
    );

    return mapUserApiToDomain(response);
  }

  async getByEmail(
    query: { tenantId: string; email: string },
    options: ProtectedRequestOptions,
  ): Promise<User> {
    const response = await this.httpClient.get<ApiUser>(
      AuthContextEndpoints.users.byEmail(query.tenantId, query.email),
      toProtectedConfig(options),
    );

    return mapUserApiToDomain(response);
  }

  async update(
    command: {
      userId: string;
      tenantId: string;
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.put<
      void,
      {
        tenant_id: string;
        identification_number: string;
        username: string;
        email: string;
        password: string;
      }
    >(
      AuthContextEndpoints.users.update(command.userId),
      {
        tenant_id: command.tenantId,
        identification_number: command.identificationNumber,
        username: command.username,
        email: command.email,
        password: command.password,
      },
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { userId: string; tenantId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.users.delete(command.userId, command.tenantId),
      toIdempotentProtectedConfig(options),
    );
  }
}
