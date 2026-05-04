import type {
  InvoiceItemRepository,
  InvoiceMetricsRepository,
  InvoiceRepository,
} from "@modules/invoicing/domain/repositories";
import type { HttpClient } from "@shared/infrastructure/http";
import { httpCore } from "@shared/infrastructure/http";
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
