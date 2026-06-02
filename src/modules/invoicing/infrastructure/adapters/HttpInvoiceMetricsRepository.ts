import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import type { InvoiceMetrics } from "../../domain/entities/InvoiceMetrics";
import type {
  InvoiceMetricsRepository,
  RequestOptions,
} from "../../domain/repositories/InvoiceMetricsRepository";
import {
  mapInvoiceMetricsApiToDomain,
  type InvoiceMetricsApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";
import type { HttpClient } from "../../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../../shared/infrastructure/http/httpCore";
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
