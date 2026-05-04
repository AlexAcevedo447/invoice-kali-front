import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type {
  AuthRepository,
  ProtectedRequestOptions,
  RequestOptions,
} from "@modules/auth-context/domain/repositories";
import {
  mapAuthorizationApiToDomain,
  mapAuthSessionApiToDomain,
  type ApiAuthorizationDecision,
  type ApiAuthSessionResponse,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toProtectedConfig, toPublicConfig } from "./httpConfig";

export class HttpAuthRepository implements AuthRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async login(
    command: { tenantId: string; email: string; password: string },
    options?: RequestOptions,
  ) {
    const response = await this.httpClient.post<
      ApiAuthSessionResponse,
      { tenant_id: string; email: string; password: string }
    >(
      AuthContextEndpoints.auth.login,
      {
        tenant_id: command.tenantId,
        email: command.email,
        password: command.password,
      },
      toPublicConfig(options),
    );

    return mapAuthSessionApiToDomain(response);
  }

  async authorize(
    command: {
      tenantId: string;
      userId: string;
      resource: string;
      action: string;
    },
    options: ProtectedRequestOptions,
  ) {
    const response = await this.httpClient.post<
      ApiAuthorizationDecision,
      {
        tenant_id: string;
        user_id: string;
        resource: string;
        action: string;
      }
    >(
      AuthContextEndpoints.auth.authorize,
      {
        tenant_id: command.tenantId,
        user_id: command.userId,
        resource: command.resource,
        action: command.action,
      },
      toProtectedConfig(options),
    );

    return mapAuthorizationApiToDomain(response);
  }
}
