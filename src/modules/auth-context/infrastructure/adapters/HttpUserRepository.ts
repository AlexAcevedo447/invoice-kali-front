import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { User } from "../../domain/entities/User";
import type {
  IdempotentProtectedRequestOptions,
  ProtectedRequestOptions,
} from "../../domain/repositories/RequestOptions";
import type { UserRepository } from "../../domain/repositories/UserRepository";
import {
  mapUserApiToDomain,
  type ApiUser,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toIdempotentProtectedConfig, toProtectedConfig } from "./httpConfig";

type CreateUserBody = {
  identification_number: string;
  username: string;
  email: string;
  password: string;
};

type UpdateUserBody = {
  identification_number: string;
  username: string;
  email: string;
  password?: string;
};

/**
 * Usuarios de la empresa de la sesión. El servidor toma la empresa del token,
 * por eso no se envía tenant_id. El mapper descarta cualquier campo de
 * contraseña que pudiera llegar en la respuesta.
 */
export class HttpUserRepository implements UserRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async create(
    command: {
      identificationNumber: string;
      username: string;
      email: string;
      password: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<User> {
    const response = await this.httpClient.post<ApiUser, CreateUserBody>(
      AuthContextEndpoints.users.create,
      {
        identification_number: command.identificationNumber,
        username: command.username,
        email: command.email,
        password: command.password,
      },
      toIdempotentProtectedConfig(options),
    );

    return mapUserApiToDomain(response);
  }

  async list(options: ProtectedRequestOptions): Promise<User[]> {
    const response = await this.httpClient.get<ApiUser[] | null>(
      AuthContextEndpoints.users.list,
      toProtectedConfig(options),
    );

    return (response ?? []).map(mapUserApiToDomain);
  }

  async getById(
    query: { userId: string },
    options: ProtectedRequestOptions,
  ): Promise<User> {
    const response = await this.httpClient.get<ApiUser>(
      AuthContextEndpoints.users.getById(query.userId),
      toProtectedConfig(options),
    );

    return mapUserApiToDomain(response);
  }

  async getByEmail(
    query: { email: string },
    options: ProtectedRequestOptions,
  ): Promise<User> {
    const response = await this.httpClient.get<ApiUser>(
      AuthContextEndpoints.users.byEmail(query.email),
      toProtectedConfig(options),
    );

    return mapUserApiToDomain(response);
  }

  async update(
    command: {
      userId: string;
      identificationNumber: string;
      username: string;
      email: string;
      password?: string;
    },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    const body: UpdateUserBody = {
      identification_number: command.identificationNumber,
      username: command.username,
      email: command.email,
    };
    // Contraseña vacía u omitida: no se envía y el servidor conserva la actual.
    if (command.password && command.password.trim().length > 0) {
      body.password = command.password;
    }

    await this.httpClient.put<void, UpdateUserBody>(
      AuthContextEndpoints.users.update(command.userId),
      body,
      toIdempotentProtectedConfig(options),
    );
  }

  async delete(
    command: { userId: string },
    options: IdempotentProtectedRequestOptions,
  ): Promise<void> {
    await this.httpClient.delete<void>(
      AuthContextEndpoints.users.delete(command.userId),
      toIdempotentProtectedConfig(options),
    );
  }
}
