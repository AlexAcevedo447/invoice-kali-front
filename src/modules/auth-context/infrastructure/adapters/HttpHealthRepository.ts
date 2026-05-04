import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { ServiceHealth } from "@modules/auth-context/domain/entities";
import type {
  HealthRepository,
  RequestOptions,
} from "@modules/auth-context/domain/repositories";
import {
  mapHealthApiToDomain,
  type ApiHealthResponse,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toPublicConfig } from "./httpConfig";

export class HttpHealthRepository implements HealthRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async getRoot(options?: RequestOptions): Promise<ServiceHealth> {
    const response = await this.httpClient.get<ApiHealthResponse>(
      AuthContextEndpoints.health.root,
      toPublicConfig(options),
    );

    return mapHealthApiToDomain(response);
  }

  async checkHealth(options?: RequestOptions): Promise<void> {
    await this.httpClient.get<void>(
      AuthContextEndpoints.health.health,
      toPublicConfig(options),
    );
  }
}
