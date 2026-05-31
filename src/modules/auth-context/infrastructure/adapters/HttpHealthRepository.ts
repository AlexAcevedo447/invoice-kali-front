import { AuthContextEndpoints } from "@modules/auth-context/application/endpoints";
import type { ServiceHealth } from "../../domain/entities/ServiceHealth";
import type { HealthRepository } from "../../domain/repositories/HealthRepository";
import type { RequestOptions } from "../../domain/repositories/RequestOptions";
import {
  mapHealthApiToDomain,
  type ApiHealthResponse,
} from "@modules/auth-context/infrastructure/mappers/authContextMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
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
