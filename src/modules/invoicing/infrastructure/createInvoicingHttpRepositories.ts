import type { InvoiceItemRepository } from "@modules/invoicing/domain/repositories/InvoiceItemRepository";
import type { InvoiceMetricsRepository } from "@modules/invoicing/domain/repositories/InvoiceMetricsRepository";
import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import { httpCore } from "@shared/infrastructure/http/httpCore";
import type { EndpointRegistryContext } from "@app/api/EndpointRegistry";
import {
  createEndpointRegistry,
  registerEndpoint,
} from "@app/api/EndpointRegistry";
import { InvoiceEndpoints } from "@modules/invoicing/application/endpoints";
import { createHttpInvoiceRepository } from "@modules/invoicing/infrastructure/adapters/HttpInvoiceRepository";
import { createHttpInvoiceItemRepository } from "@modules/invoicing/infrastructure/adapters/HttpInvoiceItemRepository";
import { createHttpInvoiceMetricsRepository } from "@modules/invoicing/infrastructure/adapters/HttpInvoiceMetricsRepository";

export interface InvoicingRepositories {
  invoiceRepository: InvoiceRepository;
  invoiceItemRepository: InvoiceItemRepository;
  invoiceMetricsRepository: InvoiceMetricsRepository;
}

export function createInvoicingHttpRepositories(
  httpClient: HttpClient = httpCore,
  registry: EndpointRegistryContext = createEndpointRegistry(),
): InvoicingRepositories {
  // Registrar el factory de endpoints de invoices
  registerEndpoint(registry, "invoices", async () => ({
    invoices: InvoiceEndpoints,
  }));
  return {
    invoiceRepository: createHttpInvoiceRepository({
      httpClient,
      endpointRegistry: registry,
    }),
    invoiceItemRepository: createHttpInvoiceItemRepository({
      httpClient,
      endpointRegistry: registry,
    }),
    invoiceMetricsRepository: createHttpInvoiceMetricsRepository({
      httpClient,
      endpointRegistry: registry,
    }),
  };
}
