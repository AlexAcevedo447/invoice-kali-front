import type { InvoiceMetricsRepository } from "@modules/invoicing/domain/repositories/InvoiceMetricsRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import { resolveEndpoint } from "@app/api/EndpointRegistry";
import { toPublicConfig } from "@modules/invoicing/infrastructure/adapters/httpConfig";
import {
  mapInvoiceMetricsApiToDomain,
  type InvoiceMetricsApi,
} from "@modules/invoicing/infrastructure/mappers/invoiceMapper";

export interface CreateHttpInvoiceMetricsRepositoryDeps {
  httpClient: HttpClient;
  endpointRegistry: EndpointRegistryContext;
}

export function createHttpInvoiceMetricsRepository({
  httpClient,
  endpointRegistry,
}: CreateHttpInvoiceMetricsRepositoryDeps): InvoiceMetricsRepository {
  return {
    async get(options) {
      const { invoices } = await resolveEndpoint(endpointRegistry, "invoices");
      const response = await httpClient.get<InvoiceMetricsApi>(
        invoices.metrics,
        toPublicConfig(options),
      );
      return mapInvoiceMetricsApiToDomain(response);
    },
  };
}
