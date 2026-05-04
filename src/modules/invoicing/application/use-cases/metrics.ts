import type {
  InvoiceMetricsResult,
  PublicRequest,
} from "@modules/invoicing/application/contracts";
import type { InvoiceMetricsRepository } from "@modules/invoicing/domain/repositories/InvoiceMetricsRepository";

export class GetInvoicingMetricsUseCase {
  private readonly invoiceMetricsRepository: InvoiceMetricsRepository;

  constructor(invoiceMetricsRepository: InvoiceMetricsRepository) {
    this.invoiceMetricsRepository = invoiceMetricsRepository;
  }

  execute(options?: PublicRequest): Promise<InvoiceMetricsResult> {
    return this.invoiceMetricsRepository.get(options);
  }
}
