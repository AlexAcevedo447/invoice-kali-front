import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";

export class GetInvoicesUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute() {
    return this.invoiceRepository.findAll();
  }
}
