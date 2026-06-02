import type { InvoiceMetricsRepository } from "../../domain/repositories/InvoiceMetricsRepository";
import type { HttpClient } from "@shared/infrastructure/http/HttpClient";
import { httpCore } from "@shared/infrastructure/http/httpCore";
import { endpointRegistry } from "src/app/api/EndpointRegistry";
import { toPublicConfig } from "./httpConfig";
import { mapInvoiceMetricsApiToDomain } from "../mappers/invoiceMapper";

type InvoiceMetricsApi = import("../mappers/invoiceMapper").InvoiceMetricsApi;

export function createHttpInvoiceMetricsRepository(
  httpClient: HttpClient = httpCore,
): InvoiceMetricsRepository {
  return {
    async get(options) {
      const { invoices } = await endpointRegistry.resolve("invoices");
      const response = await httpClient.get<InvoiceMetricsApi>(
        invoices.metrics,
        toPublicConfig(options),
      );
      return mapInvoiceMetricsApiToDomain(response);
    },
  };
}
