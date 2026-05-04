import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import type { InvoiceMetrics } from "@modules/invoicing/domain/entities";
import type {
  InvoiceMetricsRepository,
  RequestOptions,
} from "@modules/invoicing/domain/repositories";
import {
  mapInvoiceMetricsApiToDomain,
  type InvoiceMetricsApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
import { toPublicConfig } from "./httpConfig";

export class HttpInvoiceMetricsRepository implements InvoiceMetricsRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient = httpCore) {
    this.httpClient = httpClient;
  }

  async get(options?: RequestOptions): Promise<InvoiceMetrics> {
    const response = await this.httpClient.get<InvoiceMetricsApi>(
      InvoiceEndpoints.metrics,
      toPublicConfig(options),
    );

    return mapInvoiceMetricsApiToDomain(response);
  }
}
