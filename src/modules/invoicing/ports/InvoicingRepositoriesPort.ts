import type { InvoiceRepository } from "../domain/repositories/InvoiceRepository";
import type { InvoiceItemRepository } from "../domain/repositories/InvoiceItemRepository";
import type { InvoiceMetricsRepository } from "../domain/repositories/InvoiceMetricsRepository";

export interface InvoicingRepositoriesPort {
  invoiceRepository: InvoiceRepository;
  invoiceItemRepository: InvoiceItemRepository;
  invoiceMetricsRepository: InvoiceMetricsRepository;
}
