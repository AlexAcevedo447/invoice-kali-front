import type {
  CreateInvoiceItemCommand,
  DeleteInvoiceItemCommand,
  GetInvoiceItemByIdQuery,
  IdempotentRequest,
  InvoiceItemListResult,
  InvoiceItemResult,
  ListInvoiceItemsQuery,
  PublicRequest,
  UpdateInvoiceItemCommand,
} from "@modules/invoicing/application/contracts";
import type { InvoiceItemRepository } from "@modules/invoicing/domain/repositories/InvoiceItemRepository";
import { toInvoiceItemId } from "@modules/invoicing/domain/value-objects";

export class ListInvoiceItemsUseCase {
  private readonly invoiceItemRepository: InvoiceItemRepository;

  constructor(invoiceItemRepository: InvoiceItemRepository) {
    this.invoiceItemRepository = invoiceItemRepository;
  }

  execute(
    query: ListInvoiceItemsQuery,
    options?: PublicRequest,
  ): Promise<InvoiceItemListResult> {
    return this.invoiceItemRepository.list(
      {
        page: query.page,
        pageSize: query.pageSize,
      },
      options,
    );
  }
}

export class GetInvoiceItemByIdUseCase {
  private readonly invoiceItemRepository: InvoiceItemRepository;

  constructor(invoiceItemRepository: InvoiceItemRepository) {
    this.invoiceItemRepository = invoiceItemRepository;
  }

  execute(
    query: GetInvoiceItemByIdQuery,
    options?: PublicRequest,
  ): Promise<InvoiceItemResult> {
    return this.invoiceItemRepository.getById(
      toInvoiceItemId(query.id),
      options,
    );
  }
}

export class CreateInvoiceItemUseCase {
  private readonly invoiceItemRepository: InvoiceItemRepository;

  constructor(invoiceItemRepository: InvoiceItemRepository) {
    this.invoiceItemRepository = invoiceItemRepository;
  }

  execute(
    command: CreateInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceItemResult> {
    return this.invoiceItemRepository.create(command, options);
  }
}

export class UpdateInvoiceItemUseCase {
  private readonly invoiceItemRepository: InvoiceItemRepository;

  constructor(invoiceItemRepository: InvoiceItemRepository) {
    this.invoiceItemRepository = invoiceItemRepository;
  }

  execute(
    command: UpdateInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceItemResult> {
    return this.invoiceItemRepository.update(
      {
        id: toInvoiceItemId(command.id),
        quantity: command.quantity,
        unitPrice: command.unitPrice,
        taxes: command.taxes,
      },
      options,
    );
  }
}

export class DeleteInvoiceItemUseCase {
  private readonly invoiceItemRepository: InvoiceItemRepository;

  constructor(invoiceItemRepository: InvoiceItemRepository) {
    this.invoiceItemRepository = invoiceItemRepository;
  }

  execute(
    command: DeleteInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<void> {
    return this.invoiceItemRepository.delete(
      toInvoiceItemId(command.id),
      options,
    );
  }
}
