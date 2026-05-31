import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";
import type { InvoiceItemRepository } from "@modules/invoicing/domain/repositories/InvoiceItemRepository";
import type { InvoiceMetricsRepository } from "@modules/invoicing/domain/repositories/InvoiceMetricsRepository";

export interface InvoicingRepositoriesPort {
  invoiceRepository: InvoiceRepository;
  invoiceItemRepository: InvoiceItemRepository;
  invoiceMetricsRepository: InvoiceMetricsRepository;
}
