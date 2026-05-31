import type {
  CreateInvoiceItemCommand,
  DeleteInvoiceItemCommand,
  IdempotentRequest,
  InvoiceItemListResult,
  InvoiceItemResult,
  ListInvoiceItemsQuery,
  PublicRequest,
  UpdateInvoiceItemCommand,
} from "@modules/invoicing/application/contracts";

export interface ListInvoiceItemsPort {
  list(
    query: ListInvoiceItemsQuery,
    options?: PublicRequest,
  ): Promise<InvoiceItemListResult>;
}

export interface GetInvoiceItemByIdPort {
  getById(id: string, options?: PublicRequest): Promise<InvoiceItemResult>;
}

export interface CreateInvoiceItemPort {
  create(
    command: CreateInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceItemResult>;
}

export interface UpdateInvoiceItemPort {
  update(
    command: UpdateInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<InvoiceItemResult>;
}

export interface DeleteInvoiceItemPort {
  delete(
    command: DeleteInvoiceItemCommand,
    options: IdempotentRequest,
  ): Promise<void>;
}
