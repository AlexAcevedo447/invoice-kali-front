import type {
  CreateInvoiceCommand,
  GetInvoiceByIdQuery,
  IdempotentRequest,
  InvoiceListResult,
  InvoiceResult,
  InvoiceStatusCommand,
  ListInvoicesQuery,
  PublicRequest,
  UpdateInvoiceCommand,
} from "@modules/invoicing/application/contracts";
import type { InvoiceRepository } from "@modules/invoicing/domain/repositories/InvoiceRepository";
import { toInvoiceId } from "@modules/invoicing/domain/value-objects";

export class ListInvoicesUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    query: ListInvoicesQuery,
    options?: PublicRequest,
  ): Promise<InvoiceListResult> {
    return this.invoiceRepository.list(
      {
        page: query.page,
        pageSize: query.pageSize,
      },
      options,
    );
  }
}

export class GetInvoiceByIdUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    query: GetInvoiceByIdQuery,
    options?: PublicRequest,
  ): Promise<InvoiceResult> {
    return this.invoiceRepository.getById(toInvoiceId(query.id), options);
  }
}

export class CreateInvoiceUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    command: CreateInvoiceCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult> {
    return this.invoiceRepository.create(command, options);
  }
}

export class UpdateInvoiceUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    command: UpdateInvoiceCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult> {
    return this.invoiceRepository.update(
      {
        id: toInvoiceId(command.id),
        customerId: command.customerId,
        dueDate: command.dueDate,
      },
      options,
    );
  }
}

export class PayInvoiceUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    command: InvoiceStatusCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult> {
    return this.invoiceRepository.pay(toInvoiceId(command.id), options);
  }
}

export class CancelInvoiceUseCase {
  private readonly invoiceRepository: InvoiceRepository;

  constructor(invoiceRepository: InvoiceRepository) {
    this.invoiceRepository = invoiceRepository;
  }

  execute(
    command: InvoiceStatusCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceResult> {
    return this.invoiceRepository.cancel(toInvoiceId(command.id), options);
  }
}
