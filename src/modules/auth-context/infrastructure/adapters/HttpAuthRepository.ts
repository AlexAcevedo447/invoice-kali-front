import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import type {
  ProtectedRequestOptions,
  RequestOptions,
} from "../../domain/repositories/RequestOptions";
import {
  mapAuthorizationApiToDomain,
  mapAuthSessionApiToDomain,
  type ApiAuthorizationDecision,
  type ApiAuthSessionResponse,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
import { toProtectedConfig, toPublicConfig } from "./httpConfig";

export class HttpAuthRepository implements AuthRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async login(
    command: { email: string; password: string; tenantCode?: string },
    options?: RequestOptions,
  ) {
    const response = await this.httpClient.post<
      ApiAuthSessionResponse,
      { email: string; password: string; tenant_code?: string }
    >(
      AuthContextEndpoints.auth.login,
      {
        email: command.email,
        password: command.password,
        ...(command.tenantCode ? { tenant_code: command.tenantCode } : {}),
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
