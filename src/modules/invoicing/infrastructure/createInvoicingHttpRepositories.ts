import type { InvoiceItemRepository } from "../domain/repositories/InvoiceItemRepository";
import type { InvoiceMetricsRepository } from "../domain/repositories/InvoiceMetricsRepository";
import type { InvoiceRepository } from "../domain/repositories/InvoiceRepository";
import type { HttpClient } from "../../../shared/infrastructure/http/HttpClient";
import { httpCore } from "../../../shared/infrastructure/http/httpCore";
import {
  HttpInvoiceItemRepository,
  HttpInvoiceMetricsRepository,
  HttpInvoiceRepository,
} from "./adapters";

export interface InvoicingRepositories {
  invoiceRepository: InvoiceRepository;
  invoiceItemRepository: InvoiceItemRepository;
  invoiceMetricsRepository: InvoiceMetricsRepository;
}

export const createInvoicingHttpRepositories = (
  httpClient: HttpClient = httpCore,
): InvoicingRepositories => ({
  invoiceRepository: new HttpInvoiceRepository(httpClient),
  invoiceItemRepository: new HttpInvoiceItemRepository(httpClient),
  invoiceMetricsRepository: new HttpInvoiceMetricsRepository(httpClient),
});
